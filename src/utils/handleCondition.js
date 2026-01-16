const traverse = require("./traverse");
const WorkflowEdge = require("../pgModels/workflow/workflowEdge.model");
module.exports = async function handleCondition(node, lead, visited) {
  
  const { field, operator, value } = node.data.selectedData || {};
  let result = false;

  switch (operator) {
    case "equals":
      result = lead[field] === value;
      break;
    case "not_equals":
      result = lead[field] !== value;
      break;

    case "contains":
      result = (lead[field] || "").includes(value);
      break;
  }


  const edge = await WorkflowEdge.findOne({
    where: {
      source: node.node_id,
      condition: result ? "YES" : "NO"
    }
  });


  

  if (edge) {
    await traverse(edge.target, lead,visited);
  }
}
