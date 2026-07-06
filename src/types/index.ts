/**
 * Tipos e Interfaces Globais do Projeto SLA Tracker - Recrutamento & Seleção
 * @author Fernando Anacleto Fernandes
 * @since Junho 2026
 */

/**
 * Papel (Role) do Usuário no sistema.
 */
export type TUserRole = 'admin' | 'usuario';

/**
 * Perfil do usuário (profiles).
 */
export interface IProfile {
  id: string; // uuid PK, referencia auth.users
  nome: string;
  email: string;
  role: TUserRole;
  created_at: string; // ISO timestamp
}

/**
 * Consultorias externas envolvidas no processo (consultorias).
 */
export interface IConsultoria {
  id: string; // uuid PK
  user_id: string; // FK profiles (criador do registro)
  nome: string;
  contato: string | null;
  ativa: boolean;
  created_at: string; // ISO timestamp
}

/**
 * Áreas ou departamentos solicitantes (areas).
 */
export interface IArea {
  id: string; // uuid PK
  user_id: string; // FK profiles (criador do registro)
  nome: string;
  responsavel: string | null;
  created_at: string; // ISO timestamp
}

/**
 * Cadastro de Feriados Nacionais e Regionais para exclusão em cálculos de dias úteis (feriados).
 */
export interface IFeriado {
  id: string; // uuid PK
  data: string; // date 'YYYY-MM-DD' unique
  descricao: string;
  ano: number;
}

/**
 * Tipo da Vaga (interna ou externa).
 */
export type TTipoVaga = 'interna' | 'externa';

/**
 * Nível hierárquico da Vaga.
 * Define a variação de SLA para a etapa de envio de candidatos.
 */
export type TNivelVaga = 'auxiliar' | 'assistente' | 'analista' | 'especialista' | 'gestao' | 'medico';

/**
 * Cadastro de Vagas (vagas).
 * As datas marcam o início e fim de cada etapa para fins de rastreabilidade e cálculo de SLA.
 */
export interface IVaga {
  id: string; // uuid PK
  user_id: string; // FK profiles (criador/responsável)
  codigo_vaga: string; // unique
  nome_vaga: string;
  tipo_vaga: TTipoVaga;
  nivel_vaga: TNivelVaga;
  area_id: string; // FK areas
  gestor_solicitante: string;
  consultoria_id: string | null; // FK consultorias (opcional, aplicável a vagas externas)
  custo_processo: number; // numeric (ex: 1500.00)
  
  // Datas cruciais para o monitoramento de SLAs (todas em formato 'YYYY-MM-DD')
  data_solicitacao: string;
  data_aprovacao: string | null;
  data_abertura_consultoria: string | null;
  data_envio_candidatos: string | null;
  data_entrevista: string | null;
  data_fechamento: string | null;
  data_inicio_colaborador: string | null;
  
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Log de auditoria para alteração de campos da vaga (vaga_audit_log).
 */
export interface IVagaAuditLog {
  id: string; // uuid PK
  vaga_id: string; // FK vagas
  user_id: string; // FK profiles (quem alterou)
  campo: string; // nome do campo alterado
  valor_antigo: string | null;
  valor_novo: string | null;
  created_at: string; // ISO timestamp
}

/**
 * Identificação das etapas individuais do fluxo de recrutamento.
 */
export type TEtapaVaga = 
  | 'aprovacao' 
  | 'abertura_consultoria' 
  | 'envio_candidatos' 
  | 'entrevista' 
  | 'fechamento';

/**
 * Status de SLA para uma determinada etapa do processo.
 */
export type TSlaStatus = 
  | 'pendente'      // A etapa anterior ainda não foi finalizada (não iniciada)
  | 'em_andamento'  // Etapa ativa, dentro do prazo
  | 'no_prazo'      // Concluída dentro do prazo estipulado pelo SLA
  | 'atrasada'      // Concluída fora do prazo estipulado pelo SLA
  | 'estourada';    // Em andamento, porém já ultrapassou o limite do SLA

/**
 * Estrutura calculada de SLA para cada etapa do processo seletivo (calculado em tempo de execução).
 */
export interface ISlaEtapaStatus {
  etapa: TEtapaVaga;
  nomeEtapa: string;
  slaPrevisto: number; // SLA limite em dias úteis
  diasUteisRealizados: number | null; // dias úteis decorridos até a conclusão (ou até hoje, se em andamento)
  dataInicio: string | null;
  dataFim: string | null;
  status: TSlaStatus;
  limiteData: string | null; // Data máxima esperada para conclusão ('YYYY-MM-DD')
}

/**
 * Vaga enriquecida com os dados dinâmicos de cálculo de SLA e relacionamentos para o Frontend.
 */
export interface IVagaComSla extends IVaga {
  area_nome?: string;
  area_responsavel?: string;
  consultoria_nome?: string | null;
  status_geral_sla: TSlaStatus;
  etapas_sla: Record<TEtapaVaga, ISlaEtapaStatus>;
  dias_uteis_totais: number; // soma dos dias úteis de todas as etapas ativas/concluídas
}

/**
 * Consentimento LGPD registrado pelo usuário (user_consents).
 */
export interface IUserConsent {
  id: string;
  user_id: string;
  consent_type: 'privacy_policy' | 'terms_of_use';
  accepted_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

/**
 * Solicitação de exclusão de conta (LGPD art. 18) (exclusion_requests).
 */
export interface IExclusionRequest {
  id: string;
  user_id: string;
  requested_at: string;
  status: 'pendente' | 'processada' | 'cancelada';
  processed_at: string | null;
}

/**
 * Filtros globais aplicados na listagem de vagas e painéis de dashboard.
 */
export interface IFiltrosVagas {
  busca: string;
  tipo_vaga: TTipoVaga | 'todas';
  nivel_vaga: TNivelVaga | 'todos';
  area_id: string | 'todas';
  consultoria_id: string | 'todas';
  status_sla: TSlaStatus | 'todos';
  data_inicio: string | null; // data_solicitacao inicial
  data_fim: string | null; // data_solicitacao final
}

/**
 * Estrutura de dados para o painel de "Visão Geral" do Dashboard.
 */
export interface IDashboardOverview {
  vagas_ativas: number;
  vagas_concluidas: number;
  vagas_no_prazo: number;
  vagas_atrasadas: number;
  taxa_adesao_sla: number; // percentual de etapas concluídas no prazo
}

/**
 * Estrutura de dados para identificar gargalos (etapas com maior índice de atraso).
 */
export interface IDashboardGargalo {
  etapa: TEtapaVaga;
  nomeEtapa: string;
  media_dias_uteis: number;
  sla_previsto: number;
  total_vagas_analisadas: number;
  percentual_atraso: number;
}
