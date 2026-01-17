const { DataTypes } = require('sequelize');
const sequelize = require('../../config/postgres.config');

const Broadcast = sequelize.define("Broadcast", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  template_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  number_field: {
    type: DataTypes.STRING,
    defaultValue: "whatsapp_number"
  },
  auto_retry: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: DataTypes.ENUM("DRAFT", "RUNNING", "COMPLETED", "FAILED"),
    defaultValue: "DRAFT"
  },
  total_leads: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: "Broadcasts",
  timestamps: true
});

module.exports = Broadcast;
