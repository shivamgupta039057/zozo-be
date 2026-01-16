const { statusCode, resMessage } = require("../../config/default.json");
const { LeadStatus, WorkflowRules, } = require("../../pgModels/index");
const Workflow = require('../../pgModels/workflow/workflow.model');
const WorkflowNode = require('../../pgModels/workflow/workflowNode.model');
const WorkflowEdge = require('../../pgModels/workflow/workflowEdge.model');

/**
 * Create a new workflow rule.
 *
 * @param {object} body - The workflow rule details { Status_id, ActionType, action_data, Delay, isActive }
 * @returns {object} - An object containing the status code, success flag, message, and created workflow rule data.
 * @throws Will throw an error if there is a database error.
 */
exports.createWorkFlow = async (body) => {
  try {
    console.log("dfkdjhfkdjklsdjdklsfjdksljdfldjkl", body);

    const { Status_id, ActionType, action_data, Delay, isActive } = body;

    // Check for required fields
    if (!Status_id || !ActionType || !action_data) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: "Status_id, ActionType, and action_data are required.",
      };
    }

    // Optionally, check if a rule with exactly same key already exists
    const exists = await WorkflowRules.findOne({
      where: { Status_id, ActionType },
    });
    if (exists) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: "Workflow rule with this Status and ActionType already exists.",
      };
    }

    const createdRule = await WorkflowRules.create({
      Status_id,
      ActionType,
      action_data,
      Delay: Delay || null,
      isActive: typeof isActive === "boolean" ? isActive : true,
    });

    return {
      statusCode: statusCode.OK,
      success: true,
      message: "Workflow rule created successfully.",
      data: createdRule,
    };
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};


// exports.getWorkFlow = async () => {
//   try {
//     const rules = await WorkflowRules.findAll({
//       include: [
//         { model: LeadStatus, as: "status", attributes: ["id", "name"] }
//       ],
//       order: [["id", "DESC"]]
//     });

//     return {
//       statusCode: statusCode.OK,
//       success: true,
//       message: "Workflow rules fetched successfully",
//       data: rules
//     };
//   } catch (error) {
//     return {
//       statusCode: statusCode.BAD_REQUEST,
//       success: false,
//       message: error.message
//     };
//   }
// };

exports.getWorkFlow = async () => {
  try {
    const workflows = await Workflow.findAll({
      include: [
        { model: WorkflowNode, attributes: ["extraNodeData"] },
        { model: WorkflowEdge, attributes: ["extraEdgeData"] }
      ]
    });

    const response = workflows.map(wf => ({
      name: wf.name,
      nodes: wf.WorkflowNodes.map(n => n.extraNodeData),
      edges: wf.WorkflowEdges.map(e => e.extraEdgeData)
    }));

    return {
      statusCode: 200,
      success: true,
      data: response
    };

  } catch (error) {
    return {
      statusCode: 400,
      success: false,
      message: error.message
    };
  }
};




exports.saveWorkFlow = async (body) => {
  try {
    const { name, nodes, edges } = body;
    console.log("namenodesedgesnamenodesedgesnamenodesedgesnamenodesedges" , name, nodes, edges );

      // Check for required fields
      if (!name || !nodes || !Array.isArray(nodes) || nodes.length === 0) {
        return {
          statusCode: 400,
          success: false,
          message: "name and nodes are required.",
        };
      }

    // Optionally check edges structure if relevant to your workflow
    if (!edges || !Array.isArray(edges)) {
      return {
        statusCode: 400,
        success: false,
        message: "edges is required and should be an array.",
      };
    }


    // Check for duplicate EVENT node type with the same action_type in WorkflowNode table
    if (Array.isArray(nodes)) {
      for (const node of nodes) {
        // Check for node_type === EVENT
        if (node.data?.type === "EVENT") {
          const actionType = node.data?.sub;
          const data = node.data.selectedData || {};

          // Check if selectedData object has keys
          const dataKeys = Object.keys(data);

          // If dataKeys.length === 0, don't allow duplicate entries (one EVENT node for each actionType with empty selectedData)
          if (dataKeys.length === 0) {
            const existingNode = await WorkflowNode.findOne({
              where: {
                node_type: "EVENT",
                action_type: actionType
              }
            });
            if (existingNode) {
              return {
                statusCode: 409,
                success: false,
                message: `Duplicate EVENT node with action_type "${actionType}" found. EVENT nodes with empty selectedData must be unique by action_type.`,
              };
            }
          }
          // If dataKeys.length > 0, allow multiple entries (do not check for duplicates)
          // (So, do nothing in this case)
        }
      }
    }

    // Create workflow
    const workflow = await Workflow.create({ name });

    // Save nodes
    for (const node of nodes) {
      await WorkflowNode.create({
        workflow_id: workflow.id, // Sequelize: referenced as modelName + Id
        node_id: node.id,
        node_type: node.data?.type,      // EVENT / ACTION /  condition / delay
        action_type: node.data?.sub,     // Lead Status / WhatsApp or similar
        data: node.data,
        position: node.position,
        extraNodeData: node
      });
    }

    for (const edge of edges) {
      await WorkflowEdge.create({
        workflow_id: workflow.id,
        source: edge.source,
        target: edge.target,
        condition: edge.condition || null,
        extraEdgeData: edge
      });
    }

    return {
      statusCode: 200,
      success: true,
      message: "Workflow saved successfully.",
      data: { workflowId: workflow.id }
    };
  } catch (error) {
    return {
      statusCode: 400,
      success: false,
      message: error.message,
    };
  }
};