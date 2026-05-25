// routes/data.js — CRUD genérico de user_data (replica localStorage)
// Chaves suportadas: perfil, meta, draft, history, produtos, ebooks,
//                   receitas, cfg_consulta, theme
const express = require('express');
const pool    = require('../db');
const { requireAuth } = require('../middleware/auth');
const router  = express.Router();

const ALLOWED_KEYS = new Set([
  'perfil', 'meta', 'draft', 'history',
  'produtos', 'ebooks', 'receitas', 'cfg_consulta', 'theme',
]);

// ── GET /data/:chave ────────────────────────────────────────
router.get('/:chave', requireAuth, async (req, res) => {
  const { chave } = req.params;
  if (!ALLOWED_KEYS.has(chave))
    return res.status(400).json({ error: 'Chave inválida.' });

  try {
    const result = await pool.query(
      'SELECT valor_json FROM user_data WHERE user_id = $1 AND chave = $2',
      [req.user.id, chave]
    );
    if (!result.rows.length) return res.json({ data: null });
    res.json({ data: result.rows[0].valor_json });
  } catch (err) {
    console.error('data GET error:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// ── PUT /data/:chave ────────────────────────────────────────
router.put('/:chave', requireAuth, async (req, res) => {
  const { chave } = req.params;
  if (!ALLOWED_KEYS.has(chave))
    return res.status(400).json({ error: 'Chave inválida.' });

  const valor = req.body.data !== undefined ? req.body.data : null;

  try {
    await pool.query(
      `INSERT INTO user_data (user_id, chave, valor_json, atualizado_em)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, chave)
       DO UPDATE SET valor_json = EXCLUDED.valor_json, atualizado_em = NOW()`,
      [req.user.id, chave, JSON.stringify(valor)]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('data PUT error:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// ── GET /data (todos de uma vez) ────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT chave, valor_json FROM user_data WHERE user_id = $1',
      [req.user.id]
    );
    const map = {};
    result.rows.forEach(r => { map[r.chave] = r.valor_json; });
    res.json({ data: map });
  } catch (err) {
    console.error('data GET all error:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
