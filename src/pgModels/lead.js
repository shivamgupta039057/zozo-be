const { DataTypes } = require("sequelize");
const sequelize = require("../config/postgres.config");



const { Campaign } = require("./index");

const Lead = sequelize.define(
  "Lead",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    campaign_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "campaigns",
      stage_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "leadstage",
          key: "id",
        },
      },
        key: "id",
      },
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    meta: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true,  // store form data dynamically
    },
    whatsapp_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    source: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    assignedTo: {
      type: DataTypes.INTEGER, // User ID
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    stage_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "leadstage",
        key: "id",
      },
    },
    status_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "lead_statuses",
        key: "id",
      },
      allowNull: true,
    },
    reason_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "lead_reasons",
        key: "id",
      },
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER, // admin/user ID who created this lead
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    timestamps: false,
    tableName: "leads",
  }
);




module.exports = Lead;

