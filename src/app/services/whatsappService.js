const axios = require("axios");
const Lead = require("../../pgModels/lead");
const WhatsappChat = require("../../pgModels/whatsapp/WhatsappChat");
const WhatsappMessage = require("../../pgModels/whatsapp/WhatsappMessage");
const API_URL = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`;
const API_URL_TEMPLATE = `https://graph.facebook.com/v23.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`;
const { parsePhoneNumberFromString } = require('libphonenumber-js');
const Sequelize = require("sequelize");
const { BroadcastLog, LeadStatus } = require("../../pgModels/index");
const API_MEDIA_URL = `https://graph.facebook.com/v23.0/${process.env.WHATSAPP_PHONE_ID}/media`
const FormData = require('form-data'); // Ensure this package is installed: npm install form-data
// Import socket.io instance for real-time messaging
let io;

const { getIO } = require('../sockets/socketIntance');
const { buildTemplatePayload } = require("../../utils/buildTemplatePayload");
io = getIO(); // Returns null if not initialized (e.g., in worker processes)



exports.handleIncomingMessage = async (payload) => {
  const io = getIO();

  const value = payload?.entry?.[0]?.changes?.[0]?.value;
  if (!value) return { success: true };

  const message = value.messages?.[0];
  if (!message) return { success: true };

  // DUPLICATE CHECK
  const exists = await WhatsappMessage.findOne({
    where: { meta_message_id: message.id }
  });
  if (exists) return { success: true };

  const phone = message.from;
  const text = message.text?.body || "";

  const numberMatch = phone.match(/\d+/);
  let whatsapp_number;
  if (numberMatch) {
    const phoneNumber = parsePhoneNumberFromString(`+${numberMatch[0]}`);
    whatsapp_number = phoneNumber.nationalNumber;
  }

  // LEAD
  let lead = await Lead.findOne({ where: { whatsapp_number } });
  if (!lead) {
    const status = await LeadStatus.findOne({ where: { is_default: true } });
    const status_id = status ? status.id : null;
    lead = await Lead.create({
      whatsapp_number,
      source: "whatsapp",
      status_id: status_id
    });
  }

  // CHAT
  let chat = await WhatsappChat.findOne({
    where: { phone: whatsapp_number }
  });

  const isNewChat = !chat;

  if (!chat) {
    chat = await WhatsappChat.create({
      phone: whatsapp_number,
      lead_id: lead.id,
      unread_count: 0,
      is_24h_active: true,
      last_message_at: new Date()
    });
  }

  // SAVE MESSAGE
  const savedMessage = await WhatsappMessage.create({
    chat_id: chat.id,
    direction: "IN",
    message_type: "text",
    content: text,
    meta_message_id: message.id
  });

  // UPDATE CHAT
  await chat.update({
    last_message: text,
    last_message_at: new Date(),
    unread_count: chat.unread_count + 1,
    is_24h_active: true
  });

  // 🔥 SOCKET EVENTS
  if (io) {
    // MESSAGE EVENT (chat open view)
    io.to(String(chat.id)).emit("newMessage", {
      id: savedMessage.id,
      chat_id: chat.id,
      direction: "IN",
      content: text,
      createdAt: savedMessage.createdAt
    });

    // CHAT LIST UPDATE (🔥 WITHOUT API)
    io.emit("chatUpdated", {
      chat_id: chat.id,
      id: chat.id,
      phone: chat.phone,
      last_message: text,
      last_message_at: chat.last_message_at,
      unread_count: chat.unread_count + 1,
      is_new_chat: isNewChat,
      lead: {
        whatsapp_number: chat.phone,
        name: chat.lead?.name || null
      }
    });
  }

  return { success: true };
};




exports.sendText = async ({ phone, text }) => {
  const io = getIO();

  const chat = await getOrCreateChat(phone);

  if (!chat.is_24h_active) {
    return {
      success: false,
      message: "24h window expired"
    };
  }

  const response = await axios.post(
    API_URL,
    {
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body: text }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );

  const savedMessage = await WhatsappMessage.create({
    chat_id: chat.id,
    direction: "OUT",
    message_type: "text",
    content: text,
    meta_message_id: response.data?.messages?.[0]?.id
  });

  await chat.update({
    last_message: text,
    last_message_at: new Date()
  });

  if (io) {
    io.to(String(chat.id)).emit("newMessage", {
      id: savedMessage.id,
      chat_id: chat.id,
      direction: "OUT",
      content: text
    });

    // 🔥 CHAT LIST UPDATE
    io.emit("chatUpdated", {
      chat_id: chat.id,
      id: chat.id,
      phone: chat.phone,
      last_message: text,
      last_message_at: chat.last_message_at,
      unread_count: chat.unread_count,
      lead: {
        whatsapp_number: chat.phone,
        name: chat.lead?.name || null
      }
    });
  }

  return response.data;
};


/**
 * Resumable Upload API - required for template media header_handle.
 * Template creation expects a handle (e.g. "4:::..." or "2:...") not the numeric ID from simple /media upload.
 * @see https://developers.facebook.com/docs/graph-api/guides/upload
 * @see https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/components/#media-header
 */
async function uploadMediaForTemplate(fileUrl) {
  const appId = process.env.FB_APP_ID;
  if (!appId) {
    throw new Error('FB_APP_ID is required for template media upload (Resumable Upload API)');
  }

  const fileResponse = await axios.get(fileUrl, {
    responseType: 'arraybuffer'
  });
  const fileBuffer = Buffer.from(fileResponse.data);
  const fileLength = fileBuffer.length;
  // Meta requires file_name to match /^[^\/<@%]+$/ - no \ / < @ %
  let fileName = fileUrl.split('/').pop().split('?')[0] || 'file.png';
  try {
    fileName = decodeURIComponent(fileName);
  } catch (_) {}
  fileName = fileName.replace(/[\\/<@%]/g, '_').trim() || 'file.png';
  const fileType = getMimeType(fileName);

  // Resumable Upload only supports: image/jpeg, image/jpg, image/png, application/pdf, video/mp4
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'video/mp4'];
  if (!allowedTypes.includes(fileType)) {
    throw new Error(`Template media type not supported: ${fileType}. Use image/jpeg, image/png, application/pdf, or video/mp4.`);
  }

  // Step 1: Create upload session (query params per Meta docs)
  const sessionRes = await axios.post(
    `https://graph.facebook.com/v23.0/${appId}/uploads`,
    null,
    {
      params: {
        file_name: fileName,
        file_length: fileLength,
        file_type: fileType
      },
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`
      }
    }
  );
  const sessionId = sessionRes.data?.id; // e.g. "upload:MTphdHRh..."
  if (!sessionId) {
    throw new Error('Resumable upload: failed to get session id');
  }

  // Step 2: Upload file binary (OAuth header, file_offset: 0, raw binary body - no Content-Type)
  const uploadRes = await axios.post(
    `https://graph.facebook.com/v23.0/${sessionId}`,
    fileBuffer,
    {
      headers: {
        Authorization: `OAuth ${process.env.WHATSAPP_TOKEN}`,
        'file_offset': '0'
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    }
  );
  const handle = uploadRes.data?.h;
  if (!handle) {
    throw new Error('Resumable upload: failed to get file handle (h)');
  }

  return { id: handle };
}

exports.sendMedia = async ({ fileUrl, forTemplate }) => {
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  try {
    // Template creation requires Resumable Upload handle; simple /media returns numeric ID (invalid for templates)
    if (forTemplate) {
      const result = await uploadMediaForTemplate(fileUrl);
      console.log('✅ Template media uploaded (resumable handle):', result.id?.substring(0, 20) + '...');
      return result;
    }

    const fileResponse = await axios.get(fileUrl, {
      responseType: 'stream'
    });

    const fileName =
      fileUrl.split('/').pop().split('?')[0] || 'file.png';

    const contentType = getMimeType(fileName); // 🔥 FIX

    const form = new FormData();

    form.append('file', fileResponse.data, {
      filename: fileName,
      contentType: contentType
    });

    form.append('type', 'image'); // MUST be image
    form.append('messaging_product', 'whatsapp');

    const response = await axios.post(
      `https://graph.facebook.com/v23.0/${phoneId}/media`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`
        }
      }
    );

    console.log('✅ Media uploaded:', response.data.id);
    return response.data;

  } catch (error) {
    console.error(
      '❌ WhatsApp Media Upload Error:',
      error.response?.data || error.message
    );
    throw error;
  }
};


exports.sendTemplate = async ({ phone, template_name, params=[], media = null }) => {

  const io = getIO();
  const safeParams = [...params];
  const chat = await getOrCreateChat(phone);
  // 1️⃣ Meta se template nikalo
  const metaTemplate = await getMetaTemplate(template_name);

  if (!metaTemplate) throw new Error("Template not found");

  // 2️⃣ create payload with params and media
  const templatePayload = TemplatePayload(
    metaTemplate,
    params,
    media
  );

    console.log("templatePayloadtemplatePayload" , templatePayload);
    const param = { messaging_product: "whatsapp",
      to: phone,
      type: "template",
      template: templatePayload,
       components : []
    }


      console.log("paramparamparamparamparamparam" , param);
      

    

  // 3️⃣ send to meta
  const response = await axios.post(
    API_URL,
    {
      messaging_product: "whatsapp",
      to: phone,
      type: "template",
      template: templatePayload,
      components : []
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );

  const bodyComponent = metaTemplate.components.find(
    c => c.type === "BODY"
  );
  // USE IT
  let finalText = bodyComponent.text;

  finalText = applyParamsToTemplate(finalText, safeParams);

  // 5️⃣ DB me ACTUAL message save karo
  await WhatsappMessage.create({
    chat_id: chat.id,
    direction: "OUT",
    message_type: "template",
    content: finalText,
    meta_message_id: response.data?.messages?.[0]?.id,
    media_type: media?.type || null,
    media_url: media?.url || null,
    status: "sent"
  });

  await chat.update({
    last_message: finalText,
    last_message_at: new Date()
  });

  return response.data;
};


exports.getChat = async () => {
  try {
    const chats = await WhatsappChat.findAll({
      order: [["updatedAt", "DESC"]],
      attributes: {
        include: [
          [
            Sequelize.literal(`(
              SELECT wm.content
              FROM "WhatsappMessages" wm
              WHERE wm.chat_id = "WhatsappChat"."id"
              ORDER BY wm."createdAt" DESC
              LIMIT 1
            )`),
            "lastMessage"
          ],
          [
            Sequelize.literal(`(
              SELECT wm."createdAt"
              FROM "WhatsappMessages" wm
              WHERE wm.chat_id = "WhatsappChat"."id"
              ORDER BY wm."createdAt" DESC
              LIMIT 1
            )`),
            "lastMessageTime"
          ]
        ]
      },
      include: [
        {
          model: require("../../pgModels/lead"),
          as: "lead",
        }
      ]
    });

    return {
      statusCode: 200,
      success: true,
      data: chats
    };

  } catch (error) {
    return {
      statusCode: 400,
      success: false,
      message: error.message
    };
  }
};

exports.getTemplates = async (query) => {
  console.log("ddddddddddddddddddddddddddddddddddd", query);

  try {
    const response = await axios.get(
      API_URL_TEMPLATE,
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );


    return {
      statusCode: 200,
      success: true,
      data: response.data
    };

  } catch (error) {
    return {
      statusCode: 400,
      success: false,
      message: error.message
    };
  }
};

exports.getMessagesByChatId = async (params) => {
  try {
    const { id } = params;

    const messages = await WhatsappMessage.findAll({
      where: { chat_id: id },
      order: [["createdAt", "ASC"]],
    });

    // 🔥 FORMAT messages for frontend
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      chat_id: msg.chat_id,
      direction: msg.direction,
      message_type: msg.message_type,
      content: msg.content,

      // 👇 MEDIA handling
      media: msg.media_url
        ? {
            type: msg.media_type,   // image | video | document
            url: msg.media_url
          }
        : null,

      status: msg.status,
      createdAt: msg.createdAt
    }));

    // Reset unread count
    const updateChat = await WhatsappChat.findOne({ where: { id } });
    if (updateChat) {
      await updateChat.update({ unread_count: 0 });
    }

    return {
      statusCode: 200,
      success: true,
      data: formattedMessages
    };

  } catch (error) {
    return {
      statusCode: 400,
      success: false,
      message: error.message
    };
  }
};


async function getOrCreateChat(phone) {
  const numberMatch = phone.match(/\d+/);
  let whatsapp_number;
  if (numberMatch) {
    const phoneNumber = parsePhoneNumberFromString(`+${numberMatch[0]}`);
    whatsapp_number = phoneNumber.nationalNumber;
  }

  let lead = await Lead.findOne({ where: { whatsapp_number } });
  if (!lead) {
    const status = await LeadStatus.findOne({ where: { is_default: true } });
    const status_id = status ? status.id : null;
    lead = await Lead.create({
      whatsapp_number,
      source: "whatsapp",
      status_id: status_id
    });
  }

  let chat = await WhatsappChat.findOne({
    where: { phone: whatsapp_number }
  });

  if (!chat) {
    chat = await WhatsappChat.create({
      phone: whatsapp_number,
      lead_id: lead.id,
      unread_count: 0,
      last_message_at: new Date(),
      is_24h_active: true
    });
  }

  return chat;
}




exports.createTemplate = async (req, res) => {
  try {
    console.log("req.bodyreq.body " , req.body);

    const body = { ...req.body };
    // If Media header and fileUrl is provided (and no valid handle yet), do resumable upload and set media_upload_id
    if (body.headerType === "Media" && body.fileUrl) {
      const hasValidHandle = body.media_upload_id && String(body.media_upload_id).trim() && !/^\d+$/.test(String(body.media_upload_id).trim());
        console.log("hasValidHandlehasValidHandle" , hasValidHandle);
        
      if (!hasValidHandle) {
        const { id: handle } = await uploadMediaForTemplate(body.fileUrl);
        body.media_upload_id = handle;
      }
    }

    const payload = buildTemplatePayload(body);
console.log("Final Payload:", JSON.stringify(payload, null, 2));
// ffffffffffff
    const response = await axios.post(
      API_URL_TEMPLATE,
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    return res.json({
      success: true,
      data: response.data
    });
  } catch (err) {
    const apiError = err.response?.data?.error;
    const code = apiError?.code;
    const isInvalidHandle = code === 131009 && apiError?.error_subcode === 2494102;

    if (isInvalidHandle) {
      return res.status(400).json({
        success: false,
        error: {
          ...(err.response?.data || {}),
          hint: 'Template media header requires a Resumable Upload handle. Call POST /whatsapp/upload with body: { "fileUrl": "<image-url>", "forTemplate": true }, then use the returned "id" as media_upload_id when creating the template.'
        }
      });
    }
    return res.status(400).json({
      success: false,
      error: err.response?.data || err.message
    });
  }
};


async function getMetaTemplate(template_name) {
  const res = await axios.get(API_URL_TEMPLATE, {
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`
    }
  });

  return res.data.data.find(
    t => t.name === template_name
  );
}


function TemplatePayload(metaTemplate, params = [], media = null) {
  const safeParams = [...params];
  const components = [];

  for (const comp of metaTemplate.components) {

    /* 🔹 HEADER */
    if (comp.type === "HEADER") {

      // MEDIA HEADER
      if (["IMAGE", "VIDEO", "DOCUMENT"].includes(comp.format)) {
        if (!media?.url) {
          throw new Error("Media URL required for header");
        }

        components.push({
          type: "header",
          parameters: [{
            type: comp.format.toLowerCase(),
            [comp.format.toLowerCase()]: { link: media.url }
          }]
        });
      }

      // TEXT HEADER (ONLY if variable exists)
      if (comp.format === "TEXT" && safeParams.length > 0) {
        components.push({
          type: "header",
          parameters: [{
            type: "text",
            text: safeParams.shift()
          }]
        });
      }
    }

    /* 🔹 BODY */
    if (comp.type === "BODY") {
      const matches = comp.text.match(/{{\s*\d+\s*}}/g) || [];
      const count = matches.length;

      // ⚠️ ONLY add body if variables exist
      if (count > 0) {
        const bodyParams = safeParams.splice(0, count);

        components.push({
          type: "body",
          parameters: bodyParams.map(p => ({
            type: "text",
            text: p
          }))
        });
      }
    }

    /* 🔹 BUTTONS */
    if (comp.type === "BUTTONS") {
      comp.buttons.forEach((btn, index) => {
        if (btn.type === "URL" && safeParams.length > 0) {
          components.push({
            type: "button",
            sub_type: "url",
            index,
            parameters: [{
              type: "text",
              text: safeParams.shift()
            }]
          });
        }
      });
    }
  }

  // 🚀 IMPORTANT: no components → don't send it
  const payload = {
    name: metaTemplate.name,
    language: { code: metaTemplate.language }
  };

  if (components.length > 0) {
    payload.components = components;
  }

  return payload;
}




function applyParamsToTemplate(text, params) {
  let finalText = text;

  params.forEach((p, i) => {
    const value =
      typeof p === "string"
        ? p
        : typeof p === "object"
          ? p.text ?? ""
          : "";

    const regex = new RegExp(`{{\\s*${i + 1}\\s*}}`, "g");
    finalText = finalText.replace(regex, value);
  });

  return finalText;
}


function getMimeType(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();

  const map = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    pdf: 'application/pdf',
    mp4: 'video/mp4'
  };

  return map[ext] || 'application/octet-stream';
}
