-- Tabela de consentimentos LGPD
CREATE TABLE IF NOT EXISTS public.user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type text NOT NULL CHECK (consent_type IN ('privacy_policy', 'terms_of_use')),
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  UNIQUE (user_id, consent_type)
);

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_read_own_consents" ON public.user_consents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_own_consents" ON public.user_consents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_consents" ON public.user_consents
  FOR UPDATE USING (auth.uid() = user_id);

-- Tabela de solicitações de exclusão (LGPD art. 18)
CREATE TABLE IF NOT EXISTS public.exclusion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'processada', 'cancelada')),
  processed_at timestamptz
);

ALTER TABLE public.exclusion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_read_own_exclusion_requests" ON public.exclusion_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_own_exclusion_requests" ON public.exclusion_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
