const { statusCode, resMessage } = require("../../config/default.json");
const {
  Lead,
  LeadStage,
  LeadStatus,
  UserModel,
  BulkLeadUpload,
  LeadField,
} = require("../../pgModels");
const { Op, Sequelize } = require("sequelize");

const WorkflowRules = require("../../pgModels/workflowRulesModel"); // Make sure to require the WorkflowRules model if not already at the top
const WorkFlowQueue = require("../../pgModels/workflowQueueModel");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");
const {
  parseExcel,
  buildLeadPayload,
  buildAssignmentPlan,
} = require("../../utils/leadBulkInsert");
const {
  SEARCH_FIELD_MAP,
  FIXED_FIELDS,
  operatorMap,
} = require("../../utils/filerDynamic");
const { default: axios } = require("axios");
const OnLeadStatusChange = require("../../utils/OnLeadStatusChange");
/**
 * Add or update dynamic home page services according to schema.
 *
 * @param {object} body - The home page details to add or update.
 * @returns {object} - An object containing the status code, success flag, message, and home page data.
 * @throws Will throw an error if there is a database error.
 */
exports.addLead = async (body, user) => {
  console.log("sdssadsasdsbodybodybodybody", body);

  try {
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

    const workflowRule = await WorkflowRules.findOne({
      where: { type: "ManualLead" },
    });

    if (workflowRule && workflowRule.action_data) {
      console.log(
        "Workflow Template for this status:",
        workflowRule.action_data,
      );

      // Check for existing queue entry
      let queueEntry = await WorkFlowQueue.findOne({
        where: {
          workflow_ruleID: workflowRule.id,
        },
      });

      if (queueEntry) {
        await queueEntry.update({
          Status: "executed",
          executed_At: null,
        });
      } else {
        await WorkFlowQueue.create({
          lead_id: lead_id,
          workflow_ruleID: workflowRule.id,
          Status: "processing",
        });
      }
    }

    return {
      statusCode: statusCode.OK,
      success: true,
      message: resMessage.LEAD_CREATED || "Lead Created successfull",
      data: {
        lead,
        status,
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

// exports.getAllLeads = async ({query,user}) => {
//   try {

//     console.log("sjhhhhhhhhhhhhhhhhhhhh")
//     console.log(user,"Sa")
//     console.log("asdasd", query);
//     // Example of query->    {
//     //   "statusIds": "1,3",
//     //   "assignees": "Shivam,Anuj",
//     //   "startDate": 1737456000000,
//     //   "endDate": 1738020000000,
//     //   "filters": [
//     //     { "field": "name", "operator": "contains", "value": "test" },
//     //     { "field": "leadRating", "operator": "in", "value": [4,5] }
//     //   ],
//     //   "page": 1,
//     //   "limit": 10
//     // }
//     const {
//       searchField,
//       searchText,
//       statusIds,
//       assignees,
//       startDate, // timestamp from frontend
//       endDate, // timestamp from frontend
//       filters = [], // dynamic filters
//       page = 1,
//       limit = 10,
//     } = query;

//     let whereClause = {};

//     // 1️⃣ SEARCH TEXT FIELD (KEEP)
//     if (searchField && searchText) {
//       whereClause = {
//         ...whereClause,
//         data: {
//           [Op.contains]: {
//             [searchField]: searchText,
//           },
//         },
//       };
//     }

//     console.log("whereClausewhereClausewhereClause", whereClause);
//     // 2️⃣ STATUS FILTER (KEEP)
//     if (statusIds) {
//       const statusArray = statusIds.split(",").map(Number);
//       console.log("statusArraystatusArraystatusArray", statusArray);
//       whereClause.status_id = { [Op.in]: statusArray };
//     }

//     // 3️⃣ ASSIGNEE FILTER (KEEP)
//     if (assignees) {
//       const assigneeArray = assignees.split(",");
//       whereClause.assignedTo = { [Op.in]: assigneeArray };
//     }

//     // 4️⃣ TIMESTAMP DATE FILTER
//     if (startDate && endDate) {
//       const start = new Date(Number(startDate));
//       const end = new Date(Number(endDate));
//       end.setHours(23, 59, 59, 999);
//       whereClause.createdAt = { [Op.between]: [start, end] };
//     }

//     // 5️⃣ DYNAMIC UI FILTERS
//     const operatorMap = {
//       equal: Op.eq,
//       not_equal: Op.ne,
//       contains: Op.substring,
//       not_contains: Op.notLike,
//       begins_with: Op.startsWith,
//       not_begins_with: Op.notILike,
//       in: Op.in,
//       not_in: Op.notIn,
//       between: Op.between,
//       is_empty: "IS_EMPTY",
//       is_not_empty: "IS_NOT_EMPTY",
//     };

//     filters.forEach((filter) => {
//       const { field, operator, value } = filter;
//       const sequelizeOperator = operatorMap[operator];
//       if (!sequelizeOperator) return;

//       if (sequelizeOperator === "IS_EMPTY") {
//         whereClause[field] = { [Op.or]: [null, ""] };
//       } else if (sequelizeOperator === "IS_NOT_EMPTY") {
//         whereClause[field] = { [Op.ne]: null };
//       } else if (sequelizeOperator === Op.between) {
//         whereClause[field] = {
//           [Op.between]: [
//             new Date(Number(value[0])),
//             new Date(Number(value[1])),
//           ],
//         };
//       } else if (Array.isArray(value)) {
//         whereClause[field] = { [sequelizeOperator]: value };
//       } else {
//         whereClause[field] = { [sequelizeOperator]: value };
//       }
//     });

//     // 6️⃣ PAGINATION LOGIC
//     const pageNumber = Number(page) || 1;
//     const pageSize = Number(limit) || 10;
//     const offset = (pageNumber - 1) * pageSize;

//     // 7️⃣ FINAL DB QUERY WITH PAGINATION
//     const { rows: leads, count: totalCount } = await Lead.findAndCountAll({
//       where: whereClause,
//       attributes: {
//         exclude: ["stage_id", "reason_id", "created_by"],
//       },
//       include: [
//         { model: LeadStatus, as: "status", attributes: ["name", "color"] },
//         {
//           model: UserModel,
//           as: "assignedUser",
//           attributes: ["id", "name", "email"],
//         },
//       ],
//       order: [["createdAt", "DESC"]],
//       offset,
//       limit: pageSize,
//     });

//     return {
//       success: true,
//       message: leads.length ? "Leads fetched successfully" : "No data found",
//       data: leads,
//       pagination: {
//         total: totalCount,
//         page: pageNumber,
//         limit: pageSize,
//         totalPages: Math.ceil(totalCount / pageSize),
//       },
//     };
//   } catch (error) {
//     return {
//       success: false,
//       message: error.message,
//     };
//   }
// };

exports.getleadbyId = async (id) => {
  try {
    const lead = await Lead.findByPk(id, {
      attributes: {
        exclude: ["stage_id", "reason_id", "created_by"],
      },
      include: [
        { model: LeadStatus, as: "status", attributes: ["name", "color"] },
        {
          model: UserModel,
          as: "assignedUser",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    if (!lead) {
      return {
        success: false,
        message: "Lead not found",
      };
    }

    return {
      success: true,
      message: "Lead fetched successfully",
      data: lead,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

exports.getAllLeads = async ({ query, body }) => {
  try {
    const {
      searchField,
      searchText,
      filters = [],
      statusIds,
      assignees,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = body;

    const whereClause = {};
    const andConditions = [];

    /* ==================================================
       1️⃣ TOP SEARCH BAR (SEARCH_FIELD_MAP)
    ================================================== */
    if (searchField && searchText) {
      const fieldConfig = SEARCH_FIELD_MAP[searchField];

      if (fieldConfig?.type === "fixed") {
        andConditions.push({
          [fieldConfig.column]: {
            [Op.iLike]: `%${searchText}%`,
          },
        });
      }

      if (fieldConfig?.type === "jsonb") {
        andConditions.push(
          Sequelize.where(
            Sequelize.cast(
              Sequelize.json(`data.${fieldConfig.column}`),
              "text",
            ),
            {
              [Op.iLike]: `%${searchText}%`,
            },
          ),
        );
      }
    }

    /* ==================================================
       2️⃣ STATUS FILTER (SIMPLE)
    ================================================== */
    if (statusIds) {
      andConditions.push({
        status_id: {
          [Op.in]: statusIds.split(",").map(Number),
        },
      });
    }

    /* ==================================================
       3️⃣ ASSIGNEE FILTER
    ================================================== */
    if (assignees) {
      andConditions.push({
        assignedTo: {
          [Op.in]: assignees.split(",").map(Number),
        },
      });
    }

    /* ==================================================
       4️⃣ DATE FILTER (DIRECT DB MATCH – NO HELPER)
       DD-MM-YYYY → PostgreSQL DATE()
    ================================================== */
    if (startDate && endDate) {
      andConditions.push(
        Sequelize.where(Sequelize.fn("DATE", Sequelize.col("Lead.createdAt")), {
          [Op.between]: [
            Sequelize.literal(`TO_DATE('${startDate}', 'DD-MM-YYYY')`),
            Sequelize.literal(`TO_DATE('${endDate}', 'DD-MM-YYYY')`),
          ],
        }),
      );
    }

    /* ==================================================
       5️⃣ DYNAMIC FILTER BUILDER (ANY FIELD)
    ================================================== */
    // filters.forEach(({ field, operator, value }) => {
    //   const sequelizeOp = operatorMap[operator];
    //   if (!sequelizeOp) return;
    //   const isFixed = FIXED_FIELDS.includes(field);

    //   // EMPTY
    //   if (sequelizeOp === "IS_EMPTY") {
    //     if (isFixed) {
    //       andConditions.push({
    //         [Op.or]: [{ [field]: null }, { [field]: "" }],
    //       });
    //     } else {
    //       andConditions.push(
    //         Sequelize.where(
    //           Sequelize.fn("COALESCE", Sequelize.json(`data.${field}`), ""),
    //           ""
    //         )
    //       );
    //     }
    //     return;
    //   }

    //   // NOT EMPTY
    //   if (sequelizeOp === "IS_NOT_EMPTY") {
    //     if (isFixed) {
    //       andConditions.push({ [field]: { [Op.ne]: null } });
    //     } else {
    //       andConditions.push(
    //         Sequelize.where(
    //           Sequelize.json(`data.${field}`),
    //           { [Op.ne]: null }
    //         )
    //       );
    //     }
    //     return;
    //   }

    //   // BETWEEN (NON-DATE)
    //   // BETWEEN
    //   if (sequelizeOp === Op.between && Array.isArray(value)) {

    //     // ✅ DATE FIELD FIX (createdAt / updatedAt)
    //     if (isFixed && ["createdAt", "updatedAt"].includes(field)) {
    //       const [start, end] = value;

    //       andConditions.push(
    //         Sequelize.where(
    //           Sequelize.fn("DATE", Sequelize.col(`Lead.${field}`)),
    //           {
    //             [Op.between]: [
    //               Sequelize.literal(`TO_DATE('${start}', 'DD-MM-YYYY')`),
    //               Sequelize.literal(`TO_DATE('${end}', 'DD-MM-YYYY')`),
    //             ],
    //           }
    //         )
    //       );
    //       return;
    //     }

    //     // ✅ NORMAL BETWEEN (numbers, strings)
    //     if (isFixed) {
    //       andConditions.push({
    //         [field]: { [Op.between]: value },
    //       });
    //     } else {
    //       andConditions.push(
    //         Sequelize.where(
    //           Sequelize.json(`data.${field}`),
    //           { [Op.between]: value }
    //         )
    //       );
    //     }
    //     return;
    //   }

    //   // IN / NOT IN
    //   if (Array.isArray(value)) {
    //     if (isFixed) {
    //       andConditions.push({
    //         [field]: { [sequelizeOp]: value },
    //       });
    //     } else {
    //       andConditions.push(
    //         Sequelize.where(
    //           Sequelize.json(`data.${field}`),
    //           { [sequelizeOp]: value }
    //         )
    //       );
    //     }
    //     return;
    //   }

    //   // NORMAL STRING / NUMBER
    //   if (isFixed) {
    //     andConditions.push({
    //       [field]:
    //         operator === "contains"
    //           ? { [Op.iLike]: `%${value}%` }
    //           : { [sequelizeOp]: value },
    //     });
    //   } else {
    //     andConditions.push(
    //       Sequelize.where(
    //         Sequelize.cast(Sequelize.json(`data.${field}`), "text"),
    //         operator === "contains"
    //           ? { [Op.iLike]: `%${value}%` }
    //           : { [sequelizeOp]: value }
    //       )
    //     );
    //   }
    // });

    filters.forEach(({ field, operator, value }) => {
      const sequelizeOp = operatorMap[operator];
      if (!sequelizeOp || !Array.isArray(value) || value.length === 0) return;

      const isFixed = FIXED_FIELDS.includes(field);

      /* ================= EMPTY ================= */
      if (sequelizeOp === "IS_EMPTY") {
        if (isFixed) {
          andConditions.push({
            [Op.or]: [{ [field]: null }, { [field]: "" }],
          });
        } else {
          andConditions.push(
            Sequelize.where(
              Sequelize.fn("COALESCE", Sequelize.json(`data.${field}`), ""),
              "",
            ),
          );
        }
        return;
      }

      /* ============== NOT EMPTY ================ */
      if (sequelizeOp === "IS_NOT_EMPTY") {
        if (isFixed) {
          andConditions.push({ [field]: { [Op.ne]: null } });
        } else {
          andConditions.push(
            Sequelize.where(Sequelize.json(`data.${field}`), { [Op.ne]: null }),
          );
        }
        return;
      }

      /* ================= BETWEEN ================= */
      if (sequelizeOp === Op.between && value.length === 2) {
        const [start, end] = value;

        // DATE
        if (isFixed && ["createdAt", "updatedAt"].includes(field)) {
          andConditions.push(
            Sequelize.where(
              Sequelize.fn("DATE", Sequelize.col(`Lead.${field}`)),
              {
                [Op.between]: [
                  Sequelize.literal(`TO_DATE('${start}', 'DD-MM-YYYY')`),
                  Sequelize.literal(`TO_DATE('${end}', 'DD-MM-YYYY')`),
                ],
              },
            ),
          );
          return;
        }

        // NORMAL BETWEEN
        if (isFixed) {
          andConditions.push({ [field]: { [Op.between]: value } });
        } else {
          andConditions.push(
            Sequelize.where(Sequelize.json(`data.${field}`), {
              [Op.between]: value,
            }),
          );
        }
        return;
      }

      /* ================= IN / NOT IN ================= */
      if (sequelizeOp === Op.in || sequelizeOp === Op.notIn) {
        if (isFixed) {
          andConditions.push({ [field]: { [sequelizeOp]: value } });
        } else {
          andConditions.push(
            Sequelize.where(Sequelize.json(`data.${field}`), {
              [sequelizeOp]: value,
            }),
          );
        }
        return;
      }

      /* ========== SINGLE VALUE (array[0]) ========== */
      const singleValue = value[0];

      if (isFixed) {
        andConditions.push({
          [field]:
            operator === "contains"
              ? { [Op.iLike]: `%${singleValue}%` }
              : { [sequelizeOp]: singleValue },
        });
      } else {
        andConditions.push(
          Sequelize.where(
            Sequelize.cast(Sequelize.json(`data.${field}`), "text"),
            operator === "contains"
              ? { [Op.iLike]: `%${singleValue}%` }
              : { [sequelizeOp]: singleValue },
          ),
        );
      }
    });

    /* ==================================================
       APPLY ALL CONDITIONS
    ================================================== */
    if (andConditions.length) {
      whereClause[Op.and] = andConditions;
    }

    /* ==================================================
       PAGINATION
    ================================================== */
    const pageNumber = Number(page);
    const pageSize = Number(limit);
    const offset = (pageNumber - 1) * pageSize;

    /* ==================================================
       FINAL QUERY
    ================================================== */
    const { rows, count } = await Lead.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: LeadStatus,
          as: "status",
          attributes: ["id", "name", "color"],
        },
        {
          model: UserModel,
          as: "assignedUser",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
      offset,
      limit: pageSize,
    });

    return {
      success: true,
      message: rows.length ? "Leads fetched successfully" : "No data found",
      data: rows,
      pagination: {
        total: count,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(count / pageSize),
      },
    };
  } catch (error) {
    console.error("LEAD FILTER ERROR:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

exports.changeStatus = async (body, params) => {
  try {
    let dataTemp;
    const { leadId } = params;
    const { statusId } = body;

    if (!leadId || !statusId) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: "lead_id and status_id are required",
      };
    }
    // Check if the lead exists
    const leadData = await Lead.findByPk(leadId);
    if (!leadData) {
      return {
        statusCode: statusCode.NOT_FOUND,
        success: false,
        message: "Lead not found",
      };
    }
    // Check if the new status is valid and has an associated stage
    const status = await LeadStatus.findByPk(statusId, {
      include: [{ model: LeadStage, as: "stage" }],
    });
    if (!status) {
      return {
        statusCode: statusCode.NOT_FOUND,
        success: false,
        message: "Invalid status_id",
      };
    }

    console.log("leadDataleadDataleadData", leadData);

    console.log("leadIdleadIdleadIdleadIdleadIdleadId", leadId, statusId);

    // If there is no associated stage
    if (!status.stage_id && (!status.stage || !status.stage.id)) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: "leadstage is not associated to lead_statuses!",
      };
    }

    // Optionally pass both lead and new status for potential logic
    if (typeof OnLeadStatusChange === "function") {
      console.log("Calling OnLeadStatusChange function...");
      dataTemp = await OnLeadStatusChange(leadData, statusId);
    } else {
      console.log(
        "OnLeadStatusChange is not a function:",
        typeof OnLeadStatusChange,
      );
    }
    // Update the lead with new status and stage
    await leadData.update({
      status_id: status.id,
      stage_id: status.stage_id || (status.stage && status.stage.id),
    });

    const updatedLead = await Lead.findByPk(leadId, {
      include: [{ model: LeadStatus, as: "status" }],
    });

    return {
      statusCode: statusCode.OK,
      success: true,
      message:
        resMessage.LEAD_STATUS_UPDATED || "Lead status updated successfully",
      data: updatedLead,
      dataTemp,
    };
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

/**
 * Bulk upload leads from Excel file data.
 *
 * Expects body to have:
 * - filePath: path to uploaded Excel file
 *
 * Returns standard response.
 */
exports.leadUpload = async (body, user) => {
  try {
    // Extract file path from expected keys
    const relativePath = body.filePath || body.file || body.path;
    if (!relativePath || typeof relativePath !== "string") {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: "File path is required",
      };
    }

    // Build the absolute path to the uploaded file
    const filePath = path.join(
      __dirname,
      "../../../public/uploads",
      relativePath,
    );

    // Check if the file exists at the specified path
    if (!fs.existsSync(filePath)) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: "Uploaded file not found on server",
      };
    }

    // Read the Excel file (.xlsx) using xlsx module
    const workbook = XLSX.readFile(filePath);

    // Get the first worksheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Convert worksheet data to JSON array
    let leadsData = XLSX.utils.sheet_to_json(worksheet);

    if (!Array.isArray(leadsData) || leadsData.length === 0) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: "No leads found in uploaded Excel file",
      };
    }

    // Fetch default status for newly uploaded leads
    const defaultStatus = await LeadStatus.findOne({
      where: { is_default: true },
    });

    // Normalize keys: camelCase, trim
    const normalizeKey = (key) => {
      return key
        .replace(/^\s+|\s+$/g, "") // Trim spaces
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_")
        .replace(/^\w/, (c) => c.toLowerCase()); // Lowercase first char
    };

    // Apply normalization for each lead object
    leadsData = leadsData.map((obj) => {
      const normalized = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const normKey = normalizeKey(key);
          normalized[normKey] = obj[key];
        }
      }
      return normalized;
    });

    // Bulk create leads
    const createdLeads = [];
    console.log("leadsDataleadsData", leadsData);

    for (const leadObj of leadsData) {
      const lead = await Lead.create({
        data: leadObj !== undefined ? leadObj : null,
        source: "excel" !== undefined ? "excel" : null,
        status_id: defaultStatus ? defaultStatus.id : null,
        assignedTo: user?.id || null,
        created_by: user?.id || null,
      });
      createdLeads.push(lead);
    }

    // const cLeads = await Lead.bulkCreate(createdLeads, { returning: true });

    return {
      statusCode: statusCode.OK,
      success: true,
      message: resMessage.LEAD_CREATED || "Lead(s) uploaded successfully",
      data: createdLeads,
    };
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

exports.getStageStatusStructure = async () => {
  try {
    // Fetch all stages and their statuses
    const stages = await LeadStage.findAll({
      where: { is_active: true },
      include: [
        {
          model: LeadStatus,
          as: "statuses",
          where: { is_active: true },
          required: false, // even if no statuses exist
          attributes: ["id", "name", "color"],
        },
      ],
      order: [["order", "ASC"]],
    });

    // Format data
    const formatted = stages.map((stage) => ({
      title: stage.name,
      items: (stage.statuses || []).map((status) => ({
        id: status.id,
        label: status.name,
        color: status.color || "bg-gray-400", // fallback if color missing
      })),
    }));

    return {
      statusCode: 200,
      success: true,
      message: "Lead stages with statuses fetched successfully",
      data: formatted,
    };
  } catch (error) {
    console.error("❌ Error in getStageStatusStructure:", error);
    return {
      statusCode: 500,
      success: false,
      message: error.message,
    };
  }
};

// Bulk assign leads to users by percentage
// exports.bulkAssignLeads = async (body) => {
//   // body: { leadIds: [1,2,3,4], userIds: [10,11], percentages: [60,40] }
//   const { leadIds, userIds, percentages } = body;
//   if (
//     !Array.isArray(leadIds) ||
//     !Array.isArray(userIds) ||
//     !Array.isArray(percentages)
//   ) {
//     return {
//       statusCode: statusCode.BAD_REQUEST,
//       success: false,
//       message: "leadIds, userIds, and percentages must be arrays",
//     };
//   }
//   if (userIds.length !== percentages.length) {
//     return {
//       statusCode: statusCode.BAD_REQUEST,
//       success: false,
//       message: "userIds and percentages must have the same length",
//     };
//   }
//   if (percentages.reduce((a, b) => a + b, 0) !== 100) {
//     return {
//       statusCode: statusCode.BAD_REQUEST,
//       success: false,
//       message: "Percentages must sum to 100",
//     };
//   }
//   // Calculate how many leads per user
//   const totalLeads = leadIds.length;
//   console.log("Total leads to assign:", totalLeads);
//   let counts = percentages.map((p) => Math.floor((p / 100) * totalLeads));
//   // Distribute any remainder
//   let assigned = counts.reduce((a, b) => a + b, 0);
//   console.log("Initial assigned leads:", assigned);
//   let remainder = totalLeads - assigned;

//   console.log("Initial counts:", counts, "Remainder:", remainder);
//   for (let i = 0; remainder > 0 && i < counts.length; i++, remainder--) {
//     counts[i]++;
//   }
//   // Assign leads
//   let updates = [];
//   let leadIndex = 0;
//   const assignmentMap = {};
//   for (let i = 0; i < userIds.length; i++) {
//     assignmentMap[userIds[i]] = [];
//     for (let j = 0; j < counts[i]; j++) {
//       if (leadIndex < leadIds.length) {
//         updates.push(
//           Lead.update(
//             { assignedTo: userIds[i] },
//             { where: { id: leadIds[leadIndex] } }
//           )
//         );
//         assignmentMap[userIds[i]].push(leadIds[leadIndex]);
//         leadIndex++;
//       }
//     }
//   }
//   await Promise.all(updates);
//   // Console output for assignment
//   Object.entries(assignmentMap).forEach(([userId, leads]) => {
//     console.log(
//       `User ${userId} assigned leads: [${leads.join(", ")}] (Total: ${leads.length
//       })`
//     );
//   });
//   return {
//     statusCode: statusCode.OK,
//     success: true,
//     message: "Leads assigned successfully",
//     assignment: assignmentMap,
//   };
// };

exports.bulkAssignLeads = async (body) => {
  // body: { leadIds: [1,2,3,4], userIds: [10,11], percentages: [60,40] },statusId:1
  // body may or may not have userIds and percentages for assignment
  // if only statusId is provided, just update status for all leads
  // if both assignment and statusId provided, do both
  const { leadIds, userIds, percentages, statusId } = body;

  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: "leadIds must be a non-empty array",
    };
  }

  const hasAssignment =
    Array.isArray(userIds) &&
    userIds.length > 0 &&
    Array.isArray(percentages) &&
    percentages.length > 0;

  // ✅ CASE: only status update
  if (!hasAssignment) {
    if (statusId) {
      await Lead.update({ status_id: statusId }, { where: { id: leadIds } });
    }

    return {
      statusCode: statusCode.OK,
      success: true,
      message: statusId
        ? "Leads status updated successfully"
        : "No assignment or status change applied",
    };
  }

  // assignment validation
  if (userIds.length !== percentages.length) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: "userIds and percentages must have the same length",
    };
  }

  if (percentages.reduce((a, b) => a + b, 0) !== 100) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: "Percentages must sum to 100",
    };
  }

  const totalLeads = leadIds.length;

  let counts = percentages.map((p) => Math.floor((p / 100) * totalLeads));

  let assigned = counts.reduce((a, b) => a + b, 0);
  let remainder = totalLeads - assigned;

  for (let i = 0; remainder > 0; i++, remainder--) {
    counts[i]++;
  }

  let leadIndex = 0;
  const updates = [];

  for (let i = 0; i < userIds.length; i++) {
    for (let j = 0; j < counts[i]; j++) {
      updates.push(
        Lead.update(
          {
            assignedTo: userIds[i],
            ...(statusId ? { status_id: statusId } : {}),
          },
          { where: { id: leadIds[leadIndex++] } },
        ),
      );
    }
  }

  await Promise.all(updates);

  return {
    statusCode: statusCode.OK,
    success: true,
    message: "Leads assigned successfully",
  };
};

// Bulk Lead Upload Step 1: Upload File
exports.uploadFile = async (file, body, user) => {
  console.log("filefilefile", file);

  try {
    const upload = await BulkLeadUpload.create({
      file_name: file.originalname,
      file_path: file.location,
      uploaded_by: user?.id || null,
    });

    console.log("Upload record created:", upload);
    return {
      message: "File uploaded successfully",
      statusCode: statusCode.OK,
      success: true,
      uploadId: upload.id,
      filename: body.originalname,
    };
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

// exports.getSheets = async (uploadId) => {
//   try {
//     const upload = await BulkLeadUpload.findByPk(uploadId);
//     console.log("Fetched upload record:", upload);
//     const wb = XLSX.readFile(upload.file_path);
//     const sheet = wb.SheetNames[0];
//     const headers = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1 })[0];
//     console.log("Extracted headers:", headers);
//     console.log("Sheet names:", wb.SheetNames);
//     return {
//       message: "Sheets fetched successfully",
//       statusCode: statusCode.OK,
//       success: true,
//       sheets: wb.SheetNames,
//       headers
//     };
//   } catch (error) {
//     return {
//       statusCode: statusCode.BAD_REQUEST,
//       success: false,
//       message: error.message
//     };
//   }
// };

// Step 2: Get Sheets and Headers
exports.getSheets = async (uploadId) => {
  try {
    const upload = await BulkLeadUpload.findByPk(uploadId);
    if (!upload) throw new Error("Upload record not found");

    console.log("Fetching file from S3:", upload.file_path);

    // 1. Download the file from S3 as an ArrayBuffer
    const response = await axios.get(upload.file_path, {
      responseType: "arraybuffer",
    });
    const buffer = response.data;

    // 2. Use XLSX.read (NOT readFile) to parse the buffer
    const wb = XLSX.read(buffer, { type: "buffer" });

    const sheetName = wb.SheetNames[0];
    const headers = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
      header: 1,
    })[0];

    console.log("Extracted headers:", headers);

    return {
      message: "Sheets fetched successfully",
      statusCode: statusCode.OK,
      success: true,
      sheets: wb.SheetNames,
      headers,
    };
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

// Step 3: Validate Mapping
exports.validateMapping = async ({ valmapping, uploadId, sheet, mapping }) => {
  try {
    if (!valmapping.whatsapp_number) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: "WhatsApp is required",
      };
    }

    const fields = await LeadField.findAll({ where: { is_active: true } });
    console.log(
      "Valid lead fields:",
      fields.map((f) => f.name)
    );
    const validFields = fields.map((f) => f.name);

    Object.keys(valmapping.data || {}).forEach((f) => {
      if (!validFields.includes(f)) throw new Error(`Invalid field: ${f}`);
    });

    const upload = await BulkLeadUpload.findByPk(uploadId);
    if (!upload) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: "Upload record not found",
      };
    }
    console.log("Upload record:", upload.dataValues);

    // Download the file from S3 (URL in upload.file_path)
    // Use axios to fetch as arraybuffer, then parse with XLSX
    const axiosResp = await axios.get(upload.file_path, { responseType: "arraybuffer" });
    const buffer = axiosResp.data;
    const workbook = XLSX.read(buffer, { type: "buffer" });

    if (!workbook.SheetNames.includes(sheet)) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: "Sheet not found in the uploaded file",
      };
    }

    const ws = workbook.Sheets[sheet];
    const rows = XLSX.utils.sheet_to_json(ws);

    // mapping.whatsapp_number is column name from mapping
    const numbers = rows.map((r) => r[mapping.whatsapp_number]).filter(Boolean);

    if (numbers.length === 0) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: "No WhatsApp numbers found in the sheet per mapping.",
      };
    }

    const duplicates = await Lead.findAll({
      where: { whatsapp_number: { [Op.in]: numbers } },
      attributes: ["whatsapp_number"],
    });

    return { statusCode: statusCode.OK, success: true, duplicates };
  } catch (error) {
    console.log("Error in validateMapping:", error);

    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message || "Error validating mapping",
    };
  }
};

// exports.validateMapping = async ({ valmapping, uploadId, sheet, mapping }) => {
//   try {
//     if (!valmapping.whatsapp_number)
//       return {
//         statusCode: statusCode.BAD_REQUEST,
//         success: false,
//         message: "WhatsApp is required",
//       };
//     const fields = await LeadField.findAll({ where: { is_active: true } });
//     console.log(
//       "Valid lead fields:",
//       fields.map((f) => f.name),
//     );
//     const validFields = fields.map((f) => f.name);
//     Object.keys(valmapping.data || {}).forEach((f) => {
//       if (!validFields.includes(f)) throw new Error(`Invalid field: ${f}`);
//     });

//     const upload = await BulkLeadUpload.findByPk(uploadId);
//     console.log("uploaduploaduploaduploadupload" , upload);
    
//     const rows = parseExcel(upload.file_path, sheet);
//     const numbers = rows.map((r) => r[mapping.whatsapp_number]);
//     const duplicates = await Lead.findAll({
//       where: { whatsapp_number: { [Op.in]: numbers } },
//       attributes: ["whatsapp_number"],
//     });
//     return { statusCode: statusCode.OK, success: true, duplicates };
//   } catch (error) {
//     console.log("errorerrorerrorerrorerror" , error);
    
//     return {
//       statusCode: statusCode.BAD_REQUEST,
//       success: false,
//       message: error.message,
//     };
//   }
// };

// Step 4: Check Duplicates
   // Download the file from S3 (URL in upload.file_path)
    // Use axios to fetch as arraybuffer, then parse with XLSX
// Step 5: Commit Import
// exports.commitImport = async ({ uploadId, sheet, mapping, user }) => {
//   try {
//     const upload = await BulkLeadUpload.findByPk(uploadId);
//     const rows = parseExcel(upload.file_path, sheet);
//     const leads = rows.map(row =>
//       buildLeadPayload(row, mapping, user.id, uploadId)
//     );
//     await Lead.bulkCreate(leads);
//     await upload.update({ status: "COMPLETED" });
//     return { statusCode: statusCode.OK, success: true, inserted: leads.length };
//   } catch (error) {
//     return { statusCode: statusCode.BAD_REQUEST, success: false, message: error.message };
//   }
// };


exports.commitImport = async ({ uploadId, sheet, mapping, assignment, user }) => {
  try {
    const upload = await BulkLeadUpload.findByPk(uploadId);
    const status = await LeadStatus.findOne({ where: { is_default: true } });

    if (!upload) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: "Upload not found"
      };
    }

    let rows = [];
    let filePath = upload.file_path;

    // basic check to see if file path is an S3 url
    const isS3Url = typeof filePath === 'string' && (filePath.startsWith('http://') || filePath.startsWith('https://'));

    if (isS3Url) {
      // Download excel file from S3 url using axios, parse as arraybuffer, then parse using XLSX
      const fileResponse = await axios.get(filePath, { responseType: 'arraybuffer' });
      const data = fileResponse.data;
      const workbook = XLSX.read(data, { type: 'buffer' });

      // Try getting specific sheet, else get the first one
      let wsname = sheet || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[wsname];
      rows = XLSX.utils.sheet_to_json(worksheet);
    } else {
      // Assume file is local path or accessible to parseExcel util
      rows = parseExcel(filePath, sheet);
    }

    if (!rows.length) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: "No rows found in excel"
      };
    }

    // 🔥 STEP 1: build assignment PLAN (before lead create)
    let assignmentPlan = null;
    let assignmentUsers = [];
    let currentUserIndex = 0;
    let currentUserRemaining = 0;

    if (assignment?.userIds?.length) {
      assignmentPlan = buildAssignmentPlan({
        total: rows.length,
        userIds: assignment.userIds,
        percentages: assignment.percentages
      });

      assignmentUsers = Object.keys(assignmentPlan);
      currentUserRemaining = assignmentPlan[assignmentUsers[0]];
    }

    // 🔥 STEP 2: build lead payloads with assignedTo already set
    const leadsPayload = rows.map(row => {
      let assignedTo = null;
      const status_id = status ? status.id : null;

      if (assignmentPlan) {
        if (currentUserRemaining === 0) {
          currentUserIndex++;
          currentUserRemaining =
            assignmentPlan[assignmentUsers[currentUserIndex]];
        }

        assignedTo = Number(assignmentUsers[currentUserIndex]);
        currentUserRemaining--;
      }

      return buildLeadPayload(
        row,
        mapping,
        user.id,
        uploadId,
        assignedTo,
        status_id,
        "excel"
      );
    });

    // 🔥 STEP 3: insert leads
    await Lead.bulkCreate(leadsPayload);

    // update upload status
    await upload.update({ status: "COMPLETED" });

    return {
      statusCode: statusCode.OK,
      success: true,
      inserted: leadsPayload.length,
      assigned: !!assignmentPlan
    };
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message
    };
  }
};

exports.getUploadedFiles = async ({ limit, offset }) => {
  const { rows, count } = await BulkLeadUpload.findAndCountAll({
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: UserModel,
        as: "uploader",
        attributes: ["id", "name", "email"],
      },
    ],
  });

  const uploadsWithCount = await Promise.all(
    rows.map(async (upload) => {
      const leadsCount = await Lead.count({
        where: {
          upload_id: upload.id, // ✅ FIX
        },
      });

      return {
        id: upload.id,
        file_name: upload.file_name,
        leads: leadsCount,
        uploaded_by: upload.uploader,
        uploaded_on: upload.createdAt,
        status: upload.status,
      };
    }),
  );

  return {
    data: uploadsWithCount,
    pagination: {
      total: count,
      limit,
      page: Math.floor(offset / limit) + 1,
    },
  };
};
