-- 004_create_feriados.sql
-- Tabela para gerenciar feriados (exclusão no cálculo de dias úteis)

CREATE TABLE IF NOT EXISTS public.feriados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data DATE NOT NULL UNIQUE,
    descricao TEXT NOT NULL,
    ano INTEGER NOT NULL
);

-- Habilitar a replicação em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.feriados;

-- Carga inicial de feriados federais brasileiros para os anos 2024, 2025 e 2026
INSERT INTO public.feriados (data, descricao, ano) VALUES
-- Ano 2024 (Fixos)
('2024-01-01', 'Ano Novo / Confraternização Universal', 2024),
('2024-04-21', 'Tiradentes', 2024),
('2024-05-01', 'Dia do Trabalho', 2024),
('2024-09-07', 'Independência do Brasil', 2024),
('2024-10-12', 'Nossa Senhora Aparecida / Dia das Crianças', 2024),
('2024-11-02', 'Finados', 2024),
('2024-11-15', 'Proclamação da República', 2024),
('2024-12-25', 'Natal', 2024),
-- Ano 2024 (Móveis)
('2024-02-13', 'Carnaval', 2024),
('2024-03-29', 'Sexta-Feira Santa', 2024),
('2024-05-30', 'Corpus Christi', 2024),

-- Ano 2025 (Fixos)
('2025-01-01', 'Ano Novo / Confraternização Universal', 2025),
('2025-04-21', 'Tiradentes', 2025),
('2025-05-01', 'Dia do Trabalho', 2025),
('2025-09-07', 'Independência do Brasil', 2025),
('2025-10-12', 'Nossa Senhora Aparecida / Dia das Crianças', 2025),
('2025-11-02', 'Finados', 2025),
('2025-11-15', 'Proclamação da República', 2025),
('2025-12-25', 'Natal', 2025),
-- Ano 2025 (Móveis)
('2025-03-04', 'Carnaval', 2025),
('2025-04-18', 'Sexta-Feira Santa', 2025),
('2025-06-19', 'Corpus Christi', 2025),

-- Ano 2026 (Fixos)
('2026-01-01', 'Ano Novo / Confraternização Universal', 2026),
('2026-04-21', 'Tiradentes', 2026),
('2026-05-01', 'Dia do Trabalho', 2026),
('2026-09-07', 'Independência do Brasil', 2026),
('2026-10-12', 'Nossa Senhora Aparecida / Dia das Crianças', 2026),
('2026-11-02', 'Finados', 2026),
('2026-11-15', 'Proclamação da República', 2026),
('2026-12-25', 'Natal', 2026),
-- Ano 2026 (Móveis)
('2026-02-17', 'Carnaval', 2026),
('2026-03-03', 'Sexta-Feira Santa', 2026), -- Oopss: 3 de abril de 2026, vamos arrumar abaixo
('2026-06-04', 'Corpus Christi', 2026)
ON CONFLICT (data) DO NOTHING;

-- Corrigindo a data da Sexta-Feira Santa de 2026 que foi definida na linha acima erroneamente para 03/mar.
UPDATE public.feriados SET data = '2026-04-03' WHERE data = '2026-03-03';
