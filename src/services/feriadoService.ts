import { supabase } from './supabase';
import { IFeriado } from '@/types';

/**
 * Serviço para gerenciar as operações de persistência de Feriados no Supabase.
 */
export const feriadoService = {
  /**
   * Lista todos os feriados cadastrados no sistema.
   * 
   * @returns Array de feriados ordenados por data
   */
  async listar(): Promise<IFeriado[]> {
    try {
      const { data, error } = await supabase
        .from('feriados')
        .select('*')
        .order('data', { ascending: true });

      if (error) throw error;
      return (data as IFeriado[]) || [];
    } catch (error) {
      console.error('Erro ao listar feriados:', error);
      throw error;
    }
  },

  /**
   * Lista os feriados de um ano específico.
   * 
   * @param ano Ano para filtrar
   * @returns Array de feriados filtrados
   */
  async listarPorAno(ano: number): Promise<IFeriado[]> {
    try {
      const { data, error } = await supabase
        .from('feriados')
        .select('*')
        .eq('ano', ano)
        .order('data', { ascending: true });

      if (error) throw error;
      return (data as IFeriado[]) || [];
    } catch (error) {
      console.error(`Erro ao listar feriados do ano ${ano}:`, error);
      throw error;
    }
  },

  /**
   * Cadastra um novo feriado.
   * 
   * @param data Dados do feriado (sem id)
   * @returns Feriado cadastrado
   */
  async criar(data: Omit<IFeriado, 'id'>): Promise<IFeriado> {
    try {
      const { data: created, error } = await supabase
        .from('feriados')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return created as IFeriado;
    } catch (error) {
      console.error('Erro ao cadastrar feriado:', error);
      throw error;
    }
  },

  /**
   * Atualiza dados de um feriado.
   * 
   * @param id ID do feriado
   * @param data Novos dados
   * @returns Feriado atualizado
   */
  async atualizar(id: string, data: Partial<Omit<IFeriado, 'id'>>): Promise<IFeriado> {
    try {
      const { data: updated, error } = await supabase
        .from('feriados')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated as IFeriado;
    } catch (error) {
      console.error('Erro ao atualizar feriado:', error);
      throw error;
    }
  },

  /**
   * Exclui um feriado do banco de dados.
   * 
   * @param id ID do feriado
   */
  async excluir(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('feriados')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao excluir feriado:', error);
      throw error;
    }
  }
};

export default feriadoService;
