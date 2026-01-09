const sequelize = require('../config/postgres.config');
const Sequelize = require('sequelize');
const insertDefaultLeadFields = require("../seed/leadFieldDefaults");

// require("./roleModel");
// require("./permissionModel");
// require("./permissionTemplateModel");
// require("./userModel");
// require("./permissionTemplatePermissionModel");
// require("./rolePermission");
require('./workflowRulesModel');
const LeadField = require('./LeadField')


const RoleModel = require('./roleModel');
const PermissionTemplateModel = require('./permissionTemplateModel');
const UserModel = require('./userModel');
const Broadcast = require('./brodcaste/Broadcast')

const BroadcastFilter = require('./brodcaste/BroadcastFilter')
const BroadcastLead = require('./brodcaste/BroadcastLead')
const BroadcastLog=require('./brodcaste/BroadcastLog');
const Lead = require('./lead');
const FacebookIntegration = require('./FacebookIntegration')(sequelize, Sequelize.DataTypes);

// Role <-> PermissionTemplate (1:1)
// RoleModel.belongsTo(PermissionTemplateModel, { foreignKey: 'permissionTemplateId', as: 'template' });
// PermissionTemplateModel.hasOne(RoleModel, { foreignKey: 'permissionTemplateId', as: 'role' });


Broadcast.hasMany(BroadcastFilter, { foreignKey: "broadcast_id" });
Broadcast.hasMany(BroadcastLead, { foreignKey: "broadcast_id" });
Broadcast.hasMany(BroadcastLog, { foreignKey: "broadcast_id" });

BroadcastLead.belongsTo(Broadcast, { foreignKey: "broadcast_id" });

FacebookIntegration.belongsTo(UserModel, { foreignKey: 'user_id' });
UserModel.hasMany(FacebookIntegration, { foreignKey: 'user_id' });
BroadcastLead.belongsTo(Lead, { foreignKey: "lead_id" });

const initDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Pg DataBase connected successfully');

        await sequelize.sync({ alter: true });
        console.log("Table synced successfully");
        // Call the default fields seeder ONCE
        await insertDefaultLeadFields(LeadField);
        console.log("Table synced successfully")
    } catch (err) {
        console.log("Database connection Failed", err)
    }
}

module.exports = {
    initDB, sequelize, RoleModel, PermissionTemplateModel, UserModel, Broadcast,
    BroadcastFilter,
    BroadcastLead,BroadcastLog , FacebookIntegration
}