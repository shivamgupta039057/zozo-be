// run_seeder.js
// Script to run all seeders safely (idempotent)
require('dotenv').config();
const seedData = require('./src/seed/seedData');
const permissionTemplateSeeder = require('./src/seed/permissionTemplateSeeder');
const insertDefaultLeadFields = require('./src/seed/leadFieldDefaults');
const { sequelize, LeadField, initDB } = require('./src/pgModels/index');

async function runSeeders() {
  try {
    await initDB(); // Ensure DB connection and sync

    // Always seed permission templates
    await permissionTemplateSeeder();

    // Check if roles already exist
    const [roleCount] = await sequelize.query('SELECT COUNT(*) as count FROM "Roles"');
    if (roleCount[0].count > 0) {
      console.log('Roles already seeded. Skipping role seeder.');
    } else {
      await seedData();
      console.log('Roles seeded.');
    }

    // Check if lead fields already exist
    const leadFieldCount = await LeadField.count();
    if (leadFieldCount > 0) {
      console.log('LeadFields already seeded. Skipping lead field seeder.');
    } else {
      await insertDefaultLeadFields(LeadField);
      console.log('LeadFields seeded.');
    }

    console.log('✅ All seeders executed (idempotent).');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeder error:', err);
    process.exit(1);
  }
}

runSeeders();
