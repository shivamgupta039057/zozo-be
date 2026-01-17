const services = require('../services/brodcasteService');
const { statusCode } = require('../../config/default.json');

exports.createBrodcaste = async ({ body }) => {
  try {
    return await services.createBrodcaste(body);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};



exports.startBroadcast = async ({ params,query, }) => {
  try {

    return await services.startBroadcast(params.id);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};