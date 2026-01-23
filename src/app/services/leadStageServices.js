const { statusCode, resMessage } = require("../../config/default.json");
// const Lead = require("../../pgModels/lead");
// Import index to initialize associations
const {LeadReason,LeadStatus,LeadStage}=require("../../pgModels/index");
const { Op } = require("sequelize");


/**
 * Add or update dynamic home page services according to schema.
 *
 * @param {object} body - The home page details to add or update.
 * @returns {object} - An object containing the status code, success flag, message, and home page data.
 * @throws Will throw an error if there is a database error.
 */
exports.createLeadStage = async (body) => {
  const { name, order: bodyOrder } = body;
  try {
    // Check if a LeadStage already exists with the same name
    const existingByName = await LeadStage.findOne({ where: { name } });
    if (existingByName) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: resMessage.FIELD_LABLE_EXIST,
      };
    }

    // If an order is provided, check for order duplication
    if (typeof bodyOrder !== 'undefined' && bodyOrder !== null) {
      const existingByOrder = await LeadStage.findOne({ where: { order: bodyOrder } });
      if (existingByOrder) {
        return {
          statusCode: statusCode.BAD_REQUEST,
          success: false,
          message: "Order value already exists. Please use a different order.",
        };
      }
    }

    // If no order is provided, set the next order automatically
    let leadData = { ...body };
    if (typeof bodyOrder === 'undefined' || bodyOrder === null) {
      const maxOrder = await LeadStage.max('order');
      leadData.order = typeof maxOrder === 'number' ? maxOrder + 1 : 1;
    }

    const leadfield = await LeadStage.create(leadData);

    return {
      statusCode: statusCode.OK,
      success: true,
      message: resMessage.Add_LEAD_FIELD_Data,
      data: leadfield,
    };
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error && error.message ? error.message : "An error occurred",
    };
  }
};

exports.getAllLeadStages = async (query) => {
  const { page = 1, limit = 10} = query;
  try {
    const getfield = await LeadStage.findAll({ order: [["order", "ASC"]] });
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
    const getfield = await LeadStage.findByPk(id);
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
    const [updatedCount] = await LeadStage.update(
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
    const updatedStage = await LeadStage.findByPk(id);
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
    const updatefield = await LeadStage.destroy(
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
  console.log("createLeadStatuscreateLeadStatus", body);
  try {
    const { stage_id, name, color, is_default } = body;

    // Check if the status already exists within the given stage (case-insensitive)
    const existingStatus = await LeadStatus.findOne({
      where: {
        stage_id,
        name: {
          [Op.iLike]: name,
        },
      },
    });
    if (existingStatus) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: `Status "${name}" already exists in this stage`,
      };
    }

    // If is_default is true, check if there is already a default status for this stage
    if (is_default === true || is_default === "true") {
      const existingDefault = await LeadStatus.findOne({
        where: {
          is_default: true,
        },
      });
      if (existingDefault) {
        return {
          statusCode: statusCode.BAD_REQUEST,
          success: false,
          message: `Default status already exists in this stage. Only one default can be set.`,
        };
      }
    }

    // Find the current max order for the stage
    const maxOrderStatus = await LeadStatus.findOne({
      where: { stage_id },
      order: [["order", "DESC"]],
      attributes: ["order"],
    });
    const nextOrder = maxOrderStatus ? maxOrderStatus.order + 1 : 1;

    const leadStatusCreate = await LeadStatus.create({
      stage_id,
      name,
      color,
      is_default: is_default || false,
      order: nextOrder,
    });

    const leadstatus = await LeadStatus.findByPk(leadStatusCreate.id, {
      attributes: ["id", "name", "order", "color", "is_active", "stage_id", "is_default"],
    });
    const leadstatusdata = leadstatus
      ? {
          id: leadstatus.id,
          name: leadstatus.name,
          order: leadstatus.order,
          color: leadstatus.color,
          is_active: leadstatus.is_active,
          is_default: leadstatus.is_default,
        }
      : null;

    return {
      statusCode: statusCode.OK,
      success: true,
      message: resMessage.Add_LEAD_FIELD_Data,
      data: leadstatusdata || null,
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
    const getfield = await LeadStatus.findAll({ order: [["order", "ASC"]] });
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
    const [updatedCount] = await LeadStatus.update(
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
    const updatedStage = await LeadStatus.findByPk(id);
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
    const updatefield = await LeadStatus.destroy(
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
    const existingReason = await LeadReason.findOne({
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
    const maxOrderReason = await LeadReason.findOne({
      where: { status_id },
      order: [["order", "DESC"]],
      attributes: ["order"],
    });
    const nextOrder = maxOrderReason ? maxOrderReason.order + 1 : 1;

    // Create the lead reason
    const leadReasonCreate = await LeadReason.create({
      status_id,
      reason,
      order: nextOrder,
    });

    // Fetch the created lead reason
    const leadReason = await LeadReason.findByPk(leadReasonCreate.id, {
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
    const getfield = await LeadReason.findAll({ order: [["order", "ASC"]] });
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
    const [updatedCount] = await LeadReason.update(
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
    const updatedStage = await LeadReason.findByPk(id);
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
    const updatefield = await LeadReason.destroy(
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
    const datafullleads = await LeadStage.findAll({
      include: [
        {
          model: LeadStatus,
          as: 'statuses',
          include: [
            {
              model: LeadReason,
              as: 'reasons',
            }
          ]
        }
      ],
      order: [
        ["order", "ASC"],
        [{ model: LeadStatus, as: "statuses" }, "order", "ASC"],
        [
          { model: LeadStatus, as: "statuses" },
          { model: LeadReason, as: "reasons" },
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