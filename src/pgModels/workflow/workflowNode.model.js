const { DataTypes } = require('sequelize');
const sequelize = require('../../config/postgres.config');
const Workflow = require('./workflow.model');

const WorkflowNode = sequelize.define("WorkflowNode", {
  node_id: DataTypes.STRING,
  node_type: DataTypes.STRING,   // trigger | action |condition
  action_type: DataTypes.STRING, //whatsapp | status | delay | Lead Status
  data: DataTypes.JSONB,
  position: DataTypes.JSONB,
  extraNodeData: DataTypes.JSON
});

// Define associations
// Workflow.hasMany(WorkflowNode);
// WorkflowNode.belongsTo(Workflow);
Workflow.hasMany(WorkflowNode, { foreignKey: "workflow_id" });
WorkflowNode.belongsTo(Workflow, { foreignKey: "workflow_id" });


module.exports = WorkflowNode;
