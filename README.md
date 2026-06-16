# SLA Tracker — Recrutamento & Seleção

Sistema de rastreamento de SLA para processos de recrutamento e seleção. Permite monitorar vagas abertas, acompanhar o cumprimento dos prazos por etapa (aprovação, abertura de consultoria, envio de candidatos, entrevista e fechamento), identificar gargalos e exportar relatórios em Excel.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript (strict) + Vite 5 |
| Estilo | Tailwind CSS v3 + tailwindcss-animate |
| Componentes | shadcn/ui (customizado) + Lucide React |
| Roteamento | React Router v6 |
| Gráficos | Recharts |
| Datas | date-fns v3 |
| Excel | SheetJS (xlsx) |
| Backend | Supabase (Auth + PostgreSQL + RLS) |
| Deploy | Vercel |

---

## Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com)
- Conta na [Vercel](https://vercel.com)

---

## Rodar localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo de exemplo e preencha com as credenciais do seu projeto Supabase:

```bash
cp .env.example .env
```

Edite o `.env`:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

As chaves estão em: **Supabase Dashboard → Project Settings → API**.

### 3. Aplicar as migrations no Supabase

Acesse o **SQL Editor** do seu projeto Supabase e execute os arquivos em ordem:

```
supabase/migrations/001_create_profiles.sql
supabase/migrations/002_create_consultorias.sql
supabase/migrations/003_create_areas.sql
supabase/migrations/004_create_feriados.sql
supabase/migrations/005_create_vagas.sql
supabase/migrations/006_create_audit_log.sql
supabase/migrations/007_enable_rls.sql
```

> As migrations habilitam RLS em todas as tabelas. Execute-as **na ordem numérica** — há dependências entre elas.

### 4. (Opcional) Aplicar o seed de desenvolvimento

Para popular o banco com dados de teste (2 usuários, 3 consultorias, 5 áreas, 20 vagas fictícias):

```sql
-- Execute no SQL Editor do Supabase
-- Arquivo: supabase/seed.sql
```

Credenciais de teste após o seed:

| Usuário | E-mail | Senha | Role |
|---------|--------|-------|------|
| Admin | admin@unimed.coop.br | senha123 | admin |
| Consultor | consultor@unimed.coop.br | senha123 | usuario |

> O seed usa o usuário `consultor@unimed.coop.br` (id: `22222222-...`) como dono das vagas e das áreas/consultorias. Faça login com ele para ver os dados.

### 5. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse em: `http://localhost:5173`

---

## Estrutura de pastas

```
sla-tracker/
├── public/                    # Assets estáticos
├── src/
│   ├── components/
│   │   ├── layout/            # Sidebar, AuthGuard
│   │   ├── ui/                # Componentes reutilizáveis (Button, Card, Modal…)
│   │   └── vagas/             # VagaForm, VagaTimeline, VagaSLATable
│   ├── contexts/              # ToastContext, SidebarContext
│   ├── hooks/                 # useAuth, useVagas, useAreas, useConsultorias, useFeriados
│   ├── pages/                 # Login, Dashboard, Vagas, VagaDetalhe, Consultorias,
│   │   │                      #   Areas, Feriados, Relatorios
│   ├── services/              # supabase.ts, vagaService, exportService…
│   ├── types/                 # index.ts — todos os tipos TypeScript
│   └── utils/                 # calcularDiasUteis, getSLAConfig, getStatusVaga, formatters
├── supabase/
│   ├── migrations/            # SQL de criação de tabelas e RLS (001–007)
│   └── seed.sql               # Dados de desenvolvimento
├── .env.example               # Template de variáveis de ambiente
├── vercel.json                # Configuração de deploy na Vercel
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Deploy na Vercel

### Via GitHub (recomendado)

1. Inicialize o repositório e suba para o GitHub:

```bash
git init
git add .
git commit -m "feat: versão inicial do sla-tracker"
git remote add origin https://github.com/SEU_USUARIO/sla-tracker.git
git push -u origin main
```

2. Acesse [vercel.com](https://vercel.com) → **Add New Project** → importe o repositório.

3. Na tela de configuração do projeto, defina as **Environment Variables**:

| Variável | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Anon key pública do Supabase |

4. Clique em **Deploy**. O `vercel.json` já configura build command, output directory e o rewrite de SPA.

### Via Vercel CLI

```bash
npm i -g vercel
vercel --prod
```

---

## Regras de SLA por etapa

| Etapa | Prazo |
|-------|-------|
| Aprovação da vaga | 15 dias úteis |
| Abertura na consultoria | 3 dias úteis (apenas vagas externas) |
| Envio de candidatos — Auxiliar / Assistente | 10 dias úteis |
| Envio de candidatos — Analista | 15 dias úteis |
| Envio de candidatos — Gestão / Especialista / Médico | 20 dias úteis |
| Entrevistas | 15 dias úteis |
| Fechamento | 7 dias úteis |

Os cálculos excluem finais de semana e feriados cadastrados no sistema.

---

## Controle de acesso

| Recurso | Usuário comum | Admin |
|---------|:---:|:---:|
| Vagas próprias (CRUD) | ✓ | ✓ |
| Áreas próprias (CRUD) | ✓ | ✓ |
| Consultorias próprias (CRUD) | ✓ | ✓ |
| Ver feriados | ✓ | ✓ |
| Gerenciar feriados (CRUD) | — | ✓ |
| Dashboard / Relatórios | ✓ | ✓ |
