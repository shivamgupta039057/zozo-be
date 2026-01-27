const { Op } = require("sequelize");
const FIXED_FIELDS = [
  "id",
  "name",
  "email",
  "whatsapp_number",
  "assignedTo",
  "status_id",
  "stage_id",
  "reason_id",
  "createdAt",
  "updatedAt",
];

const SEARCH_FIELD_MAP = {
  name: { type: "fixed", column: "name" },
  email: { type: "fixed", column: "email" },
  whatsapp_number: { type: "fixed", column: "whatsapp_number" },

  alternate_number: { type: "jsonb", column: "alternate_number" },
  special_comment: { type: "jsonb", column: "special_comment" },
};


const operatorMap = {
  equal: Op.eq,
  not_equal: Op.ne,
  contains: Op.iLike,
  not_contains: Op.notILike,
  begins_with: Op.startsWith,
  in: Op.in,
  not_in: Op.notIn,
  between: Op.between,
  is_empty: "IS_EMPTY",
  is_not_empty: "IS_NOT_EMPTY",
};

module.exports = {
  FIXED_FIELDS,
  SEARCH_FIELD_MAP,operatorMap
};