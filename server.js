require("dotenv").config();
const express = require("express");
const path = require("path");
const crypto = require("crypto");
const { Pool } = require("pg");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

const publicDir = path.join(__dirname, "Public");
const pageDir = path.join(publicDir, "Page");
const imagesDir = path.join(publicDir, "images");

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";
const activeTokens = new Set();

const DATABASE_URL =
  process.env.DATABASE_URL || "postgres://apdd:apdd@localhost:5432/apdd";
const pool = new Pool({ connectionString: DATABASE_URL });

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { ok: false, error: "Muitas requisições. Tente novamente em 15 minutos." }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { ok: false, error: "Muitas tentativas de login. Tente novamente em 15 minutos." }
});

app.use(cors());
app.use(limiter);
app.use(express.json({ limit: "1mb" }));
app.use(express.static(pageDir));
app.use("/images", express.static(imagesDir));

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Banco indisponível" });
  }
});

const mapPost = (row) => ({
  id: row.id,
  title: row.title,
  excerpt: row.excerpt,
  content: row.content,
  coverImage: row.cover_image,
  category: row.category,
  published: row.published,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization || "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token || !activeTokens.has(token)) {
    return res.status(401).json({ ok: false, error: "Não autorizado" });
  }
  return next();
};

app.post("/api/lead", async (req, res) => {
  const { name, email, company, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, error: "Campos obrigatórios: nome, e-mail e mensagem." });
  }

  try {
    await pool.query(
      "INSERT INTO leads (name, email, company, message, ip, user_agent) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        String(name).trim(),
        String(email).trim(),
        String(company || "").trim(),
        String(message).trim(),
        req.ip,
        req.headers["user-agent"] || ""
      ]
    );

    res.json({ ok: true, message: "Recebemos seu contato! Em breve retornaremos." });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Erro ao salvar contato" });
  }
});

app.post("/api/login", loginLimiter, (req, res) => {
  const { username, password } = req.body || {};
  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    return res.status(401).json({ ok: false, error: "Credenciais inválidas" });
  }
  const token = crypto.randomUUID();
  activeTokens.add(token);
  res.json({ ok: true, token });
});

app.get("/api/admin/leads", requireAuth, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM leads ORDER BY created_at DESC");
    res.json({ ok: true, leads: result.rows });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Erro ao carregar leads" });
  }
});

app.get("/api/admin/stats", requireAuth, async (req, res) => {
  try {
    const leadsCount = await pool.query("SELECT COUNT(*) FROM leads");
    const postsCount = await pool.query("SELECT COUNT(*) FROM blog_posts");
    const publishedCount = await pool.query("SELECT COUNT(*) FROM blog_posts WHERE published = true");
    const recentLeads = await pool.query("SELECT COUNT(*) FROM leads WHERE created_at > NOW() - INTERVAL '7 days'");
    
    res.json({
      ok: true,
      stats: {
        totalLeads: parseInt(leadsCount.rows[0].count),
        totalPosts: parseInt(postsCount.rows[0].count),
        publishedPosts: parseInt(publishedCount.rows[0].count),
        leadsLastWeek: parseInt(recentLeads.rows[0].count)
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Erro ao carregar estatísticas" });
  }
});

app.get("/api/admin/leads/export", requireAuth, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM leads ORDER BY created_at DESC");
    
    let csv = "Nome,Email,Empresa,Mensagem,Data\n";
    result.rows.forEach((lead) => {
      const date = new Date(lead.created_at).toLocaleString("pt-BR");
      csv += `"${lead.name}","${lead.email}","${lead.company || ""}","${lead.message.replace(/"/g, '""')}","${date}"\n`;
    });
    
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="leads-${Date.now()}.csv"`);
    res.send("\ufeff" + csv);
  } catch (error) {
    res.status(500).json({ ok: false, error: "Erro ao exportar leads" });
  }
});

app.get("/api/admin/chart-data", requireAuth, async (req, res) => {
  try {
    const leadsPerDay = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM leads
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    
    res.json({
      ok: true,
      chartData: {
        labels: leadsPerDay.rows.map(r => new Date(r.date).toLocaleDateString("pt-BR")),
        values: leadsPerDay.rows.map(r => parseInt(r.count))
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Erro ao carregar dados do gráfico" });
  }
});

app.get("/api/posts", async (req, res) => {
  try {
    const onlyPublished = req.query.published === "1";
    const query = onlyPublished
      ? "SELECT * FROM blog_posts WHERE published = true ORDER BY created_at DESC"
      : "SELECT * FROM blog_posts ORDER BY created_at DESC";
    const result = await pool.query(query);
    res.json({ ok: true, posts: result.rows.map(mapPost) });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Erro ao carregar posts" });
  }
});

app.get("/api/posts/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM blog_posts WHERE id = $1", [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ ok: false, error: "Post não encontrado" });
    res.json({ ok: true, post: mapPost(result.rows[0]) });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Erro ao carregar post" });
  }
});

app.post("/api/admin/posts", requireAuth, async (req, res) => {
  const { title, excerpt, content, coverImage, category, published } = req.body || {};
  if (!title || !content) {
    return res.status(400).json({ ok: false, error: "Título e conteúdo são obrigatórios" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO blog_posts (title, excerpt, content, cover_image, category, published) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [
        String(title).trim(),
        String(excerpt || "").trim(),
        String(content).trim(),
        String(coverImage || "").trim(),
        String(category || "Tecnologia").trim(),
        Boolean(published)
      ]
    );
    res.json({ ok: true, post: mapPost(result.rows[0]) });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Erro ao salvar post" });
  }
});

app.put("/api/admin/posts/:id", requireAuth, async (req, res) => {
  try {
    const current = await pool.query("SELECT * FROM blog_posts WHERE id = $1", [req.params.id]);
    if (!current.rows.length) return res.status(404).json({ ok: false, error: "Post não encontrado" });

    const existing = current.rows[0];
    const updated = await pool.query(
      "UPDATE blog_posts SET title = $1, excerpt = $2, content = $3, cover_image = $4, category = $5, published = $6, updated_at = NOW() WHERE id = $7 RETURNING *",
      [
        req.body.title ? String(req.body.title).trim() : existing.title,
        req.body.excerpt !== undefined ? String(req.body.excerpt).trim() : existing.excerpt,
        req.body.content ? String(req.body.content).trim() : existing.content,
        req.body.coverImage !== undefined ? String(req.body.coverImage).trim() : existing.cover_image,
        req.body.category ? String(req.body.category).trim() : existing.category,
        req.body.published !== undefined ? Boolean(req.body.published) : existing.published,
        req.params.id
      ]
    );

    res.json({ ok: true, post: mapPost(updated.rows[0]) });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Erro ao atualizar post" });
  }
});

app.delete("/api/admin/posts/:id", requireAuth, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM blog_posts WHERE id = $1 RETURNING *", [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ ok: false, error: "Post não encontrado" });
    res.json({ ok: true, post: mapPost(result.rows[0]) });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Erro ao excluir post" });
  }
});

app.get("/admin.html", (_req, res) => {
  res.sendFile(path.join(pageDir, "admin.html"));
});

app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ ok: false, error: "Rota não encontrada" });
  }
  res.sendFile(path.join(pageDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
