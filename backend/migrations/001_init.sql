-- GR Nutri & Performance — Schema inicial
-- Executar uma única vez na criação do banco

-- ── Extensão para UUID ───────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Tabela de usuários ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL,
  nome       TEXT NOT NULL,
  senha_hash TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'atleta',   -- 'atleta' | 'admin'
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ── Dados genéricos por usuário (replica localStorage) ───────
-- chave: perfil | meta | draft | history | produtos | ebooks |
--        receitas | cfg_consulta | theme
CREATE TABLE IF NOT EXISTS user_data (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chave        TEXT NOT NULL,
  valor_json   JSONB NOT NULL DEFAULT 'null',
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, chave)
);

CREATE INDEX IF NOT EXISTS idx_user_data_uid_chave ON user_data(user_id, chave);

-- ── Agendamentos ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agendamentos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data       DATE NOT NULL,
  hora       TEXT NOT NULL,
  motivo     TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'pendente', -- pendente | confirmado | cancelado
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agend_user_id ON agendamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_agend_data    ON agendamentos(data);

-- ── Config global (seeds e configurações do admin) ───────────
CREATE TABLE IF NOT EXISTS global_config (
  chave      TEXT PRIMARY KEY,
  valor_json JSONB NOT NULL DEFAULT 'null',
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
