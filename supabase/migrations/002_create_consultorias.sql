-- 002_create_consultorias.sql
-- Tabela para gerenciar as consultorias de RH parceiras

CREATE TABLE IF NOT EXISTS public.consultorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    nome TEXT NOT NULL,
    contato TEXT,
    ativa BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar a replicação em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultorias;
