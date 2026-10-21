import { IVaga } from '@/types';

export type TSituacaoVaga = 'aberta' | 'fechada';

/** Vaga fechada = possui data de fechamento. Sem ela, a vaga ainda está em aberto. */
export const situacaoVaga = (vaga: Pick<IVaga, 'data_fechamento'>): TSituacaoVaga =>
  vaga.data_fechamento ? 'fechada' : 'aberta';

export const SITUACAO_LABELS: Record<TSituacaoVaga, string> = {
  aberta: 'Em aberto',
  fechada: 'Fechada',
};

export const filtrarPorSituacao = <T extends Pick<IVaga, 'data_fechamento'>>(
  vagas: T[],
  situacao: TSituacaoVaga | 'todas',
): T[] => (situacao === 'todas' ? vagas : vagas.filter((v) => situacaoVaga(v) === situacao));
