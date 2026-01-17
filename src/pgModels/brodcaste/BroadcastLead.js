const { DataTypes } = require('sequelize');
const sequelize = require('../../config/postgres.config');
const Broadcast = require("../brodcaste/Broadcast");
const Lead = require("../lead");

const BroadcastLead = sequelize.define("BroadcastLead", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  broadcast_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Broadcast,
      key: "id"
    }
  },
  lead_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Lead,
      key: "id"
    }
  },
  phone: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM("PENDING", "SENT", "FAILED", "RETRY"),
    defaultValue: "PENDING"
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  error_message: {
    type: DataTypes.TEXT
  }
}, {
  tableName: "BroadcastLeads",
  timestamps: true
});

module.exports = BroadcastLead;

