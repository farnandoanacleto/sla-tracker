-- supabase/seed.sql
-- Seed de dados iniciais para desenvolvimento e homologação local/staging

-- 1. Criação de usuários de teste na tabela de autenticação auth.users
-- Senha de teste gerada pelo Supabase padrão: 'senha123'
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'admin@unimed.coop.br', crypt('senha123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"nome":"Admin Unimed","role":"admin"}', false, 'authenticated', now(), now()),
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'consultor@unimed.coop.br', crypt('senha123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"nome":"Consultor Unimed","role":"usuario"}', false, 'authenticated', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Garantir que os perfis também sejam criados (caso o trigger não rode localmente de forma síncrona no seed)
INSERT INTO public.profiles (id, nome, email, role, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'Admin Unimed', 'admin@unimed.coop.br', 'admin', now()),
('22222222-2222-2222-2222-222222222222', 'Consultor Unimed', 'consultor@unimed.coop.br', 'usuario', now())
ON CONFLICT (id) DO NOTHING;

-- 2. Criação de 3 Consultorias
INSERT INTO public.consultorias (id, user_id, nome, contato, ativa, created_at) VALUES
('33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222222', 'RH Conecta', 'contato@rhconecta.com.br - (11) 98888-7777', true, now()),
('33333333-3333-3333-3333-333333333332', '22222222-2222-2222-2222-222222222222', 'Talentos Unimed', 'vagas@talentos.com.br - (11) 96666-5555', true, now()),
('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Recruta Já', 'suporte@recrutaja.com.br - (11) 94444-3333', false, now())
ON CONFLICT (id) DO NOTHING;

-- 3. Criação de 5 Áreas Solicitantes
INSERT INTO public.areas (id, user_id, nome, responsavel, created_at) VALUES
('44444444-4444-4444-4444-444444444441', '22222222-2222-2222-2222-222222222222', 'Tecnologia da Informação', 'Carlos Lima', now()),
('44444444-4444-4444-4444-444444444442', '22222222-2222-2222-2222-222222222222', 'Financeiro', 'Mariana Costa', now()),
('44444444-4444-4444-4444-444444444443', '22222222-2222-2222-2222-222222222222', 'Atendimento e Operações', 'Renato Silva', now()),
('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Medicina Preventiva', 'Dra. Sandra Ramos', now()),
('44444444-4444-4444-4444-444444444445', '22222222-2222-2222-2222-222222222222', 'Recursos Humanos', 'Juliana Rocha', now())
ON CONFLICT (id) DO NOTHING;

-- 4. Criação de 20 Vagas Fictícias
-- Misturando tipos, níveis, custos, datas e conformidade com SLA (Datas de Janeiro a Junho de 2025)
INSERT INTO public.vagas (id, user_id, codigo_vaga, nome_vaga, tipo_vaga, nivel_vaga, area_id, gestor_solicitante, consultoria_id, custo_processo, data_solicitacao, data_aprovacao, data_abertura_consultoria, data_envio_candidatos, data_entrevista, data_fechamento, data_inicio_colaborador) VALUES
-- Vaga 1: Interna, Auxiliar, Totalmente dentro do SLA e Concluída
('55555555-5555-5555-5555-555555555501', '22222222-2222-2222-2222-222222222222', 'VAG-2025-001', 'Auxiliar de Faturamento', 'interna', 'auxiliar', '44444444-4444-4444-4444-444444444442', 'Mariana Costa', NULL, 500.00, '2025-01-02', '2025-01-08', '2025-01-09', '2025-01-15', '2025-01-22', '2025-01-27', '2025-02-03'),

-- Vaga 2: Externa, Analista, Estourada em algumas etapas (Aprovação e Envio de Candidatos) e Concluída
('55555555-5555-5555-5555-555555555502', '22222222-2222-2222-2222-222222222222', 'VAG-2025-002', 'Analista de Infraestrutura Cloud', 'externa', 'analista', '44444444-4444-4444-4444-444444444441', 'Carlos Lima', '33333333-3333-3333-3333-333333333331', 4500.00, '2025-01-02', '2025-01-28', '2025-01-29', '2025-02-21', '2025-03-07', '2025-03-12', '2025-03-25'),

-- Vaga 3: Externa, Gestão, Em andamento (aguardando envio de candidatos - dentro do SLA)
('55555555-5555-5555-5555-555555555503', '22222222-2222-2222-2222-222222222222', 'VAG-2025-003', 'Coordenador Médico', 'externa', 'gestao', '44444444-4444-4444-4444-444444444444', 'Dra. Sandra Ramos', '33333333-3333-3333-3333-333333333332', 12000.00, '2025-06-02', '2025-06-05', '2025-06-06', NULL, NULL, NULL, NULL),

-- Vaga 4: Interna, Analista, Em andamento (aguardando aprovação - dentro do SLA)
('55555555-5555-5555-5555-555555555504', '22222222-2222-2222-2222-222222222222', 'VAG-2025-004', 'Analista Financeiro Pleno', 'interna', 'analista', '44444444-4444-4444-4444-444444444442', 'Mariana Costa', NULL, 800.00, '2025-06-10', NULL, NULL, NULL, NULL, NULL, NULL),

-- Vaga 5: Externa, Assistente, Atrasada em andamento (aguardando entrevista - estourou o SLA de entrevista)
('55555555-5555-5555-5555-555555555505', '22222222-2222-2222-2222-222222222222', 'VAG-2025-005', 'Assistente de Atendimento', 'externa', 'assistente', '44444444-4444-4444-4444-444444444443', 'Renato Silva', '33333333-3333-3333-3333-333333333331', 1200.00, '2025-05-02', '2025-05-05', '2025-05-06', '2025-05-15', NULL, NULL, NULL),

-- Vaga 6: Interna, Especialista, Dentro do SLA e Concluída
('55555555-5555-5555-5555-555555555506', '22222222-2222-2222-2222-222222222222', 'VAG-2025-006', 'Arquiteto de Software', 'interna', 'especialista', '44444444-4444-4444-4444-444444444441', 'Carlos Lima', NULL, 3000.00, '2025-02-10', '2025-02-14', '2025-02-15', '2025-03-05', '2025-03-12', '2025-03-18', '2025-04-01'),

-- Vaga 7: Externa, Médico, Dentro do SLA e Concluída
('55555555-5555-5555-5555-555555555507', '22222222-2222-2222-2222-222222222222', 'VAG-2025-007', 'Médico Pediatra Plantonista', 'externa', 'medico', '44444444-4444-4444-4444-444444444444', 'Dra. Sandra Ramos', '33333333-3333-3333-3333-333333333332', 15000.00, '2025-02-03', '2025-02-07', '2025-02-10', '2025-02-28', '2025-03-14', '2025-03-21', '2025-04-05'),

-- Vaga 8: Externa, Analista, Em andamento (aguardando abertura da consultoria - estourou os 3 dias de SLA)
('55555555-5555-5555-5555-555555555508', '22222222-2222-2222-2222-222222222222', 'VAG-2025-008', 'Analista de Departamento Pessoal', 'externa', 'analista', '44444444-4444-4444-4444-444444444445', 'Juliana Rocha', '33333333-3333-3333-3333-333333333331', 2500.00, '2025-06-01', '2025-06-02', NULL, NULL, NULL, NULL, NULL),

-- Vaga 9: Interna, Auxiliar, Em andamento (candidatos recebidos - dentro do SLA)
('55555555-5555-5555-5555-555555555509', '22222222-2222-2222-2222-222222222222', 'VAG-2025-009', 'Auxiliar Administrativo', 'interna', 'auxiliar', '44444444-4444-4444-4444-444444444445', 'Juliana Rocha', NULL, 500.00, '2025-06-08', '2025-06-09', '2025-06-10', '2025-06-13', NULL, NULL, NULL),

-- Vaga 10: Externa, Especialista, Fora do SLA (Estourou Envio de Candidatos) e Fechada
('55555555-5555-5555-5555-555555555510', '22222222-2222-2222-2222-222222222222', 'VAG-2025-010', 'Médico Cardiologista', 'externa', 'especialista', '44444444-4444-4444-4444-444444444444', 'Dra. Sandra Ramos', '33333333-3333-3333-3333-333333333332', 15000.00, '2025-01-10', '2025-01-15', '2025-01-16', '2025-02-20', '2025-03-04', '2025-03-10', '2025-03-24'),

-- Vaga 11: Interna, Analista, Totalmente dentro do SLA e Fechada
('55555555-5555-5555-5555-555555555511', '22222222-2222-2222-2222-222222222222', 'VAG-2025-011', 'Analista de Controladoria', 'interna', 'analista', '44444444-4444-4444-4444-444444444442', 'Mariana Costa', NULL, 1500.00, '2025-03-03', '2025-03-07', '2025-03-10', '2025-03-24', '2025-04-03', '2025-04-09', '2025-04-20'),

-- Vaga 12: Externa, Assistente, Dentro do SLA e Fechada
('55555555-5555-5555-5555-555555555512', '22222222-2222-2222-2222-222222222222', 'VAG-2025-012', 'Assistente de TI', 'externa', 'assistente', '44444444-4444-4444-4444-444444444441', 'Carlos Lima', '33333333-3333-3333-3333-333333333331', 1800.00, '2025-03-10', '2025-03-12', '2025-03-13', '2025-03-24', '2025-04-04', '2025-04-10', '2025-04-20'),

-- Vaga 13: Interna, Gestão, Em andamento (aprovada - dentro do SLA)
('55555555-5555-5555-5555-555555555513', '22222222-2222-2222-2222-222222222222', 'VAG-2025-013', 'Gerente Financeiro', 'interna', 'gestao', '44444444-4444-4444-4444-444444444442', 'Mariana Costa', NULL, 5000.00, '2025-06-12', '2025-06-15', NULL, NULL, NULL, NULL, NULL),

-- Vaga 14: Externa, Analista, Dentro do SLA e Fechada
('55555555-5555-5555-5555-555555555514', '22222222-2222-2222-2222-222222222222', 'VAG-2025-014', 'Analista de Sistemas Senior', 'externa', 'analista', '44444444-4444-4444-4444-444444444441', 'Carlos Lima', '33333333-3333-3333-3333-333333333331', 4500.00, '2025-04-01', '2025-04-04', '2025-04-07', '2025-04-23', '2025-05-08', '2025-05-14', '2025-05-28'),

-- Vaga 15: Externa, Assistente, Estourada na Entrevista e Fechada
('55555555-5555-5555-5555-555555555515', '22222222-2222-2222-2222-222222222222', 'VAG-2025-015', 'Assistente Financeiro', 'externa', 'assistente', '44444444-4444-4444-4444-444444444442', 'Mariana Costa', '33333333-3333-3333-3333-333333333332', 1200.00, '2025-03-05', '2025-03-10', '2025-03-11', '2025-03-21', '2025-04-22', '2025-04-29', '2025-05-12'),

-- Vaga 16: Interna, Analista, Estourada no Fechamento e Fechada
('55555555-5555-5555-5555-555555555516', '22222222-2222-2222-2222-222222222222', 'VAG-2025-016', 'Analista de Marketing', 'interna', 'analista', '44444444-4444-4444-4444-444444444445', 'Juliana Rocha', NULL, 1500.00, '2025-04-02', '2025-04-08', '2025-04-09', '2025-04-24', '2025-05-09', '2025-05-28', '2025-06-10'),

-- Vaga 17: Externa, Médico, Em andamento (aguardando fechamento - estourou SLA de fechamento de 7 dias úteis)
('55555555-5555-5555-5555-555555555517', '22222222-2222-2222-2222-222222222222', 'VAG-2025-017', 'Médico Oncologista', 'externa', 'medico', '44444444-4444-4444-4444-444444444444', 'Dra. Sandra Ramos', '33333333-3333-3333-3333-333333333332', 15000.00, '2025-05-02', '2025-05-06', '2025-05-07', '2025-05-28', '2025-06-04', NULL, NULL),

-- Vaga 18: Interna, Assistente, Em andamento (aguardando entrevista - dentro do SLA)
('55555555-5555-5555-5555-555555555518', '22222222-2222-2222-2222-222222222222', 'VAG-2025-018', 'Assistente Administrativo de TI', 'interna', 'assistente', '44444444-4444-4444-4444-444444444441', 'Carlos Lima', NULL, 1000.00, '2025-06-05', '2025-06-06', '2025-06-09', '2025-06-13', NULL, NULL, NULL),

-- Vaga 19: Externa, Analista, Dentro do SLA e Fechada
('55555555-5555-5555-5555-555555555519', '22222222-2222-2222-2222-222222222222', 'VAG-2025-019', 'Analista de Suporte Técnico', 'externa', 'analista', '44444444-4444-4444-4444-444444444441', 'Carlos Lima', '33333333-3333-3333-3333-333333333331', 2200.00, '2025-04-10', '2025-04-15', '2025-04-16', '2025-04-30', '2025-05-12', '2025-05-19', '2025-06-01'),

-- Vaga 20: Externa, Auxiliar, Em andamento (apenas solicitada - estourou o SLA de 15 dias de aprovação)
('55555555-5555-5555-5555-555555555520', '22222222-2222-2222-2222-222222222222', 'VAG-2025-020', 'Auxiliar de Almoxarifado', 'externa', 'auxiliar', '44444444-4444-4444-4444-444444444443', 'Renato Silva', '33333333-3333-3333-3333-333333333331', 500.00, '2025-05-10', NULL, NULL, NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
