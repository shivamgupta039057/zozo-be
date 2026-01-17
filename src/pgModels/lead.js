const { DataTypes } = require("sequelize");
const sequelize = require("../config/postgres.config");
const LeadStage = require("./LeadStages/LeadStage");
const LeadStatus = require("./LeadStages/leadStatus");
const LeadReason = require("./LeadStages/LeadReason");

const Lead = sequelize.define(
  "Lead",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true,  // store form data dynamically
    },    
    source: {
      type: DataTypes.STRING, 
      allowNull: true,
    },
    assignedTo: {
      type: DataTypes.STRING, // Counselor ID or Name
      allowNull: true,
    },
    stage_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: LeadStage,
        key: "id",
      },
    },
    status_id: {
      type: DataTypes.INTEGER,
      references: {
        model: LeadStatus,
        key: "id",
      },
      allowNull: true,
    },
    reason_id: {
      type: DataTypes.INTEGER,
      references: {
        model: LeadReason,
        key: "id",
      },
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.STRING, // admin/user ID who created this lead
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: "leads",
  }
);

Lead.belongsTo(LeadStage, { foreignKey: "stage_id", as: "stage" });
Lead.belongsTo(LeadStatus, { foreignKey: "status_id", as: "status" });
Lead.belongsTo(LeadReason, { foreignKey: "reason_id", as: "reason" });

module.exports = Lead;
