import React, { useState } from 'react';
import { Plus, Pencil, Trash2, CalendarOff, Search, Lock } from 'lucide-react';
import { useFeriados } from '@/hooks/useFeriados';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { IFeriado } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/DatePicker';
import { Modal } from '@/components/ui/Modal';
import { SkeletonTableRow } from '@/components/ui/Skeleton';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FeriadoFormData {
  data: string;
  descricao: string;
  ano: number;
}

const ANOS_DISPONIVEIS = [2024, 2025, 2026, 2027];

const Feriados: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { feriados, loading, criar, atualizar, excluir } = useFeriados();
  const isAdmin = user?.profile?.role === 'admin';

  const [busca, setBusca] = useState('');
  const [anoFiltro, setAnoFiltro] = useState<number | 'todos'>('todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<IFeriado | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<IFeriado | null>(null);
  const [form, setForm] = useState<FeriadoFormData>({
    data: '',
    descricao: '',
    ano: new Date().getFullYear(),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const feriadosFiltrados = feriados.filter((f) => {
    const matchBusca = f.descricao.toLowerCase().includes(busca.toLowerCase());
    const matchAno = anoFiltro === 'todos' || f.ano === anoFiltro;
    return matchBusca && matchAno;
  });

  // Agrupar por ano
  const porAno = feriadosFiltrados.reduce<Record<number, IFeriado[]>>((acc, f) => {
    if (!acc[f.ano]) acc[f.ano] = [];
    acc[f.ano].push(f);
    return acc;
  }, {});

  const abrirModal = (feriado?: IFeriado) => {
    setEditando(feriado ?? null);
    setForm({
      data: feriado?.data ?? '',
      descricao: feriado?.descricao ?? '',
      ano: feriado?.ano ?? new Date().getFullYear(),
    });
    setErrors({});
    setModalAberto(true);
  };

  const fecharModal = () => { setModalAberto(false); setEditando(null); };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.data) errs.data = 'Data é obrigatória';
    if (!form.descricao.trim()) errs.descricao = 'Descrição é obrigatória';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSalvar = async () => {
    if (!validate()) return;
    setSaving(true);
    // Extrair o ano da data selecionada
    const ano = new Date(form.data + 'T00:00:00').getFullYear();
    try {
      if (editando) {
        await atualizar(editando.id, form.data, form.descricao, ano);
        showToast('Feriado atualizado!', 'success');
      } else {
        await criar(form.data, form.descricao, ano);
        showToast('Feriado cadastrado!', 'success');
      }
      fecharModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar';
      if (msg.includes('unique') || msg.includes('duplicate')) {
        showToast('Esta data já está cadastrada como feriado.', 'error');
      } else {
        showToast(msg, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleExcluir = async () => {
    if (!confirmandoExclusao) return;
    try {
      await excluir(confirmandoExclusao.id);
      showToast('Feriado excluído!', 'success');
      setConfirmandoExclusao(null);
    } catch {
      showToast('Erro ao excluir feriado', 'error');
    }
  };

  const formatDateFull = (date: string) => {
    try { return format(parseISO(date), "dd 'de' MMMM", { locale: ptBR }); } catch { return date; }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feriados</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {feriados.length} feriado{feriados.length !== 1 ? 's' : ''} cadastrado{feriados.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isAdmin && (
          <Button variant="primary" onClick={() => abrirModal()}>
            <Plus size={16} />
            Novo Feriado
          </Button>
        )}
      </div>

      {/* Aviso para usuários não-admin */}
      {!isAdmin && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <Lock size={15} className="flex-shrink-0" />
          <span>Somente administradores podem adicionar ou editar feriados.</span>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por descrição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
            id="feriados-busca"
          />
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setAnoFiltro('todos')}
            className={[
              'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              anoFiltro === 'todos' ? 'bg-[#1A56A0] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50',
            ].join(' ')}
          >
            Todos
          </button>
          {ANOS_DISPONIVEIS.map((ano) => (
            <button
              key={ano}
              type="button"
              onClick={() => setAnoFiltro(ano)}
              className={[
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                anoFiltro === ano ? 'bg-[#1A56A0] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50',
              ].join(' ')}
            >
              {ano}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <table className="w-full text-sm">
            <tbody>{Array.from({ length: 8 }).map((_, i) => <SkeletonTableRow key={i} cols={4} />)}</tbody>
          </table>
        ) : feriadosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <CalendarOff size={40} className="text-gray-300" />
            <p className="font-medium">Nenhum feriado encontrado</p>
          </div>
        ) : (
          Object.entries(porAno)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([ano, lista]) => (
              <div key={ano}>
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{ano}</span>
                </div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100">
                    {lista.map((f) => (
                      <tr key={f.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                              <CalendarOff size={14} className="text-[#1A56A0]" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{f.descricao}</p>
                              <p className="text-xs text-gray-400">{formatDateFull(f.data)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                          {f.data}
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => abrirModal(f)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-[#1A56A0] hover:bg-blue-50 transition-colors"
                                aria-label="Editar feriado"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmandoExclusao(f)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                aria-label="Excluir feriado"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
        )}
      </div>

      {/* Modal criar/editar */}
      <Modal
        isOpen={modalAberto}
        onClose={fecharModal}
        title={editando ? 'Editar Feriado' : 'Novo Feriado'}
        size="sm"
        disableBackdropClose={saving}
      >
        <div className="flex flex-col gap-4">
          <DatePicker
            label="Data"
            id="feriado-data"
            value={form.data}
            onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
            error={errors.data}
            required
          />
          <Input
            label="Descrição"
            id="feriado-descricao"
            value={form.descricao}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            error={errors.descricao}
            placeholder="Ex: Natal"
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={fecharModal} disabled={saving}>Cancelar</Button>
            <Button variant="primary" onClick={handleSalvar} disabled={saving}>
              {saving ? 'Salvando...' : editando ? 'Salvar' : 'Cadastrar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal confirmação exclusão */}
      <Modal
        isOpen={!!confirmandoExclusao}
        onClose={() => setConfirmandoExclusao(null)}
        title="Confirmar Exclusão"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            Tem certeza que deseja excluir o feriado{' '}
            <strong>{confirmandoExclusao?.descricao}</strong>?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setConfirmandoExclusao(null)}>Cancelar</Button>
            <Button variant="danger" onClick={handleExcluir}>Excluir</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Feriados;
