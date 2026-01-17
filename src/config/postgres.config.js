const { Sequelize } = require('sequelize');
const devConfig = require('./dev.config');

console.log("devConfig" , devConfig);



const sequelize = new Sequelize(
  devConfig.PG_DB,      // Database name
  devConfig.PG_USER,    // Username
  devConfig.PG_PASS,    // Password

  {
    host: devConfig.PG_HOST,
    dialect: devConfig.PG_DIALECT,
    port: devConfig.DB_PORT,
    logging: false,
  }
);

module.exports = sequelize;

