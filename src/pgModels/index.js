const sequelize = require('../config/postgres.config')
const insertDefaultLeadFields = require("../seed/leadFieldDefaults");

// require("./roleModel");
// require("./permissionModel");
// require("./permissionTemplateModel");
// require("./userModel");
// require("./permissionTemplatePermissionModel");
// require("./rolePermission");
require('./workflowRulesModel');

const Sequelize = require('sequelize');
const sequelizeInstance = require('../config/postgres.config');

// Model factories
const LeadFieldFactory = require('./LeadField');
const FacebookConnectionFactory = require('./FacebookConnection');
const FacebookPageFactory = require('./FacebookPage');
const FacebookFormFactory = require('./FacebookForm');
const FacebookFormFieldFactory = require('./FacebookFormField');
const CrmFieldFactory = require('./CrmField');
const FbFieldMappingFactory = require('./FbFieldMapping');
const CampaignFactory = require('./Campaign');
const RawFacebookLeadFactory = require('./RawFacebookLead');


// Initialize models
const LeadField = LeadFieldFactory(sequelizeInstance, Sequelize.DataTypes);
const FacebookConnection = FacebookConnectionFactory(sequelizeInstance, Sequelize.DataTypes);
const FacebookPage = FacebookPageFactory(sequelizeInstance, Sequelize.DataTypes);
const FacebookForm = FacebookFormFactory(sequelizeInstance, Sequelize.DataTypes);
const FacebookFormField = FacebookFormFieldFactory(sequelizeInstance, Sequelize.DataTypes);
const CrmField = CrmFieldFactory(sequelizeInstance, Sequelize.DataTypes);
const FbFieldMapping = FbFieldMappingFactory(sequelizeInstance, Sequelize.DataTypes);
const Campaign = CampaignFactory(sequelizeInstance, Sequelize.DataTypes);
const RawFacebookLead = RawFacebookLeadFactory(sequelizeInstance, Sequelize.DataTypes);
const RoleModelFactory = require('./roleModel');
const PermissionTemplateModelFactory = require('./permissionTemplateModel');
const UserModelFactory = require('./userModel');
const PermissionModelFactory = require('./permissionModel');
const RoleModel = RoleModelFactory(sequelizeInstance, Sequelize.DataTypes);
const PermissionTemplateModel = PermissionTemplateModelFactory(sequelizeInstance, Sequelize.DataTypes);
const UserModel = UserModelFactory(sequelizeInstance, Sequelize.DataTypes);
const PermissionModel = PermissionModelFactory(sequelizeInstance, Sequelize.DataTypes);
const FacebookIntegration = require('./FacebookIntegration')(sequelizeInstance, Sequelize.DataTypes);


// Set up associations
if (FacebookConnection.associate) FacebookConnection.associate({ FacebookPage });
if (FacebookPage.associate) FacebookPage.associate({ FacebookConnection, FacebookForm });
if (FacebookForm.associate) FacebookForm.associate({ FacebookPage, FacebookFormField, FbFieldMapping });
if (FacebookFormField.associate) FacebookFormField.associate({ FacebookForm });
if (FbFieldMapping.associate) FbFieldMapping.associate({ FacebookForm, CrmField });

// Lead and Campaign associations
const Lead = require('./lead');
const LeadStage = require('./LeadStages/LeadStage');
const LeadStatus = require('./LeadStages/leadStatus');
const LeadReason = require('./LeadStages/leadReason');

Lead.belongsTo(Campaign, { foreignKey: 'campaign_id', as: 'campaign' });
Campaign.hasMany(Lead, { foreignKey: 'campaign_id', as: 'leads' });
Lead.belongsTo(LeadStage, { foreignKey: 'stage_id', as: 'stage' });
Lead.belongsTo(LeadStatus, { foreignKey: 'status_id', as: 'status' });
Lead.belongsTo(LeadReason, { foreignKey: 'reason_id', as: 'reason' });
Lead.belongsTo(UserModel, { foreignKey: 'assignedTo', as: 'assignedUser' });
Lead.belongsTo(UserModel, { foreignKey: 'created_by', as: 'creator' });
UserModel.hasMany(Lead, { foreignKey: 'assignedTo', as: 'assignedLeads' });
UserModel.hasMany(Lead, { foreignKey: 'created_by', as: 'createdLeads' });
// User associations
UserModel.belongsTo(RoleModel, { foreignKey: 'roleId', as: 'role' });
RoleModel.hasMany(UserModel, { foreignKey: 'roleId', as: 'users' });
UserModel.belongsTo(PermissionTemplateModel, { foreignKey: 'permissionTemplateId', as: 'template' });
PermissionTemplateModel.hasMany(UserModel, { foreignKey: 'permissionTemplateId', as: 'users' });
UserModel.hasMany(UserModel, { as: 'reportees', foreignKey: 'reportingTo' });
UserModel.belongsTo(UserModel, { as: 'manager', foreignKey: 'reportingTo' });
// FacebookIntegration associations
FacebookIntegration.belongsTo(UserModel, { foreignKey: 'user_id' });
UserModel.hasMany(FacebookIntegration, { foreignKey: 'user_id' });


// (Removed duplicate requires)
const Broadcast = require('./brodcaste/Broadcast')

const BroadcastFilter = require('./brodcaste/BroadcastFilter')
const BroadcastLead = require('./brodcaste/BroadcastLead')
const BroadcastLog=require('./brodcaste/BroadcastLog')
// Role <-> PermissionTemplate (1:1)
// RoleModel.belongsTo(PermissionTemplateModel, { foreignKey: 'permissionTemplateId', as: 'template' });
// PermissionTemplateModel.hasOne(RoleModel, { foreignKey: 'permissionTemplateId', as: 'role' });


Broadcast.hasMany(BroadcastFilter, { foreignKey: "broadcast_id" });
Broadcast.hasMany(BroadcastLead, { foreignKey: "broadcast_id" });
Broadcast.hasMany(BroadcastLog, { foreignKey: "broadcast_id" });

BroadcastLead.belongsTo(Broadcast, { foreignKey: "broadcast_id" });
// BroadcastLead.belongsTo(Lead, { foreignKey: "lead_id" });

const initDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Pg DataBase connected successfully');

        await sequelize.sync({ force: true });
        console.log("Table synced successfully");
        // Call the default fields seeder ONCE
        await insertDefaultLeadFields(LeadField);
        console.log("Table synced successfully")
    } catch (err) {
        console.log("Database connection Failed", err)
    }
}

module.exports = {
    initDB, sequelize: sequelizeInstance, RoleModel, PermissionTemplateModel, UserModel, PermissionModel, Broadcast,
    BroadcastFilter,
    BroadcastLead, BroadcastLog,
    LeadField,
    FacebookConnection,
    FacebookPage,
    FacebookForm,
    FacebookFormField,
    CrmField,
    FbFieldMapping,
    Campaign,
    RawFacebookLead,
    FacebookIntegration
}