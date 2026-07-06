import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { IProfile } from '@/types';

export type TAuthUser = User & { profile?: IProfile | null };

const SESSION_EXPIRED_KEY = 'sla_session_expired';
const MANUAL_LOGOUT_KEY = 'sla_manual_logout';

export function useAuth() {
  const [user, setUser] = useState<TAuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (authUserId: string): Promise<IProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUserId)
        .maybeSingle();
      if (error) throw error;
      return data as IProfile | null;
    } catch (error) {
      console.error('Erro ao obter perfil do usuário:', error);
      return null;
    }
  };

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (session?.user) {
        fetchProfile(session.user.id).then((profile) => {
          if (active) {
            setUser({ ...session.user, profile });
            setLoading(false);
          }
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;

      if (event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          if (active) setUser({ ...session.user, profile });
        }
        return;
      }

      if (event === 'SIGNED_OUT') {
        const isManual = sessionStorage.getItem(MANUAL_LOGOUT_KEY) === 'true';
        sessionStorage.removeItem(MANUAL_LOGOUT_KEY);
        if (!isManual) {
          sessionStorage.setItem(SESSION_EXPIRED_KEY, 'true');
        }
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (active) setUser({ ...session.user, profile });
      } else {
        if (active) setUser(null);
      }
      if (active) setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, senha: string): Promise<void> => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) throw error;
    } catch (error) {
      console.error('Erro no login:', error);
      setLoading(false);
      throw error;
    }
  };

  const signup = async (email: string, senha: string, nome: string): Promise<string | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { data: { nome, role: 'usuario' } },
      });
      if (error) throw error;
      return data.user?.id ?? null;
    } catch (error) {
      console.error('Erro no signup:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    sessionStorage.setItem(MANUAL_LOGOUT_KEY, 'true');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Erro no logout:', error);
      sessionStorage.removeItem(MANUAL_LOGOUT_KEY);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const checkMfaRequired = async (): Promise<{ required: boolean; factorId: string | null }> => {
    try {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error) throw error;
      if (data.nextLevel === 'aal2' && data.currentLevel !== 'aal2') {
        const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError) throw factorsError;
        const totpFactor = factorsData?.totp?.find((f) => f.status === 'verified');
        return { required: true, factorId: totpFactor?.id ?? null };
      }
      return { required: false, factorId: null };
    } catch (error) {
      console.error('Erro ao verificar MFA:', error);
      return { required: false, factorId: null };
    }
  };

  const challengeAndVerifyMfa = async (factorId: string, code: string): Promise<void> => {
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) throw challengeError;
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });
    if (verifyError) throw verifyError;
  };

  const enrollMfa = async (): Promise<{ qrCode: string; secret: string; factorId: string }> => {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'SLA Tracker' });
    if (error) throw error;
    return { qrCode: data.totp.qr_code, secret: data.totp.secret, factorId: data.id };
  };

  const verifyAndActivateMfa = async (factorId: string, code: string): Promise<void> => {
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) throw challengeError;
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });
    if (verifyError) throw verifyError;
  };

  const unenrollMfa = async (factorId: string): Promise<void> => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) throw error;
  };

  const listMfaFactors = async (): Promise<Array<{ id: string; status: string; factorType: string; friendlyName?: string }>> => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) throw error;
    return (data?.totp ?? []).map((f) => ({
      id: f.id,
      status: f.status,
      factorType: 'totp',
      friendlyName: f.friendly_name,
    }));
  };

  return {
    user,
    loading,
    login,
    signup,
    logout,
    checkMfaRequired,
    challengeAndVerifyMfa,
    enrollMfa,
    verifyAndActivateMfa,
    unenrollMfa,
    listMfaFactors,
  };
}

export default useAuth;
