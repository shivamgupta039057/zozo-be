const { DataTypes } = require('sequelize');
const sequelize = require('../../config/postgres.config');

const WhatsappMessage = sequelize.define("WhatsappMessage", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  chat_id: DataTypes.INTEGER,

  direction: DataTypes.STRING, // IN | OUT

  message_type: DataTypes.STRING, // text | template

  content: DataTypes.TEXT,

  meta_message_id: DataTypes.STRING,
  media_type: DataTypes.STRING,
  media_url: DataTypes.STRING,
  meta_template_id: DataTypes.STRING,
  status: DataTypes.STRING // sent, delivered, read
});

// Add relation to WhatsappTemplate and WhatsappChat
WhatsappMessage.associate = function (models) {
  // Message belongs to a chat
  WhatsappMessage.belongsTo(models.WhatsappChat, {
    foreignKey: 'chat_id',
    as: 'chat'
  });

  // Message belongs to a template via meta_message_id -> meta_template_id
  // WhatsappMessage.belongsTo(models.WhatsappTemplate, {
  //   foreignKey: 'meta_message_id',
  //   targetKey: 'meta_template_id',
  //   as: 'template'
  // });
};


module.exports = WhatsappMessage;
