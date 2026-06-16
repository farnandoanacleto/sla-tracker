import { addDays, isWeekend, isSameDay, format, parseISO, startOfDay } from 'date-fns';
import { IVaga, IVagaComSla, ISlaEtapaStatus, TEtapaVaga, TSlaStatus } from '@/types';
import { calcularDiasUteis } from './calcularDiasUteis';

/**
 * Adiciona uma quantidade de dias úteis a uma determinada data de início,
 * pulando finais de semana e feriados cadastrados.
 * 
 * @param dataInicio Data de início (Date ou string YYYY-MM-DD)
 * @param diasParaAdicionar Quantidade de dias úteis a somar
 * @param feriados Lista de feriados cadastrados
 * @returns String formatada 'yyyy-MM-dd'
 */
export function adicionarDiasUteis(
  dataInicio: Date | string,
  diasParaAdicionar: number,
  feriados: (Date | string)[]
): string {
  let dataAtual = startOfDay(typeof dataInicio === 'string' ? parseISO(dataInicio) : dataInicio);
  const feriadosDates = feriados.map(f => 
    startOfDay(typeof f === 'string' ? parseISO(f) : f)
  );

  let diasAdicionados = 0;
  // Loop para incrementar a data de 1 em 1 dia, contando apenas os dias úteis
  while (diasAdicionados < diasParaAdicionar) {
    dataAtual = addDays(dataAtual, 1);
    const eFimDeSemana = isWeekend(dataAtual);
    const eFeriado = feriadosDates.some(f => isSameDay(f, dataAtual));

    if (!eFimDeSemana && !eFeriado) {
      diasAdicionados++;
    }
  }

  return format(dataAtual, 'yyyy-MM-dd');
}

/**
 * Retorna o SLA limite em dias úteis para a etapa de envio de candidatos com base no nível da vaga.
 * 
 * @param nivel Nível da vaga
 * @returns SLA em dias úteis
 */
export function getSlaEnvioCandidatos(nivel: string): number {
  switch (nivel) {
    case 'auxiliar':
    case 'assistente':
      return 10;
    case 'analista':
      return 15;
    case 'gestao':
    case 'especialista':
    case 'medico':
      return 20;
    default:
      return 15; // padrão de segurança
  }
}

/**
 * Processa uma vaga e gera a configuração detalhada de SLAs por etapa,
 * bem como o status geral consolidado da vaga.
 * 
 * @param vaga Objeto contendo os dados da vaga
 * @param feriados Lista de feriados (Date ou strings YYYY-MM-DD)
 * @returns Objeto IVagaComSla contendo os metadados calculados
 */
export function processarSlaVaga(
  vaga: IVaga, 
  feriados: (Date | string)[]
): IVagaComSla {
  const hoje = format(new Date(), 'yyyy-MM-dd');
  
  // 1. Definição das configurações base de cada etapa
  const etapasConfig: { etapa: TEtapaVaga; nome: string; slaBase: number }[] = [
    { etapa: 'aprovacao', nome: 'Aprovação', slaBase: 15 },
    { etapa: 'abertura_consultoria', nome: 'Abertura de Consultoria', slaBase: 3 },
    { etapa: 'envio_candidatos', nome: 'Envio de Candidatos', slaBase: getSlaEnvioCandidatos(vaga.nivel_vaga) },
    { etapa: 'entrevista', nome: 'Entrevista', slaBase: 15 },
    { etapa: 'fechamento', nome: 'Fechamento', slaBase: 7 }
  ];

  const etapasSla: Record<TEtapaVaga, ISlaEtapaStatus> = {} as Record<TEtapaVaga, ISlaEtapaStatus>;
  let diasUteisTotais = 0;

  // Percorrer cada etapa para calcular o status individual
  etapasConfig.forEach((config) => {
    let dataInicio: string | null = null;
    let dataFim: string | null = null;
    let status: TSlaStatus = 'pendente';
    let diasUteisRealizados: number | null = null;
    let limiteData: string | null = null;
    let slaPrevisto = config.slaBase;

    // Determinar data de início e fim baseada nas regras de dependência cronológica
    switch (config.etapa) {
      case 'aprovacao':
        dataInicio = vaga.data_solicitacao;
        dataFim = vaga.data_aprovacao;
        break;

      case 'abertura_consultoria':
        if (vaga.tipo_vaga === 'interna') {
          // Vagas internas não possuem esta etapa
          status = 'no_prazo';
          diasUteisRealizados = 0;
          slaPrevisto = 0;
        } else {
          dataInicio = vaga.data_aprovacao;
          dataFim = vaga.data_abertura_consultoria;
        }
        break;

      case 'envio_candidatos':
        // Se for vaga interna, inicia na data_aprovacao. Se for externa, na data_abertura_consultoria.
        dataInicio = vaga.tipo_vaga === 'interna' 
          ? vaga.data_aprovacao 
          : vaga.data_abertura_consultoria;
        dataFim = vaga.data_envio_candidatos;
        break;

      case 'entrevista':
        dataInicio = vaga.data_envio_candidatos;
        dataFim = vaga.data_entrevista;
        break;

      case 'fechamento':
        dataInicio = vaga.data_entrevista;
        dataFim = vaga.data_fechamento;
        break;
    }

    // Se temos a data de início da etapa, ela foi disparada
    if (dataInicio && status !== 'no_prazo') {
      const dataFimCalculo = dataFim || hoje;
      diasUteisRealizados = calcularDiasUteis(dataInicio, dataFimCalculo, feriados);
      limiteData = adicionarDiasUteis(dataInicio, slaPrevisto, feriados);

      if (dataFim) {
        // Concluída
        status = diasUteisRealizados <= slaPrevisto ? 'no_prazo' : 'atrasada';
      } else {
        // Em andamento
        status = diasUteisRealizados <= slaPrevisto ? 'em_andamento' : 'estourada';
      }

      diasUteisTotais += diasUteisRealizados;
    }

    etapasSla[config.etapa] = {
      etapa: config.etapa,
      nomeEtapa: config.nome,
      slaPrevisto,
      diasUteisRealizados,
      dataInicio,
      dataFim,
      status,
      limiteData
    };
  });

  // 2. Determinar o status geral consolidado da vaga
  let statusGeralSla: TSlaStatus = 'no_prazo';

  const statuses = Object.values(etapasSla).map(e => e.status);
  
  if (statuses.includes('estourada')) {
    statusGeralSla = 'estourada';
  } else if (statuses.includes('atrasada')) {
    statusGeralSla = 'atrasada';
  } else if (statuses.includes('em_andamento')) {
    statusGeralSla = 'em_andamento';
  }

  return {
    ...vaga,
    status_geral_sla: statusGeralSla,
    etapas_sla: etapasSla,
    dias_uteis_totais: diasUteisTotais
  };
}
