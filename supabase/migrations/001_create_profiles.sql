-- 001_create_profiles.sql
-- Tabela para guardar os perfis do sistema associados a usuários de autenticação do Supabase

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'usuario' CONSTRAINT chk_profiles_role CHECK (role IN ('admin', 'usuario')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar a replicação em tempo real se necessário
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Função que escuta novos inserts na tabela auth.users e cria o perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nome, email, role)
    VALUES (
        new.id,
        COALESCE(
            new.raw_user_meta_data->>'nome',
            new.raw_user_meta_data->>'name',
            new.raw_user_meta_data->>'full_name',
            SPLIT_PART(new.email, '@', 1) -- fallback se nome não for enviado
        ),
        new.email,
        COALESCE(new.raw_user_meta_data->>'role', 'usuario')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para executar a função handle_new_user ao criar um usuário
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
