-- 005_create_vagas.sql
-- Tabela para gerenciar os processos seletivos (vagas) e rastreamento de datas das etapas

CREATE TABLE IF NOT EXISTS public.vagas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    codigo_vaga TEXT NOT NULL UNIQUE,
    nome_vaga TEXT NOT NULL,
    tipo_vaga TEXT NOT NULL CONSTRAINT chk_vagas_tipo CHECK (tipo_vaga IN ('interna', 'externa')),
    nivel_vaga TEXT NOT NULL CONSTRAINT chk_vagas_nivel CHECK (nivel_vaga IN ('auxiliar', 'assistente', 'analista', 'especialista', 'gestao', 'medico')),
    area_id UUID NOT NULL REFERENCES public.areas(id) ON DELETE RESTRICT,
    gestor_solicitante TEXT NOT NULL,
    consultoria_id UUID REFERENCES public.consultorias(id) ON DELETE SET NULL,
    custo_processo NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    
    -- Datas que marcam o início e a conclusão das etapas do processo
    data_solicitacao DATE NOT NULL,
    data_aprovacao DATE,
    data_abertura_consultoria DATE,
    data_envio_candidatos DATE,
    data_entrevista DATE,
    data_fechamento DATE,
    data_inicio_colaborador DATE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar a replicação em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.vagas;

-- Função para atualizar automaticamente a data updated_at no UPDATE
CREATE OR REPLACE FUNCTION public.update_vagas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    new.updated_at = NOW();
    RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Trigger para invocar a função update_vagas_updated_at
CREATE OR REPLACE TRIGGER trigger_update_vagas_updated_at
    BEFORE UPDATE ON public.vagas
    FOR EACH ROW EXECUTE FUNCTION public.update_vagas_updated_at();
