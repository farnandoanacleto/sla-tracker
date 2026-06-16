import { format, parseISO } from 'date-fns';

/**
 * Formata uma data no formato brasileiro dd/MM/yyyy.
 * Aceita strings ISO (como '2025-06-15') ou objetos Date.
 * 
 * @param date Data a ser formatada
 * @returns String formatada ou '-' se for nula/indefinida
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'dd/MM/yyyy');
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return '-';
  }
}

/**
 * Formata um valor numérico para a moeda brasileira Real (R$ X.XXX,XX).
 * 
 * @param value Valor numérico a ser formatado
 * @returns String formatada ou 'R$ 0,00' se for inválido
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
