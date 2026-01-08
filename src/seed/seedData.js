const { RoleModel, PermissionModel, PermissionTemplateModel } = require("../pgModels/index");
const RolePermission = require("../pgModels/rolePermission");
const PermissionTemplatePermission = require("../pgModels/permissionTemplatePermissionModel");

const seed = async () => {
  // Roles
  const roles = await RoleModel.bulkCreate([
    {roleName:"Root"},
    { roleName: "Admin" },
    { roleName: "Manager" },
    { roleName: "Caller" },
    { roleName: "Marketing" },
  ]);

  // Permissions
  // const permissions = await PermissionModel.bulkCreate([
  //   { name: "user.create" },
  //   { name: "user.view" },
  //   { name: "leads.add" },
  //   { name: "leads.view" },
  //   { name: "dashboard.view" },
  // ]);

  // Permission Templates
  // const templates = await PermissionTemplate.bulkCreate([
  //   { templateName: "Default Admin Permissions" },
  //   { templateName: "Default Manager Permissions" },
  //   { templateName: "Default Caller Permissions" },
  //   { templateName: "Default Marketing Permissions" },
  // ]);

  // Admin → all permissions
//   for (let perm of permissions) {
//     await RolePermission.create({ roleId: roles[0].id, permissionId: perm.id });
//     await PermissionTemplatePermission.create({
//       templateId: templates[0].id,
//       permissionId: perm.id
//     });
//   }

  // Caller → only leads.view
//   await RolePermission.create({ roleId: roles[2].id, permissionId: permissions[3].id });

  console.log("✅ Seed Completed");
};

module.exports = seed;
