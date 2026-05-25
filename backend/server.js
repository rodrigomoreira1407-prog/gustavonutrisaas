require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');

const authRouter  = require('./routes/auth');
const dataRouter  = require('./routes/data');
const agendRouter = require('./routes/agendamentos');
const adminRouter = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── CORS ─────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Permitir requisições sem origin (ex.: curl, Render health checks)
    if (!origin) return cb(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin))
      return cb(null, true);
    cb(new Error('Origem não permitida pelo CORS'));
  },
  credentials: true,
}));

// ── Body parser ──────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// ── Rate limiting ─────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Muitas tentativas. Aguarde 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: 'Limite de requisições excedido.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);

// ── Rotas ─────────────────────────────────────────────────────
app.use('/api/auth',         authRouter);
app.use('/api/data',         dataRouter);
app.use('/api/agendamentos', agendRouter);
app.use('/api/admin',        adminRouter);

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Rota não encontrada ───────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

// ── Error handler global ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`🚀 GR Nutri API rodando na porta ${PORT}`));
