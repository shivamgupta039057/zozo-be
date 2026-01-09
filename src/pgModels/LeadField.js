const { DataTypes } = require("sequelize");
const sequelize = require("../config/postgres.config");

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
module.exports = LeadField;

// await LeadField.bulkCreate([
//   {
//     name: "course_type",
//     label: "Course Type",
//     type: "dropdown",
//     options: [
//       { label: "MBBS Government", value: "mbbs_govt", order: 1 },
//       { label: "MBBS Abroad", value: "mbbs_abroad", order: 2 },
//       { label: "MBBS Private", value: "mbbs_private", order: 3 },
//       { label: "BAMS", value: "bams", order: 4 },
//       { label: "NRI Admission", value: "nri_admission", order: 5 },
//     ],
//     is_required: true,
//     order: 1,
//     category: "lead_form",
//   },
//   {
//     name: "student_name",
//     label: "Student Name",
//     type: "text",
//     is_required: true,
//     default_value: "",
//     order: 2,
//     category: "lead_form",
//   },
// ]);
