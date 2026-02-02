const { Op, Sequelize } = require("sequelize");
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

const parseDDMMYYYY = (dateStr) => {
  if (!dateStr) return null;

  const [dd, mm, yyyy] = dateStr.split("-");
  const date = new Date(`${yyyy}-${mm}-${dd}`);

  return isNaN(date.getTime()) ? null : date;
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



/**
 * Build AND conditions for dynamic filters
 * @param {Array} filters
 * @returns {Array} andConditions
 */
const buildDynamicWhereClause = (filters = []) => {
  const andConditions = [];

  filters.forEach(({ field, operator, value }) => {
    if (!operatorMap[operator]) return;

    const isFixed = FIXED_FIELDS.includes(field);
    const sequelizeOp = operatorMap[operator];
    const fixedCol = field;

    const jsonTextCol = Sequelize.cast(
      Sequelize.json(`data.${field}`),
      "text"
    );

    /* ================= IS EMPTY ================= */
    if (operator === "is_empty") {
      andConditions.push(
        isFixed
          ? { [Op.or]: [{ [fixedCol]: null }, { [fixedCol]: "" }] }
          : Sequelize.where(
              Sequelize.fn("COALESCE", jsonTextCol, ""),
              ""
            )
      );
      return;
    }

    /* ================= IS NOT EMPTY ================= */
    if (operator === "is_not_empty") {
      andConditions.push(
        isFixed
          ? {
              [fixedCol]: {
                [Op.and]: {
                  [Op.ne]: null,
                  [Op.ne]: "",
                },
              },
            }
          : Sequelize.where(
              Sequelize.fn("COALESCE", jsonTextCol, ""),
              { [Op.ne]: "" }
            )
      );
      return;
    }

    /* ================= BETWEEN (GENERIC & SAFE) ================= */
    if (operator === "between" && Array.isArray(value) && value.length === 2) {
      // 🔹 try date parse (only if looks like DD-MM-YYYY)
      const startDate = parseDDMMYYYY(value[0]);
      const endDate = parseDDMMYYYY(value[1]);

      // ✅ DATE BETWEEN
      if (startDate && endDate) {
        andConditions.push(
          Sequelize.where(
           Sequelize.fn("DATE", Sequelize.col(`Lead.${fixedCol}`)),

            {
              [Op.between]: [startDate, endDate],
            }
          )
        );
        return;
      }

      // ✅ NON-DATE BETWEEN (number / string / json)
      andConditions.push(
        isFixed
          ? { [fixedCol]: { [Op.between]: value } }
          : Sequelize.where(
              Sequelize.cast(
                Sequelize.json(`data.${field}`),
                "numeric"
              ),
              { [Op.between]: value }
            )
      );
      return;
    }

    /* ================= ARRAY VALUE ================= */
    if (Array.isArray(value)) {
      // equal / not_equal → first value
      if (operator === "equal" || operator === "not_equal") {
        const v = value[0];
        andConditions.push(
          isFixed
            ? { [fixedCol]: { [sequelizeOp]: v } }
            : Sequelize.where(jsonTextCol, { [sequelizeOp]: v })
        );
        return;
      }

      // in / not_in
      if (operator === "in" || operator === "not_in") {
        andConditions.push(
          isFixed
            ? { [fixedCol]: { [sequelizeOp]: value } }
            : Sequelize.where(
                Sequelize.json(`data.${field}`),
                { [sequelizeOp]: value }
              )
        );
        return;
      }
    }

    /* ================= STRING ================= */
    if (typeof value === "string") {
      andConditions.push(
        isFixed
          ? {
              [fixedCol]:
                operator === "contains"
                  ? { [Op.iLike]: `%${value}%` }
                  : { [sequelizeOp]: value },
            }
          : Sequelize.where(
              jsonTextCol,
              operator === "contains"
                ? { [Op.iLike]: `%${value}%` }
                : { [sequelizeOp]: value }
            )
      );
      return;
    }

    /* ================= NUMBER ================= */
    if (typeof value === "number") {
      andConditions.push(
        isFixed
          ? { [fixedCol]: { [sequelizeOp]: value } }
          : Sequelize.where(
              Sequelize.cast(
                Sequelize.json(`data.${field}`),
                "numeric"
              ),
              { [sequelizeOp]: value }
            )
      );
    }
  });

  return andConditions;
};





module.exports = {
  FIXED_FIELDS,
  SEARCH_FIELD_MAP, operatorMap,
   buildDynamicWhereClause
};