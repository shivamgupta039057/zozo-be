const { statusCode, resMessage } = require("../../config/default.json");
const { Lead, LeadStage, LeadStatus, UserModel, BulkLeadUpload, LeadField, Sequelize } = require("../../pgModels");
const { Op } = require("sequelize");

const WorkflowRules = require("../../pgModels/workflowRulesModel"); // Make sure to require the WorkflowRules model if not already at the top
const WorkFlowQueue = require("../../pgModels/workflowQueueModel");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");
const { parseExcel, buildLeadPayload, buildAssignmentPlan } = require("../../utils/leadBulkInsert");

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
    const { data, source, assignedTo, notes, name, email , whatsapp_number } = body;


    // Check if whatsapp_number already exists in the Lead model
    if (whatsapp_number) {
      const existingLead = await Lead.findOne({
        where: { whatsapp_number: whatsapp_number }
      });
      if (existingLead) {
        return {
          statusCode: statusCode.BAD_REQUEST,
          success: false,
          message: "Lead with this WhatsApp number already exists"
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
        workflowRule.action_data
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

// exports.getAllLeads = async (query) => {
//   try {
//     // Eample of query->    {
//     //   "statusIds": "1,3",
//     //   "assignees": "Shivam,Anuj",
//     //   "startDate": 1737456000000,
//     //   "endDate": 1738020000000,
//     //   "filters": [
//     //     { "field": "name", "operator": "contains", "value": "test" },
//     //     { "field": "leadRating", "operator": "in", "value": [4,5] }
//     //   ]
//     // }
//     const {
//       searchField,
//       searchText,
//       statusIds,
//       assignees,
//       startDate, // timestamp from frontend
//       endDate, // timestamp from frontend
//       filters = [], // dynamic filters
//     } = query;

//     let whereClause = {};

//     // -----------------------------------------
//     // 1️⃣ SEARCH TEXT FIELD (KEEP)
//     // -----------------------------------------
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

//     // -----------------------------------------
//     // 2️⃣ STATUS FILTER (KEEP)
//     // -----------------------------------------
//     if (statusIds) {
//       const statusArray = statusIds.split(",").map(Number);
//       whereClause.status_id = { [Op.in]: statusArray };
//     }

//     // -----------------------------------------
//     // 3️⃣ ASSIGNEE FILTER (KEEP)
//     // -----------------------------------------
//     if (assignees) {
//       const assigneeArray = assignees.split(",");
//       whereClause.assignedTo = { [Op.in]: assigneeArray };
//     }

//     // -----------------------------------------
//     // 4️⃣ TIMESTAMP DATE FILTER
//     // -----------------------------------------
//     if (startDate && endDate) {
//       const start = new Date(Number(startDate));
//       const end = new Date(Number(endDate));

//       // Ensure end covers the full day
//       end.setHours(23, 59, 59, 999);

//       whereClause.createdAt = { [Op.between]: [start, end] };
//     }

//     // -----------------------------------------
//     // 5️⃣ DYNAMIC UI FILTERS
//     // -----------------------------------------
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

//     // -----------------------------------------
//     // 6️⃣ FINAL DB QUERY
//     // -----------------------------------------
//     const leads = await Lead.findAll({
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
//     });

//     return {
//       success: true,
//       message: leads.length ? "Leads fetched successfully" : "No data found",
//       data: leads,
//     };
//   } catch (error) {
//     return {
//       success: false,
//       message: error.message,
//     };
//   }
// };


exports.getAllLeads = async (query) => {
  try {
    // Example of query->    {
    //   "statusIds": "1,3",
    //   "assignees": "Shivam,Anuj",
    // leadName : "shivam",
    //   "startDate": 1737456000000,
    //   "endDate": 1738020000000,
    //   "filters": [
    //     { "field": "name", "operator": "contains", "value": "test" },
    //     { "field": "leadRating", "operator": "in", "value": [4,5] }
    //   ],
    //   "page": 1,
    //   "limit": 10
    // }
    const {
      searchField,
      searchText,
      statusIds,
      assignees,
      leadName,
      leadWhtsMobilenumber,
      startDate, // timestamp from frontend
      endDate, // timestamp from frontend
      filters = [], // dynamic filters
      page = 1,
      limit = 10,
    } = query;

    let whereClause = {};

    // 1️⃣ SEARCH TEXT FIELD (KEEP)
    if (searchField && searchText) {
      whereClause = {
        ...whereClause,
        data: {
          [Op.contains]: {
            [searchField]: searchText,
          },
        },
      };
    }

    // Add filter for leadName and leadWhtsMobilenumber if provided
    if (leadName) {
      // Filter on "name" field at root OR in "data" column's name key (Postgres JSONB)
      whereClause = {
        ...whereClause,
        name: { [Op.iLike]: `%${leadName}%` },
      };
    }
    if (leadWhtsMobilenumber) {
      // Filter on "whatsapp_number" at root OR inside "data" column's whatsapp_number
      whereClause = {
        ...whereClause,
        whatsapp_number: { [Op.iLike]: `%${leadWhtsMobilenumber}%` },
      };
    }

    // 2️⃣ STATUS FILTER (KEEP)
    if (statusIds) {
      const statusArray = statusIds.split(",").map(Number);
      whereClause.status_id = { [Op.in]: statusArray };
    }

    // 3️⃣ ASSIGNEE FILTER (KEEP)
    if (assignees) {
      const assigneeArray = assignees.split(",");
      whereClause.assignedTo = { [Op.in]: assigneeArray };
    }

    // 4️⃣ TIMESTAMP DATE FILTER
    if (startDate && endDate) {
      const start = new Date(Number(startDate));
      const end = new Date(Number(endDate));
      end.setHours(23, 59, 59, 999);
      whereClause.createdAt = { [Op.between]: [start, end] };
    }

    // 5️⃣ DYNAMIC UI FILTERS
    const operatorMap = {
      equal: Op.eq,
      not_equal: Op.ne,
      contains: Op.substring,
      not_contains: Op.notLike,
      begins_with: Op.startsWith,
      not_begins_with: Op.notILike,
      in: Op.in,
      not_in: Op.notIn,
      between: Op.between,
      is_empty: "IS_EMPTY",
      is_not_empty: "IS_NOT_EMPTY",
    };

    filters.forEach((filter) => {
      const { field, operator, value } = filter;
      const sequelizeOperator = operatorMap[operator];
      if (!sequelizeOperator) return;

      if (sequelizeOperator === "IS_EMPTY") {
        whereClause[field] = { [Op.or]: [null, ""] };
      } else if (sequelizeOperator === "IS_NOT_EMPTY") {
        whereClause[field] = { [Op.ne]: null };
      } else if (sequelizeOperator === Op.between) {
        whereClause[field] = {
          [Op.between]: [
            new Date(Number(value[0])),
            new Date(Number(value[1])),
          ],
        };
      } else if (Array.isArray(value)) {
        whereClause[field] = { [sequelizeOperator]: value };
      } else {
        whereClause[field] = { [sequelizeOperator]: value };
      }
    });

    // 6️⃣ PAGINATION LOGIC
    const pageNumber = Number(page) || 1;
    const pageSize = Number(limit) || 10;
    const offset = (pageNumber - 1) * pageSize;

    // 7️⃣ FINAL DB QUERY WITH PAGINATION
    const { rows: leads, count: totalCount } = await Lead.findAndCountAll({
      where: whereClause,
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
      order: [["createdAt", "DESC"]],
      offset,
      limit: pageSize,
    });

    return {
      success: true,
      message: leads.length ? "Leads fetched successfully" : "No data found",
      data: leads,
      pagination: {
        total: totalCount,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};




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

exports.getAllLeads = async (query) => {
  try {
    // Example of query->    {
    //   "statusIds": "1,3",
    //   "assignees": "Shivam,Anuj",
    //   "startDate": 1737456000000,
    //   "endDate": 1738020000000,
    //   "filters": [
    //     { "field": "name", "operator": "contains", "value": "test" },
    //     { "field": "leadRating", "operator": "in", "value": [4,5] }
    //   ],
    //   "page": 1,
    //   "limit": 10
    // }
    const {
      searchField,
      searchText,
      statusIds,
      assignees,
      startDate, // timestamp from frontend
      endDate, // timestamp from frontend
      filters = [], // dynamic filters
      page = 1,
      limit = 10,
    } = query;

    let whereClause = {};

    // 1️⃣ SEARCH TEXT FIELD (KEEP)
    if (searchField && searchText) {
      whereClause = {
        ...whereClause,
        data: {
          [Op.contains]: {
            [searchField]: searchText,
          },
        },
      };
    }

    // 2️⃣ STATUS FILTER (KEEP)
    if (statusIds) {
      const statusArray = statusIds.split(",").map(Number);
      whereClause.status_id = { [Op.in]: statusArray };
    }

    // 3️⃣ ASSIGNEE FILTER (KEEP)
    if (assignees) {
      const assigneeArray = assignees.split(",");
      whereClause.assignedTo = { [Op.in]: assigneeArray };
    }

    // 4️⃣ TIMESTAMP DATE FILTER
    if (startDate && endDate) {
      const start = new Date(Number(startDate));
      const end = new Date(Number(endDate));
      end.setHours(23, 59, 59, 999);
      whereClause.createdAt = { [Op.between]: [start, end] };
    }

    // 5️⃣ DYNAMIC UI FILTERS
    const operatorMap = {
      equal: Op.eq,
      not_equal: Op.ne,
      contains: Op.substring,
      not_contains: Op.notLike,
      begins_with: Op.startsWith,
      not_begins_with: Op.notILike,
      in: Op.in,
      not_in: Op.notIn,
      between: Op.between,
      is_empty: "IS_EMPTY",
      is_not_empty: "IS_NOT_EMPTY",
    };

    filters.forEach((filter) => {
      const { field, operator, value } = filter;
      const sequelizeOperator = operatorMap[operator];
      if (!sequelizeOperator) return;

      if (sequelizeOperator === "IS_EMPTY") {
        whereClause[field] = { [Op.or]: [null, ""] };
      } else if (sequelizeOperator === "IS_NOT_EMPTY") {
        whereClause[field] = { [Op.ne]: null };
      } else if (sequelizeOperator === Op.between) {
        whereClause[field] = {
          [Op.between]: [
            new Date(Number(value[0])),
            new Date(Number(value[1])),
          ],
        };
      } else if (Array.isArray(value)) {
        whereClause[field] = { [sequelizeOperator]: value };
      } else {
        whereClause[field] = { [sequelizeOperator]: value };
      }
    });

    // 6️⃣ PAGINATION LOGIC
    const pageNumber = Number(page) || 1;
    const pageSize = Number(limit) || 10;
    const offset = (pageNumber - 1) * pageSize;

    // 7️⃣ FINAL DB QUERY WITH PAGINATION
    const { rows: leads, count: totalCount } = await Lead.findAndCountAll({
      where: whereClause,
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
      order: [["createdAt", "DESC"]],
      offset,
      limit: pageSize,
    });

    return {
      success: true,
      message: leads.length ? "Leads fetched successfully" : "No data found",
      data: leads,
      pagination: {
        total: totalCount,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};


exports.changeStatus = async (body, params) => {
  try {
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

    // Check if the new status is valid
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

    // Workflow: check if this status has any workflow rules
    const workflowRule = await WorkflowRules.findOne({
      where: { Status_id: statusId },
    });

    // If a workflow rule with template exists: log the template, add/update queue
    if (workflowRule && workflowRule.action_data) {
      // Console the template
      console.log(
        "Workflow Template for this status:",
        workflowRule.action_data
      );

      // Find if there is already an entry in the queue for this (lead, workflowRule)
      let queueEntry = await WorkFlowQueue.findOne({
        where: {
          lead_id: leadId,
          workflow_ruleID: workflowRule.id,
        },
      });

      if (queueEntry) {
        // Update the status to 'processing'
        await queueEntry.update({
          Status: "executed",
          executed_At: null,
        });
      } else {
        // Create an entry in queue with 'processing' status for this lead and workflow rule
        await WorkFlowQueue.create({
          lead_id: leadId,
          workflow_ruleID: workflowRule.id,
          Status: "processing",
        });
      }
    }

    // Update the lead with new status and stage
    await leadData.update({
      status_id: status.id,
      stage_id: status.stage_id,
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
      relativePath
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

  let counts = percentages.map(p =>
    Math.floor((p / 100) * totalLeads)
  );

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
            ...(statusId ? { status_id: statusId } : {})
          },
          { where: { id: leadIds[leadIndex++] } }
        )
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
exports.uploadFile = async (body, user) => {
  try {

    const upload = await BulkLeadUpload.create({
      file_name: body.originalname,
      file_path: body.path,
      uploaded_by: user.id
    });
    // console.log("Upload record created:", upload.id);
    return {
      message: "File uploaded successfully",
      statusCode: statusCode.OK,
      success: true,
      uploadId: upload.id,
      filename: body.originalname
    };
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,

    };
  }
};

// Step 2: Get Sheets and Headers
exports.getSheets = async (uploadId) => {
  try {
    const upload = await BulkLeadUpload.findByPk(uploadId);
    console.log("Fetched upload record:", upload);
    const wb = XLSX.readFile(upload.file_path);
    const sheet = wb.SheetNames[0];
    const headers = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1 })[0];
    console.log("Extracted headers:", headers);
    console.log("Sheet names:", wb.SheetNames);
    return {
      message: "Sheets fetched successfully",
      statusCode: statusCode.OK,
      success: true,
      sheets: wb.SheetNames,
      headers
    };
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message
    };
  }
};

// Step 3: Validate Mapping
exports.validateMapping = async ({ valmapping, uploadId, sheet, mapping }) => {
  try {
    if (!valmapping.whatsapp_number)
      return { statusCode: statusCode.BAD_REQUEST, success: false, message: "WhatsApp is required" };
    const fields = await LeadField.findAll({ where: { is_active: true } });
    console.log("Valid lead fields:", fields.map(f => f.name));
    const validFields = fields.map(f => f.name);
    Object.keys(valmapping.data || {}).forEach(f => {
      if (!validFields.includes(f))
        throw new Error(`Invalid field: ${f}`);
    });

    const upload = await BulkLeadUpload.findByPk(uploadId);
    const rows = parseExcel(upload.file_path, sheet);
    const numbers = rows.map(r => r[mapping.whatsapp_number]);
    const duplicates = await Lead.findAll({
      where: { whatsapp_number: { [Op.in]: numbers } },
      attributes: ["whatsapp_number"]
    });
    return { statusCode: statusCode.OK, success: true, duplicates };
  } catch (error) {
    return { statusCode: statusCode.BAD_REQUEST, success: false, message: error.message };
  }
};

// Step 4: Check Duplicates
exports.checkDuplicates = async ({ uploadId, sheet, mapping }) => {
  try {
    const upload = await BulkLeadUpload.findByPk(uploadId);
    const rows = parseExcel(upload.file_path, sheet);
    const numbers = rows.map(r => r[mapping.whatsapp_number]);
    const duplicates = await Lead.findAll({
      where: { whatsapp_number: { [Op.in]: numbers } },
      attributes: ["whatsapp_number"]
    });
    return { statusCode: statusCode.OK, success: true, duplicates };
  } catch (error) {
    return { statusCode: statusCode.BAD_REQUEST, success: false, message: error.message };
  }
};

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

    const rows = parseExcel(upload.file_path, sheet);
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
        source = "excel"
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
        attributes: ["id", "name", "email"]
      }
    ]
  });

  const uploadsWithCount = await Promise.all(
    rows.map(async upload => {
      const leadsCount = await Lead.count({
        where: {
          upload_id: upload.id   // ✅ FIX
        }
      });

      return {
        id: upload.id,
        file_name: upload.file_name,
        leads: leadsCount,
        uploaded_by: upload.uploader,
        uploaded_on: upload.createdAt,
        status: upload.status
      };
    })
  );

  return {
    data: uploadsWithCount,
    pagination: {
      total: count,
      limit,
      page: Math.floor(offset / limit) + 1
    }
  };
};
