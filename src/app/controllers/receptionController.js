const services = require('../services/receiptionServices.js');
const { statusCode } = require('../../config/default.json');


exports.createReceptionlead = async ({ body }) => {
  try {
    return await services.createReceptionlead(body);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

exports.getReceptionLeadController = async ({ query }) => {
  try {
    return await services.getReceptionLeadServices(query);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};



exports.getnumberController = async ({ params }) => {
  try {
    return await services.getnumberServices(params);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

exports.updateLeadFieldController = async ({ params , body }) => {

  try {
    return await services.updateLeadFieldServices(params , body);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

exports.deleteLeadFieldController = async ({ params }) => {
    
  try {
    return await services.deleteLeadField(params);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

exports.reorderLeadFieldController = async ({ query }) => {
  try {
    return await services.reorderLeadField(query);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};