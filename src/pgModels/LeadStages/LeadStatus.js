const { DataTypes } = require("sequelize");
const sequelize = require("../../config/postgres.config");
const LeadStage = require("./LeadStage");

const LeadStatus = sequelize.define("lead_statuses", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  stage_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "leadstage",
      key: "id",
    },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false, // e.g. "New", "Contacted"
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: true, // // for drag-and-drop order
    defaultValue: 0
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, { timestamps: true, tableName: "lead_statuses" });

LeadStage.hasMany(LeadStatus, {
  foreignKey: "stage_id",
  as: "statuses",
});
LeadStatus.belongsTo(LeadStage, {
  foreignKey: "stage_id",
  as: "stage",
});

module.exports = LeadStatus;