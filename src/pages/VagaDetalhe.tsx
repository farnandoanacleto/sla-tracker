import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Clock, Calendar, Building2, User, Briefcase, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { useVagas } from '@/hooks/useVagas';
import { useAreas } from '@/hooks/useAreas';
import { useConsultorias } from '@/hooks/useConsultorias';
import { useToast } from '@/contexts/ToastContext';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SkeletonCard } from '@/components/ui/Skeleton';
import VagaTimeline from '@/components/vagas/VagaTimeline';
import VagaSLATable from '@/components/vagas/VagaSLATable';
import VagaForm from '@/components/vagas/VagaForm';
import { IVaga, TSlaStatus } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SLA_BADGE: Record<TSlaStatus, { label: string; variant: 'verde' | 'vermelho' | 'cinza' | 'amarelo' | 'azul' }> = {
  no_prazo: { label: 'No prazo', variant: 'verde' },
  em_andamento: { label: 'Em andamento', variant: 'azul' },
  atrasada: { label: 'Atrasada', variant: 'vermelho' },
  estourada: { label: 'SLA estourado', variant: 'vermelho' },
  pendente: { label: 'Pendente', variant: 'cinza' },
};

const formatDate = (date: string | null) => {
  if (!date) return '—';
  try { return format(parseISO(date), "dd 'de' MMM 'de' yyyy", { locale: ptBR }); } catch { return date; }
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const VagaDetalhe: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { vagaAtual, auditLog, loadingDetalhe, buscarVaga, atualizar } = useVagas();
  const { areas } = useAreas();
  const { consultorias } = useConsultorias();

  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);

  useEffect(() => {
    if (id) buscarVaga(id);
  }, [id, buscarVaga]);

  const handleAtualizar = async (data: Omit<IVaga, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!id) return;
    setSaving(true);
    try {
      await atualizar(id, data);
      showToast('Vaga atualizada com sucesso!', 'success');
      setShowEditModal(false);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao atualizar vaga', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loadingDetalhe) {
    return (
      <div className="p-6 space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!vagaAtual) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-64 gap-4">
        <p className="text-gray-500">Vaga não encontrada.</p>
        <Button variant="secondary" onClick={() => navigate('/vagas')}>
          <ArrowLeft size={16} />
          Voltar
        </Button>
      </div>
    );
  }

  const sla = SLA_BADGE[vagaAtual.status_geral_sla];
  const etapasArray = Object.values(vagaAtual.etapas_sla);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/vagas')}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Voltar para vagas"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{vagaAtual.nome_vaga}</h1>
              <Badge variant={sla.variant}>{sla.label}</Badge>
            </div>
            <p className="text-sm text-gray-500 font-mono mt-0.5">{vagaAtual.codigo_vaga}</p>
          </div>
        </div>
        <Button variant="primary" onClick={() => setShowEditModal(true)}>
          <Edit size={16} />
          Editar vaga
        </Button>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Building2 size={16} />, label: 'Área', value: vagaAtual.area_nome ?? '—' },
          { icon: <User size={16} />, label: 'Gestor', value: vagaAtual.gestor_solicitante },
          { icon: <Briefcase size={16} />, label: 'Tipo / Nível', value: `${vagaAtual.tipo_vaga} / ${vagaAtual.nivel_vaga}` },
          { icon: <DollarSign size={16} />, label: 'Custo', value: formatCurrency(vagaAtual.custo_processo) },
        ].map(({ icon, label, value }) => (
          <div key={label} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              {icon}
              <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
            </div>
            <p className="font-semibold text-gray-800 text-sm capitalize">{value}</p>
          </div>
        ))}
      </div>

      {/* Datas do processo */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Calendar size={14} />
          Datas do Processo
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            { label: 'Solicitação', date: vagaAtual.data_solicitacao },
            { label: 'Aprovação', date: vagaAtual.data_aprovacao },
            { label: 'Abertura Consultoria', date: vagaAtual.data_abertura_consultoria },
            { label: 'Envio Candidatos', date: vagaAtual.data_envio_candidatos },
            { label: 'Entrevista', date: vagaAtual.data_entrevista },
            { label: 'Fechamento', date: vagaAtual.data_fechamento },
            { label: 'Início Colaborador', date: vagaAtual.data_inicio_colaborador },
          ].filter(({ label }) => !(vagaAtual.tipo_vaga === 'interna' && label === 'Abertura Consultoria'))
            .map(({ label, date }) => (
              <div key={label}>
                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                <p className={date ? 'font-medium text-gray-800' : 'text-gray-300'}>
                  {formatDate(date)}
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Clock size={14} />
          Progresso do Processo
        </h2>
        <VagaTimeline etapas={etapasArray} tipoVaga={vagaAtual.tipo_vaga} />
      </div>

      {/* Tabela SLA */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Detalhamento de SLAs por Etapa
        </h2>
        <VagaSLATable vaga={vagaAtual} />
      </div>

      {/* Audit Log */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <button
          type="button"
          onClick={() => setShowAuditLog((s) => !s)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors rounded-xl"
        >
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Histórico de Alterações ({auditLog.length})
          </h2>
          {showAuditLog ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>

        {showAuditLog && (
          <div className="px-6 pb-4">
            {auditLog.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sem alterações registradas.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {auditLog.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#1A56A0] mt-2 flex-shrink-0" />
                    <div className="flex-1 text-sm">
                      <span className="font-medium text-gray-700">{log.campo}</span>
                      <span className="text-gray-400"> alterado de </span>
                      <span className="font-mono text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded">
                        {log.valor_antigo ?? '—'}
                      </span>
                      <span className="text-gray-400"> para </span>
                      <span className="font-mono text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">
                        {log.valor_novo ?? '—'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {format(parseISO(log.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal edição */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Vaga"
        size="xl"
        disableBackdropClose={saving}
      >
        <VagaForm
          initialData={vagaAtual}
          areas={areas}
          consultorias={consultorias}
          onSubmit={handleAtualizar}
          onCancel={() => setShowEditModal(false)}
          loading={saving}
        />
      </Modal>
    </div>
  );
};

export default VagaDetalhe;
