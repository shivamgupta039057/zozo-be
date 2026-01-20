const services = require('../services/userService');
const { statusCode } = require('../../config/default.json');



/**
 * Function to handle addDoctorAvailability.
 *
 * @param {Object} param - The function parameter object.
 * @param {Object} param.body - The request body containing set time detials.
 * @returns {Object} - The response object containing status code, success flag, and message.
 * @throws Will throw an error if login fails.
 */
exports.addUser = async ({body}) => {
  try {
    return await services.addUser(body);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};


/**
 * Function to handle addDoctorAvailability.
 *
 * @param {Object} param - The function parameter object.
 * @param {Object} param.body - The request body containing set time detials.
 * @returns {Object} - The response object containing status code, success flag, and message.
 * @throws Will throw an error if login fails.
 */
exports.getUserList = async ({query}) => {
  try {
    return await services.getUserList(query);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};


/**
 * Function to handle addDoctorAvailability.
 *
 * @param {Object} param - The function parameter object.
 * @param {Object} param.body - The request body containing set time detials.
 * @returns {Object} - The response object containing status code, success flag, and message.
 * @throws Will throw an error if login fails.
 */
exports.editUser = async ({params,body}) => {
  try {
    return await services.editUser(params,body);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};


exports.login = async ({body}) => {
  try {
    return await services.loginUser(body);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};


exports.sendotpEmail = async ({body}) => {
  try {
    return await services.sendotpEmail(body);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};


exports.getProfile = async ({query, user}) => {
  try {
    return await services.getProfileList(query , user);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

