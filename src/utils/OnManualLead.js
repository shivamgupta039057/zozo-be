const WorkflowEdge = require("../pgModels/workflow/workflowEdge.model.js");
const WorkflowNode = require("../pgModels/workflow/workflowNode.model.js");
const traverse = require("./traverse.js");

module.exports = async function OnManualLead() {

  // 1. Find workflows (nodes) whose trigger matches this lead status.
  const triggerNodes = await WorkflowNode.findAll({
    where: {
      action_type: "Manual Lead",
      node_type: "EVENT",
    },
  });

  console.log("triggerNodestriggerNodestriggerNodes", triggerNodes);

  if (!triggerNodes || triggerNodes.length === 0) return null;
  const results = [];

  for (const trigger of triggerNodes) {
    const nodeId =
      trigger.node_id || (trigger.dataValues && trigger.dataValues.node_id);

    // console.log("nodeIdnodeIdnodeIdnodeIdnodeId", nodeId, leadData);

    // Capture any data returned from the workflow traversal (e.g. template label)
    const result = await traverse(nodeId, {}, new Set(),);
    if (result !== undefined && result !== null) {
      results.push(result);
    }
  }



  // If there was only one result, return it directly; otherwise return array
  if (results.length === 0) return null;
  if (results.length === 1) return results[0];
  return results;
};