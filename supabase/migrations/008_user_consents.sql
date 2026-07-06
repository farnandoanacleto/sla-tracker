-- Tabela de registro de consentimentos LGPD
CREATE TABLE IF NOT EXISTS public.user_consents (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type text        NOT NULL CHECK (consent_type IN ('privacy_policy', 'terms_of_use')),
  accepted_at  timestamptz NOT NULL DEFAULT now(),
  ip_address   text,
  user_agent   text,
  UNIQUE (user_id, consent_type)
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user_id
  ON public.user_consents(user_id);

-- Row Level Security
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário visualiza seus próprios consentimentos"
  ON public.user_consents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário registra seus próprios consentimentos"
  ON public.user_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário atualiza seus próprios consentimentos"
  ON public.user_consents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admin visualiza todos os consentimentos"
  ON public.user_consents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
