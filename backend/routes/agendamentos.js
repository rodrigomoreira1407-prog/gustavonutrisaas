// routes/agendamentos.js — CRUD de consultas agendadas
const express = require('express');
const pool    = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const router  = express.Router();

// ── GET /agendamentos (atleta: só os seus; admin: todos) ─────
router.get('/', requireAuth, async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await pool.query(
        `SELECT a.*, u.nome AS cliente_nome, u.email AS cliente_email
         FROM agendamentos a JOIN users u ON a.user_id = u.id
         ORDER BY a.data, a.hora`
      );
    } else {
      result = await pool.query(
        'SELECT * FROM agendamentos WHERE user_id = $1 ORDER BY data, hora',
        [req.user.id]
      );
    }
    res.json({ agendamentos: result.rows });
  } catch (err) {
    console.error('agendamentos GET error:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// ── POST /agendamentos ───────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  const { data, hora, motivo } = req.body;
  if (!data || !hora)
    return res.status(400).json({ error: 'Data e hora são obrigatórios.' });

  try {
    // Verificar conflito de horário
    const conflict = await pool.query(
      'SELECT id FROM agendamentos WHERE data = $1 AND hora = $2 AND status != $3',
      [data, hora, 'cancelado']
    );
    if (conflict.rows.length)
      return res.status(409).json({ error: 'Horário já reservado. Escolha outro.' });

    const result = await pool.query(
      `INSERT INTO agendamentos (user_id, data, hora, motivo)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, data, hora, motivo || '']
    );
    res.status(201).json({ agendamento: result.rows[0] });
  } catch (err) {
    console.error('agendamentos POST error:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// ── PATCH /agendamentos/:id/status ──────────────────────────
router.patch('/:id/status', requireAuth, async (req, res) => {
  const { status } = req.body;
  const validStatus = ['pendente', 'confirmado', 'cancelado'];
  if (!validStatus.includes(status))
    return res.status(400).json({ error: 'Status inválido.' });

  try {
    const result = await pool.query(
      `UPDATE agendamentos SET status = $1
       WHERE id = $2 AND (user_id = $3 OR $4 = 'admin')
       RETURNING *`,
      [status, req.params.id, req.user.id, req.user.role]
    );
    if (!result.rows.length)
      return res.status(404).json({ error: 'Agendamento não encontrado.' });
    res.json({ agendamento: result.rows[0] });
  } catch (err) {
    console.error('agendamentos PATCH error:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// ── DELETE /agendamentos/:id ─────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM agendamentos
       WHERE id = $1 AND (user_id = $2 OR $3 = 'admin')
       RETURNING id`,
      [req.params.id, req.user.id, req.user.role]
    );
    if (!result.rows.length)
      return res.status(404).json({ error: 'Agendamento não encontrado.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('agendamentos DELETE error:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
