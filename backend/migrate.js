// migrate.js — Executa as migrations SQL na ordem
require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const pool = require('./db');

async function run() {
  const dir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    console.log(`→ Executando ${file}...`);
    await pool.query(sql);
    console.log(`  ✓ ${file} concluído`);
  }
  await pool.end();
  console.log('✅ Migrations concluídas');
}

run().catch(err => { console.error('❌ Erro na migration:', err.message); process.exit(1); });
