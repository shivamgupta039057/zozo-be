// permissionTemplateSeeder.js
const {
  MainMenuModel,
  PermissionTemplateModel,
  TemplatePermissionModel,
} = require("../pgModels/index");

const menuList = [
  { name: "Dashboard", path: "/", order: 1, icon: "dashboard" },
  { name: "Lead", path: "/leads", order: 2, icon: "lead" },
  { name: "Bulk Upload", path: "/bulk-import/add", order: 9, icon: "Funnel" },
  { name: "Workflow", path: "/workflow", order: 10, icon: "Workflow" },
  { name: "WhatsApp", path: "/whatsapp-ui", order: 3, icon: "whatsapp" },
  { name: "Reception", path: "/reception-management", order: 9, icon: "Funnel" },
  {
    name: "Integrations",
    path: "/integrations",
    order: 4,
    icon: "integration",
  },
  {
    name: "Lead Fields",
    path: "/lead-fields",
    order: 5,
    isHeaderMenu: true,
    icon: "List",
  },
  {
    name: "Lead Stages",
    path: "/lead-stages",
    order: 6,
    isHeaderMenu: true,
    icon: "Funnel",
  },
  {
    name: "Users",
    path: "/users",
    order: 7,
    icon: "Users",
    isHeaderMenu: true,
  },
  {
    name: "Permission Templates",
    path: "/permission-templates",
    order: 8,
    isHeaderMenu: true,
    icon: "Shield",
  },
];

const defaultPermissions = {
  name: "Default Root Permissions",
  permissions: menuList.map((menu, idx) => ({
    menuName: menu.name,
    menuPath: menu.path,
    menuOrder: menu.order,
    create: true,
    view: true,
    edit: true,
    delete: true,
  })),
};

const seedPermissionTemplate = async () => {
  // Seed menus first, avoid duplicates
  for (const menu of menuList) {
    const exists = await MainMenuModel.findOne({
      where: { name: menu.name, path: menu.path },
    });
    if (!exists) {
      await MainMenuModel.create(menu);
    }
  }
  const menus = await MainMenuModel.findAll();

  // Create template only if not exists
  let template = await PermissionTemplateModel.findOne({
    where: { name: defaultPermissions.name },
  });
  if (!template) {
    template = await PermissionTemplateModel.create({
      name: defaultPermissions.name,
    });
  }

  // For each menu, add default permissions if not already present
  for (const menu of menus) {
    const exists = await TemplatePermissionModel.findOne({
      where: {
        PermissionTemplateId: template.id,
        MenuId: menu.id,
      },
    });
    if (!exists) {
      await TemplatePermissionModel.create({
        PermissionTemplateId: template.id,
        MenuId: menu.id,
        canCreate: true,
        canView: true,
        canEdit: true,
        canDelete: true,
      });
    }
  }
  console.log("✅ Default Root Permission Template seeded");
};

module.exports = seedPermissionTemplate;
