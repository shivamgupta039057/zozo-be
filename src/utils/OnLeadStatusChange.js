const WorkflowEdge = require("../pgModels/workflow/workflowEdge.model.js");
const WorkflowNode = require("../pgModels/workflow/workflowNode.model.js");
const traverse = require("./traverse.js");

module.exports = async function OnLeadStatusChange(lead, status) {
  console.log("Lead status changed:", status);

  console.log(lead,"leaddddd")
  // 1. Find workflows (nodes) whose trigger matches this lead status.
  const triggerNodes = await WorkflowNode.findAll({
    where: {
      action_type: "Lead Status",
      node_type: "EVENT",
    },
  });

  // console.log("triggerNodestriggerNodestriggerNodes", triggerNodes);

  if (!triggerNodes || triggerNodes.length === 0) return null;
  const results = [];

  for (const trigger of triggerNodes) {
    const nodeId =
      trigger.node_id || (trigger.dataValues && trigger.dataValues.node_id);
    const leadData = lead && lead.dataValues ? lead.dataValues : lead;

    // console.log("nodeIdnodeIdnodeIdnodeIdnodeId", nodeId, leadData);

    // Capture any data returned from the workflow traversal (e.g. template label)
    const result = await traverse(nodeId, leadData, new Set(),status);
    if (result !== undefined && result !== null) {
      results.push(result);
    }
  }



  // If there was only one result, return it directly; otherwise return array
  if (results.length === 0) return null;
  if (results.length === 1) return results[0];
  return results;
};