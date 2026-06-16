import { useState, useEffect, useCallback } from 'react';
import { IConsultoria } from '@/types';
import { consultoriaService } from '@/services/consultoriaService';
import { supabase } from '@/services/supabase';

/**
 * Hook customizado para gerenciar o CRUD e estado de Consultorias no Frontend.
 */
export function useConsultorias() {
  const [consultorias, setConsultorias] = useState<IConsultoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Carregar o ID do usuário conectado
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
      }
    });
  }, []);

  /**
   * Recarrega a listagem de consultorias do banco de dados.
   */
  const carregarConsultorias = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const lista = await consultoriaService.listar(userId);
      setConsultorias(lista);
    } catch (error) {
      console.error('Falha ao carregar consultorias no hook:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Carregar automaticamente ao resolver o userId
  useEffect(() => {
    if (userId) {
      carregarConsultorias();
    }
  }, [userId, carregarConsultorias]);

  /**
   * Cria uma nova consultoria vinculada ao usuário atual.
   */
  const criar = async (nome: string, contato?: string): Promise<IConsultoria> => {
    if (!userId) throw new Error('Usuário não autenticado');
    try {
      const nova = await consultoriaService.criar({
        nome,
        contato: contato || null,
        ativa: true,
        user_id: userId,
      });
      // Atualizar o estado local de forma otimista
      setConsultorias(prev => [...prev, nova].sort((a, b) => a.nome.localeCompare(b.nome)));
      return nova;
    } catch (error) {
      console.error('Falha ao criar consultoria no hook:', error);
      throw error;
    }
  };

  /**
   * Atualiza uma consultoria existente.
   */
  const atualizar = async (id: string, nome: string, contato?: string): Promise<IConsultoria> => {
    try {
      const atualizada = await consultoriaService.atualizar(id, {
        nome,
        contato: contato || null,
      });
      // Atualizar o estado local
      setConsultorias(prev => 
        prev.map(c => c.id === id ? atualizada : c).sort((a, b) => a.nome.localeCompare(b.nome))
      );
      return atualizada;
    } catch (error) {
      console.error('Falha ao atualizar consultoria no hook:', error);
      throw error;
    }
  };

  /**
   * Alterna o estado ativa/inativa de uma consultoria.
   */
  const toggleAtiva = async (id: string, ativa: boolean): Promise<IConsultoria> => {
    try {
      const atualizada = await consultoriaService.toggleAtiva(id, ativa);
      // Atualizar o estado local
      setConsultorias(prev => prev.map(c => c.id === id ? atualizada : c));
      return atualizada;
    } catch (error) {
      console.error('Falha ao alternar status da consultoria no hook:', error);
      throw error;
    }
  };

  return {
    consultorias,
    loading,
    carregarConsultorias,
    criar,
    atualizar,
    toggleAtiva,
  };
}

export default useConsultorias;
