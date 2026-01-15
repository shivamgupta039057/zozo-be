const { statusCode, resMessage } = require("../../config/default.json");
// const Lead = require("../../pgModels/lead");
const leadstage = require("../../pgModels/LeadStages/LeadStage");
const { Op } = require("sequelize");
const Leadstatus = require("../../pgModels/LeadStages/leadStatus");
const Leadreason = require("../../pgModels/LeadStages/leadReason");

/**
 * Add or update dynamic home page services according to schema.
 *
 * @param {object} body - The home page details to add or update.
 * @returns {object} - An object containing the status code, success flag, message, and home page data.
 * @throws Will throw an error if there is a database error.
 */
exports.createLeadStage = async (body) => {
  console.log("fdgdfkgjldfdkldskl" , body);
  
    const { name, ...rest } = body;
  try {
    // Check for existing entry by name or order
    const existingField = await leadstage.findOne({
      where: {
        [Op.or]: [
          { name: name },
          { order: rest.order }
        ]
      },
    });

    if (existingField) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: resMessage.FIELD_LABLE_EXIST,
      };
    }

    const leadfiled = await leadstage.create(body);

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

exports.getAllLeadStages = async (query) => {
  const { page = 1, limit = 10} = query;
  try {
    const getfield = await leadstage.findAll({ order: [["order", "ASC"]] });
    return {
      statusCode: statusCode.OK,
      success: true,
      message: resMessage.GET_LEAD_FIELD_Data,
      data: getfield,
    };
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

exports.getAllLeadByIdStages = async (query , params) => {
  const { page = 1, limit = 10} = query;
  const { id } = params;
  try {
    const getfield = await leadstage.findByPk(id);
    return {
      statusCode: statusCode.OK,
      success: true,
      message: resMessage.GET_LEAD_FIELD_Data,
      data: getfield || null,
    };
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

exports.updateLeadStage = async (params, body) => {
  const { id } = params;
  try {
    const [updatedCount] = await leadstage.update(
      { ...body },
      {
        where: { id: id },
      }
    );
    console.log("updatedCountupdatedCount" , updatedCount);
    
    if (updatedCount === 0) {
      return {
        statusCode: statusCode.DATA_NOT_FOUND,
        success: false,
        message: "Lead Stage not found",
        data: null,
      };
    }
    const updatedStage = await leadstage.findByPk(id);
    return {
      statusCode: statusCode.OK,
      success: true,
      message: resMessage.UPDATE_LEAD_STAGE_Data,
      data: updatedStage,
    };
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};


exports.deleteLeadStage = async (params) => {
  const { id } = params;
  try {
    const updatefield = await leadstage.destroy(
      {
        where: { id: id },
      }
    );
    return {
      statusCode: statusCode.OK,
      success: true,
      message: resMessage.DELETE_LEAD_STAGE_Data,
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


// lead status routes

exports.createLeadStatus = async (body) => {
  console.log("createLeadStatuscreateLeadStatus" , body); 
  try {
  const { stage_id, name, color , is_default } = body;
  const existingStatus = await Leadstatus.findOne({
    where: {
      stage_id,
      name: {
        [Op.iLike]: name
      }
    },
  });
  if (existingStatus) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: `Status "${name}" already exists in this stage`,
    };
  }
  const maxOrderStatus = await Leadstatus.findOne({
    where: { stage_id },
    order: [["order", "DESC"]],
    attributes: ["order"],
  });
  const nextOrder = maxOrderStatus ? maxOrderStatus.order + 1 : 1;
  console.log("maxOrderStatusmaxOrderStatus" , nextOrder);
  // const leadStatusCreate = await Leadstatus.create(body);
  const leadStatusCreate = await Leadstatus.create({
    stage_id,
    name,
    color,
    is_default: is_default || false,
    order: nextOrder,
  });
  const leadstatus = await Leadstatus.findByPk(leadStatusCreate.id, {
    attributes: ["id", "name", "order", "color", "is_active", "stage_id"],
  });
  const leadstatusdata = leadstatus ? {
    id: leadstatus.id,
    name: leadstatus.name,
    order: leadstatus.order,
    color: leadstatus.color,
    is_active: leadstatus.is_active,
  } : null;
  return {
    statusCode: statusCode.OK,
    success: true,
    message: resMessage.Add_LEAD_FIELD_Data,
    data: leadstatusdata || null ,
    };
} catch (error) {
  return {
    statusCode: statusCode.BAD_REQUEST,
    success: false,
    message: error.message,
  };
}
};

exports.getAllLeadStatuses = async (query) => {
  const { page = 1, limit = 10} = query;
  try {
    const getfield = await Leadstatus.findAll({ order: [["order", "ASC"]] });
    return {
      statusCode: statusCode.OK,
      success: true,
      message: resMessage.GET_LEAD_FIELD_Data,
      data: getfield,
    };
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};


exports.updateLeadStatus = async (params, body) => {
  const { id } = params;
  try {
    const [updatedCount] = await Leadstatus.update(
      { ...body },
      {
        where: { id: id },
      }
    );
    console.log("updatedCountupdatedCount" , updatedCount);
    
    if (updatedCount === 0) {
      return {
        statusCode: statusCode.DATA_NOT_FOUND,
        success: false,
        message: "Lead Stage not found",
        data: null,
      };
    }
    const updatedStage = await Leadstatus.findByPk(id);
    return {
      statusCode: statusCode.OK,
      success: true,
      message: resMessage.UPDATE_LEAD_STAGE_Data,
      data: updatedStage,
    };
  } catch (error) {
    console.log("errorerror" , error);
    
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};


exports.deleteLeadStatus = async (params) => {
  const { id } = params;
  try {
    const updatefield = await Leadstatus.destroy(
      {
        where: { id: id },
      }
    );
    return {
      statusCode: statusCode.OK,
      success: true,
      message: resMessage.DELETE_LEAD_STAGE_Data,
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


// lead reason routes



exports.createReasonStatus = async (body) => {
  console.log("createReasonStatus", body);
  try {
    const { status_id, reason } = body;

    // Check for duplicate reason in the same status
    const existingReason = await Leadreason.findOne({
      where: {
        status_id,
        reason: {
          [Op.iLike]: reason
        }
      },
    });

    if (existingReason) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: `Reason "${reason}" already exists for this status`,
      };
    }

    // Get max order for the given status_id
    const maxOrderReason = await Leadreason.findOne({
      where: { status_id },
      order: [["order", "DESC"]],
      attributes: ["order"],
    });
    const nextOrder = maxOrderReason ? maxOrderReason.order + 1 : 1;

    // Create the lead reason
    const leadReasonCreate = await Leadreason.create({
      status_id,
      reason,
      order: nextOrder,
    });

    // Fetch the created lead reason
    const leadReason = await Leadreason.findByPk(leadReasonCreate.id, {
      attributes: ["id", "status_id", "reason", "order", "is_active"],
    });

    const reasonData = leadReason ? {
      id: leadReason.id,
      status_id: leadReason.status_id,
      reason: leadReason.reason,
      order: leadReason.order,
      is_active: leadReason.is_active,
    } : null;

    return {
      statusCode: statusCode.OK,
      success: true,
      message: resMessage.Add_LEAD_FIELD_Data,
      data: reasonData || null,
    };
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

exports.getAllReasonStatuses = async (query) => {
  const { page = 1, limit = 10} = query;
  try {
    const getfield = await Leadreason.findAll({ order: [["order", "ASC"]] });
    return {
      statusCode: statusCode.OK,
      success: true,
      message: resMessage.GET_LEAD_FIELD_Data,
      data: getfield,
    };
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};


exports.updateReasonStatus = async (params, body) => {
  const { id } = params;
  try {
    const [updatedCount] = await Leadreason.update(
      { ...body },
      {
        where: { id: id },
      }
    );
    console.log("updatedCountupdatedCount" , updatedCount);
    
    if (updatedCount === 0) {
      return {
        statusCode: statusCode.DATA_NOT_FOUND,
        success: false,
        message: "Lead Stage not found",
        data: null,
      };
    }
    const updatedStage = await Leadreason.findByPk(id);
    return {
      statusCode: statusCode.OK,
      success: true,
      message: resMessage.UPDATE_LEAD_STAGE_Data,
      data: updatedStage,
    };
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};


exports.deleteReasonStatus = async (params) => {
  const { id } = params;
  try {
    const updatefield = await Leadreason.destroy(
      {
        where: { id: id },
      }
    );
    return {
      statusCode: statusCode.OK,
      success: true,
      message: resMessage.DELETE_LEAD_STAGE_Data,
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

// get full leads with stage, status, reason
exports.getfullLeads = async (query) => {
  const { page = 1, limit = 10} = query;
  try {
    const datafullleads = await leadstage.findAll({
      include: [
        {
          model: Leadstatus,
          as: 'statuses',
          include: [
            {
              model: Leadreason,
              as: 'reasons',
            }
          ]
        }
      ],
      order: [
        ["order", "ASC"],
        [{ model: Leadstatus, as: "statuses" }, "order", "ASC"],
        [
          { model: Leadstatus, as: "statuses" },
          { model: Leadreason, as: "reasons" },
          "order",
          "ASC",
        ],
      ],
     });
    return {
      statusCode: statusCode.OK,
      success: true,
      message: resMessage.GET_LEAD_FIELD_Data,
      data: datafullleads,
    };
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};