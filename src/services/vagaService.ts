import { supabase } from './supabase';
import { IVaga, IVagaComSla, IFiltrosVagas, IVagaAuditLog } from '@/types';
import { feriadoService } from './feriadoService';
import { processarSlaVaga } from '@/utils/getSLAConfig';

// Tipo que representa a resposta do Supabase com os joins de areas e consultorias
interface IVagaSupabase extends IVaga {
  areas?: { nome: string; responsavel: string | null } | null;
  consultorias?: { nome: string } | null;
}

/**
 * Serviço para gerenciar operações de persistência e regras de negócio das Vagas no Supabase.
 */
export const vagaService = {
  /**
   * Lista todas as vagas de um usuário, enriquecidas com dados de relacionamento e SLAs,
   * aplicando filtros opcionais programaticamente.
   * 
   * @param userId ID do usuário proprietário das vagas
   * @param filtros Filtros aplicados na busca
   * @returns Array de vagas processadas com SLAs calculados
   */
  async listar(userId: string, filtros?: Partial<IFiltrosVagas>): Promise<IVagaComSla[]> {
    try {
      // 1. Obter a lista completa de feriados para o cálculo de SLA
      const feriadosObj = await feriadoService.listar();
      const feriados = feriadosObj.map(f => f.data);

      // 2. Buscar vagas do banco com joins das tabelas auxiliares
      const { data, error } = await supabase
        .from('vagas')
        .select(`
          id, user_id, codigo_vaga, nome_vaga, tipo_vaga, nivel_vaga,
          area_id, gestor_solicitante, consultoria_id, custo_processo,
          data_solicitacao, data_aprovacao, data_abertura_consultoria,
          data_envio_candidatos, data_entrevista, data_fechamento,
          data_inicio_colaborador, created_at, updated_at,
          areas (nome, responsavel),
          consultorias (nome)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 3. Processar SLAs e dados relacionais no javascript
      const vagasFormatadas: IVagaComSla[] = ((data as unknown as IVagaSupabase[]) || []).map((item) => {
        // Separar os objetos de join dos campos da vaga
        const { areas: areaData, consultorias: consultoriaData, ...vagaBase } = item;
        const vagaProcessada = processarSlaVaga(vagaBase, feriados);

        return {
          ...vagaProcessada,
          area_nome: areaData?.nome || 'Área não associada',
          area_responsavel: areaData?.responsavel || '',
          consultoria_nome: consultoriaData?.nome || null
        };
      });

      // 4. Aplicar filtros programaticamente se fornecidos
      if (!filtros) return vagasFormatadas;

      return vagasFormatadas.filter((vaga) => {
        // Filtro de Busca Textual (busca no código ou nome da vaga)
        if (filtros.busca) {
          const buscaLower = filtros.busca.toLowerCase();
          const matchesCodigo = vaga.codigo_vaga.toLowerCase().includes(buscaLower);
          const matchesNome = vaga.nome_vaga.toLowerCase().includes(buscaLower);
          const matchesGestor = vaga.gestor_solicitante.toLowerCase().includes(buscaLower);
          if (!matchesCodigo && !matchesNome && !matchesGestor) return false;
        }

        // Filtro de Tipo de Vaga
        if (filtros.tipo_vaga && filtros.tipo_vaga !== 'todas') {
          if (vaga.tipo_vaga !== filtros.tipo_vaga) return false;
        }

        // Filtro de Nível da Vaga
        if (filtros.nivel_vaga && filtros.nivel_vaga !== 'todos') {
          if (vaga.nivel_vaga !== filtros.nivel_vaga) return false;
        }

        // Filtro de Área
        if (filtros.area_id && filtros.area_id !== 'todas') {
          if (vaga.area_id !== filtros.area_id) return false;
        }

        // Filtro de Consultoria
        if (filtros.consultoria_id && filtros.consultoria_id !== 'todas') {
          if (vaga.consultoria_id !== filtros.consultoria_id) return false;
        }

        // Filtro de Status Geral do SLA (derivado)
        if (filtros.status_sla && filtros.status_sla !== 'todos') {
          if (vaga.status_geral_sla !== filtros.status_sla) return false;
        }

        // Filtro de Período (com base na data de solicitação da vaga)
        if (filtros.data_inicio) {
          if (vaga.data_solicitacao < filtros.data_inicio) return false;
        }
        if (filtros.data_fim) {
          if (vaga.data_solicitacao > filtros.data_fim) return false;
        }

        return true;
      });
    } catch (error) {
      console.error('Erro ao listar vagas:', error);
      throw error;
    }
  },

  /**
   * Busca os detalhes de uma vaga específica pelo ID.
   * 
   * @param id ID da vaga
   * @returns Vaga com SLAs processados ou null se não encontrada
   */
  async buscarPorId(id: string): Promise<IVagaComSla | null> {
    try {
      const feriadosObj = await feriadoService.listar();
      const feriados = feriadosObj.map(f => f.data);

      const { data, error } = await supabase
        .from('vagas')
        .select(`
          id, user_id, codigo_vaga, nome_vaga, tipo_vaga, nivel_vaga,
          area_id, gestor_solicitante, consultoria_id, custo_processo,
          data_solicitacao, data_aprovacao, data_abertura_consultoria,
          data_envio_candidatos, data_entrevista, data_fechamento,
          data_inicio_colaborador, created_at, updated_at,
          areas (nome, responsavel),
          consultorias (nome)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const { areas: areaData, consultorias: consultoriaData, ...vagaBase } = data as unknown as IVagaSupabase;
      const vagaProcessada = processarSlaVaga(vagaBase, feriados);

      return {
        ...vagaProcessada,
        area_nome: areaData?.nome || 'Área não associada',
        area_responsavel: areaData?.responsavel || '',
        consultoria_nome: consultoriaData?.nome || null
      };
    } catch (error) {
      console.error(`Erro ao buscar vaga por ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Cria uma nova vaga no banco de dados.
   * 
   * @param data Dados cadastrais da vaga
   * @returns Registro da vaga criada
   */
  async criar(data: Omit<IVaga, 'id' | 'created_at' | 'updated_at'>): Promise<IVaga> {
    try {
      const { data: created, error } = await supabase
        .from('vagas')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return created as IVaga;
    } catch (error) {
      console.error('Erro ao criar vaga:', error);
      throw error;
    }
  },

  /**
   * Atualiza uma vaga existente e registra as mudanças ocorridas campo a campo
   * no histórico de auditoria (vaga_audit_log).
   * 
   * @param id ID da vaga a ser atualizada
   * @param dadosAntigos Dados antes da modificação (para comparação)
   * @param dadosNovos Novos dados para gravação
   * @param userId ID do usuário operador da alteração (para auditoria)
   * @returns Registro atualizado da vaga
   */
  async atualizar(
    id: string,
    dadosAntigos: IVaga,
    dadosNovos: Partial<Omit<IVaga, 'id' | 'created_at' | 'updated_at' | 'user_id'>>,
    userId: string
  ): Promise<IVaga> {
    try {
      // 1. Atualizar a vaga no banco
      const { data: updated, error } = await supabase
        .from('vagas')
        .update(dadosNovos)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // 2. Mapeamento de campos relevantes para auditoria
      const camposAuditoria = [
        'codigo_vaga', 'nome_vaga', 'tipo_vaga', 'nivel_vaga', 'area_id', 'gestor_solicitante',
        'consultoria_id', 'custo_processo', 'data_solicitacao', 'data_aprovacao',
        'data_abertura_consultoria', 'data_envio_candidatos', 'data_entrevista',
        'data_fechamento', 'data_inicio_colaborador'
      ];

      const logsToInsert: Omit<IVagaAuditLog, 'id' | 'created_at'>[] = [];

      camposAuditoria.forEach((campo) => {
        // Só comparamos se o campo foi enviado no payload de atualização
        if (campo in dadosNovos) {
          const valAntigo = dadosAntigos[campo as keyof IVaga];
          const valNovo = dadosNovos[campo as keyof typeof dadosNovos];

          // Normalizar valores em strings para fins de comparação limpa no log
          const strAntigo = valAntigo !== null && valAntigo !== undefined ? String(valAntigo) : null;
          const strNovo = valNovo !== null && valNovo !== undefined ? String(valNovo) : null;

          if (strAntigo !== strNovo) {
            logsToInsert.push({
              vaga_id: id,
              user_id: userId,
              campo,
              valor_antigo: strAntigo,
              valor_novo: strNovo
            });
          }
        }
      });

      // 3. Inserir logs históricos se houverem divergências
      if (logsToInsert.length > 0) {
        const { error: logError } = await supabase
          .from('vaga_audit_log')
          .insert(logsToInsert);

        if (logError) {
          console.error('Falha ao registrar histórico de auditoria:', logError);
          // Não falhamos a transação de atualização da vaga devido ao log de auditoria
        }
      }

      return updated as IVaga;
    } catch (error) {
      console.error(`Erro ao atualizar vaga por ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Busca o histórico de alterações feitas em uma determinada vaga.
   * 
   * @param vagaId ID da vaga a ser auditada
   * @returns Lista de registros de auditoria ordenados cronologicamente
   */
  async buscarAuditLog(vagaId: string): Promise<IVagaAuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('vaga_audit_log')
        .select('*')
        .eq('vaga_id', vagaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as IVagaAuditLog[]) || [];
    } catch (error) {
      console.error(`Erro ao obter log de auditoria da vaga ${vagaId}:`, error);
      throw error;
    }
  }
};

export default vagaService;
