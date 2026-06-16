import { supabase } from './supabase';
import { IConsultoria } from '@/types';

/**
 * Serviço para gerenciar as operações de persistência de Consultorias no Supabase.
 */
export const consultoriaService = {
  /**
   * Lista todas as consultorias cadastradas por um usuário específico.
   * 
   * @param userId ID do usuário proprietário
   * @returns Array de consultorias
   */
  async listar(userId: string): Promise<IConsultoria[]> {
    try {
      const { data, error } = await supabase
        .from('consultorias')
        .select('*')
        .eq('user_id', userId)
        .order('nome', { ascending: true });

      if (error) throw error;
      return (data as IConsultoria[]) || [];
    } catch (error) {
      console.error('Erro ao listar consultorias:', error);
      throw error;
    }
  },

  /**
   * Cria uma nova consultoria.
   * 
   * @param data Dados da consultoria (sem id e created_at)
   * @returns Consultoria cadastrada
   */
  async criar(data: Omit<IConsultoria, 'id' | 'created_at'>): Promise<IConsultoria> {
    try {
      const { data: created, error } = await supabase
        .from('consultorias')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return created as IConsultoria;
    } catch (error) {
      console.error('Erro ao criar consultoria:', error);
      throw error;
    }
  },

  /**
   * Atualiza dados de uma consultoria existente.
   * 
   * @param id ID da consultoria
   * @param data Dados para atualização
   * @returns Consultoria atualizada
   */
  async atualizar(id: string, data: Partial<Omit<IConsultoria, 'id' | 'created_at' | 'user_id'>>): Promise<IConsultoria> {
    try {
      const { data: updated, error } = await supabase
        .from('consultorias')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated as IConsultoria;
    } catch (error) {
      console.error('Erro ao atualizar consultoria:', error);
      throw error;
    }
  },

  /**
   * Habilita ou desabilita (toggle ativa/inativa) uma consultoria.
   * 
   * @param id ID da consultoria
   * @param ativa Novo estado de ativação
   * @returns Consultoria atualizada
   */
  async toggleAtiva(id: string, ativa: boolean): Promise<IConsultoria> {
    try {
      const { data: updated, error } = await supabase
        .from('consultorias')
        .update({ ativa })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated as IConsultoria;
    } catch (error) {
      console.error('Erro ao alternar status da consultoria:', error);
      throw error;
    }
  }
};

export default consultoriaService;
