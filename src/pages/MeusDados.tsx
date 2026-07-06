import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Trash2,
  ShieldCheck,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { meusDadosService } from '@/services/meusDadosService';
import { IUserConsent, IExclusionRequest } from '@/types';

const CONSENT_LABELS: Record<string, string> = {
  privacy_policy: 'Política de Privacidade',
  terms_of_use: 'Termos de Uso',
};

const STATUS_CONFIG: Record<
  IExclusionRequest['status'],
  { label: string; icon: React.ReactNode; className: string }
> = {
  pendente: {
    label: 'Pendente',
    icon: <Clock size={14} />,
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  processada: {
    label: 'Processada',
    icon: <CheckCircle2 size={14} />,
    className: 'bg-green-50 text-green-700 border border-green-200',
  },
  cancelada: {
    label: 'Cancelada',
    icon: <XCircle size={14} />,
    className: 'bg-gray-50 text-gray-500 border border-gray-200',
  },
};

const SectionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}> = ({ icon, title, description, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
      <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 text-[#1A56A0]">
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </div>
    <div className="px-6 py-5">{children}</div>
  </div>
);

interface IDeleteModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

const DeleteModal: React.FC<IDeleteModalProps> = ({ onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={20} className="text-red-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">Solicitar exclusão de conta</h3>
          <p className="text-xs text-gray-500 mt-0.5">Esta ação é irreversível</p>
        </div>
      </div>

      <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-5 text-sm text-red-800 space-y-2">
        <p>
          Ao confirmar, sua solicitação será registrada e processada em até{' '}
          <strong>15 dias úteis</strong>.
        </p>
        <p>
          Durante esse período, seus dados permanecerão no sistema. Após a exclusão, não será
          possível recuperar vagas, histórico de auditorias ou configurações associadas à sua conta.
        </p>
        <p>
          Dados exigidos por lei (como logs de auditoria trabalhista) serão anonimizados conforme
          a política de retenção.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          Confirmar solicitação
        </button>
      </div>
    </div>
  </div>
);

const MeusDados: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [consentimentos, setConsentimentos] = useState<IUserConsent[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<IExclusionRequest[]>([]);
  const [loadingConsents, setLoadingConsents] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const userId = user?.id ?? '';

  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoadingConsents(true);
    setLoadingRequests(true);
    try {
      const [consents, requests] = await Promise.all([
        meusDadosService.listarConsentimentos(userId),
        meusDadosService.listarSolicitacoesExclusao(userId),
      ]);
      setConsentimentos(consents);
      setSolicitacoes(requests);
    } catch {
      console.error('Erro ao carregar dados do usuário');
    } finally {
      setLoadingConsents(false);
      setLoadingRequests(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExport = async () => {
    if (!userId) return;
    setExportLoading(true);
    try {
      await meusDadosService.exportarDados(userId);
      showToast('Arquivo JSON gerado com sucesso.', 'success');
    } catch {
      showToast('Erro ao exportar dados. Tente novamente.', 'error');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userId) return;
    setDeleteLoading(true);
    try {
      await meusDadosService.solicitarExclusao(userId);
      setShowDeleteModal(false);
      showToast('Solicitação registrada. Você receberá confirmação em até 15 dias úteis.', 'success');
      await loadData();
    } catch {
      showToast('Erro ao registrar solicitação. Tente novamente.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const hasPendingRequest = solicitacoes.some((r) => r.status === 'pendente');

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));

  return (
    <>
      {showDeleteModal && (
        <DeleteModal
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteModal(false)}
          loading={deleteLoading}
        />
      )}

      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">Meus Dados</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie seus dados pessoais conforme os direitos previstos na LGPD (art. 18).
          </p>
        </div>

        {/* Exportação */}
        <SectionCard
          icon={<Download size={18} />}
          title="Exportação de dados"
          description="Baixe uma cópia de todos os seus dados armazenados no sistema."
        >
          <p className="text-sm text-gray-600 mb-4">
            O arquivo JSON incluirá seu perfil, todas as vagas que você cadastrou, seu histórico
            de auditoria e os registros de consentimento LGPD.
          </p>
          <button
            type="button"
            onClick={handleExport}
            disabled={exportLoading}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#1A56A0] rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-60"
          >
            {exportLoading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Download size={15} />
            )}
            Exportar meus dados
          </button>
        </SectionCard>

        {/* Histórico de consentimentos */}
        <SectionCard
          icon={<ShieldCheck size={18} />}
          title="Histórico de consentimentos"
          description="Registro dos termos e políticas que você aceitou ao usar o sistema."
        >
          {loadingConsents ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
              <Loader2 size={14} className="animate-spin" />
              Carregando...
            </div>
          ) : consentimentos.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum consentimento registrado.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {consentimentos.map((c) => (
                <li key={c.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {CONSENT_LABELS[c.consent_type] ?? c.consent_type}
                      </p>
                      {c.ip_address && (
                        <p className="text-xs text-gray-400 mt-0.5">IP: {c.ip_address}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatDate(c.accepted_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* Política de retenção */}
        <SectionCard
          icon={<FileText size={18} />}
          title="Política de retenção de dados"
          description="Por quanto tempo seus dados são mantidos no sistema."
        >
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex gap-3">
              <span className="w-2 h-2 rounded-full bg-[#1A56A0] flex-shrink-0 mt-1.5" />
              <span>
                <strong className="text-gray-800">Vagas encerradas</strong> — dados mantidos por{' '}
                <strong>2 anos</strong> a partir do fechamento. Após esse período, são anonimizados.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="w-2 h-2 rounded-full bg-[#1A56A0] flex-shrink-0 mt-1.5" />
              <span>
                <strong className="text-gray-800">Logs de auditoria</strong> — mantidos por{' '}
                <strong>5 anos</strong> por exigências trabalhistas e de compliance.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="w-2 h-2 rounded-full bg-[#1A56A0] flex-shrink-0 mt-1.5" />
              <span>
                <strong className="text-gray-800">Dados de candidatos rejeitados</strong> — mantidos
                por <strong>6 meses</strong> após a conclusão do processo, depois anonimizados ou
                excluídos.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="w-2 h-2 rounded-full bg-[#1A56A0] flex-shrink-0 mt-1.5" />
              <span>
                <strong className="text-gray-800">Registros de consentimento</strong> — mantidos
                permanentemente como evidência de conformidade legal.
              </span>
            </li>
          </ul>
          <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
            Base legal: LGPD art. 7º incisos I, V e IX · Contato DPO: fernando@attrax.com.br
          </p>
        </SectionCard>

        {/* Solicitação de exclusão */}
        <SectionCard
          icon={<Trash2 size={18} />}
          title="Solicitar exclusão da conta"
          description="Direito à eliminação de dados pessoais (LGPD art. 18, inciso VI)."
        >
          {hasPendingRequest ? (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <Clock size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Solicitação de exclusão em andamento
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Sua solicitação foi registrada e será processada em até 15 dias úteis. Entre em
                  contato em <a href="mailto:fernando@attrax.com.br" className="underline">fernando@attrax.com.br</a> caso
                  precise de informações.
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Você pode solicitar a exclusão permanente da sua conta e dados pessoais. A exclusão
                é <strong>irreversível</strong> e será processada em até <strong>15 dias úteis</strong>.
                Dados exigidos por lei serão anonimizados antes da exclusão.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 size={15} />
                Solicitar exclusão da conta
              </button>
            </>
          )}

          {/* Histórico de solicitações */}
          {!loadingRequests && solicitacoes.length > 0 && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">
                Histórico de solicitações
              </p>
              <ul className="space-y-2">
                {solicitacoes.map((req) => {
                  const config = STATUS_CONFIG[req.status];
                  return (
                    <li key={req.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{formatDate(req.requested_at)}</span>
                      <span
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}
                      >
                        {config.icon}
                        {config.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </SectionCard>
      </div>
    </>
  );
};

export default MeusDados;
