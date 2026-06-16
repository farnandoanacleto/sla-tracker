import React from 'react';
import { CheckCircle, Clock, AlertCircle, XCircle, Circle } from 'lucide-react';
import { ISlaEtapaStatus, TSlaStatus } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VagaTimelineProps {
  etapas: ISlaEtapaStatus[];
  tipoVaga: 'interna' | 'externa';
}

const statusConfig: Record<
  TSlaStatus,
  { color: string; bg: string; border: string; icon: React.ReactNode; label: string }
> = {
  no_prazo: {
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    icon: <CheckCircle size={18} />,
    label: 'No prazo',
  },
  em_andamento: {
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    icon: <Clock size={18} />,
    label: 'Em andamento',
  },
  atrasada: {
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-300',
    icon: <XCircle size={18} />,
    label: 'Atrasada',
  },
  estourada: {
    color: 'text-red-700',
    bg: 'bg-red-100',
    border: 'border-red-400',
    icon: <AlertCircle size={18} />,
    label: 'SLA estourado',
  },
  pendente: {
    color: 'text-gray-400',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    icon: <Circle size={18} />,
    label: 'Pendente',
  },
};

const formatDate = (date: string | null) => {
  if (!date) return '—';
  try {
    return format(parseISO(date), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return date;
  }
};

/**
 * Timeline horizontal representando as 5 etapas do processo seletivo.
 * Exibe status visual, dias úteis e datas de cada etapa.
 */
const VagaTimeline: React.FC<VagaTimelineProps> = ({ etapas, tipoVaga }) => {
  // Filtrar abertura_consultoria para vagas internas
  const etapasFiltradas = etapas.filter(
    (e) => !(tipoVaga === 'interna' && e.etapa === 'abertura_consultoria')
  );

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-start gap-0 min-w-[600px]">
        {etapasFiltradas.map((etapa, index) => {
          const config = statusConfig[etapa.status];
          const isLast = index === etapasFiltradas.length - 1;

          return (
            <React.Fragment key={etapa.etapa}>
              {/* Etapa */}
              <div className="flex flex-col items-center flex-1 min-w-0">
                {/* Ícone de status */}
                <div
                  className={[
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 z-10',
                    config.bg,
                    config.border,
                    config.color,
                  ].join(' ')}
                  title={config.label}
                >
                  {config.icon}
                </div>

                {/* Informações da etapa */}
                <div className="mt-2 text-center px-1">
                  <p className="text-xs font-semibold text-gray-700 leading-tight">
                    {etapa.nomeEtapa}
                  </p>
                  <p className={['text-xs mt-0.5 font-medium', config.color].join(' ')}>
                    {config.label}
                  </p>

                  {/* Dias úteis */}
                  {etapa.diasUteisRealizados !== null && (
                    <p className="text-xs text-gray-500 mt-1">
                      <span className="font-semibold text-gray-700">
                        {etapa.diasUteisRealizados}
                      </span>
                      /{etapa.slaPrevisto} du
                    </p>
                  )}

                  {/* Datas */}
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(etapa.dataInicio)}
                    {etapa.dataFim && (
                      <>
                        {' → '}
                        {formatDate(etapa.dataFim)}
                      </>
                    )}
                  </p>

                  {/* Data limite */}
                  {etapa.limiteData && !etapa.dataFim && (
                    <p className="text-xs text-amber-600 mt-0.5">
                      Limite: {formatDate(etapa.limiteData)}
                    </p>
                  )}
                </div>
              </div>

              {/* Conector entre etapas */}
              {!isLast && (
                <div className="flex-none flex items-start pt-5">
                  <div
                    className={[
                      'h-0.5 w-8',
                      etapa.status === 'no_prazo' || etapa.status === 'atrasada'
                        ? 'bg-gray-300'
                        : 'bg-gray-200',
                    ].join(' ')}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default VagaTimeline;
