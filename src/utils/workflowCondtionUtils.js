function normalizeConditions(selectedData) {
  if (!selectedData) return [];

  // 🟢 OLD FORMAT → object → array
  if (!Array.isArray(selectedData)) {
    return [selectedData];
  }

  // 🟢 NEW FORMAT → already array
  return selectedData;
}


function getLeadValue(field, lead, context) {
  if (field === "status_id" && context?.status !== undefined) {
    return context.status;
  }
  return lead[field];
}

function evaluateCondition(rule, lead, context = {}) {
  const { field, operator, value } = rule;
  const leadValue = getLeadValue(field, lead, context);

  switch (operator) {
    case "equal":
      return String(leadValue) === String(value);

    case "in":
      return Array.isArray(value)
        ? value.map(String).includes(String(leadValue))
        : false;

    case "is_empty":
      return (
        leadValue === null ||
        leadValue === undefined ||
        String(leadValue).trim() === ""
      );

    case "is_not_empty":
      return !(
        leadValue === null ||
        leadValue === undefined ||
        String(leadValue).trim() === ""
      );

    default:
      return false;
  }
}

module.exports = { evaluateCondition, normalizeConditions };
