const services = require('../services/leadFieldService.js');
const { statusCode } = require('../../config/default.json');


exports.createLeadFieldController = async ({ body }) => {
  try {
    return await services.createLeadField(body);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

exports.getLeadFieldsController = async ({ query }) => {
  try {
    return await services.getAllLeadFields(query);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

exports.updateLeadFieldController = async ({ params,body,user}) => {

  try {
    return await services.updateLeadFieldServices(params,body,user);
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