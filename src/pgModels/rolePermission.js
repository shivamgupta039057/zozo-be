const sequelize = require("../config/postgres.config");
const { RoleModel, PermissionModel } = require("./index");

const RolePermission = sequelize.define("Role_Permission", {}, { timestamps: false });

RoleModel.belongsToMany(PermissionModel, { through: RolePermission });
PermissionModel.belongsToMany(RoleModel, { through: RolePermission });

module.exports = RolePermission;
