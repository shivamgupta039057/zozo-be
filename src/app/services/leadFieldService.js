const { statusCode, resMessage } = require("../../config/default.json");
const OnLeadFieldChange = require("../../utils/OnLeadFieldChange");
const {LeadField,Lead}= require("../../pgModels");
/**
 * Add or update dynamic home page services according to schema.
 *
 * @param {object} body - The home page details to add or update.
 * @returns {object} - An object containing the status code, success flag, message, and home page data.
 * @throws Will throw an error if there is a database error.
 */
exports.createLeadField = async (body) => {

  console.log("bodybodybodydddddddddddddd" , body);
  
  try {
    const { label, ...rest } = body;

    // let a=await LeadField.findAll();
    // console.log("aaaaaaaaaa" , a);
    const existingField = await LeadField.findOne({
      where: {
        label: label
      },
    });

    console.log("existingFieldexistingField" , existingField);
    if (existingField) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: resMessage.FIELD_LABLE_EXIST,
      };
    }

    const name = label.toLowerCase().trim().replace(/\s+/g, "_");
    
    
     const maxOrderStatus = await LeadField.findOne({
     order: [["order", "DESC"]],
     attributes: ["order"],
    });
    console.log("maxOrderStatusmaxOrderStatus" , maxOrderStatus);
    const nextOrder = maxOrderStatus ? maxOrderStatus.order + 1 : 1;

   

    const leadfiled = await LeadField.create({ ...rest, label:label, name , order: nextOrder });
    
    return {
      statusCode: statusCode.OK,
      success: true,
      message: resMessage.Add_LEAD_FIELD_Data,
      data: leadfiled,
    };
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

exports.getAllLeadFields = async (query) => {
  const { page = 1, limit = 10 } = query;
  try {
    const getfield = await LeadField.findAll({ order: [["order", "ASC"]] });

    // Create array of { number: i+1, name: leadfield.name }
    // const whatsappNumber = await Lead.findOne({ where: { name: "whatsapp_number" } });

    return {
      statusCode: statusCode.OK,
      success: true,
      message: resMessage.GET_LEAD_FIELD_Data,
      data: getfield,
      // whatsappNumber, // Add numbered key-name pairs to response
    };
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

exports.updateLeadFieldServices = async (params, body) => {

  console.log("bodybodybody" , body);
  
  const { leadId } = params; // expect: id = leadFieldId, leadId = lead id (optional)
  try {

    let dataTemp = null;
    let leadData = null;

    // If a leadId is given (for OnLeadFieldChange logic)
    if (leadId) {
       leadData = await Lead.findByPk(leadId);
      if (!leadData) {
        return {
          statusCode: statusCode.NOT_FOUND,
          success: false,
          message: "Lead not found",
        };
      }
      console.log("leadDataleadData" , leadId);
      // Extract the dynamic key from the body object (assumes body has exactly one key)
      const fieldKey = body && typeof body === 'object' ? Object.keys(body)[0] : undefined;
      const fieldvalue = body && typeof body === 'object' ? Object.values(body)[0] : undefined;

     const leadFieldData = await LeadField.findOne({ where: { name: fieldKey } });

     if (!leadFieldData) {
      return {
        statusCode: statusCode.NOT_FOUND,
        success: false,
        message: "Lead field not found",
      };
    }
      console.log("hasNameKeyhasNameKeyhasNameKeyhasNameKey" , leadFieldData);
     
      if (typeof OnLeadFieldChange === "function") {
        console.log("Calling OnLeadFieldChange function...");
        dataTemp = await OnLeadFieldChange(leadData, leadFieldData , fieldvalue);
      } else {
        console.log("OnLeadFieldChange is not a function:", typeof OnLeadFieldChange);
      }
    }
    console.log("dataTempdataTempdataTemp" , dataTemp);

    
    const primaryFields = ["name", "whatsapp_number", "email"];
    const currentData = (leadData.dataValues && leadData.dataValues.data) ? { ...leadData.dataValues.data } : {};
    const updateKey = body && typeof body === 'object' ? Object.keys(body)[0] : undefined;
    console.log("updateKeyupdateKeyupdateKey" , updateKey);

    let updatePayload = {};

    if (updateKey) {
      if (primaryFields.includes(updateKey)) {
        // Update at the root level (not in data)
        updatePayload[updateKey] = body[updateKey];
      } else {
        // Update in the data object
        currentData[updateKey] = body[updateKey];
        updatePayload.data = currentData;
      }
    }

    console.log("updatePayloadupdatePayloadupdatePayload", updatePayload);

    const updateResult = await Lead.update(
      updatePayload,
      { where: { id: leadId } }
    );

    return {
      statusCode: statusCode.OK,
      success: true,
      dataTemp,
      message: resMessage.UPDATE_LEAD_FIELD_Data,
      data: updateResult,
    };
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};


exports.deleteLeadField = async (params) => {
  const { id } = params;
  try {
    const updatefield = await LeadField.destroy(
      {
        where: { id: id },
      }
    );
    return {
      statusCode: statusCode.OK,
      success: true,
      message: resMessage.DELETE_LEAD_FIELD_Data,
      data: updatefield,
    };
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};


exports.reorderLeadField = async (query) => {
  const { page = 1, limit = 10} = query;
  try {
    const leadsName = await LeadField.findAll({ 
      attributes: ['label'], 
      order: [["order", "ASC"]] 
    });
    return {
      statusCode: statusCode.OK,
      success: true,
      message: resMessage.GET_RECODE_LIST_DATA,
      data: leadsName,
    };
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};