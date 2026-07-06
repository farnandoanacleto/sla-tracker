import { supabase } from './supabase';
import { IUserConsent, IExclusionRequest } from '@/types';

export const meusDadosService = {
  async exportarDados(userId: string): Promise<void> {
    const [profileRes, vagasRes, auditRes, consentRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('vagas').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('vaga_audit_log').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('user_consents').select('*').eq('user_id', userId),
    ]);

    const payload = {
      exportadoEm: new Date().toISOString(),
      usuario: profileRes.data ?? null,
      vagas: vagasRes.data ?? [],
      auditoria: auditRes.data ?? [],
      consentimentos: consentRes.data ?? [],
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `meus-dados-sla-tracker-${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  async solicitarExclusao(userId: string): Promise<void> {
    const { error } = await supabase
      .from('exclusion_requests')
      .insert({ user_id: userId, status: 'pendente' });
    if (error) throw error;
  },

  async listarSolicitacoesExclusao(userId: string): Promise<IExclusionRequest[]> {
    const { data, error } = await supabase
      .from('exclusion_requests')
      .select('*')
      .eq('user_id', userId)
      .order('requested_at', { ascending: false });
    if (error) throw error;
    return (data as IExclusionRequest[]) ?? [];
  },

  async listarConsentimentos(userId: string): Promise<IUserConsent[]> {
    const { data, error } = await supabase
      .from('user_consents')
      .select('*')
      .eq('user_id', userId)
      .order('accepted_at', { ascending: false });
    if (error) throw error;
    return (data as IUserConsent[]) ?? [];
  },
};

export default meusDadosService;
