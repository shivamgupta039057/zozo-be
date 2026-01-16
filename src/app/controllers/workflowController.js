const services = require('../services/workflowServices.js');
const { statusCode } = require('../../config/default.json');


exports.createWorkFlowController = async ({ body }) => {
  try {
    return await services.createWorkFlow(body);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};


exports.getWorkFlowController = async ({ query }) => {
  try {
    return await services.getWorkFlow(query);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

exports.saveWorkFlowController = async ({ body }) => {
  try {
    return await services.saveWorkFlow(body);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

