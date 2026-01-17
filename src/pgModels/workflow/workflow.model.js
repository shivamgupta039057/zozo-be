const { DataTypes } = require('sequelize');
const sequelize = require('../../config/postgres.config');

const Workflow = sequelize.define("Workflow", {
  name: DataTypes.STRING,
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});


module.exports = Workflow;
