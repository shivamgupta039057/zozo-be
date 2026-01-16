const WorkflowEdge = require("../pgModels/workflow/workflowEdge.model.js");
const WorkflowNode = require("../pgModels/workflow/workflowNode.model.js");
const traverse = require("./traverse.js");
const { Op, literal } = require("sequelize"); // Correct way: import literal directly

module.exports = async function OnLeadFieldChange(lead, field , fieldvalue) {
  console.log("Field has key?", field);

  console.log(lead, "leaddddd");
  // 1. Find workflows (nodes) whose trigger matches this lead field.
  // Find nodes with node_type === 'EVENT', action_type === 'Lead Field', and
  // data.selectedData.name (inside JSON in data column) matches field.name

  // Here, we want to find all WorkflowNodes whose data.selectedData has a "name" key equal to the value of 'field.name'
  // This assumes 'field' is an object with a 'name' property.
  // We are checking if the dynamic field key exists as a key in the selectedData object inside the data JSON column
  // We want to match WorkflowNodes where the selectedData object in data is exactly equal to the provided field object.
  // We'll do this by matching nodes where the JSON stringification of selectedData equals the JSON stringification of field.
  // This uses the Sequelize 'where' with a literal for deep object equality (Postgres only).
  // We want to match on the field.name, which is inside field.dataValues.name, with
  // the WorkflowNode.data.selectedData.name (in JSON column 'data').
  // So we use a Postgres JSONB operator -> to extract selectedData, then ->> to extract its name value.
  // If "field" is a Sequelize instance, use field.dataValues.name; otherwise use field.name.
  const fieldName = field && field.dataValues ? field.dataValues.name : field.name;

  const triggerNodes = await WorkflowNode.findAll({
    where: {
      action_type: "Lead Field",
      node_type: "EVENT",
      [Op.and]: [
        literal(`data->'selectedData'->>'name' = '${fieldName}'`)
      ],
    },
  });

  
  
  // console.log("triggerNodestriggerNodestriggerNodes", triggerNodes.data);
  
  if (!triggerNodes || triggerNodes.length === 0) return null;
  const results = [];
  
  for (const trigger of triggerNodes) {
    console.log("dddddddeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" , trigger.dataValues.data.selectedData.value);
    if (trigger.dataValues.data.selectedData.value !== fieldvalue) return null;
    const nodeId =
      trigger.node_id || (trigger.dataValues && trigger.dataValues.node_id);
    const leadData = lead && lead.dataValues ? lead.dataValues : lead;

    // Capture any data returned from the workflow traversal (e.g. template label)
    const result = await traverse(nodeId, leadData, new Set(), field);
    if (result !== undefined && result !== null) {
      results.push(result);
    }
  }

  // If there was only one result, return it directly; otherwise return array
  if (results.length === 0) return null;
  if (results.length === 1) return results[0];
  return results;
};