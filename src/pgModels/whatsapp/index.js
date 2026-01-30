const WhatsappChat = require('./WhatsappChat');
const WhatsappMessage = require('./WhatsappMessage');
const WhatsappTemplate = require('./WhatsappTemplate');

// Setup associations if defined
if (WhatsappMessage.associate) {
  WhatsappMessage.associate({ WhatsappChat, WhatsappTemplate });
}
if (WhatsappTemplate.associate) {
  WhatsappTemplate.associate({ WhatsappMessage });
}

module.exports = {
  WhatsappChat,
  WhatsappMessage,
  WhatsappTemplate,
};
