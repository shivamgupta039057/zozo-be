// menuSeeder.js
const { MainMenuModel } = require("../pgModels/index");

const menuList = [
  { name: 'dashboard', path: '/', order: 1 },
  { name: 'lead', path: '/leads', order: 2 },
  { name: 'whatsapp', path: '/whatsapp-ui', order: 3 },
  { name: 'integrations', path: '/integrations', order: 4 },
  { name: 'lead-feilds', path: '/lead-feilds', order: 5 },
  { name: 'lead-stages', path: '/lead-stages', order: 6 },
  { name: 'users', path: '/users', order: 7 },
  { name: 'permission-templates', path: '/permission-templates', order: 8 },
];

const seedMenu = async () => {
  await MainMenuModel.bulkCreate(menuList, { ignoreDuplicates: true });
  console.log('✅ Menu seeded');
};

module.exports = seedMenu;
