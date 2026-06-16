import React from 'react';
import { CheckCircle, Clock, AlertCircle, XCircle, Circle } from 'lucide-react';
import { IVagaComSla, ISlaEtapaStatus, TSlaStatus, TEtapaVaga } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VagaSLATableProps {
  vaga: IVagaComSla;
}

const statusConfig: Record<
  TSlaStatus,
  { color: string; bg: string; icon: React.ReactNode; label: string }
> = {
  no_prazo: { color: 'text-emerald-700', bg: 'bg-emerald-50', icon: <CheckCircle size={14} />, label: 'No prazo' },
  em_andamento: { color: 'text-blue-700', bg: 'bg-blue-50', icon: <Clock size={14} />, label: 'Em andamento' },
  atrasada: { color: 'text-red-700', bg: 'bg-red-50', icon: <XCircle size={14} />, label: 'Atrasada' },
  estourada: { color: 'text-red-800', bg: 'bg-red-100', icon: <AlertCircle size={14} />, label: 'SLA estourado' },
  pendente: { color: 'text-gray-500', bg: 'bg-gray-50', icon: <Circle size={14} />, label: 'Pendente' },
};

const formatDate = (date: string | null) => {
  if (!date) return '—';
  try {
    return format(parseISO(date), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return date;
  }
};

const etapasOrdem: TEtapaVaga[] = [
  'aprovacao',
  'abertura_consultoria',
  'envio_candidatos',
  'entrevista',
  'fechamento',
];

/**
 * Tabela detalhada com os SLAs de cada etapa do processo seletivo.
 */
const VagaSLATable: React.FC<VagaSLATableProps> = ({ vaga }) => {
  const etapasParaExibir = etapasOrdem.filter((etapa) => {
    if (etapa === 'abertura_consultoria' && vaga.tipo_vaga === 'interna') return false;
    return true;
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Etapa
            </th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              SLA (du)
            </th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Realizado (du)
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Início
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Conclusão
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Limite SLA
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {etapasParaExibir.map((etapaKey) => {
            const etapa: ISlaEtapaStatus = vaga.etapas_sla[etapaKey];
            if (!etapa) return null;

            const config = statusConfig[etapa.status];
            const excedeu =
              etapa.diasUteisRealizados !== null &&
              etapa.diasUteisRealizados > etapa.slaPrevisto;

            return (
              <tr
                key={etapaKey}
                className="hover:bg-gray-50/50 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-gray-800">
                  {etapa.nomeEtapa}
                </td>
                <td className="px-4 py-3 text-center text-gray-600">
                  {etapa.slaPrevisto > 0 ? `${etapa.slaPrevisto} du` : '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  {etapa.diasUteisRealizados !== null ? (
                    <span
                      className={[
                        'font-semibold',
                        excedeu ? 'text-red-600' : 'text-gray-700',
                      ].join(' ')}
                    >
                      {etapa.diasUteisRealizados} du
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{formatDate(etapa.dataInicio)}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(etapa.dataFim)}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(etapa.limiteData)}</td>
                <td className="px-4 py-3">
                  <span
                    className={[
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                      config.bg,
                      config.color,
                    ].join(' ')}
                  >
                    {config.icon}
                    {config.label}
                  </span>
                </td>
              </tr>
            );
          })}

          {/* Linha de totais */}
          <tr className="bg-gray-50 border-t-2 border-gray-200">
            <td className="px-4 py-3 font-semibold text-gray-800">Total</td>
            <td className="px-4 py-3 text-center font-semibold text-gray-600">—</td>
            <td className="px-4 py-3 text-center font-semibold text-gray-800">
              {vaga.dias_uteis_totais} du
            </td>
            <td colSpan={4} className="px-4 py-3" />
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default VagaSLATable;
