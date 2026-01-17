const { DataTypes } = require('sequelize');
const sequelize = require('../../config/postgres.config');
const Lead = require('../lead'); // Reference to the Lead model

const WhatsappChat = sequelize.define("WhatsappChat", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  lead_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Lead,
      key: "id"
    }
  },
  phone: DataTypes.STRING,
  last_message_at: DataTypes.DATE,
  is_24h_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  unread_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'WhatsappChats',
  timestamps: true
});

// Association: Each WhatsappChat belongs to a Lead
WhatsappChat.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });

module.exports = WhatsappChat;
