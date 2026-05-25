// routes/admin.js — Endpoints exclusivos do admin
const express = require('express');
const pool    = require('../db');
const { requireAdmin } = require('../middleware/auth');
const router  = express.Router();

// ── GET /admin/users ─────────────────────────────────────────
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, nome, role, criado_em FROM users ORDER BY criado_em DESC'
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error('admin users error:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// ── GET /admin/global/:chave ──────────────────────────────────
router.get('/global/:chave', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT valor_json FROM global_config WHERE chave = $1',
      [req.params.chave]
    );
    res.json({ data: result.rows[0]?.valor_json ?? null });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// ── PUT /admin/global/:chave ──────────────────────────────────
router.put('/global/:chave', requireAdmin, async (req, res) => {
  const valor = req.body.data !== undefined ? req.body.data : null;
  try {
    await pool.query(
      `INSERT INTO global_config (chave, valor_json, atualizado_em)
       VALUES ($1, $2, NOW())
       ON CONFLICT (chave)
       DO UPDATE SET valor_json = EXCLUDED.valor_json, atualizado_em = NOW()`,
      [req.params.chave, JSON.stringify(valor)]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
