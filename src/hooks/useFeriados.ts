import { useState, useEffect, useCallback } from 'react';
import { IFeriado } from '@/types';
import { feriadoService } from '@/services/feriadoService';

/**
 * Hook customizado para gerenciar o CRUD e estado de Feriados no Frontend.
 */
export function useFeriados() {
  const [feriados, setFeriados] = useState<IFeriado[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Recarrega todos os feriados cadastrados no sistema.
   */
  const carregarFeriados = useCallback(async () => {
    setLoading(true);
    try {
      const lista = await feriadoService.listar();
      setFeriados(lista);
    } catch (error) {
      console.error('Falha ao carregar feriados no hook:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar ao montar o componente
  useEffect(() => {
    carregarFeriados();
  }, [carregarFeriados]);

  /**
   * Cadastra um novo feriado.
   */
  const criar = async (data: string, descricao: string, ano: number): Promise<IFeriado> => {
    try {
      const novo = await feriadoService.criar({
        data,
        descricao,
        ano,
      });
      // Atualizar o estado local
      setFeriados(prev => [...prev, novo].sort((a, b) => a.data.localeCompare(b.data)));
      return novo;
    } catch (error) {
      console.error('Falha ao cadastrar feriado no hook:', error);
      throw error;
    }
  };

  /**
   * Atualiza um feriado existente.
   */
  const atualizar = async (id: string, data: string, descricao: string, ano: number): Promise<IFeriado> => {
    try {
      const atualizado = await feriadoService.atualizar(id, {
        data,
        descricao,
        ano,
      });
      // Atualizar o estado local
      setFeriados(prev => 
        prev.map(f => f.id === id ? atualizado : f).sort((a, b) => a.data.localeCompare(b.data))
      );
      return atualizado;
    } catch (error) {
      console.error('Falha ao atualizar feriado no hook:', error);
      throw error;
    }
  };

  /**
   * Exclui um feriado.
   */
  const excluir = async (id: string): Promise<void> => {
    try {
      await feriadoService.excluir(id);
      // Atualizar o estado local
      setFeriados(prev => prev.filter(f => f.id !== id));
    } catch (error) {
      console.error('Falha ao excluir feriado no hook:', error);
      throw error;
    }
  };

  return {
    feriados,
    loading,
    carregarFeriados,
    criar,
    atualizar,
    excluir,
  };
}

export default useFeriados;
