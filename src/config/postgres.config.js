const { Sequelize } = require('sequelize');
const devConfig = require('./dev.config');


const sequelize = new Sequelize(
  devConfig.PG_DB,      // Database name
  devConfig.PG_USER,    // Username
  devConfig.PG_PASS,    // Password

  {
    host: devConfig.PG_HOST,
    dialect: "postgres",
    port: 5432,
    logging: false,
  }
);

module.exports = sequelize;

