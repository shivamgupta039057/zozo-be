
// =========================
// Sequelize & Config
// =========================
const sequelize = require('../config/postgres.config');
const Sequelize = require('sequelize');
const sequelizeInstance = require('../config/postgres.config');
const insertDefaultLeadFields = require("../seed/leadFieldDefaults");

// =========================
// Model Factories & Imports
// =========================
const LeadFieldFactory = require('./LeadField');
const FacebookConnectionFactory = require('./FacebookConnection');
const FbFieldMappingFactory = require('./FbFieldMapping');

const RawFacebookLeadFactory = require('./RawFacebookLead');
const RoleModelFactory = require('./roleModel');
const PermissionTemplateModelFactory = require('./permissionTemplateModel');
const UserModelFactory = require('./userModel');

const TemplatePermissionModelFactory = require('./templatePermissionModel');
const MainMenuModelFactory = require('./MainMenu');

// Brodcaste Models
const Broadcast = require('./brodcaste/Broadcast');
const BroadcastFilter = require('./brodcaste/BroadcastFilter');
const BroadcastLead = require('./brodcaste/BroadcastLead');
const BroadcastLog = require('./brodcaste/BroadcastLog');
const Lead = require('./lead');
const LeadStage = require('./LeadStages/LeadStage');
const LeadStatus = require('./LeadStages/LeadStatus');
const LeadReason = require('./LeadStages/LeadReason');

// =========================
// Model Initialization
// =========================
const LeadField = LeadFieldFactory(sequelizeInstance, Sequelize.DataTypes);
const FacebookConnection = FacebookConnectionFactory(sequelizeInstance, Sequelize.DataTypes);
const FbFieldMapping = FbFieldMappingFactory(sequelizeInstance, Sequelize.DataTypes);

const RawFacebookLead = RawFacebookLeadFactory(sequelizeInstance, Sequelize.DataTypes);
const RoleModel = RoleModelFactory(sequelizeInstance, Sequelize.DataTypes);
const PermissionTemplateModel = PermissionTemplateModelFactory(sequelizeInstance, Sequelize.DataTypes);
const UserModel = UserModelFactory(sequelizeInstance, Sequelize.DataTypes);
const TemplatePermissionModel = TemplatePermissionModelFactory(sequelizeInstance, Sequelize.DataTypes);
const MainMenuModel = MainMenuModelFactory(sequelizeInstance, Sequelize.DataTypes);

const FacebookIntegration = require('./FacebookIntegration')(sequelizeInstance, Sequelize.DataTypes);
const FbLeadDistributionRule = require('./FbLeadDistributionRule')(sequelizeInstance, Sequelize.DataTypes);
const FbLeadDistributionState = require('./FbLeadDistributionState')(sequelizeInstance, Sequelize.DataTypes);

// =========================
// Model Associations
// =========================

// PermissionTemplate <-> TemplatePermission, User
if (PermissionTemplateModel.associate) {
    PermissionTemplateModel.associate({
        TemplatePermission: TemplatePermissionModel,
        User: UserModel
    });
}

// TemplatePermission <-> PermissionTemplate, Menu
TemplatePermissionModel.belongsTo(PermissionTemplateModel, { foreignKey: 'PermissionTemplateId' });
TemplatePermissionModel.belongsTo(MainMenuModel, { foreignKey: 'MenuId' });


// Lead <-> LeadStage, LeadStatus, LeadReason, User
Lead.belongsTo(LeadStage, { foreignKey: 'stage_id', as: 'stage' });
Lead.belongsTo(LeadStatus, { foreignKey: 'status_id', as: 'status' });
Lead.belongsTo(LeadReason, { foreignKey: 'reason_id', as: 'reason' });
Lead.belongsTo(UserModel, { foreignKey: 'assignedTo', as: 'assignedUser' });
Lead.belongsTo(UserModel, { foreignKey: 'created_by', as: 'creator' });
UserModel.hasMany(Lead, { foreignKey: 'assignedTo', as: 'assignedLeads' });
UserModel.hasMany(Lead, { foreignKey: 'created_by', as: 'createdLeads' });

// User <-> Role, PermissionTemplate, User (manager/reportees)
UserModel.belongsTo(RoleModel, { foreignKey: 'roleId', as: 'role' });
RoleModel.hasMany(UserModel, { foreignKey: 'roleId', as: 'users' });
UserModel.belongsTo(PermissionTemplateModel, { foreignKey: 'permissionTemplateId', as: 'template' });
PermissionTemplateModel.hasMany(UserModel, { foreignKey: 'permissionTemplateId', as: 'users' });
UserModel.hasMany(UserModel, { as: 'reportees', foreignKey: 'reportingTo' });
UserModel.belongsTo(UserModel, { as: 'manager', foreignKey: 'reportingTo' });

// FacebookIntegration <-> User
FacebookIntegration.belongsTo(UserModel, { foreignKey: 'user_id' });
UserModel.hasMany(FacebookIntegration, { foreignKey: 'user_id' });

// Broadcast <-> BroadcastFilter, BroadcastLead, BroadcastLog
Broadcast.hasMany(BroadcastFilter, { foreignKey: "broadcast_id" });
Broadcast.hasMany(BroadcastLead, { foreignKey: "broadcast_id" });
Broadcast.hasMany(BroadcastLog, { foreignKey: "broadcast_id" });
BroadcastLead.belongsTo(Broadcast, { foreignKey: "broadcast_id" });

// FbLeadDistributionRule <-> FacebookIntegration, User
FbLeadDistributionRule.belongsTo(FacebookIntegration, { foreignKey: 'integration_id' });
FacebookIntegration.hasMany(FbLeadDistributionRule, { foreignKey: 'integration_id' });
FbLeadDistributionRule.belongsTo(UserModel, { foreignKey: 'user_id' });
UserModel.hasMany(FbLeadDistributionRule, { foreignKey: 'user_id' });

// FbLeadDistributionState <-> FacebookIntegration, User
FbLeadDistributionState.belongsTo(FacebookIntegration, { foreignKey: 'integration_id' });
FacebookIntegration.hasMany(FbLeadDistributionState, { foreignKey: 'integration_id' });
FbLeadDistributionState.belongsTo(UserModel, { foreignKey: 'user_id' });
UserModel.hasMany(FbLeadDistributionState, { foreignKey: 'user_id' });

// =========================
// DB Initialization
// =========================
const initDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Pg DataBase connected successfully');
        await sequelize.sync();
        console.log("Table synced successfully");
        // Call the default fields seeder ONCE
        await insertDefaultLeadFields(LeadField);
        console.log("Table synced successfully")
    } catch (err) {
        console.log("Database connection Failed", err)
    }
}

// =========================
// Exports
// =========================
module.exports = {
    initDB,
    sequelize: sequelizeInstance,
    LeadField,
    FacebookConnection,
    FbFieldMapping,
    RawFacebookLead,
    RoleModel,
    PermissionTemplateModel,
    UserModel,
    TemplatePermissionModel,
    MainMenuModel,
    FacebookIntegration,
    FbLeadDistributionRule,
    FbLeadDistributionState,
    Broadcast,
    BroadcastFilter,
    BroadcastLead,
    BroadcastLog,
    Lead,
    LeadStage,
    LeadStatus,
    LeadReason,
};