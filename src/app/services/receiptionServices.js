const { statusCode, resMessage } = require("../../config/default.json");
const OnLeadFieldChange = require("../../utils/OnLeadFieldChange");
const { LeadField, Lead, Reception, LeadStatus } = require("../../pgModels");
/**
 * Add or update dynamic home page services according to schema.
 *
 * @param {object} body - The home page details to add or update.
 * @returns {object} - An object containing the status code, success flag, message, and home page data.
 * @throws Will throw an error if there is a database error.
 */
exports.createReceptionlead = async (body) => {
  console.log("bodybodybodydddddddddddddd", body);
  const { leadId, name } = body;

  console.log("leadId, nameleadId, name", leadId, name);

  try {
    let ReceptionData;
    if (leadId) {
      console.log("sssssssdddddddddddddddsdfsdfasd", leadId, name);

      ReceptionData = await Reception.create(name,leadId);

      console.log("ReceptionDataReceptionDataReceptionData", ReceptionData);
    } else {
      const { data, source, assignedTo, notes, name, email, whatsapp_number } =
        body;

      // Check if whatsapp_number already exists in the Lead model
      if (whatsapp_number) {
        const existingLead = await Lead.findOne({
          where: { whatsapp_number: whatsapp_number },
        });
        if (existingLead) {
          return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: "Lead with this WhatsApp number already exists",
          };
        }
      }
      const status = await LeadStatus.findOne({ where: { is_default: true } });

      console.log("statusstatusstatusstatus", status);

      // Assign the lead to the user who created it
      const lead = await Lead.create({
        data,
        source,
        status_id: status ? status.id : null,
        notes,
        name,
        email,
        whatsapp_number,
        assignedTo: user?.id || null,
        created_by: user?.id || null,
      });
      ReceptionData = await Reception.create(lead.id, name);

      return {
        statusCode: statusCode.OK,
        success: true,
        message: resMessage.LEAD_CREATED || "Lead Created successfull",
        data: {
          lead,
          status,
        },
      };
    }

    return {
      statusCode: statusCode.OK,
      success: true,
      message: resMessage.Add_LEAD_FIELD_Data,
      data: ReceptionData,
    };
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

exports.createCheckOutLead = async (body) => {
  try {
     const { receptionId } = body;

  console.log("ddddddddddddddddddddddddddddddd" , receptionId);

    const ReceptionData = await Reception.findOne({
      where: { id: receptionId },
    });

    if (!ReceptionData) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: "Reception data not found for the given leadId",
      };
    }

    ReceptionData.checkIn = false;
    await ReceptionData.save();

    return {
      statusCode: statusCode.OK,
      success: true,
      message: resMessage.Add_LEAD_FIELD_Data,
      data: ReceptionData,
    };
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

exports.getnumberServices = async (params) => {
  const { number } = params;

  console.log("numbernumbernumbernumber", number);

  try {
    // Check if any Lead record has a name of "whatsapp_number"
    const whatsappNumberExists = await Lead.findOne({
      where: { whatsapp_number: number },
    });
    return {
      statusCode: statusCode.OK,
      success: true,
      message: resMessage.GET_LEAD_FIELD_Data,
      data: whatsappNumberExists ? whatsappNumberExists : false,
    };
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

exports.getReceptionLeadServices = async (query) => {
  const { page = 1, limit = 10 } = query;
  try {
    // Pagination calculations
    const offset = (page - 1) * limit;

    // Fetch Receptionlead records with associated Lead (as 'lead')
    const receptionLeads = await Reception.findAndCountAll({
      include: [
        {
          model: Lead,
          as: "lead", // This must match the alias used in the associate function in your model
        },
      ],
      offset: Number(offset),
      limit: Number(limit),
      order: [["createdAt", "DESC"]],
    });

    return {
      statusCode: statusCode.OK,
      success: true,
      message: resMessage.GET_LEAD_FIELD_Data,
      data: {
        rows: receptionLeads.rows,
        count: receptionLeads.count,
        currentPage: page,
        perPage: limit,
        totalPages: Math.ceil(receptionLeads.count / limit),
      },
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
  console.log("bodybodybody", body);

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
      console.log("leadDataleadData", leadId);
      // Extract the dynamic key from the body object (assumes body has exactly one key)
      const fieldKey =
        body && typeof body === "object" ? Object.keys(body)[0] : undefined;
      const fieldvalue =
        body && typeof body === "object" ? Object.values(body)[0] : undefined;

      const leadFieldData = await LeadField.findOne({
        where: { name: fieldKey },
      });

      if (!leadFieldData) {
        return {
          statusCode: statusCode.NOT_FOUND,
          success: false,
          message: "Lead field not found",
        };
      }
      console.log("hasNameKeyhasNameKeyhasNameKeyhasNameKey", leadFieldData);

      if (typeof OnLeadFieldChange === "function") {
        console.log("Calling OnLeadFieldChange function...");
        dataTemp = await OnLeadFieldChange(leadData, leadFieldData, fieldvalue);
      } else {
        console.log(
          "OnLeadFieldChange is not a function:",
          typeof OnLeadFieldChange,
        );
      }
    }
    console.log("dataTempdataTempdataTemp", dataTemp);

    const primaryFields = ["name", "whatsapp_number", "email"];
    const currentData =
      leadData.dataValues && leadData.dataValues.data
        ? { ...leadData.dataValues.data }
        : {};
    const updateKey =
      body && typeof body === "object" ? Object.keys(body)[0] : undefined;
    console.log("updateKeyupdateKeyupdateKey", updateKey);

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

    const updateResult = await Lead.update(updatePayload, {
      where: { id: leadId },
    });

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
    const updatefield = await LeadField.destroy({
      where: { id: id },
    });
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
  const { page = 1, limit = 10 } = query;
  try {
    const leadsName = await LeadField.findAll({
      attributes: ["label"],
      order: [["order", "ASC"]],
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
