const axios = require("axios");
const Lead = require("../../pgModels/lead");
const WhatsappChat = require("../../pgModels/whatsapp/WhatsappChat");
const WhatsappMessage = require("../../pgModels/whatsapp/WhatsappMessage");
const API_URL = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`;
const API_URL_TEMPLATE = `https://graph.facebook.com/v23.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`;
const { parsePhoneNumberFromString } = require('libphonenumber-js');
const Sequelize = require("sequelize");
const { BroadcastLog,LeadStatus } = require("../../pgModels/index");
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
       lead:{
        whatsapp_number : chat.phone,
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
       lead:{
        whatsapp_number : chat.phone,
        name: chat.lead?.name || null
      }
    });
  }

  return response.data;
};


exports.sendTemplate = async ({ phone, template_name, language }) => {
  const io = getIO();

  const chat = await getOrCreateChat(phone);


  const response = await axios.post(
    API_URL,
    {
      messaging_product: "whatsapp",
      to: phone,
      type: "template",
      template: {
        name: template_name,
        language: { code: language }
      }
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
    message_type: "template",
    content: template_name,
    meta_message_id: response.data?.messages?.[0]?.id
  });

  await chat.update({
    last_message: template_name,
    last_message_at: new Date()
  });

  if (io) {
    io.emit("chatUpdated", {
      id: chat.id,
      phone: chat.phone,
      last_message: template_name,
      last_message_at: chat.last_message_at,
      unread_count: chat.unread_count,
      lead:{
        whatsapp_number : chat.phone,
        name: chat.lead?.name || null
      }
    });
  }

  return response.data;
};


// exports.getChat = async () => {
//   try {
//     // Find all chats with newest first, include Lead info if available for each chat's lead_id
//     const chats = await WhatsappChat.findAll({
//       order: [["updatedAt", "DESC"]],
//       include: [
//         {
//           model: require("../../pgModels/lead"),
//           as: "lead",
//         },
//         {
//           model: WhatsappMessage, // Adjust path/model name as needed
//           as: "messages", // Make sure association is set up as 'messages'
//           limit: 1,
//           order: [["createdAt", "DESC"]], // Get the last message
//         },
//       ],
//     });

//     // Optionally, you can format the result to only include the last message as 'lastMessage'
//     const formattedChats = chats.map(chat => {
//       const chatData = chat.toJSON ? chat.toJSON() : chat;
//       return {
//         ...chatData,
//         lastMessage: chatData.messages && chatData.messages[0] ? chatData.messages[0] : null,
//       };
//     });

//     console.log("chatschatschatschatschat", formattedChats);
//     return {
//       statusCode: 200,
//       success: true,
//       data: formattedChats
//     };

//   } catch (error) {
//     return {
//       statusCode: 400,
//       success: false,
//       message: error.message
//     };
//   }
// };


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

    console.log("`responseresponseresponse`", response.data);


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
    const chatID = await WhatsappMessage.findAll({
      where: { chat_id: id },
      order: [["createdAt", "ASC"]],
    });

   let updateChat = await WhatsappChat.findOne({ where: { id: id } });
    if (updateChat) {
      await updateChat.update({ unread_count: 0 });
    }
    return {
      statusCode: 200,
      success: true,
      data: chatID
    };

  } catch (error) {
    return {
      statusCode: 400,
      success: false,
      message: error.message
    };
  }
};



// async function getOrCreateChat(phone) {
//   console.log("ddddddddddddddddddddddddddddddddddddd", phone);

//   const numberMatch = phone.match(/\d+/);

//   console.log("numberMatchnumberMatchnumberMatch", numberMatch);

//   let whatsapp_number
//   if (numberMatch) {
//     const phoneNumber = parsePhoneNumberFromString(`+${numberMatch[0]}`);
//     whatsapp_number = phoneNumber.nationalNumber
//   }

//   console.log("whatsapp_numberwhatsapp_numberwhatsapp_number", whatsapp_number);


//   let lead = await Lead.findOne({ where: { whatsapp_number } });

//   console.log("leadleadleadleadlead", lead);



//   if (!lead) {
//     lead = await Lead.create({
//       whatsapp_number,
//       source: "whatsapp"
//     });
//   }

//   let chat = await WhatsappChat.findOne({
//     where: { phone: whatsapp_number }
//   });

//   console.log(chat, "chhhhhhh")

//   if (!chat) {
//     chat = await WhatsappChat.create({
//       phone: whatsapp_number,
//       lead_id: lead.id,
//       last_message_at: new Date(),
//       // is_24h_active: true
//     });
//   }

//   return chat;
// }
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
    const payload = buildTemplatePayload(req.body);

    console.log("ssssssssssspayloadpayloadpayload", payload);

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

    console.log("responseresponseresponseresponseresponseresponse", response);


    return res.json({
      success: true,
      data: response.data
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.response?.data || err.message
    });
  }
};
