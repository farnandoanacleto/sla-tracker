import { eachDayOfInterval, isWeekend, isSameDay, parseISO, startOfDay } from 'date-fns';

/**
 * Calcula a quantidade de dias úteis entre duas datas,
 * desconsiderando fins de semana (sábados e domingos) e a lista de feriados fornecida.
 * 
 * O cálculo considera dias decorridos de transição (ex: Quinta para Sexta = 1 dia útil, Sexta para Segunda = 1 dia útil).
 * 
 * @param dataInicio Data de início do intervalo (Date ou string YYYY-MM-DD)
 * @param dataFim Data de fim do intervalo (Date ou string YYYY-MM-DD)
 * @param feriados Lista de feriados (Date ou strings YYYY-MM-DD)
 * @returns Quantidade de dias úteis inteiros
 */
export function calcularDiasUteis(
  dataInicio: Date | string,
  dataFim: Date | string,
  feriados: (Date | string)[]
): number {
  if (!dataInicio || !dataFim) return 0;

  const start = startOfDay(typeof dataInicio === 'string' ? parseISO(dataInicio) : dataInicio);
  const end = startOfDay(typeof dataFim === 'string' ? parseISO(dataFim) : dataFim);

  if (start > end) return 0;
  if (isSameDay(start, end)) return 0;

  // Converter a lista de feriados para objetos Date normalizados no início do dia
  const feriadosDates = feriados.map(f => 
    startOfDay(typeof f === 'string' ? parseISO(f) : f)
  );

  try {
    const dias = eachDayOfInterval({ start, end });
    let diasUteis = 0;

    // Começa em i = 1 para desconsiderar o dia de início (contagem de transições úteis)
    for (let i = 1; i < dias.length; i++) {
      const dia = dias[i];
      const eFimDeSemana = isWeekend(dia);
      const eFeriado = feriadosDates.some(f => isSameDay(f, dia));

      if (!eFimDeSemana && !eFeriado) {
        diasUteis++;
      }
    }

    return diasUteis;
  } catch (error) {
    console.error('Erro ao calcular dias úteis:', error);
    return 0;
  }
}

export default calcularDiasUteis;
