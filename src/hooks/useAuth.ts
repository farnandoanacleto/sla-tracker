import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { IProfile } from '@/types';

export type TAuthUser = User & { profile?: IProfile | null };

/**
 * Hook customizado para gerenciar a autenticação e estado da sessão do usuário.
 */
export function useAuth() {
  const [user, setUser] = useState<TAuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Função interna para carregar os dados de perfil da tabela public.profiles
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

    // 1. Obter a sessão inicial síncrona/assíncrona do Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (session?.user) {
        const authUser = session.user;
        fetchProfile(authUser.id).then((profile) => {
          if (active) {
            setUser({ ...authUser, profile });
            setLoading(false);
          }
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // 2. Escutar mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;

      // TOKEN_REFRESHED é disparado ao renovar o JWT (ex: ao voltar de outra aba).
      // Não define loading=true para evitar desmontar toda a UI enquanto o usuário trabalha.
      if (event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          if (active) setUser({ ...session.user, profile });
        }
        return;
      }

      setLoading(true);
      if (session?.user) {
        const authUser = session.user;
        const profile = await fetchProfile(authUser.id);
        if (active) {
          setUser({ ...authUser, profile });
        }
      } else {
        if (active) {
          setUser(null);
        }
      }
      if (active) {
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Realiza login por email e senha.
   */
  const login = async (email: string, senha: string): Promise<void> => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Erro no login:', error);
      setLoading(false);
      throw error;
    }
  };

  /**
   * Realiza cadastro (sign up) criando o perfil associado.
   */
  const signup = async (email: string, senha: string, nome: string): Promise<void> => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: {
            nome,
            role: 'usuario', // role padrão
          },
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Erro no signup:', error);
      setLoading(false);
      throw error;
    }
  };

  /**
   * Realiza logout encerrando a sessão.
   */
  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    login,
    signup,
    logout,
  };
}

export default useAuth;
