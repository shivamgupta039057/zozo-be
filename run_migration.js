// Node.js script to run all migration SQL files in the migrations directory
const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    user: process.env.PG_USER,
    password: process.env.PG_PASS,
    database: process.env.PG_DB,
  });
  try {
    await client.connect();
    const migrationFiles = fs.readdirSync('./migrations').filter(f => f.endsWith('.sql'));
    for (const file of migrationFiles) {
      const sql = fs.readFileSync(`./migrations/${file}`, 'utf8');
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log(`Migration ${file} ran successfully!`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Migration ${file} failed:`, err.message);
        throw err;
      }
    }
  } catch (err) {
    console.error('Migration process failed:', err.message);
  } finally {
    await client.end();
  }
}

runMigration();
