import React, { useMemo, useState } from 'react';
import { Download, Search, Filter, X } from 'lucide-react';
import { useVagas } from '@/hooks/useVagas';
import { useAreas } from '@/hooks/useAreas';

import { useToast } from '@/contexts/ToastContext';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { SkeletonTableRow } from '@/components/ui/Skeleton';
import { IVagaComSla, TSlaStatus, TEtapaVaga } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SLA_BADGE: Record<TSlaStatus, { label: string; variant: 'verde' | 'vermelho' | 'cinza' | 'amarelo' | 'azul' }> = {
  no_prazo: { label: 'No prazo', variant: 'verde' },
  em_andamento: { label: 'Em andamento', variant: 'azul' },
  atrasada: { label: 'Atrasada', variant: 'vermelho' },
  estourada: { label: 'SLA estourado', variant: 'vermelho' },
  pendente: { label: 'Pendente', variant: 'cinza' },
};

const ETAPA_CHAVES: TEtapaVaga[] = [
  'aprovacao',
  'abertura_consultoria',
  'envio_candidatos',
  'entrevista',
  'fechamento',
];

const ITEMS_PER_PAGE = 20;

const formatDate = (date: string | null) => {
  if (!date) return '';
  try { return format(parseISO(date), 'dd/MM/yyyy', { locale: ptBR }); } catch { return date; }
};

const Relatorios: React.FC = () => {
  const { showToast } = useToast();
  const { vagas, loading, filtros, atualizarFiltros, limparFiltros } = useVagas();
  const { areas } = useAreas();

  const [busca, setBusca] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [page, setPage] = useState(1);

  const vagasFiltradas = useMemo(() => {
    if (!busca.trim()) return vagas;
    const q = busca.toLowerCase();
    return vagas.filter(
      (v) =>
        v.codigo_vaga.toLowerCase().includes(q) ||
        v.nome_vaga.toLowerCase().includes(q) ||
        v.gestor_solicitante.toLowerCase().includes(q),
    );
  }, [vagas, busca]);

  const totalPages = Math.ceil(vagasFiltradas.length / ITEMS_PER_PAGE);
  const vagasPaginadas = vagasFiltradas.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const areaOptions = [
    { value: 'todas', label: 'Todas as áreas' },
    ...areas.map((a) => ({ value: a.id, label: a.nome })),
  ];

  const temFiltros =
    filtros.tipo_vaga !== 'todas' ||
    filtros.nivel_vaga !== 'todos' ||
    filtros.area_id !== 'todas' ||
    filtros.status_sla !== 'todos' ||
    filtros.data_inicio ||
    filtros.data_fim;

  const handleExportar = async () => {
    setExportando(true);
    try {
      const { utils, writeFile } = await import('xlsx');

      const rows = vagasFiltradas.map((v: IVagaComSla) => {
        const row: Record<string, string | number> = {
          'Código': v.codigo_vaga,
          'Nome da Vaga': v.nome_vaga,
          'Tipo': v.tipo_vaga,
          'Nível': v.nivel_vaga,
          'Área': v.area_nome ?? '',
          'Gestor': v.gestor_solicitante,
          'Consultoria': v.consultoria_nome ?? '',
          'Custo (R$)': v.custo_processo,
          'Data Solicitação': formatDate(v.data_solicitacao),
          'Data Aprovação': formatDate(v.data_aprovacao),
          'Data Ab. Consultoria': formatDate(v.data_abertura_consultoria),
          'Data Envio Candidatos': formatDate(v.data_envio_candidatos),
          'Data Entrevista': formatDate(v.data_entrevista),
          'Data Fechamento': formatDate(v.data_fechamento),
          'Data Início Colaborador': formatDate(v.data_inicio_colaborador),
          'Status Geral SLA': SLA_BADGE[v.status_geral_sla]?.label ?? v.status_geral_sla,
          'Total Dias Úteis': v.dias_uteis_totais,
        };

        ETAPA_CHAVES.forEach((etapa) => {
          const e = v.etapas_sla[etapa];
          if (e && e.slaPrevisto > 0) {
            row[`SLA ${e.nomeEtapa} (previsto)`] = e.slaPrevisto;
            row[`SLA ${e.nomeEtapa} (realizado)`] = e.diasUteisRealizados ?? '';
            row[`SLA ${e.nomeEtapa} (status)`] = SLA_BADGE[e.status]?.label ?? e.status;
          }
        });

        return row;
      });

      const ws = utils.json_to_sheet(rows);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'SLA Tracker');

      const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({ wch: Math.max(key.length, 15) }));
      ws['!cols'] = colWidths;

      const fileName = `sla-tracker-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      writeFile(wb, fileName);
      showToast(`Arquivo "${fileName}" exportado com sucesso!`, 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao exportar', 'error');
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? '...' : `${vagasFiltradas.length} registro${vagasFiltradas.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setShowFilters((s) => !s)} className="relative">
            <Filter size={16} />
            Filtros
            {temFiltros && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#1A56A0] rounded-full" />}
          </Button>
          <Button
            variant="primary"
            onClick={handleExportar}
            disabled={exportando || loading || vagasFiltradas.length === 0}
          >
            <Download size={16} />
            {exportando ? 'Exportando...' : 'Exportar Excel'}
          </Button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Tipo"
              id="rel-tipo"
              value={filtros.tipo_vaga}
              onChange={(e) => { atualizarFiltros({ tipo_vaga: e.target.value as typeof filtros.tipo_vaga }); setPage(1); }}
              options={[
                { value: 'todas', label: 'Todos' },
                { value: 'interna', label: 'Interna' },
                { value: 'externa', label: 'Externa' },
              ]}
            />
            <Select
              label="Nível"
              id="rel-nivel"
              value={filtros.nivel_vaga}
              onChange={(e) => { atualizarFiltros({ nivel_vaga: e.target.value as typeof filtros.nivel_vaga }); setPage(1); }}
              options={[
                { value: 'todos', label: 'Todos' },
                { value: 'auxiliar', label: 'Auxiliar' },
                { value: 'assistente', label: 'Assistente' },
                { value: 'analista', label: 'Analista' },
                { value: 'especialista', label: 'Especialista' },
                { value: 'gestao', label: 'Gestão' },
                { value: 'medico', label: 'Médico' },
              ]}
            />
            <Select
              label="Status SLA"
              id="rel-sla"
              value={filtros.status_sla}
              onChange={(e) => { atualizarFiltros({ status_sla: e.target.value as typeof filtros.status_sla }); setPage(1); }}
              options={[
                { value: 'todos', label: 'Todos' },
                { value: 'no_prazo', label: 'No prazo' },
                { value: 'em_andamento', label: 'Em andamento' },
                { value: 'atrasada', label: 'Atrasada' },
                { value: 'estourada', label: 'SLA estourado' },
              ]}
            />
            <Select
              label="Área"
              id="rel-area"
              value={filtros.area_id}
              onChange={(e) => { atualizarFiltros({ area_id: e.target.value }); setPage(1); }}
              options={areaOptions}
            />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <DateRangeFilter
              label="Período de solicitação"
              dataInicio={filtros.data_inicio}
              dataFim={filtros.data_fim}
              onChangeInicio={(v) => { atualizarFiltros({ data_inicio: v }); setPage(1); }}
              onChangeFim={(v) => { atualizarFiltros({ data_fim: v }); setPage(1); }}
            />
            {temFiltros && (
              <Button variant="ghost" onClick={() => { limparFiltros(); setPage(1); }}>
                <X size={14} />
                Limpar filtros
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Busca textual */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por código, nome ou gestor..."
          value={busca}
          onChange={(e) => { setBusca(e.target.value); setPage(1); }}
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
          id="relatorios-busca"
        />
      </div>

      {/* Tabela detalhada */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                  Vaga
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Área</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo/Nível</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aprovação (du)</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Envio Cand. (du)</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Entrevista (du)</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fechamento (du)</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total (du)</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => <SkeletonTableRow key={i} cols={9} />)
              ) : vagasPaginadas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    <p className="font-medium">Nenhum registro encontrado</p>
                  </td>
                </tr>
              ) : (
                vagasPaginadas.map((v: IVagaComSla) => {
                  const sla = SLA_BADGE[v.status_geral_sla];

                  const renderDu = (etapa: TEtapaVaga) => {
                    const e = v.etapas_sla[etapa];
                    if (!e || e.slaPrevisto === 0) return <span className="text-gray-300">N/A</span>;
                    if (e.diasUteisRealizados === null) return <span className="text-gray-400">—</span>;
                    const excedeu = e.diasUteisRealizados > e.slaPrevisto;
                    return (
                      <span className={excedeu ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                        {e.diasUteisRealizados}/{e.slaPrevisto}
                      </span>
                    );
                  };

                  return (
                    <tr key={v.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3 sticky left-0 bg-white z-10">
                        <p className="font-mono text-xs font-semibold text-[#1A56A0]">{v.codigo_vaga}</p>
                        <p className="text-gray-700 font-medium truncate max-w-[180px]">{v.nome_vaga}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{v.area_nome ?? '—'}</td>
                      <td className="px-4 py-3">
                        <p className="text-gray-600 text-xs capitalize">{v.tipo_vaga}</p>
                        <p className="text-gray-400 text-xs capitalize">{v.nivel_vaga}</p>
                      </td>
                      <td className="px-4 py-3 text-center text-xs">{renderDu('aprovacao')}</td>
                      <td className="px-4 py-3 text-center text-xs">{renderDu('envio_candidatos')}</td>
                      <td className="px-4 py-3 text-center text-xs">{renderDu('entrevista')}</td>
                      <td className="px-4 py-3 text-center text-xs">{renderDu('fechamento')}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-semibold text-gray-800 text-xs">{v.dias_uteis_totais} du</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={sla.variant}>{sla.label}</Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Exibindo {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, vagasFiltradas.length)} de {vagasFiltradas.length}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                Anterior
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-gray-400">…</span>}
                    <button
                      type="button"
                      onClick={() => setPage(p)}
                      className={[
                        'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                        p === page ? 'bg-[#1A56A0] text-white' : 'text-gray-600 hover:bg-gray-100',
                      ].join(' ')}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
              <Button variant="ghost" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Próximo
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Relatorios;
