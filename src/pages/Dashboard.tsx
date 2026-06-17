import React, { useMemo, useState } from 'react';
import {
  CheckCircle, AlertTriangle, Clock, TrendingUp, Activity,
  BarChart2, Filter, Building2, Layers,
} from 'lucide-react';
import { useVagas } from '@/hooks/useVagas';
import { useAreas } from '@/hooks/useAreas';

import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { Select } from '@/components/ui/Select';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { IVagaComSla, TSlaStatus, TEtapaVaga, TNivelVaga } from '@/types';

const STATUS_COLORS: Record<TSlaStatus, string> = {
  no_prazo: '#22C55E',
  em_andamento: '#1A56A0',
  atrasada: '#F59E0B',
  estourada: '#EF4444',
  pendente: '#9CA3AF',
};

const ETAPA_NOMES: Record<TEtapaVaga, string> = {
  aprovacao: 'Aprovação',
  abertura_consultoria: 'Ab. Consultoria',
  envio_candidatos: 'Envio Cand.',
  entrevista: 'Entrevista',
  fechamento: 'Fechamento',
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subtext?: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, subtext, color = '#1A56A0' }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
        <span style={{ color }}>{icon}</span>
      </div>
    </div>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
    {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
  </div>
);

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
    <span className="text-gray-400">{icon}</span>
    {title}
  </h2>
);

const EmptyChart: React.FC = () => (
  <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Sem dados para exibir</div>
);

const LoadingSpinner: React.FC = () => (
  <div className="h-48 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-[#1A56A0] border-t-transparent rounded-full animate-spin" />
  </div>
);

// ---------------------------------------------------------------------------

const Dashboard: React.FC = () => {
  const { vagas, loading, filtros, atualizarFiltros } = useVagas();
  const { areas } = useAreas();
  const [showFilters, setShowFilters] = useState(false);

  // ── Painel Visão Geral ───────────────────────────────────────────────────
  const metricas = useMemo(() => {
    const ativas = vagas.filter((v) => !v.data_fechamento);
    const concluidas = vagas.filter((v) => !!v.data_fechamento);
    const atrasadas = vagas.filter((v) => v.status_geral_sla === 'atrasada' || v.status_geral_sla === 'estourada');

    let totalEtapas = 0;
    let etapasNoPrazo = 0;
    vagas.forEach((v) => {
      Object.values(v.etapas_sla).forEach((e) => {
        if (e.status !== 'pendente' && e.slaPrevisto > 0) {
          totalEtapas++;
          if (e.status === 'no_prazo') etapasNoPrazo++;
        }
      });
    });
    const taxaAdesao = totalEtapas > 0 ? Math.round((etapasNoPrazo / totalEtapas) * 100) : 0;

    const mediaTotal =
      concluidas.length > 0
        ? Math.round(concluidas.reduce((s, v) => s + v.dias_uteis_totais, 0) / concluidas.length)
        : 0;

    return { ativas, concluidas, atrasadas, taxaAdesao, mediaTotal };
  }, [vagas]);

  // ── Painel Gargalos ──────────────────────────────────────────────────────
  const dadosStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    vagas.forEach((v) => {
      counts[v.status_geral_sla] = (counts[v.status_geral_sla] ?? 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      name: {
        no_prazo: 'No prazo', em_andamento: 'Em andamento',
        atrasada: 'Atrasada', estourada: 'Estourado', pendente: 'Pendente',
      }[status] ?? status,
      value: count,
      color: STATUS_COLORS[status as TSlaStatus] ?? '#9CA3AF',
    }));
  }, [vagas]);

  const dadosGargalos = useMemo(() => {
    const etapas: TEtapaVaga[] = ['aprovacao', 'envio_candidatos', 'entrevista', 'fechamento'];
    return etapas.map((etapa) => {
      const ativas = vagas
        .map((v) => v.etapas_sla[etapa])
        .filter((e) => e && e.diasUteisRealizados !== null && e.slaPrevisto > 0);

      const mediaDias =
        ativas.length > 0
          ? Math.round(ativas.reduce((s, e) => s + (e.diasUteisRealizados ?? 0), 0) / ativas.length)
          : 0;

      return { etapa: ETAPA_NOMES[etapa], mediaDias, slaPrevisto: ativas[0]?.slaPrevisto ?? 0 };
    });
  }, [vagas]);

  // Ranqueamento de gargalos
  const gargalosRanqueados = useMemo(
    () => [...dadosGargalos].sort((a, b) => b.mediaDias - a.mediaDias),
    [dadosGargalos],
  );

  // ── Painel Consultorias ─────────────────────────────────────────────────
  const dadosConsultorias = useMemo(() => {
    const byId: Record<string, { nome: string; vagas: IVagaComSla[] }> = {};
    vagas
      .filter((v) => v.tipo_vaga === 'externa')
      .forEach((v) => {
        const key = v.consultoria_id ?? 'sem';
        if (!byId[key]) byId[key] = { nome: v.consultoria_nome ?? 'Sem consultoria', vagas: [] };
        byId[key].vagas.push(v);
      });

    return Object.values(byId)
      .map(({ nome, vagas: vList }) => {
        const etapasEnvio = vList
          .map((v) => v.etapas_sla.envio_candidatos)
          .filter((e) => e && e.diasUteisRealizados !== null);

        const mediaEnvio =
          etapasEnvio.length > 0
            ? Math.round(etapasEnvio.reduce((s, e) => s + (e.diasUteisRealizados ?? 0), 0) / etapasEnvio.length)
            : 0;

        let totalEt = 0, noPrazo = 0;
        vList.forEach((v) =>
          Object.values(v.etapas_sla).forEach((e) => {
            if (e.status !== 'pendente' && e.slaPrevisto > 0) {
              totalEt++;
              if (e.status === 'no_prazo') noPrazo++;
            }
          }),
        );
        const pctSla = totalEt > 0 ? Math.round((noPrazo / totalEt) * 100) : 0;

        const custoMedio =
          vList.length > 0
            ? Math.round(vList.reduce((s, v) => s + v.custo_processo, 0) / vList.length)
            : 0;

        return { nome, qtdVagas: vList.length, mediaEnvio, pctSla, custoMedio };
      })
      .sort((a, b) => b.qtdVagas - a.qtdVagas);
  }, [vagas]);

  // ── Painel Comparativos ──────────────────────────────────────────────────
  const dadosTipos = useMemo(() => {
    return (['interna', 'externa'] as const).map((tipo) => {
      const vList = vagas.filter((v) => v.tipo_vaga === tipo);
      const concluidas = vList.filter((v) => !!v.data_fechamento);

      let totalEt = 0, noPrazo = 0;
      vList.forEach((v) =>
        Object.values(v.etapas_sla).forEach((e) => {
          if (e.status !== 'pendente' && e.slaPrevisto > 0) {
            totalEt++;
            if (e.status === 'no_prazo') noPrazo++;
          }
        }),
      );

      return {
        tipo: tipo === 'interna' ? 'Interna' : 'Externa',
        mediaDias:
          concluidas.length > 0
            ? Math.round(concluidas.reduce((s, v) => s + v.dias_uteis_totais, 0) / concluidas.length)
            : 0,
        pctSla: totalEt > 0 ? Math.round((noPrazo / totalEt) * 100) : 0,
        custoMedio:
          vList.length > 0
            ? Math.round(vList.reduce((s, v) => s + v.custo_processo, 0) / vList.length)
            : 0,
      };
    });
  }, [vagas]);

  const dadosPorNivel = useMemo(() => {
    const niveis: TNivelVaga[] = ['auxiliar', 'assistente', 'analista', 'especialista', 'gestao', 'medico'];
    const NIVEL_LABELS: Record<TNivelVaga, string> = {
      auxiliar: 'Auxiliar', assistente: 'Assistente', analista: 'Analista',
      especialista: 'Especialista', gestao: 'Gestão', medico: 'Médico',
    };
    return niveis
      .map((nivel) => {
        const int = vagas.filter((v) => v.nivel_vaga === nivel && v.tipo_vaga === 'interna' && v.data_fechamento);
        const ext = vagas.filter((v) => v.nivel_vaga === nivel && v.tipo_vaga === 'externa' && v.data_fechamento);
        return {
          nivel: NIVEL_LABELS[nivel],
          interna: int.length > 0 ? Math.round(int.reduce((s, v) => s + v.dias_uteis_totais, 0) / int.length) : 0,
          externa: ext.length > 0 ? Math.round(ext.reduce((s, v) => s + v.dias_uteis_totais, 0) / ext.length) : 0,
        };
      })
      .filter((d) => d.interna > 0 || d.externa > 0);
  }, [vagas]);

  // Vagas com maior atraso
  const vagasAtrasadas = useMemo(
    () =>
      vagas
        .filter((v) => v.status_geral_sla === 'atrasada' || v.status_geral_sla === 'estourada')
        .sort((a, b) => b.dias_uteis_totais - a.dias_uteis_totais)
        .slice(0, 5),
    [vagas],
  );

  const areaOptions = [
    { value: 'todas', label: 'Todas as áreas' },
    ...areas.map((a) => ({ value: a.id, label: a.nome })),
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Visão geral dos processos seletivos</p>
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((s) => !s)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Filter size={15} />
          Filtros do período
        </button>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 flex-wrap">
            <DateRangeFilter
              label="Período de solicitação"
              dataInicio={filtros.data_inicio}
              dataFim={filtros.data_fim}
              onChangeInicio={(v) => atualizarFiltros({ data_inicio: v })}
              onChangeFim={(v) => atualizarFiltros({ data_fim: v })}
            />
            <Select
              label="Área"
              id="dash-area"
              value={filtros.area_id}
              onChange={(e) => atualizarFiltros({ area_id: e.target.value })}
              options={areaOptions}
              className="w-48"
            />
            <Select
              label="Tipo"
              id="dash-tipo"
              value={filtros.tipo_vaga}
              onChange={(e) => atualizarFiltros({ tipo_vaga: e.target.value as typeof filtros.tipo_vaga })}
              options={[
                { value: 'todas', label: 'Todos os tipos' },
                { value: 'interna', label: 'Interna' },
                { value: 'externa', label: 'Externa' },
              ]}
              className="w-40"
            />
          </div>
        </div>
      )}

      {/* ── Painel Visão Geral ────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Activity size={18} />} label="Vagas Ativas" value={metricas.ativas.length} subtext="em andamento" color="#1A56A0" />
          <StatCard icon={<CheckCircle size={18} />} label="Concluídas" value={metricas.concluidas.length} subtext="com fechamento" color="#10B981" />
          <StatCard icon={<AlertTriangle size={18} />} label="Atrasadas" value={metricas.atrasadas.length} subtext="fora do SLA" color="#EF4444" />
          <StatCard icon={<TrendingUp size={18} />} label="Taxa de SLA" value={`${metricas.taxaAdesao}%`} subtext="etapas dentro do prazo" color="#10B981" />
        </div>
      )}

      {/* ── Painel Gargalos ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Status */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <SectionTitle icon={<BarChart2 size={16} />} title="Distribuição por Status" />
          {loading ? <LoadingSpinner /> : dadosStatus.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={dadosStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {dadosStatus.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value) => [value, 'vagas']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Média de dias por etapa */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <SectionTitle icon={<Clock size={16} />} title="Média de Dias por Etapa vs SLA" />
          {loading ? <LoadingSpinner /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dadosGargalos} margin={{ top: 0, right: 0, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="etapa" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
                  formatter={(value, name) => [`${value} du`, name === 'mediaDias' ? 'Média real' : 'SLA previsto']}
                />
                <Legend
                  iconType="square"
                  iconSize={10}
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={(value) => (
                    <span style={{ color: '#64748B' }}>
                      {value === 'mediaDias' ? 'Média Real (dias)' : 'Meta SLA (dias)'}
                    </span>
                  )}
                />
                <Bar dataKey="mediaDias" fill="#1A56A0" radius={[4, 4, 0, 0]} name="mediaDias" />
                <Bar dataKey="slaPrevisto" fill="#E5E7EB" radius={[4, 4, 0, 0]} name="slaPrevisto" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Ranqueamento de gargalos */}
      {!loading && gargalosRanqueados.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <SectionTitle icon={<AlertTriangle size={16} />} title="Etapas com Maior Atraso (ranqueadas)" />
          <div className="space-y-2">
            {gargalosRanqueados.map((g, idx) => (
              <div key={g.etapa} className={['flex items-center gap-4 py-2 border-b border-gray-100 last:border-0', idx === 0 ? 'font-semibold' : ''].join(' ')}>
                <span className={['w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0',
                  idx === 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'].join(' ')}>
                  {idx + 1}
                </span>
                <span className="flex-1 text-sm text-gray-700">{g.etapa}</span>
                <span className="text-sm text-gray-500">
                  Média: <span className={g.mediaDias > g.slaPrevisto ? 'text-red-600 font-semibold' : 'text-gray-700 font-semibold'}>
                    {g.mediaDias} du
                  </span>
                  <span className="text-gray-400"> / SLA {g.slaPrevisto} du</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Painel Consultorias ───────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <SectionTitle icon={<Building2 size={16} />} title="Desempenho por Consultoria (vagas externas)" />
        {loading ? (
          <SkeletonCard />
        ) : dadosConsultorias.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Nenhuma vaga externa com consultoria registrada.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tabela */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Consultoria</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Envio (du)</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase">% SLA</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Vagas</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Custo Médio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dadosConsultorias.map((c) => (
                    <tr key={c.nome} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2.5 font-medium text-gray-800 max-w-[140px] truncate">{c.nome}</td>
                      <td className="px-3 py-2.5 text-center text-gray-600">{c.mediaEnvio > 0 ? `${c.mediaEnvio}` : '—'}</td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge variant={c.pctSla >= 80 ? 'verde' : c.pctSla >= 50 ? 'amarelo' : 'vermelho'}>
                          {c.pctSla}%
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-center text-gray-600">{c.qtdVagas}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600 text-xs">{formatCurrency(c.custoMedio)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Gráfico comparativo */}
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dadosConsultorias} margin={{ top: 0, right: 0, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="nome" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
                  formatter={(value, name) => [
                    name === 'pctSla' ? `${value}%` : `${value} du`,
                    name === 'pctSla' ? '% SLA' : 'Envio (du)',
                  ]}
                />
                <Bar dataKey="mediaEnvio" fill="#1A56A0" radius={[4, 4, 0, 0]} name="mediaEnvio" />
                <Bar dataKey="pctSla" fill="#10B981" radius={[4, 4, 0, 0]} name="pctSla" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Painel Comparativos ───────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <SectionTitle icon={<Layers size={16} />} title="Comparativos: Interna vs Externa" />
        {loading ? (
          <SkeletonCard />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Interna vs Externa - barras lado a lado */}
            <div>
              <p className="text-xs text-gray-500 mb-3 font-medium">Tempo médio, % SLA e custo por tipo</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dadosTipos} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="tipo" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
                    formatter={(value, name) => [
                      name === 'pctSla' ? `${value}%` : name === 'custoMedio' ? formatCurrency(value as number) : `${value} du`,
                      { mediaDias: 'Dias médios', pctSla: '% SLA', custoMedio: 'Custo médio' }[name as string] ?? name,
                    ]}
                  />
                  <Bar dataKey="mediaDias" fill="#1A56A0" radius={[4, 4, 0, 0]} name="mediaDias" />
                  <Bar dataKey="pctSla" fill="#10B981" radius={[4, 4, 0, 0]} name="pctSla" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Por nível de vaga */}
            <div>
              <p className="text-xs text-gray-500 mb-3 font-medium">Dias médios por nível (Interna vs Externa)</p>
              {dadosPorNivel.length === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dadosPorNivel} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="nivel" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
                      formatter={(value) => [`${value} du`]}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="interna" fill="#1A56A0" radius={[4, 4, 0, 0]} name="Interna" />
                    <Bar dataKey="externa" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Externa" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Vagas mais atrasadas */}
      {!loading && vagasAtrasadas.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <SectionTitle icon={<AlertTriangle size={16} />} title="Vagas com Maior Atraso" />
          <div className="space-y-3">
            {vagasAtrasadas.map((v: IVagaComSla) => (
              <div key={v.id} className="flex items-center justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{v.nome_vaga}</p>
                  <p className="text-xs text-gray-400 font-mono">{v.codigo_vaga}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700">{v.dias_uteis_totais} du</span>
                  <Badge variant="vermelho">
                    {v.status_geral_sla === 'estourada' ? 'SLA estourado' : 'Atrasada'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
