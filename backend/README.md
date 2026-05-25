# GR Nutri API — Backend

API REST em Node.js + Express + PostgreSQL para o sistema GR Nutri & Performance.

## Stack

- **Runtime:** Node.js 18+
- **Framework:** Express 4
- **Banco:** PostgreSQL (provisionado pelo Render)
- **Auth:** JWT (HS256)
- **Senhas:** bcryptjs (12 rounds)
- **Deploy:** Render Web Service

## Estrutura de Pastas

```
backend/
├── migrations/
│   └── 001_init.sql      # Schema inicial (tabelas, índices)
├── middleware/
│   └── auth.js           # requireAuth / requireAdmin
├── routes/
│   ├── auth.js           # POST /api/auth/login|register|forgot
│   ├── data.js           # GET|PUT /api/data/:chave
│   ├── agendamentos.js   # CRUD /api/agendamentos
│   └── admin.js          # GET /api/admin/users  |  /api/admin/global/:chave
├── db.js                 # Pool de conexão com PostgreSQL
├── migrate.js            # Executa as migrations em ordem
├── server.js             # Entry point do Express
├── .env.example          # Variáveis de ambiente necessárias
└── package.json
```

## Deploy no Render (passo a passo)

### 1. Criar o banco PostgreSQL

1. No painel Render, clique em **New → PostgreSQL**
2. Name: `grnutri-db`, Plan: **Free**
3. Copie a **Internal Database URL**

### 2. Criar o Web Service (backend)

1. Clique em **New → Web Service**
2. Conecte este repositório
3. Configurações:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run migrate`
   - **Start Command:** `npm start`
   - **Plan:** Free (ou pago para não adormecer)

### 3. Variáveis de Ambiente (Settings → Environment)

| Variável | Valor |
|---|---|
| `DATABASE_URL` | (use "From Database" → grnutri-db → connectionString) |
| `JWT_SECRET` | (gere: `openssl rand -hex 32`) |
| `JWT_EXPIRES_IN` | `7d` |
| `ADMIN_EMAIL` | `gustavo@grnutri.com.br` |
| `ADMIN_SENHA` | (senha forte — não compartilhe) |
| `NUTRICIONISTA_WPP` | `5511999257883` |
| `ALLOWED_ORIGINS` | `https://gustavonutrisaas.onrender.com` |

### 4. Configurar o Frontend

Edite a linha em `gr-nutri-app (5).html`:

```js
window.GR_API_URL = 'https://grnutri-api.onrender.com';
```

## Endpoints

### Auth

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/login` | Login (retorna JWT) |
| POST | `/api/auth/register` | Cadastro |
| POST | `/api/auth/forgot` | Recuperação de senha |

### Dados do usuário (requer `Authorization: Bearer <token>`)

| Método | Rota | Chaves aceitas |
|---|---|---|
| GET | `/api/data` | Retorna todos os dados do usuário |
| GET | `/api/data/:chave` | Retorna um dado específico |
| PUT | `/api/data/:chave` | Salva/atualiza um dado |

Chaves aceitas: `perfil`, `meta`, `draft`, `history`, `produtos`, `ebooks`, `receitas`, `cfg_consulta`, `theme`

### Agendamentos (requer token)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/agendamentos` | Lista agendamentos (admin vê todos) |
| POST | `/api/agendamentos` | Cria novo agendamento |
| PATCH | `/api/agendamentos/:id/status` | Altera status |
| DELETE | `/api/agendamentos/:id` | Remove agendamento |

### Admin (requer token de admin)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/admin/users` | Lista todos os usuários |
| GET | `/api/admin/global/:chave` | Lê config global |
| PUT | `/api/admin/global/:chave` | Salva config global |

## Desenvolvimento local

```bash
cp .env.example .env
# edite .env com suas credenciais locais

npm install
npm run migrate
npm start
```
