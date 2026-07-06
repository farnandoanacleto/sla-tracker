-- Fix: RLS auto-referencial em organization_members causava HTTP 500 em todas as tabelas.
-- A policy "members_can_read_org_members" consultava a própria tabela organization_members
-- para verificar membros, causando recursão infinita quando qualquer outra tabela
-- (areas, vagas, feriados, consultorias) tentava verificar o mesmo.
--
-- Solução: funções SECURITY DEFINER que consultam organization_members bypassando RLS,
-- eliminando a recursão.

CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM organization_members WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_admin_org_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM organization_members
  WHERE user_id = auth.uid() AND role IN ('owner', 'admin');
$$;

-- organization_members: corrigir a policy auto-referencial
DROP POLICY IF EXISTS "members_can_read_org_members" ON organization_members;
CREATE POLICY "members_can_read_org_members" ON organization_members
  FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));

-- organizations
DROP POLICY IF EXISTS "members_can_read_own_org" ON organizations;
CREATE POLICY "members_can_read_own_org" ON organizations
  FOR SELECT USING (id IN (SELECT get_user_org_ids()));

-- areas
DROP POLICY IF EXISTS "org_members_can_manage_areas" ON areas;
CREATE POLICY "org_members_can_manage_areas" ON areas
  FOR ALL USING (organization_id IN (SELECT get_user_org_ids()));

-- feriados
DROP POLICY IF EXISTS "org_members_can_read_feriados" ON feriados;
DROP POLICY IF EXISTS "org_admins_can_manage_feriados" ON feriados;
CREATE POLICY "org_members_can_read_feriados" ON feriados
  FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_admins_can_manage_feriados" ON feriados
  FOR ALL USING (organization_id IN (SELECT get_user_admin_org_ids()));

-- consultorias
DROP POLICY IF EXISTS "org_members_can_manage_consultorias" ON consultorias;
CREATE POLICY "org_members_can_manage_consultorias" ON consultorias
  FOR ALL USING (organization_id IN (SELECT get_user_org_ids()));

-- vagas
DROP POLICY IF EXISTS "org_members_can_manage_vagas" ON vagas;
CREATE POLICY "org_members_can_manage_vagas" ON vagas
  FOR ALL USING (organization_id IN (SELECT get_user_org_ids()));

-- vaga_audit_log
DROP POLICY IF EXISTS "org_members_can_read_audit_log" ON vaga_audit_log;
CREATE POLICY "org_members_can_read_audit_log" ON vaga_audit_log
  FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
