# 🤖 Divisão de Tarefas por Agente de Desenvolvimento (AGENTS.md)

Este documento divide o desenvolvimento do projeto **SLA Tracker - Recrutamento & Seleção** em tarefas modulares para serem executadas por diferentes agentes de IA de forma coordenada.

---

## 💾 Agente 1: Infraestrutura de Banco de Dados & RLS (Supabase)
**Foco:** Criação de tabelas, relacionamentos, triggers e políticas de segurança (RLS) no Supabase.

### Tasks
- [ ] **Configuração do Schema (PostgreSQL):**
  - Criar a tabela `profiles` com restrição de chave estrangeira (`id` aponta para `auth.users`). Adicionar check constraint para a coluna `role` ('admin' | 'usuario').
  - Criar a tabela `consultorias` com relacionamento para `profiles`.
  - Criar a tabela `areas` com relacionamento para `profiles`.
  - Criar a tabela `feriados` com restrição `unique` no campo `data`.
  - Criar a tabela `vagas` com relacionamentos para `profiles`, `areas` e `consultorias` (anulável). Adicionar restrições de check para `tipo_vaga` e `nivel_vaga`.
  - Criar a tabela `vaga_audit_log` para registrar alterações históricas em vagas.
- [ ] **Triggers de Atualização e Auditoria:**
  - Criar a função e trigger para atualizar a coluna `updated_at` na tabela `vagas` a cada alteração.
  - Criar uma função de banco de dados (ou trigger) para escutar alterações em `vagas` e inserir automaticamente um registro na tabela `vaga_audit_log` contendo o `user_id` de quem realizou a alteração, o `campo` modificado, o `valor_antigo` e o `valor_novo`.
- [ ] **Políticas RLS (Segurança Obrigatória):**
  - Habilitar Row Level Security (RLS) em **todas** as tabelas.
  - Criar políticas para permitir leitura pública ou apenas autenticada de `profiles`, mas edição estritamente limitada ao dono do próprio perfil ou administradores.
  - Criar políticas para `consultorias`, `areas` e `feriados`: leitura para qualquer usuário autenticado; escrita (insert, update, delete) exclusiva para perfis com `role = 'admin'`.
  - Criar políticas para `vagas` e `vaga_audit_log`: leitura e escrita liberadas para qualquer usuário autenticado.

---

## 🔑 Agente 2: Autenticação, Usuários e Cadastros Básicos (CRUDs)
**Foco:** Login do usuário, persistência de sessão, layouts de controle e os cadastros de apoio (Consultorias, Áreas e Feriados).

### Tasks
- [ ] **Implementação do Supabase Auth:**
  - Desenvolver a lógica e interface da página de login (`src/pages/Login.tsx`).
  - Tratar loading states, mensagens de erro amigáveis e redirecionamento de rotas caso o usuário não esteja logado.
  - Configurar um `useAuth` hook ou Context para prover a sessão do usuário de forma global e segura.
- [ ] **CRUD de Consultorias (`src/pages/Consultorias.tsx`):**
  - Listar consultorias ativas e inativas em formato de tabela responsiva.
  - Criar formulário em modal para cadastrar/editar nome, contato e flag `ativa`.
- [ ] **CRUD de Áreas (`src/pages/Areas.tsx`):**
  - Criar listagem das áreas da Unimed.
  - Desenvolver formulário de cadastro/edição com campos nome do setor e gestor responsável.
- [ ] **CRUD de Feriados & Carga de Seed (`src/pages/Feriados.tsx`):**
  - Criar interface para inserção de feriados pontuais.
  - Desenvolver a funcionalidade de carga automática de dados (Seed) que insere na tabela `feriados` todos os feriados nacionais oficiais brasileiros para os anos de 2024, 2025 e 2026.

---

## 📊 Agente 3: Módulo de Vagas, Regras de SLA e Timeline
**Foco:** Cadastro de vagas, cálculo preciso de prazos úteis e interface da timeline visual do processo.

### Tasks
- [ ] **Algoritmo de Cálculo de SLA (Dias Úteis):**
  - Criar utilitário na pasta `src/lib/` que calcule a diferença em dias úteis entre duas datas, excluindo fins de semana (sábados e domingos) e os feriados nacionais cadastrados na tabela `feriados` do Supabase.
- [ ] **Formulário de Cadastro/Edição de Vagas (`src/pages/VagaDetalhe.tsx`):**
  - Criar formulário tipado com `react-hook-form` e `zod`.
  - Exibir selects dinâmicos populados pelas tabelas de `areas` e `consultorias` (esta última ativa apenas se o tipo de vaga for 'externa').
  - Validar cronologia lógica de datas (ex: data de entrevista não pode ser anterior ao envio de candidatos).
- [ ] **Monitoramento de SLAs e Status Derivado:**
  - Mapear o status de cada etapa em tempo de execução:
    1. *Aprovação* (SLA: 15 dias úteis)
    2. *Abertura consultoria* (SLA: 3 dias úteis)
    3. *Envio candidatos* (SLA por nível: Aux/Assistente = 10, Analista = 15, Gestão/Esp/Médico = 20 dias úteis)
    4. *Entrevista* (SLA: 15 dias úteis)
    5. *Fechamento* (SLA: 7 dias úteis)
- [ ] **Timeline Visual e Detalhamento da Vaga:**
  - Desenvolver uma timeline elegante para a página de detalhes, exibindo o status de cada etapa (concluída no prazo, concluída com atraso, ativa em andamento ou pendente), destacando visualmente os dias úteis remanescentes ou de atraso.
  - Mostrar a tabela de Audit Log ao final dos detalhes da vaga, exibindo quem alterou o quê e quando.

---

## 📈 Agente 4: Dashboard, Gráficos de Gargalos e Relatórios (Exportação)
**Foco:** Consolidação analítica dos tempos de processo, gráficos visuais de desempenho e exportação de planilhas.

### Tasks
- [ ] **Painel de Dashboard (`src/pages/Dashboard.tsx`):**
  - Criar filtros globais por período (data de solicitação) e área.
  - Implementar 4 cartões com métricas gerais:
    1. *Visão Geral:* Total de vagas em andamento, concluídas e taxa geral de cumprimento de SLAs.
    2. *Gargalos:* Identificar e ordenar quais etapas do funil têm a maior média de dias de atraso ou taxa de estouro de SLA.
    3. *Consultorias:* Comparação de tempo médio de entrega e taxa de SLA de candidatos por consultoria.
    4. *Comparativos:* Comparar tempos médios e conformidade de SLA entre vagas internas vs. externas, e entre níveis de vagas.
  - Desenvolver gráficos do `recharts` (linhas/barras/rosca) para ilustrar os tempos médios de processo e evolução de contratação.
- [ ] **Tabela de Relatórios e Exportação Excel (`src/pages/Relatorios.tsx`):**
  - Criar tabela unificada listando todas as vagas com filtros avançados.
  - Adicionar visualização detalhada de todas as datas de etapas e indicadores de SLA por linha.
  - Implementar a exportação dessa tabela para planilha Excel formatada utilizando `xlsx` (SheetJS), garantindo que os dias de SLA calculados e os dados das vagas sejam exportados com sucesso.
