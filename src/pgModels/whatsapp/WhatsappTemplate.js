const { DataTypes } = require('sequelize');
const sequelize = require('../../config/postgres.config');

const WhatsappTemplate = sequelize.define("WhatsappTemplate", {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },

  name: DataTypes.STRING,

  language: DataTypes.STRING,

  category: DataTypes.STRING,

  body: DataTypes.TEXT,

  meta_template_id: DataTypes.STRING,

  status: DataTypes.STRING // APPROVED
});

// Add relation to WhatsappMessage
WhatsappTemplate.associate = function(models) {
  WhatsappTemplate.hasMany(models.WhatsappMessage, {
    foreignKey: 'meta_message_id',
    sourceKey: 'meta_template_id',
    as: 'messages'
  });
};

module.exports = WhatsappTemplate;
