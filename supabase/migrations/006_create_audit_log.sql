-- 006_create_audit_log.sql
-- Tabela para persistir o histórico de auditoria de alterações nos campos das vagas

CREATE TABLE IF NOT EXISTS public.vaga_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vaga_id UUID NOT NULL REFERENCES public.vagas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    campo TEXT NOT NULL,
    valor_antigo TEXT,
    valor_novo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar a replicação em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.vaga_audit_log;
