const { DataTypes } = require("sequelize");
const sequelize = require("../config/postgres.config");

const MediaLibrary = sequelize.define(
  "MediaLibrary",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // original file name uploaded by user
    original_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // stored file name on server
    file_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // image | video | audio | document
    media_type: {
      type: DataTypes.ENUM("image", "video", "audio", "document"),
      allowNull: false,
    },

    mime_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    file_size: {
      type: DataTypes.INTEGER, // bytes
      allowNull: false,
    },

    // full URL or relative path
    file_url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    // optional: who uploaded it
    uploaded_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "media_library",
    timestamps: true, // createdAt, updatedAt
  }
);

module.exports = MediaLibrary;
