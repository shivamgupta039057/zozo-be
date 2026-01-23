// pgModels/BulkLeadUpload.js
module.exports = (sequelize, DataTypes) => {
  return sequelize.define("BulkLeadUpload", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    file_name: DataTypes.STRING,
    file_path: DataTypes.STRING,
    uploaded_by: DataTypes.INTEGER,
    status: {
      type: DataTypes.ENUM("UPLOADED", "MAPPED", "COMPLETED"),
      defaultValue: "UPLOADED"
    }
  }, {
    tableName: "bulk_lead_uploads",
    timestamps: true
  });
};
