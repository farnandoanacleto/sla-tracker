import { IVaga } from '@/types';

export interface IStatusInfo {
  status: string;
  label: string;
  corClass: string;
}

/**
 * Deriva dinamicamente o status da vaga e suas informações visuais (label e cores do Tailwind)
 * com base nas datas preenchidas cronologicamente.
 * 
 * @param vaga Objeto contendo os dados da vaga
 * @returns Informações de status (status, label e classes CSS de cor)
 */
export function getStatusVaga(vaga: Partial<IVaga>): IStatusInfo {
  if (!vaga) {
    return {
      status: 'desconhecido',
      label: 'Desconhecido',
      corClass: 'bg-slate-100 text-slate-800 border-slate-200',
    };
  }

  // Verificar de trás para frente na linha do tempo
  if (vaga.data_inicio_colaborador) {
    return {
      status: 'colaborador_iniciado',
      label: 'Colaborador Iniciado',
      corClass: 'bg-emerald-100 text-emerald-800 border-emerald-200 border',
    };
  }
  
  if (vaga.data_fechamento) {
    return {
      status: 'fechada',
      label: 'Vaga Fechada',
      corClass: 'bg-blue-100 text-blue-800 border-blue-200 border',
    };
  }

  if (vaga.data_entrevista) {
    return {
      status: 'em_entrevista',
      label: 'Em Entrevista',
      corClass: 'bg-purple-100 text-purple-800 border-purple-200 border',
    };
  }

  if (vaga.data_envio_candidatos) {
    return {
      status: 'candidatos_recebidos',
      label: 'Candidatos Recebidos',
      corClass: 'bg-indigo-100 text-indigo-800 border-indigo-200 border',
    };
  }

  if (vaga.tipo_vaga === 'externa' && vaga.data_abertura_consultoria) {
    return {
      status: 'em_consultoria',
      label: 'Em Consultoria',
      corClass: 'bg-pink-100 text-pink-800 border-pink-200 border',
    };
  }

  if (vaga.data_aprovacao) {
    return {
      status: 'aprovada',
      label: 'Aprovada',
      corClass: 'bg-cyan-100 text-cyan-800 border-cyan-200 border',
    };
  }

  if (vaga.data_solicitacao) {
    return {
      status: 'aguardando_aprovacao',
      label: 'Aguardando Aprovação',
      corClass: 'bg-amber-100 text-amber-800 border-amber-200 border',
    };
  }

  return {
    status: 'rascunho',
    label: 'Rascunho',
    corClass: 'bg-slate-100 text-slate-600 border-slate-200 border',
  };
}

export default getStatusVaga;
