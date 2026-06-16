import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, X, ExternalLink } from 'lucide-react';
import { useVagas } from '@/hooks/useVagas';
import { useAreas } from '@/hooks/useAreas';
import { useConsultorias } from '@/hooks/useConsultorias';
import { useToast } from '@/contexts/ToastContext';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { SkeletonTableRow } from '@/components/ui/Skeleton';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import VagaForm from '@/components/vagas/VagaForm';
import { IVaga, IVagaComSla, TSlaStatus } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SLA_STATUS_BADGE: Record<TSlaStatus, { label: string; variant: 'verde' | 'vermelho' | 'cinza' | 'amarelo' | 'azul' }> = {
  no_prazo: { label: 'No prazo', variant: 'verde' },
  em_andamento: { label: 'Em andamento', variant: 'azul' },
  atrasada: { label: 'Atrasada', variant: 'vermelho' },
  estourada: { label: 'SLA estourado', variant: 'vermelho' },
  pendente: { label: 'Pendente', variant: 'cinza' },
};

const formatDate = (date: string | null) => {
  if (!date) return '—';
  try { return format(parseISO(date), 'dd/MM/yyyy', { locale: ptBR }); } catch { return date; }
};

const ITEMS_PER_PAGE = 20;

const Vagas: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { vagas, loading, filtros, atualizarFiltros, limparFiltros, criar } = useVagas();
  const { areas } = useAreas();
  const { consultorias } = useConsultorias();

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const totalPages = Math.ceil(vagas.length / ITEMS_PER_PAGE);
  const vagasPaginadas = vagas.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleCriarVaga = async (data: Omit<IVaga, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    setSaving(true);
    try {
      const nova = await criar(data);
      showToast('Vaga criada com sucesso!', 'success');
      setShowModal(false);
      navigate(`/vagas/${nova.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar vaga';
      if (msg.includes('duplicate') || msg.includes('unique')) {
        showToast('Código de vaga já cadastrado.', 'error');
      } else {
        showToast(msg, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const areaOptions = [
    { value: 'todas', label: 'Todas as áreas' },
    ...areas.map((a) => ({ value: a.id, label: a.nome })),
  ];



  const temFiltros =
    filtros.busca ||
    filtros.tipo_vaga !== 'todas' ||
    filtros.nivel_vaga !== 'todos' ||
    filtros.area_id !== 'todas' ||
    filtros.consultoria_id !== 'todas' ||
    filtros.status_sla !== 'todos' ||
    filtros.data_inicio ||
    filtros.data_fim;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vagas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? '...' : `${vagas.length} vaga${vagas.length !== 1 ? 's' : ''} encontrada${vagas.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setShowFilters((s) => !s)}
            className="relative"
          >
            <Filter size={16} />
            Filtros
            {temFiltros && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#1A56A0] rounded-full" />
            )}
          </Button>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            Nova Vaga
          </Button>
        </div>
      </div>

      {/* Barra de busca rápida */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por código, nome ou gestor..."
          value={filtros.busca}
          onChange={(e) => { atualizarFiltros({ busca: e.target.value }); setPage(1); }}
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
          id="vagas-busca"
        />
        {filtros.busca && (
          <button
            type="button"
            onClick={() => atualizarFiltros({ busca: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filtros avançados */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Tipo"
              id="filtro-tipo"
              value={filtros.tipo_vaga}
              onChange={(e) => { atualizarFiltros({ tipo_vaga: e.target.value as typeof filtros.tipo_vaga }); setPage(1); }}
              options={[
                { value: 'todas', label: 'Todos os tipos' },
                { value: 'interna', label: 'Interna' },
                { value: 'externa', label: 'Externa' },
              ]}
            />
            <Select
              label="Nível"
              id="filtro-nivel"
              value={filtros.nivel_vaga}
              onChange={(e) => { atualizarFiltros({ nivel_vaga: e.target.value as typeof filtros.nivel_vaga }); setPage(1); }}
              options={[
                { value: 'todos', label: 'Todos os níveis' },
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
              id="filtro-sla"
              value={filtros.status_sla}
              onChange={(e) => { atualizarFiltros({ status_sla: e.target.value as typeof filtros.status_sla }); setPage(1); }}
              options={[
                { value: 'todos', label: 'Todos os status' },
                { value: 'no_prazo', label: 'No prazo' },
                { value: 'em_andamento', label: 'Em andamento' },
                { value: 'atrasada', label: 'Atrasada' },
                { value: 'estourada', label: 'SLA estourado' },
                { value: 'pendente', label: 'Pendente' },
              ]}
            />
            <Select
              label="Área"
              id="filtro-area"
              value={filtros.area_id}
              onChange={(e) => { atualizarFiltros({ area_id: e.target.value }); setPage(1); }}
              options={areaOptions}
            />
          </div>
          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
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

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Código</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Área</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Tipo / Nível</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Solicitação</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status SLA</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonTableRow key={i} cols={7} />
                ))
              ) : vagasPaginadas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={32} className="text-gray-300" />
                      <p className="font-medium">Nenhuma vaga encontrada</p>
                      <p className="text-sm">Tente ajustar os filtros ou crie uma nova vaga.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                vagasPaginadas.map((vaga: IVagaComSla) => {
                  const sla = SLA_STATUS_BADGE[vaga.status_geral_sla];
                  return (
                    <tr
                      key={vaga.id}
                      className="hover:bg-gray-50/70 transition-colors cursor-pointer"
                      onClick={() => navigate(`/vagas/${vaga.id}`)}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-[#1A56A0]">
                        {vaga.codigo_vaga}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 truncate max-w-[180px]">{vaga.nome_vaga}</p>
                        <p className="text-xs text-gray-400">{vaga.gestor_solicitante}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                        {vaga.area_nome ?? '—'}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex flex-col gap-1">
                          <span className="capitalize text-gray-600 text-xs">{vaga.tipo_vaga}</span>
                          <span className="capitalize text-gray-400 text-xs">{vaga.nivel_vaga}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                        {formatDate(vaga.data_solicitacao)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={sla.variant}>{sla.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); navigate(`/vagas/${vaga.id}`); }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#1A56A0] hover:bg-blue-50 transition-colors"
                          aria-label="Ver detalhes"
                        >
                          <ExternalLink size={15} />
                        </button>
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
              Exibindo {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, vagas.length)} de {vagas.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-1 text-gray-400">…</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setPage(p)}
                      className={[
                        'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                        p === page
                          ? 'bg-[#1A56A0] text-white'
                          : 'text-gray-600 hover:bg-gray-100',
                      ].join(' ')}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
              <Button
                variant="ghost"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Próximo
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal criar vaga */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nova Vaga"
        size="xl"
        disableBackdropClose={saving}
      >
        <VagaForm
          areas={areas}
          consultorias={consultorias}
          onSubmit={handleCriarVaga}
          onCancel={() => setShowModal(false)}
          loading={saving}
        />
      </Modal>
    </div>
  );
};

export default Vagas;
