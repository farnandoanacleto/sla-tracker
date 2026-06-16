import { useState, useEffect, useCallback } from 'react';
import { IVaga, IVagaComSla, IFiltrosVagas, IVagaAuditLog } from '@/types';
import { vagaService } from '@/services/vagaService';
import { supabase } from '@/services/supabase';

const filtrosIniciais: IFiltrosVagas = {
  busca: '',
  tipo_vaga: 'todas',
  nivel_vaga: 'todos',
  area_id: 'todas',
  consultoria_id: 'todas',
  status_sla: 'todos',
  data_inicio: null,
  data_fim: null
};

/**
 * Hook customizado para gerenciar a lógica de controle, listagem, filtros e auditoria de Vagas.
 */
export function useVagas() {
  const [vagas, setVagas] = useState<IVagaComSla[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Filtros aplicados na listagem
  const [filtros, setFiltros] = useState<IFiltrosVagas>(filtrosIniciais);
  
  // Estado para visualização/edição individual
  const [vagaAtual, setVagaAtual] = useState<IVagaComSla | null>(null);
  const [auditLog, setAuditLog] = useState<IVagaAuditLog[]>([]);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);

  // Carregar o ID do usuário conectado
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
      }
    });
  }, []);

  /**
   * Carrega a lista de vagas aplicando os filtros atuais.
   */
  const carregarVagas = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const lista = await vagaService.listar(userId, filtros);
      setVagas(lista);
    } catch (error) {
      console.error('Falha ao obter vagas no hook:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, filtros]);

  // Recarregar as vagas sempre que o usuário ou os filtros mudarem
  useEffect(() => {
    if (userId) {
      carregarVagas();
    }
  }, [userId, carregarVagas]);

  /**
   * Carrega os detalhes de uma vaga e seu log de auditoria.
   * 
   * @param id ID da vaga a buscar
   */
  const buscarVaga = useCallback(async (id: string) => {
    setLoadingDetalhe(true);
    try {
      const [vaga, logs] = await Promise.all([
        vagaService.buscarPorId(id),
        vagaService.buscarAuditLog(id)
      ]);
      setVagaAtual(vaga);
      setAuditLog(logs);
    } catch (error) {
      console.error(`Falha ao obter vaga ${id} no hook:`, error);
      setVagaAtual(null);
      setAuditLog([]);
    } finally {
      setLoadingDetalhe(false);
    }
  }, []);

  /**
   * Cria uma nova vaga associada ao usuário conectado.
   */
  const criar = async (data: Omit<IVaga, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<IVaga> => {
    if (!userId) throw new Error('Usuário não autenticado');
    try {
      const novaVaga = await vagaService.criar({
        ...data,
        user_id: userId
      });
      await carregarVagas();
      return novaVaga;
    } catch (error) {
      console.error('Erro ao criar vaga no hook:', error);
      throw error;
    }
  };

  /**
   * Atualiza uma vaga existente, comparando com o estado carregado atual
   * para escrever no histórico de auditoria.
   */
  const atualizar = async (
    id: string,
    dadosNovos: Partial<Omit<IVaga, 'id' | 'created_at' | 'updated_at' | 'user_id'>>
  ): Promise<IVaga> => {
    if (!userId) throw new Error('Usuário não autenticado');
    
    // Obter dados antigos a partir do vagaAtual carregado, ou fazer busca se não disponível
    let dadosAntigos: IVaga | null = vagaAtual;
    if (!dadosAntigos || dadosAntigos.id !== id) {
      dadosAntigos = await vagaService.buscarPorId(id);
    }

    if (!dadosAntigos) {
      throw new Error('Vaga anterior não encontrada para auditoria.');
    }

    try {
      const vagaAtualizada = await vagaService.atualizar(id, dadosAntigos, dadosNovos, userId);
      // Recarregar os detalhes e a lista
      await Promise.all([
        buscarVaga(id),
        carregarVagas()
      ]);
      return vagaAtualizada;
    } catch (error) {
      console.error('Erro ao atualizar vaga no hook:', error);
      throw error;
    }
  };

  /**
   * Limpa os filtros definidos, retornando ao estado inicial.
   */
  const limparFiltros = () => {
    setFiltros(filtrosIniciais);
  };

  /**
   * Atualiza filtros específicos.
   */
  const atualizarFiltros = (novosFiltros: Partial<IFiltrosVagas>) => {
    setFiltros(prev => ({
      ...prev,
      ...novosFiltros
    }));
  };

  return {
    vagas,
    loading,
    vagaAtual,
    auditLog,
    loadingDetalhe,
    filtros,
    carregarVagas,
    buscarVaga,
    criar,
    atualizar,
    atualizarFiltros,
    limparFiltros,
  };
}

export default useVagas;
