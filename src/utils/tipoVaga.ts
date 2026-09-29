import { TTipoVaga } from '@/types';

/** Rótulos de exibição de cada tipo de vaga. */
export const TIPO_VAGA_LABELS: Record<TTipoVaga, string> = {
  interna: 'Interna',
  externa: 'Externa',
  hibrida: 'Híbrida',
};

/** Opções para selects de tipo de vaga. */
export const TIPO_VAGA_OPTIONS = (Object.keys(TIPO_VAGA_LABELS) as TTipoVaga[]).map((value) => ({
  value,
  label: TIPO_VAGA_LABELS[value],
}));

/** Rótulo seguro para exibição (aceita valores desconhecidos). */
export const labelTipoVaga = (tipo: string | null | undefined): string =>
  (tipo && TIPO_VAGA_LABELS[tipo as TTipoVaga]) || tipo || '—';

/**
 * Indica se a vaga passa pela etapa de consultoria.
 * - Externa: sempre (consultoria obrigatória).
 * - Híbrida: apenas se tiver consultoria ou data de abertura de consultoria informada.
 * - Interna: nunca.
 */
export const usaConsultoria = (vaga: {
  tipo_vaga: TTipoVaga;
  consultoria_id?: string | null;
  data_abertura_consultoria?: string | null;
}): boolean => {
  if (vaga.tipo_vaga === 'externa') return true;
  if (vaga.tipo_vaga === 'hibrida') return !!(vaga.consultoria_id || vaga.data_abertura_consultoria);
  return false;
};
