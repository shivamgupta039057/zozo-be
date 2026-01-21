// permissionTemplateSeeder.js
const { MainMenuModel, PermissionTemplateModel, TemplatePermissionModel } = require("../pgModels/index");

const menuList = [
  { name: 'dashboard', path: '/', order: 1 , icon: 'dashboard'},
  { name: 'lead', path: '/leads', order: 2 , icon: 'lead' },
  { name: 'whatsapp', path: '/whatsapp-ui', order: 3 , icon: 'whatsapp' },
  { name: 'integrations', path: '/integrations', order: 4 , icon: 'integration' },
  { name: 'lead-feilds', path: '/lead-fields', order: 5,isHeaderMenu:true , icon: 'List' },
  { name: 'users', path: '/users', order: 7 , icon: 'Users',isHeaderMenu:true },
  { name: 'lead-stages', path: '/lead-stages', order: 6,isHeaderMenu:true , icon: 'Funnel' },
  { name: 'permission-templates', path: '/permission-templates', order: 8,isHeaderMenu:true , icon: 'Shield' },
];



  // { name: 'Dashboard', path: '/', order: 1 },
  // { name: 'Lead Fields', path: '/lead-fields', order: 2 },
  // { name: 'Lead Stages', path: '/lead-stages', order: 3 },
  // { name: 'Users', path: '/users', order: 4 },
  // { name: 'Permission Templates', path: '/permission-templates', order: 5 },
  // { name: 'View Lead', path: '/leads', order: 6 },
  // { name: 'Add From Excel', path: '/excel-upload', order: 7 },
  // { name: 'Whatapp', path: '/whatsapp-ui', order: 8 },
  // { name: 'Workflow', path: '/workflow', order: 9 },
  // { name: 'Integration', path: '/integrations', order: 10 },



const defaultPermissions = {
  name: "Default Root Permissions",
  permissions: menuList.map((menu, idx) => ({
    menuName: menu.name,
    menuPath: menu.path,
    menuOrder: menu.order,
    create: true,
    view: true,
    edit: true,
    delete: true
  }))
};

const seedPermissionTemplate = async () => {

  // Seed menus first, avoid duplicates
  for (const menu of menuList) {
    const exists = await MainMenuModel.findOne({ where: { name: menu.name, path: menu.path } });
    if (!exists) {
      await MainMenuModel.create(menu);
    }
  }
  const menus = await MainMenuModel.findAll();

  // Create template only if not exists
  let template = await PermissionTemplateModel.findOne({ where: { name: defaultPermissions.name } });
  if (!template) {
    template = await PermissionTemplateModel.create({ name: defaultPermissions.name });
  }

  // For each menu, add default permissions if not already present
  for (const menu of menus) {
    const exists = await TemplatePermissionModel.findOne({
      where: {
        PermissionTemplateId: template.id,
        MenuId: menu.id
      }
    });
    if (!exists) {
      await TemplatePermissionModel.create({
        PermissionTemplateId: template.id,
        MenuId: menu.id,
        canCreate: true,
        canView: true,
        canEdit: true,
        canDelete: true
      });
    }
  }
  console.log('✅ Default Root Permission Template seeded');
};

module.exports = seedPermissionTemplate;
