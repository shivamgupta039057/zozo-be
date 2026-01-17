const { DataTypes } = require('sequelize');
const sequelize = require('../../config/postgres.config');
const Workflow = require('./workflow.model');

const WorkflowEdge = sequelize.define("WorkflowEdge", {
  source: DataTypes.STRING,
  target: DataTypes.STRING,
  condition: {
    type: DataTypes.ENUM("YES", "NO"),
    allowNull: true
  },
  extraEdgeData:DataTypes.JSON
});

// Define associations
// Workflow.hasMany(WorkflowEdge);
// WorkflowEdge.belongsTo(Workflow);


Workflow.hasMany(WorkflowEdge, { foreignKey: "workflow_id" });
WorkflowEdge.belongsTo(Workflow, { foreignKey: "workflow_id" });


module.exports = WorkflowEdge;
