import { supabase } from './supabase';
import { IArea } from '@/types';

/**
 * Serviço para gerenciar as operações de persistência de Áreas Solicitantes no Supabase.
 */
export const areaService = {
  /**
   * Lista todas as áreas solicitantes cadastradas por um usuário específico.
   * 
   * @param userId ID do usuário proprietário
   * @returns Array de áreas
   */
  async listar(userId: string): Promise<IArea[]> {
    try {
      const { data, error } = await supabase
        .from('areas')
        .select('*')
        .eq('user_id', userId)
        .order('nome', { ascending: true });

      if (error) throw error;
      return (data as IArea[]) || [];
    } catch (error) {
      console.error('Erro ao listar áreas:', error);
      throw error;
    }
  },

  /**
   * Cria uma nova área.
   * 
   * @param data Dados da área (sem id e created_at)
   * @returns Área cadastrada
   */
  async criar(data: Omit<IArea, 'id' | 'created_at'>): Promise<IArea> {
    try {
      const { data: created, error } = await supabase
        .from('areas')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return created as IArea;
    } catch (error) {
      console.error('Erro ao criar área:', error);
      throw error;
    }
  },

  /**
   * Atualiza dados de uma área existente.
   * 
   * @param id ID da área
   * @param data Dados para atualização
   * @returns Área atualizada
   */
  async atualizar(id: string, data: Partial<Omit<IArea, 'id' | 'created_at' | 'user_id'>>): Promise<IArea> {
    try {
      const { data: updated, error } = await supabase
        .from('areas')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated as IArea;
    } catch (error) {
      console.error('Erro ao atualizar área:', error);
      throw error;
    }
  }
};

export default areaService;
