// services/leadImport.service.js
const XLSX = require("xlsx");


exports.parseExcel = (filePath, sheet) => {
  const wb = XLSX.readFile(filePath);
  return XLSX.utils.sheet_to_json(wb.Sheets[sheet]);
};

exports.buildLeadPayload = (row, mapping, userId, uploadId) => {
  const payload = {
    created_by: userId,
    upload_id: uploadId,
    data: {}
  };

  // static fields
  if (mapping.name) payload.name = row[mapping.name];
  if (mapping.whatsapp_number)
    payload.whatsapp_number = row[mapping.whatsapp_number];

  // dynamic fields → data JSONB
  Object.entries(mapping.data || {}).forEach(([dbField, excelCol]) => {
    payload.data[dbField] = row[excelCol];
  });

  return payload;
};
