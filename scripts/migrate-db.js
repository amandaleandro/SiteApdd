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
  // Tabela de leads
  `CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    message TEXT NOT NULL,
    ip VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Tabela de posts do blog
  `CREATE TABLE IF NOT EXISTS blog_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    cover_image VARCHAR(500),
    category VARCHAR(100) DEFAULT 'Tecnologia',
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Criar índices para melhor performance
  `CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email)`,
  `CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published)`,
  `CREATE INDEX IF NOT EXISTS idx_blog_posts_created ON blog_posts(created_at)`
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
