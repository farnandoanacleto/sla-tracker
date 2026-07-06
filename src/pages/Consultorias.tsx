import React, { useState } from 'react';
import { Plus, Pencil, Power, Building2, Search } from 'lucide-react';
import { useConsultorias } from '@/hooks/useConsultorias';
import { useToast } from '@/contexts/ToastContext';
import { IConsultoria } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { sanitizeText } from '@/utils/sanitize';

interface ConsultoriaFormData {
  nome: string;
  contato: string;
}

const Consultorias: React.FC = () => {
  const { showToast } = useToast();
  const { consultorias, loading, criar, atualizar, toggleAtiva } = useConsultorias();

  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<IConsultoria | null>(null);
  const [form, setForm] = useState<ConsultoriaFormData>({ nome: '', contato: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const consultoriasFiltradas = consultorias.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.contato ?? '').toLowerCase().includes(busca.toLowerCase())
  );

  const abrirModal = (consultoria?: IConsultoria) => {
    setEditando(consultoria ?? null);
    setForm({
      nome: consultoria?.nome ?? '',
      contato: consultoria?.contato ?? '',
    });
    setErrors({});
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setEditando(null);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.nome.trim()) errs.nome = 'Nome é obrigatório';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSalvar = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editando) {
        await atualizar(editando.id, sanitizeText(form.nome), sanitizeText(form.contato));
        showToast('Consultoria atualizada!', 'success');
      } else {
        await criar(sanitizeText(form.nome), sanitizeText(form.contato));
        showToast('Consultoria criada!', 'success');
      }
      fecharModal();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao salvar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (c: IConsultoria) => {
    try {
      await toggleAtiva(c.id, !c.ativa);
      showToast(`Consultoria ${!c.ativa ? 'ativada' : 'desativada'}!`, 'success');
    } catch {
      showToast('Erro ao alterar status', 'error');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consultorias</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {consultorias.length} consultoria{consultorias.length !== 1 ? 's' : ''} cadastrada{consultorias.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="primary" onClick={() => abrirModal()}>
          <Plus size={16} />
          Nova Consultoria
        </Button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome ou contato..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
          id="consultorias-busca"
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : consultoriasFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
          <Building2 size={40} className="text-gray-300" />
          <p className="font-medium">Nenhuma consultoria encontrada</p>
          <Button variant="secondary" onClick={() => abrirModal()}>
            <Plus size={14} /> Cadastrar consultoria
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {consultoriasFiltradas.map((c) => (
            <div
              key={c.id}
              className={[
                'bg-white rounded-xl border shadow-sm p-5 flex flex-col gap-3',
                c.ativa ? 'border-gray-200' : 'border-gray-100 opacity-70',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{c.nome}</p>
                  {c.contato && (
                    <p className="text-sm text-gray-500 mt-0.5 truncate">{c.contato}</p>
                  )}
                </div>
                <Badge variant={c.ativa ? 'verde' : 'cinza'}>
                  {c.ativa ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>

              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100">
                <Button variant="ghost" onClick={() => abrirModal(c)} className="flex-1">
                  <Pencil size={14} />
                  Editar
                </Button>
                <Button
                  variant={c.ativa ? 'danger' : 'secondary'}
                  onClick={() => handleToggle(c)}
                  className="flex-1"
                >
                  <Power size={14} />
                  {c.ativa ? 'Desativar' : 'Ativar'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalAberto}
        onClose={fecharModal}
        title={editando ? 'Editar Consultoria' : 'Nova Consultoria'}
        size="sm"
        disableBackdropClose={saving}
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nome"
            id="consultoria-nome"
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            error={errors.nome}
            placeholder="Nome da consultoria"
            required
          />
          <Input
            label="Contato"
            id="consultoria-contato"
            value={form.contato}
            onChange={(e) => setForm((f) => ({ ...f, contato: e.target.value }))}
            placeholder="E-mail ou telefone (opcional)"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={fecharModal} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSalvar} disabled={saving}>
              {saving ? 'Salvando...' : editando ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Consultorias;
