const { statusCode, resMessage } = require("../../config/default.json");
const {
  Lead,
  LeadStage,
  LeadStatus,
  UserModel,
  BulkLeadUpload,
  LeadField,
  ActivityHistory,FollowUp
} = require("../../pgModels");
const moment = require("moment");
const { Op, Sequelize } = require("sequelize");

const WorkflowRules = require("../../pgModels/workflowRulesModel"); // Make sure to require the WorkflowRules model if not already at the top
const WorkFlowQueue = require("../../pgModels/workflowQueueModel");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");
const { buildLeadPayload, buildAssignmentPlan, parseFileFromS3 } = require("../../utils/leadBulkInsert");
const { SEARCH_FIELD_MAP, FIXED_FIELDS, operatorMap, buildDynamicWhereClause } = require("../../utils/filerDynamic");
const { default: axios } = require("axios");
const OnLeadStatusChange = require("../../utils/OnLeadStatusChange");
const { formatActivity, logActivity } = require("../../utils/ActivityLogger");
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
    const dynamicConditions = buildDynamicWhereClause(filters);

    if (dynamicConditions.length) {
      andConditions.push(...dynamicConditions);
    }

    /* ================= FINAL MERGE ================= */
    if (andConditions.length > 0) {
      whereClause[Op.and] = andConditions;
    }

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

exports.changeStatus = async (body, params, user) => {
  try {

    console.log("changeStatuschangeStatus", user.id);
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

    const oldStatusId = leadData.status_id;

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


    await ActivityHistory.create({
      lead_id: leadId,
      activity_type: "STATUS",
      title: "Status Changed",
      description: "Lead status updated",
      meta_data: {
        from_status_id: oldStatusId,
        to_status_id: status.id,
      },
      created_by: user?.id ? Number(user.id) : null
    });


    console.log("Lead status updated, fetching updated lead...");
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

// Step 2: Get Sheets and Headers
// exports.getSheets = async (uploadId) => {
//   try {
//     const upload = await BulkLeadUpload.findByPk(uploadId);
//     if (!upload) throw new Error("Upload record not found");

//     console.log("Fetching file from S3:", upload.file_path);

//     // 1. Download the file from S3 as an ArrayBuffer
//     const response = await axios.get(upload.file_path, {
//       responseType: "arraybuffer",
//     });
//     const buffer = response.data;

//     // 2. Use XLSX.read (NOT readFile) to parse the buffer
//     const wb = XLSX.read(buffer, { type: "buffer" });

//     const sheetName = wb.SheetNames[0];
//     const headers = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
//       header: 1,
//     })[0];

//     console.log("Extracted headers:", headers);

//     return {
//       message: "Sheets fetched successfully",
//       statusCode: statusCode.OK,
//       success: true,
//       sheets: wb.SheetNames,
//       headers,
//     };
//   } catch (error) {
//     return {
//       statusCode: statusCode.BAD_REQUEST,
//       success: false,
//       message: error.message,
//     };
//   }
// };
exports.getSheets = async (uploadId) => {
  try {
    const upload = await BulkLeadUpload.findByPk(uploadId);
    if (!upload) throw new Error("Upload record not found");

    const extension = path.extname(upload.file_path).toLowerCase();

    // If CSV → No sheets
    if (extension === ".csv") {
      const rows = await parseFileFromS3(upload.file_path);
      const headers = Object.keys(rows[0] || {});

      return {
        message: "CSV headers fetched successfully",
        statusCode: statusCode.OK,
        success: true,
        sheets: ["CSV"],
        headers
      };
    }

    // If Excel
    const response = await axios.get(upload.file_path, {
      responseType: "arraybuffer",
    });

    const workbook = XLSX.read(response.data, { type: "buffer" });

    const sheetName = workbook.SheetNames[0];
    const headers = XLSX.utils.sheet_to_json(
      workbook.Sheets[sheetName],
      { header: 1 }
    )[0];

    return {
      message: "Sheets fetched successfully",
      statusCode: statusCode.OK,
      success: true,
      sheets: workbook.SheetNames,
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
exports.validateMapping = async ({
  valmapping,
  uploadId,
  sheet,
  mapping
}) => {
  try {

    if (!valmapping.whatsapp_number) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: "WhatsApp is required",
      };
    }

    // Validate dynamic fields
    const fields = await LeadField.findAll({
      where: { is_active: true }
    });

    const validFields = fields.map(f => f.name);

    Object.keys(valmapping.data || {}).forEach(f => {
      if (!validFields.includes(f)) {
        throw new Error(`Invalid field: ${f}`);
      }
    });

    // Get upload record
    const upload = await BulkLeadUpload.findByPk(uploadId);

    if (!upload) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: "Upload record not found",
      };
    }

    // USE UNIVERSAL PARSER (Excel + CSV)
    const rows = await parseFileFromS3(
      upload.file_path,
      sheet
    );

    if (!rows.length) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: "No rows found in file",
      };
    }

    // Extract whatsapp numbers safely
    const numbers = rows
      .map(r => r[mapping.whatsapp_number])
      .filter(Boolean)
      .map(num =>
        String(num).replace(/\.0$/, "").trim()
      );

    if (!numbers.length) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message:
          "No WhatsApp numbers found in file per mapping.",
      };
    }

    // Check duplicates in DB
    const duplicates = await Lead.findAll({
      where: {
        whatsapp_number: {
          [Op.in]: numbers
        }
      },
      attributes: ["whatsapp_number"],
    });

    return {
      statusCode: statusCode.OK,
      success: true,
      duplicates
    };

  } catch (error) {
    console.log("Error in validateMapping:", error);

    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message:
        error.message || "Error validating mapping",
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

    //  Parse Excel (S3 or Local)
    const filePath = upload.file_path;
    const isS3Url =
      typeof filePath === "string" &&
      (filePath.startsWith("http://") ||
        filePath.startsWith("https://"));

    const rows = await parseFileFromS3(upload.file_path, sheet);
    // const rows = isS3Url
    //   ? await exports.parseExcelFromS3(filePath, sheet)
    //   : exports.parseExcel(filePath, sheet);


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

exports.addFollowUp = async (body, user) => {
  try {

    const { lead_id, minutes } = body;
    const lead = await Lead.findByPk(lead_id);
    if (!lead) {
      return {
        statusCode: statusCode.NOT_FOUND,
        success: false,
        message: "Lead not found",
      };
    }

    const user_id = user.id;

    const followupTime = moment()
      .add(minutes, "minutes")
      .toDate();

    await FollowUp.create({
      lead_id,
      user_id,
      followup_time: followupTime,
    });


    return {
      statusCode: statusCode.OK,
      success: true,
      message: "Follow-up time added successfully",
      data: lead,
    };
  }
  catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
}


exports.addNote = async (body, user) => {
  try {
    const { lead_id, note } = body;

    if (!lead_id || !note) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: "lead_id and note are required",
      };
    }

    const lead = await Lead.findByPk(lead_id);

    if (!lead) {
      return {
        statusCode: statusCode.NOT_FOUND,
        success: false,
        message: "Lead not found",
      };
    }

    // If you want to track who added the note later
    const user_id = user.id;

    lead.notes = note;
    await lead.save();

     await logActivity({
      leadId: lead_id,
      type: "NOTE", 
      title: "Note Added",
      description: note.length > 50 ? note.substring(0, 50) + "..." : note,
      metaData: {
        note: note
      },
      userId: user_id
    });

    return {
      statusCode: statusCode.OK,
      success: true,
      message: "Note added successfully",
      data: lead,
    };
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};



// exports.getActivityLog = async (req, res) => {
//   try {
//     const lead = await Lead.findByPk(req.params.leadId);
//     if (!lead) {
//       return {
//         statusCode: statusCode.NOT_FOUND,
//         success: false,
//         message: "Lead not found",
//       };
//     }
//     // 1️⃣ Fetch activity history
//     const activities = await ActivityHistory.findAll({
//       where: { lead_id: String(req.params.leadId) },
//       include: [
//         {
//           model: UserModel,
//           as: "user",
//           attributes: ["id", "name"]
//         }
//       ],
//       order: [["created_at", "DESC"]]
//     });

//     // 2️⃣ Collect all status IDs from meta_data
//     const statusIds = new Set();

//     activities.forEach(a => {
//       if (a.activity_type === "STATUS") {
//         if (a.meta_data?.from_status_id)
//           statusIds.add(a.meta_data.from_status_id);

//         if (a.meta_data?.to_status_id)
//           statusIds.add(a.meta_data.to_status_id);
//       }
//     });

//     // 3️⃣ Fetch status master
//     let statusMap = {};
//     if (statusIds.size > 0) {
//       const statuses = await LeadStatus.findAll({
//         where: { id: [...statusIds] },
//         attributes: ["id", "name"]
//       });

//       statuses.forEach(s => {
//         statusMap[s.id] = s.name;
//       });
//     }

//     // 4️⃣ Format response (UI READY)
//     const formatted = activities.map(a => {
//       const base = {
//         id: a.id,
//         type: a.activity_type,
//         title: a.title,
//         description: a.description,
//         created_at: a.created_at,
//         created_by: a.user?.name || a.created_by,
//       };

//       // 🔄 STATUS
//       if (a.activity_type === "STATUS") {
//         return {
//           ...base,
//           from_status: statusMap[a.meta_data?.from_status_id] || null,
//           to_status: statusMap[a.meta_data?.to_status_id] || null
//         };
//       }

//       // 💬 WHATSAPP
//       if (a.activity_type === "WHATSAPP") {
//         return {
//           ...base,
//           message_type: a.meta_data?.message_type,
//           media_type: a.meta_data?.media_type || null,
//           media_url: a.meta_data?.media_url || null,
//           sent_via: a.meta_data?.sent_via || "API"
//         };
//       }

//       return base;
//     });

//     return res.status(200).json({
//       success: true,
//       data: formatted
//     });
//   } catch (error) {
//     console.error("Error fetching activity log:", error);
//     return {
//       statusCode: statusCode.BAD_REQUEST,
//       success: false,
//       message: error.message,
//     };
//   }
// }

exports.getActivityLog = async (req, res) => {
  try {
    const { leadId } = req.params;

    // 1️⃣ Check Lead
    const lead = await Lead.findByPk(leadId);
    if (!lead) {
      return res.status(statusCode.NOT_FOUND).json({
        success: false,
        message: "Lead not found",
      });
    }

    // 2️⃣ Fetch Activities
    const activities = await ActivityHistory.findAll({
      where: { lead_id: String(leadId) },
      include: [
        {
          model: UserModel,
          as: "user",
          attributes: ["id", "name"]
        }
      ],
      order: [["created_at", "DESC"]]
    });

    // 3️⃣ Collect Status IDs
    const statusIds = new Set();

    activities.forEach(a => {
      if (a.activity_type === "STATUS") {
        if (a.meta_data?.from_status_id)
          statusIds.add(a.meta_data.from_status_id);

        if (a.meta_data?.to_status_id)
          statusIds.add(a.meta_data.to_status_id);
      }
    });

    // 4️⃣ Fetch Status Names
    let statusMap = {};

    if (statusIds.size > 0) {
      const statuses = await LeadStatus.findAll({
        where: { id: [...statusIds] },
        attributes: ["id", "name"]
      });

      statuses.forEach(status => {
        statusMap[status.id] = status.name;
      });
    }

    // 5️⃣ Format Using External Formatter
    const formattedActivities = activities.map(activity =>
      formatActivity(activity, statusMap)
    );

    return res.status(statusCode.OK).json({
      success: true,
      data: formattedActivities
    });

  } catch (error) {
    console.error("Error fetching activity log:", error);
    return res.status(statusCode.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });
  }
};