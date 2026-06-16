-- 007_enable_rls.sql
-- Habilitação de RLS (Row Level Security) e criação de políticas de segurança para controle de acessos

-- 1. Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feriados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vagas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaga_audit_log ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para 'profiles'
CREATE POLICY "Permitir leitura de perfis por usuários autenticados" 
    ON public.profiles FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Permitir atualização do próprio perfil" 
    ON public.profiles FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = id) 
    WITH CHECK (auth.uid() = id);

-- 3. Políticas para 'consultorias' (SELECT e escrita onde user_id = auth.uid())
CREATE POLICY "Permitir operações em consultorias para o criador" 
    ON public.consultorias FOR ALL 
    TO authenticated 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- 4. Políticas para 'areas' (SELECT e escrita onde user_id = auth.uid())
CREATE POLICY "Permitir operações em áreas para o criador" 
    ON public.areas FOR ALL 
    TO authenticated 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- 5. Políticas para 'vagas' (SELECT e escrita onde user_id = auth.uid())
CREATE POLICY "Permitir operações em vagas para o criador" 
    ON public.vagas FOR ALL 
    TO authenticated 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- 6. Políticas para 'feriados' (SELECT para todos autenticados, escrita apenas para role='admin')
CREATE POLICY "Permitir leitura de feriados para usuários autenticados" 
    ON public.feriados FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Permitir modificação de feriados apenas para administradores" 
    ON public.feriados FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 7. Políticas para 'vaga_audit_log' 
-- SELECT para o dono da vaga (join com vagas.user_id = auth.uid())
-- INSERT liberado para o usuário autenticado que seja o dono da vaga para suportar inserts via vagaService.ts
CREATE POLICY "Permitir leitura do audit log para o dono da vaga" 
    ON public.vaga_audit_log FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.vagas 
            WHERE vagas.id = vaga_audit_log.vaga_id AND vagas.user_id = auth.uid()
        )
    );

CREATE POLICY "Permitir inserção de audit log para o dono da vaga" 
    ON public.vaga_audit_log FOR INSERT 
    TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.vagas 
            WHERE vagas.id = vaga_id AND vagas.user_id = auth.uid()
        )
    );
