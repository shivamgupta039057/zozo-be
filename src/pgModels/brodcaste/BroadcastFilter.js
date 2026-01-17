const { DataTypes } = require('sequelize');
const sequelize = require('../../config/postgres.config');
const Broadcast = require("../brodcaste/Broadcast");

const BroadcastFilter = sequelize.define("BroadcastFilter", {
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
  field: {
    type: DataTypes.STRING
  },
  operator: {
    type: DataTypes.STRING
  },
  value: {
    type: DataTypes.STRING
  }
}, {
  tableName: "BroadcastFilters",
  timestamps: true
});

module.exports = BroadcastFilter;
