const { DataTypes } = require("sequelize");
const sequelize = require("../../config/postgres.config");
const Broadcast = require("../brodcaste/Broadcast");

const BroadcastLog = sequelize.define("BroadcastLog", {
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
  phone: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.STRING   // SENT, DELIVERED, READ, FAILED
  },
  meta_response: {
    type: DataTypes.JSONB
  }
}, {
  tableName: "BroadcastLogs",
  timestamps: true
});

module.exports = BroadcastLog;
