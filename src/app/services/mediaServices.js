const axios = require("axios");
const Lead = require("../../pgModels/lead");
const WhatsappChat = require("../../pgModels/whatsapp/WhatsappChat");
const WhatsappMessage = require("../../pgModels/whatsapp/WhatsappMessage");
const MediaLibrary = require("../../pgModels/MediaLibrary");

const getMediaType = (mime) => {
  if (mime.startsWith("image")) return "image";
  if (mime.startsWith("video")) return "video";
  if (mime.startsWith("audio")) return "audio";
  return "document";
};

exports.uploadMediaService = async (file, body, user) => {
  try {
    if (!file) {
      return {
        statusCode: 400,
        success: false,
        message: "File is required",
      };
    }
  // console.log("useruseruseruseruseruseruser" , user.id);
  
    console.log("file, body, userfile, body, userfile, body, user", file);

    // const media = await MediaLibrary.create({
    //   original_name: file.originalname,
    //   file_name: file.filename,
    //   media_type: getMediaType(file.mimetype),
    //   mime_type: file.mimetype,
    //   file_size: file.size,
    //   file_url: `/uploads/${body.image}`, // path added by middleware
    //   uploaded_by: user?.id || null
    // });

    const media = await MediaLibrary.create({
      original_name: file.originalname,
      file_name: file.key, // Correct property for S3 path
      media_type: getMediaType(file.mimetype), // Using your helper function!
      mime_type: file.mimetype,
      file_size: file.size,
      file_url: file.location, // The full https://... URL from S3
      uploaded_by: user?.id || null,
    });

    return {
      statusCode: 200,
      success: true,
      message: "Media uploaded successfully",
      data: media,
    };
  } catch (error) {
    return {
      statusCode: 400,
      success: false,
      message: error.message,
    };
  }
};

exports.getMediaService = async (query) => {
  try {
    let condition = {};

    if (query.type) {
      condition.media_type = query.type;
    }

    const media = await MediaLibrary.findAll({
      where: condition,
    });

    return {
      statusCode: 200,
      success: true,
      message: "Media retrieved successfully",
      data: media,
    };
  } catch (error) {
    return {
      statusCode: 400,
      success: false,
      message: error.message,
    };
  }
};
