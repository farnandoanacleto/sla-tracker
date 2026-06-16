import React, { useEffect, useState } from 'react';
import { Calendar, X } from 'lucide-react';
import {
  format,
  startOfMonth, endOfMonth,
  startOfQuarter, endOfQuarter,
  startOfYear, endOfYear,
} from 'date-fns';

type TPreset = 'mes' | 'trimestre' | 'ano' | 'personalizado';

interface DateRangeFilterProps {
  dataInicio: string | null;
  dataFim: string | null;
  onChangeInicio: (value: string | null) => void;
  onChangeFim: (value: string | null) => void;
  label?: string;
}

const toInput = (d: Date) => format(d, 'yyyy-MM-dd');

const PRESETS: { key: TPreset; label: string }[] = [
  { key: 'mes', label: 'Este mês' },
  { key: 'trimestre', label: 'Este trimestre' },
  { key: 'ano', label: 'Este ano' },
  { key: 'personalizado', label: 'Personalizado' },
];

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  dataInicio,
  dataFim,
  onChangeInicio,
  onChangeFim,
  label = 'Período',
}) => {
  const [localInicio, setLocalInicio] = useState(dataInicio ?? '');
  const [localFim, setLocalFim] = useState(dataFim ?? '');
  const [preset, setPreset] = useState<TPreset | null>(null);

  // Sincroniza com o estado externo (ex.: quando limparFiltros é chamado)
  useEffect(() => {
    setLocalInicio(dataInicio ?? '');
    setLocalFim(dataFim ?? '');
    if (!dataInicio && !dataFim) setPreset(null);
  }, [dataInicio, dataFim]);

  const applyPreset = (key: TPreset) => {
    setPreset(key);
    if (key === 'personalizado') return; // apenas exibe os inputs

    const now = new Date();
    let inicio = '';
    let fim = '';

    if (key === 'mes') {
      inicio = toInput(startOfMonth(now));
      fim = toInput(endOfMonth(now));
    } else if (key === 'trimestre') {
      inicio = toInput(startOfQuarter(now));
      fim = toInput(endOfQuarter(now));
    } else if (key === 'ano') {
      inicio = toInput(startOfYear(now));
      fim = toInput(endOfYear(now));
    }

    setLocalInicio(inicio);
    setLocalFim(fim);
    onChangeInicio(inicio || null);
    onChangeFim(fim || null);
  };

  const handleInicioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalInicio(val);
    onChangeInicio(val || null);
    setPreset('personalizado');
  };

  const handleFimChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalFim(val);
    onChangeFim(val || null);
    setPreset('personalizado');
  };

  const handleClear = () => {
    setLocalInicio('');
    setLocalFim('');
    onChangeInicio(null);
    onChangeFim(null);
    setPreset(null);
  };

  const hasValue = !!(localInicio || localFim);
  const showInputs = !preset || preset === 'personalizado';

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="text-sm font-medium text-gray-700">{label}</span>
      )}

      {/* Atalhos de período */}
      <div className="flex items-center gap-1 flex-wrap">
        {PRESETS.map(({ key, label: pLabel }) => (
          <button
            key={key}
            type="button"
            onClick={() => applyPreset(key)}
            className={[
              'px-2.5 py-1 text-xs font-medium rounded-lg transition-colors border',
              preset === key
                ? 'bg-[#1A56A0] text-white border-[#1A56A0]'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50',
            ].join(' ')}
          >
            {pLabel}
          </button>
        ))}
        {hasValue && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Limpar filtro de datas"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Inputs de data — visíveis em modo personalizado ou sem preset */}
      {showInputs && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="date"
              value={localInicio}
              onChange={handleInicioChange}
              max={localFim || undefined}
              className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
              aria-label="Data início do filtro"
            />
          </div>
          <span className="text-gray-400 text-sm">até</span>
          <div className="relative">
            <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="date"
              value={localFim}
              onChange={handleFimChange}
              min={localInicio || undefined}
              className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
              aria-label="Data fim do filtro"
            />
          </div>
        </div>
      )}

      {/* Período selecionado para presets não-personalizados */}
      {hasValue && preset && preset !== 'personalizado' && (
        <p className="text-xs text-gray-400">
          {localInicio} — {localFim}
        </p>
      )}
    </div>
  );
};

export default DateRangeFilter;
