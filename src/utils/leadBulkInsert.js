// services/leadImport.service.js
const XLSX = require("xlsx");
const axios = require("axios");
const path = require("path");
const csv = require("csv-parse/sync");

// exports.parseExcel = (filePath, sheet) => {
//   const wb = XLSX.readFile(filePath);
//   return XLSX.utils.sheet_to_json(wb.Sheets[sheet]);
// };



// exports.parseExcelFromS3 = async (fileUrl, sheetName) => {
//   // 1. download file from S3
//   const response = await axios.get(fileUrl, {
//     responseType: "arraybuffer",
//   });

//   const buffer = response.data;

//   // 2. read workbook from buffer
//   const workbook = XLSX.read(buffer, { type: "buffer" });

//   const sheet =
//     sheetName || workbook.SheetNames[0];

//   if (!workbook.Sheets[sheet]) {
//     throw new Error(`Sheet not found: ${sheet}`);
//   }

//   // 3. convert sheet to JSON
//   return XLSX.utils.sheet_to_json(
//     workbook.Sheets[sheet],
//     { defval: null }
//   );
// };


exports.parseFileFromS3 = async (fileUrl, sheetName) => {
  const response = await axios.get(fileUrl, {
    responseType: "arraybuffer",
  });

  const buffer = response.data;
  const extension = path.extname(fileUrl).toLowerCase();

  // ==============================
  // 1️⃣ Excel Files
  // ==============================
  if (extension === ".xlsx" || extension === ".xls") {
    const workbook = XLSX.read(buffer, { type: "buffer" });

    const sheet = sheetName || workbook.SheetNames[0];

    if (!workbook.Sheets[sheet]) {
      throw new Error(`Sheet not found: ${sheet}`);
    }

    return XLSX.utils.sheet_to_json(
      workbook.Sheets[sheet],
      { defval: null }
    );
  }

  // ==============================
  // 2️⃣ CSV Files
  // ==============================
  if (extension === ".csv") {
    const text = buffer.toString("utf-8");

    return csv.parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: (value) => String(value) // 🔥 force string
    });
  }

  // ==============================
  // Unsupported
  // ==============================
  throw new Error("Only Excel and CSV files are supported");
};


exports.buildAssignmentPlan = ({ total, userIds, percentages }) => {
  if (!userIds || !percentages) return null;

  if (userIds.length !== percentages.length) {
    throw new Error("userIds and percentages length mismatch");
  }

  if (percentages.reduce((a, b) => a + b, 0) !== 100) {
    throw new Error("Percentages must sum to 100");
  }

  // calculate base counts
  let counts = percentages.map(p =>
    Math.floor((p / 100) * total)
  );

  // distribute remainder
  let assigned = counts.reduce((a, b) => a + b, 0);
  let remainder = total - assigned;

  for (let i = 0; remainder > 0; i++, remainder--) {
    counts[i]++;
  }

  // build plan
  const plan = {};
  userIds.forEach((userId, index) => {
    plan[userId] = counts[index];
  });

  return plan;
};



// services/leadImport.service.js
exports.buildLeadPayload = (
  row,
  mapping,
  createdBy,
  uploadId,
  assignedTo,
  status_id,
  source = "excel"
) => {
  const payload = {
    created_by: createdBy,
    upload_id: uploadId,
    assignedTo: assignedTo || null,
    status_id: status_id || null,
    source: source || null,
    data: {}
  };

  // static fields
  if (mapping.name) payload.name = row[mapping.name];
  if (mapping.whatsapp_number) {
    payload.whatsapp_number = row[mapping.whatsapp_number];
  }
  if (mapping.email) payload.email = row[mapping.email];
  if (mapping.source) payload.source = mapping.source;

  // dynamic fields → JSONB
  if (mapping.data) {
    Object.entries(mapping.data).forEach(([dbField, excelCol]) => {
      payload.data[dbField] = row[excelCol];
    });
  }

  return payload;
};




// exports.buildLeadPayload = (row, mapping, userId, uploadId) => {
//   const payload = {
//     created_by: userId,
//     upload_id: uploadId,
//     data: {}
//   };

//   // static fields
//   if (mapping.name) payload.name = row[mapping.name];
//   if (mapping.whatsapp_number)
//     payload.whatsapp_number = row[mapping.whatsapp_number];

//   // dynamic fields → data JSONB
//   Object.entries(mapping.data || {}).forEach(([dbField, excelCol]) => {
//     payload.data[dbField] = row[excelCol];
//   });

//   return payload;
// };


// services/leadAssignmentPlan.js
