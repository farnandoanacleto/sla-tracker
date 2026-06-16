-- 003_create_areas.sql
-- Tabela para gerenciar as áreas solicitantes internas e os gestores responsáveis

CREATE TABLE IF NOT EXISTS public.areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    nome TEXT NOT NULL,
    responsavel TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar a replicação em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.areas;
