const { DataTypes } = require("sequelize");
const sequelize = require("../config/postgres.config");

module.exports = (sequelize, DataTypes) => {
  const LeadField = sequelize.define(
  "LeadField",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,  // e.g., "course_type"
      allowNull: false,
    },
    label: {
      type: DataTypes.STRING,  // e.g., "Course Type"
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        "checkbox",
        "date",
        "dropdown",
        "email",
        "money",
        "number",
        "phone",
        "radio",
        "text",
        "website"
      ),
      allowNull: false,
    },
    options: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    is_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    default_value: {
      type: DataTypes.STRING,
      allowNull: true,
    },
     is_primary_field: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
  },
  },
  {
    tableName: "LeadField",
    timestamps: true,
  }
);
  return LeadField;
};

