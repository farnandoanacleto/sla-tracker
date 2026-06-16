import React, { useState } from 'react';
import { Plus, Pencil, Users, Search } from 'lucide-react';
import { useAreas } from '@/hooks/useAreas';
import { useToast } from '@/contexts/ToastContext';
import { IArea } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SkeletonCard } from '@/components/ui/Skeleton';

interface AreaFormData {
  nome: string;
  responsavel: string;
}

const Areas: React.FC = () => {
  const { showToast } = useToast();
  const { areas, loading, criar, atualizar } = useAreas();

  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<IArea | null>(null);
  const [form, setForm] = useState<AreaFormData>({ nome: '', responsavel: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const areasFiltradas = areas.filter((a) =>
    a.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (a.responsavel ?? '').toLowerCase().includes(busca.toLowerCase())
  );

  const abrirModal = (area?: IArea) => {
    setEditando(area ?? null);
    setForm({ nome: area?.nome ?? '', responsavel: area?.responsavel ?? '' });
    setErrors({});
    setModalAberto(true);
  };

  const fecharModal = () => { setModalAberto(false); setEditando(null); };

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
        await atualizar(editando.id, form.nome, form.responsavel);
        showToast('Área atualizada!', 'success');
      } else {
        await criar(form.nome, form.responsavel);
        showToast('Área criada!', 'success');
      }
      fecharModal();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao salvar', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Áreas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {areas.length} área{areas.length !== 1 ? 's' : ''} cadastrada{areas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="primary" onClick={() => abrirModal()}>
          <Plus size={16} />
          Nova Área
        </Button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome ou responsável..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
          id="areas-busca"
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : areasFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
          <Users size={40} className="text-gray-300" />
          <p className="font-medium">Nenhuma área encontrada</p>
          <Button variant="secondary" onClick={() => abrirModal()}>
            <Plus size={14} /> Cadastrar área
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {areasFiltradas.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mb-2">
                    <Users size={15} className="text-[#1A56A0]" />
                  </div>
                  <p className="font-semibold text-gray-800">{a.nome}</p>
                  {a.responsavel && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      Responsável: {a.responsavel}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-auto pt-2 border-t border-gray-100">
                <Button variant="ghost" onClick={() => abrirModal(a)} className="w-full">
                  <Pencil size={14} />
                  Editar
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
        title={editando ? 'Editar Área' : 'Nova Área'}
        size="sm"
        disableBackdropClose={saving}
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nome da Área"
            id="area-nome"
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            error={errors.nome}
            placeholder="Ex: Tecnologia da Informação"
            required
          />
          <Input
            label="Responsável"
            id="area-responsavel"
            value={form.responsavel}
            onChange={(e) => setForm((f) => ({ ...f, responsavel: e.target.value }))}
            placeholder="Nome do responsável (opcional)"
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

export default Areas;
