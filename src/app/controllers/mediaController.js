const services = require('../services/mediaServices.js');
const { statusCode } = require('../../config/default.json');





exports.uploadMedia = async (req, res) => {
  try {
    console.log("bodybodybodybody",req ,"Dddddddddddddddddd", res);
    return await services.uploadMediaService(req.file, req.body, req.user);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

exports.getMedia = async (req, res) => {
  try {
    return await services.getMediaService(req.query);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};
