// const services = require('../services/workflowServices.js');
// const { statusCode } = require('../../config/default.json');


// /** GET - verify webhook from Meta */
// exports.verifyWebhook = async ({ query }, res) => {
//   try {
//     const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;
//     const mode = query["hub.mode"];
//     const token = query["hub.verify_token"];
//     const challenge = query["hub.challenge"];
//     if (mode === "subscribe" && token === VERIFY_TOKEN) {
//       return res.status(200).send(challenge);
//     } else {
//       return res.sendStatus(403);
//     }
//   } catch (error) {
//     return res.status(400).json({
//       statusCode: statusCode.BAD_REQUEST,
//       success: false,
//       message: error.message,
//     });
//   }
// };

// /** helper for signature check */
// function verifySignature(req) {
//     const signature = req.headers["x-hub-signature-256"];
//     if (!signature) return false;
//     const raw = req.rawBody; // ensure express captured raw body
//     if (!raw) return false;
//     const expected = "sha256=" + crypto.createHmac("sha256", process.env.FB_APP_SECRET).update(raw).digest("hex");
//     try {
//       return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
//     } catch (e) {
//       return false;
//     }
//   }


// exports.handleWebhook = async (req, res) => {
//   // Quickly acknowledge
//   res.status(200).send("EVENT_RECEIVED");

//   // verify signature
//   if (!verifySignature(req)) {
//     console.warn("Invalid signature on webhook");
//     return;
//   }

//   const body = req.body;

//   // Process entries
//   if (!body.entry) return;

//   for (const entry of body.entry) {
//     if (!entry.changes) continue;

//     for (const change of entry.changes) {
//       const val = change.value;

//       // If messages present (WhatsApp)
//       if (val && val.messages) {
//         for (const msg of val.messages) {
//           const from = msg.from; // phone number string
//           const text = (msg.text && msg.text.body) || null;

//           console.log("Incoming WhatsApp from:", from, "text:", text);

//           // TODO: map phone to existing lead and save message history

//           // Example: create lead if not found (your Lead model)
//           // const lead = await Lead.findOrCreate({ where: { phone: from }, defaults: { data: { phone: from } } });

//           // Optionally auto-reply within 24h with a text (or send template if outside 24h)
//           // Example: sendTextMessage(from, "Thanks! We'll contact you soon.").catch(console.error);

//           // Or send a template (use only approved template names)
//           // try {
//           //   await sendTemplateMessage(from, "welcome_template", [
//           //      { type: "body", parameters: [{ type: "text", text: "Name" }] }
//           //   ]);
//           // } catch(e) { console.error("send template failed", e); }
//         }
//       }

//       // handle other event types like statuses (deliveries) in val.statuses
//     }
//   }
// };



// exports.verifyWebhook = async ({ body }) => {
//   try {
//     return await services.createWorkFlow(body);
//   } catch (error) {
//     return {
//       statusCode: statusCode.BAD_REQUEST,
//       success: false,
//       message: error.message,
//     };
//   }
// };
const services = require('../services/whatsappService.js');
const { statusCode } = require('../../config/default.json');




exports.verifyWebhook = ({ query }, res) => {
  const mode = query["hub.mode"];
  const token = query["hub.verify_token"];
  const challenge = query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.FB_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
};


exports.receiveMessage = async ({ body }) => {
  try {
    return await services.handleIncomingMessage(body);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};



exports.sendText = async ({ body ,user}) => {
  try {
    return await services.sendText(body,user);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};


exports.sendTemplate = async ({ body ,user}) => {
  console.log("dddddddbodybodybodybody" , body);
  
  try {
    return await services.sendTemplate(body,user);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

exports.sendMedia = async ({ body }) => {
  try {
    return await services.sendMedia(body);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

exports.getChat = async ({ body }) => {
  try {
    return await services.getChat(body);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

exports.getTemplates = async ({ query }) => {
  console.log("bodybodybodyddddddbodybody" , query);
  try {
    return await services.getTemplates(query);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

exports.getMessagesByChatId = async ({ params }) => {
  try {
    return await services.getMessagesByChatId(params);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

exports.createTemplate = async (req, res) => {
  console.log("dddddddbodybodybodybody" , req.body);
  
  try {
    return await services.createTemplate(req, res);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};