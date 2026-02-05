const { Pool } = require("pg");
require("dotenv").config();

const DATABASE_URL = process.env.DATABASE_URL || "postgres://apdd:apdd@localhost:5432/apdd";

const pool = new Pool({ 
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000
});

const migrations = [
  // Tabela de contatos
  `CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Tabela de sessões admin
  `CREATE TABLE IF NOT EXISTS admin_sessions (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
  )`,

  // Criar índices para melhor performance
  `CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email)`,
  `CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token)`
];

async function runMigrations() {
  console.log("🚀 Iniciando migrações do banco de dados...");
  
  for (const migration of migrations) {
    try {
      await pool.query(migration);
      console.log("✅ Migração executada com sucesso");
    } catch (error) {
      console.error("❌ Erro na migração:", error.message);
      process.exit(1);
    }
  }

  console.log("✅ Todas as migrações foram executadas!");
  await pool.end();
  process.exit(0);
}

runMigrations();
