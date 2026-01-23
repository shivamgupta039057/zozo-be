// services/leadImport.service.js
const XLSX = require("xlsx");


exports.parseExcel = (filePath, sheet) => {
  const wb = XLSX.readFile(filePath);
  return XLSX.utils.sheet_to_json(wb.Sheets[sheet]);
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
  assignedTo
) => {
  const payload = {
    created_by: createdBy,
    upload_id: uploadId,
    assignedTo: assignedTo || null,
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
