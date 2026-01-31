const executeAction = require("./executeAction");

const WorkflowNode = require("../pgModels/workflow/workflowNode.model");
const WorkflowEdge = require("../pgModels/workflow/workflowEdge.model");

module.exports = async function traverse(nodeId, lead, visited,status) {
  // console.log(
  //   "nodeId, lead, visitednodeId, lead, visitednodeId, lead, visited",
  //   nodeId,
  //   lead,
  //   visited,status
  // );

  if (visited.has(nodeId)) return;
  visited.add(nodeId);
 

  const node = await WorkflowNode.findOne({ where: { node_id: nodeId } });
  if (!node) return;


  // Will hold the last non-undefined result from actions/children
  let result;
  if (node.node_type === "CONDITION") {
    const { field, operator, value } = node.data.selectedData || {};

    let conditionResult = false;
    const leadValue = status;

    switch (operator) {
      case "equals":
        conditionResult = String(leadValue) === String(value);
        break;
      case "not_equals":
        conditionResult = String(leadValue) !== String(value);
        break;
      case "contains":
        conditionResult = String(leadValue || "").includes(String(value));
        break;
      case "begins_with":
        conditionResult = String(leadValue || "").startsWith(String(value));
        break;
    }


    const edge = await WorkflowEdge.findOne({
      where: {
        source: node.node_id,
        condition: conditionResult ? "YES" : "NO"
      }
    });
  

    if (edge) {
      return traverse(edge.target, lead, visited,status);
    } return;
  }
  else if (node.node_type === "ACTION") {
    // Capture any return value from the action (e.g. selectedData.label)
    result = await executeAction(node, lead,status);
    
    // ⛔ HARD STOP → do not go further
    if (result === "__STOP__") {
      console.log("🛑 Traversal stopped at node:", node.node_id);
      return;
    }

    // "__CONTINUE__" indicates to keep going without capturing result
    if (result !== "__CONTINUE__") {
      result = result;
    }
  }


  // Continue to next nodes
  const edges = await WorkflowEdge.findAll({
    where: { source: nodeId },
  });


  for (const edge of edges) {
    const childResult = await traverse(edge.target, lead, visited,status);
    if (childResult !== undefined) {
      result = childResult;
    }
  }
  return result;
};