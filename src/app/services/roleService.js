const { statusCode, resMessage } = require("../../config/default.json");
const {RoleModel} = require("../../pgModels");


exports.getRoles = async () => {
  try {
    
    
    const roles = await RoleModel.findAll();

    return {
      statusCode: statusCode.OK,
      success: true,
      message: "All Roles",
      data: roles,
    };
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};