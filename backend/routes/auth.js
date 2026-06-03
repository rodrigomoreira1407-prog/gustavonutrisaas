// routes/auth.js — Login, cadastro, recuperação de senha
const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const pool     = require('../db');
const router   = express.Router();

const SALT_ROUNDS = 12;

function makeToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, nome: user.nome, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// ── POST /auth/register ─────────────────────────────────────
router.post('/register', async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || typeof nome !== 'string' || nome.trim().length < 2)
    return res.status(400).json({ error: 'Informe um nome válido.' });

  const emailNorm = (email || '').trim().toLowerCase();
  if (!emailNorm.includes('@'))
    return res.status(400).json({ error: 'E-mail inválido.' });

  if (!senha || senha.length < 6)
    return res.status(400).json({ error: 'Senha deve ter ao menos 6 caracteres.' });

  // Bloquear e-mail do admin
  if (emailNorm === (process.env.ADMIN_EMAIL || '').toLowerCase())
    return res.status(400).json({ error: 'E-mail não disponível.' });

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [emailNorm]);
    if (existing.rows.length)
      return res.status(409).json({ error: 'E-mail já cadastrado. Faça login.' });

    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
    const result = await pool.query(
      'INSERT INTO users (email, nome, senha_hash, role) VALUES ($1,$2,$3,$4) RETURNING id, email, nome, role',
      [emailNorm, nome.trim(), senhaHash, 'atleta']
    );
    const user = result.rows[0];
    res.status(201).json({ token: makeToken(user), user: { id: user.id, email: user.email, nome: user.nome, role: user.role } });
  } catch (err) {
    console.error('register error:', err.stack || err.message);
    res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  }
});

// ── POST /auth/login ────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  const emailNorm = (email || '').trim().toLowerCase();
  if (!emailNorm || !senha)
    return res.status(400).json({ error: 'Preencha e-mail e senha.' });

  // Login do admin (credenciais via env)
  if (
    emailNorm === (process.env.ADMIN_EMAIL || '').toLowerCase() &&
    senha === process.env.ADMIN_SENHA
  ) {
    try {
      const adminUser = { id: 'admin', email: emailNorm, nome: 'Gustavo Rodrigues', role: 'admin' };
      return res.json({ token: makeToken(adminUser), user: adminUser });
    } catch (err) {
      console.error('admin login error:', err.stack || err.message);
      return res.status(500).json({ error: 'Erro interno. Tente novamente.' });
    }
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [emailNorm]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'E-mail ou senha incorretos.' });

    const ok = await bcrypt.compare(senha, user.senha_hash);
    if (!ok) return res.status(401).json({ error: 'E-mail ou senha incorretos.' });

    res.json({
      token: makeToken(user),
      user: { id: user.id, email: user.email, nome: user.nome, role: user.role },
    });
  } catch (err) {
    console.error('login error:', err.stack || err.message);
    res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  }
});

// ── POST /auth/forgot ───────────────────────────────────────
router.post('/forgot', async (req, res) => {
  const emailNorm = (req.body.email || '').trim().toLowerCase();
  if (!emailNorm.includes('@'))
    return res.status(400).json({ error: 'Informe um e-mail válido.' });

  try {
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [emailNorm]);
    const existe = result.rows.length > 0 || emailNorm === (process.env.ADMIN_EMAIL || '').toLowerCase();
    // Sempre retornar sucesso para não revelar quais e-mails existem
    const wpp = process.env.NUTRICIONISTA_WPP || '';
    res.json({ existe, wpp });
  } catch (err) {
    console.error('forgot error:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
