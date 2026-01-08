const sequelize = require("../config/postgres.config");
const { PermissionTemplateModel, PermissionModel } = require("./index");

const PermissionTemplatePermission = sequelize.define("PermissionTemplate_Permission", {}, { timestamps: false });

PermissionTemplateModel.belongsToMany(PermissionModel, { through: PermissionTemplatePermission });
PermissionModel.belongsToMany(PermissionTemplateModel, { through: PermissionTemplatePermission });

module.exports = PermissionTemplatePermission;
