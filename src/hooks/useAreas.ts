import { useState, useEffect, useCallback } from 'react';
import { IArea } from '@/types';
import { areaService } from '@/services/areaService';
import { supabase } from '@/services/supabase';

/**
 * Hook customizado para gerenciar o CRUD e estado de Áreas no Frontend.
 */
export function useAreas() {
  const [areas, setAreas] = useState<IArea[]>([]);
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
   * Recarrega a listagem de áreas do banco de dados.
   */
  const carregarAreas = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const lista = await areaService.listar(userId);
      setAreas(lista);
    } catch (error) {
      console.error('Falha ao carregar áreas no hook:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Carregar automaticamente ao resolver o userId
  useEffect(() => {
    if (userId) {
      carregarAreas();
    }
  }, [userId, carregarAreas]);

  /**
   * Cria uma nova área solicitante vinculada ao usuário atual.
   */
  const criar = async (nome: string, responsavel?: string): Promise<IArea> => {
    if (!userId) throw new Error('Usuário não autenticado');
    try {
      const nova = await areaService.criar({
        nome,
        responsavel: responsavel || null,
        user_id: userId,
      });
      // Atualizar o estado local de forma otimista
      setAreas(prev => [...prev, nova].sort((a, b) => a.nome.localeCompare(b.nome)));
      return nova;
    } catch (error) {
      console.error('Falha ao criar área no hook:', error);
      throw error;
    }
  };

  /**
   * Atualiza uma área existente.
   */
  const atualizar = async (id: string, nome: string, responsavel?: string): Promise<IArea> => {
    try {
      const atualizada = await areaService.atualizar(id, {
        nome,
        responsavel: responsavel || null,
      });
      // Atualizar o estado local
      setAreas(prev => 
        prev.map(a => a.id === id ? atualizada : a).sort((a, b) => a.nome.localeCompare(b.nome))
      );
      return atualizada;
    } catch (error) {
      console.error('Falha ao atualizar área no hook:', error);
      throw error;
    }
  };

  return {
    areas,
    loading,
    carregarAreas,
    criar,
    atualizar,
  };
}

export default useAreas;
