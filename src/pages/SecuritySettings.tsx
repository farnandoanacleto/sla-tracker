import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  QrCode,
  KeyRound,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type TSetupStep = 'idle' | 'qr' | 'verify' | 'success';

interface IMfaFactor {
  id: string;
  status: string;
  factorType: string;
  friendlyName?: string;
}

const SecuritySettings: React.FC = () => {
  const [mfaFactors, setMfaFactors] = useState<IMfaFactor[]>([]);
  const [loadingFactors, setLoadingFactors] = useState(true);
  const [setupStep, setSetupStep] = useState<TSetupStep>('idle');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [enrollFactorId, setEnrollFactorId] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [loading, setLoading] = useState(false);

  const { enrollMfa, verifyAndActivateMfa, unenrollMfa, listMfaFactors } = useAuth();
  const { showToast } = useToast();

  const activeFactor = mfaFactors.find((f) => f.status === 'verified');

  const loadFactors = useCallback(async () => {
    setLoadingFactors(true);
    try {
      const factors = await listMfaFactors();
      setMfaFactors(factors);
    } catch {
      console.error('Erro ao carregar fatores MFA');
    } finally {
      setLoadingFactors(false);
    }
  }, [listMfaFactors]);

  useEffect(() => {
    loadFactors();
  }, [loadFactors]);

  const handleStartEnroll = async () => {
    setLoading(true);
    try {
      const result = await enrollMfa();
      setQrCode(result.qrCode);
      setSecret(result.secret);
      setEnrollFactorId(result.factorId);
      setSetupStep('qr');
    } catch {
      showToast('Erro ao iniciar configuração do MFA. Tente novamente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyCode || verifyCode.length !== 6 || !/^\d+$/.test(verifyCode)) {
      setVerifyError('Código deve ter 6 dígitos numéricos');
      return;
    }
    setVerifyError('');
    setLoading(true);
    try {
      await verifyAndActivateMfa(enrollFactorId, verifyCode);
      setSetupStep('success');
      await loadFactors();
    } catch {
      setVerifyError('Código inválido ou expirado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!activeFactor) return;
    setLoading(true);
    try {
      await unenrollMfa(activeFactor.id);
      showToast('Autenticação em dois fatores desativada.', 'success');
      setSetupStep('idle');
      await loadFactors();
    } catch {
      showToast('Erro ao desativar MFA. Tente novamente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSetup = () => {
    setSetupStep('idle');
    setQrCode('');
    setSecret('');
    setVerifyCode('');
    setVerifyError('');
    setEnrollFactorId('');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#1A56A0]/10 rounded-xl flex items-center justify-center">
          <Shield size={20} className="text-[#1A56A0]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Configurações de Segurança</h1>
          <p className="text-sm text-gray-500">Gerencie a segurança da sua conta</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            {activeFactor ? (
              <ShieldCheck size={22} className="text-green-600 flex-shrink-0" />
            ) : (
              <ShieldOff size={22} className="text-gray-400 flex-shrink-0" />
            )}
            <div>
              <h2 className="text-base font-semibold text-gray-900">Autenticação em 2 fatores (MFA)</h2>
              <p className="text-sm text-gray-500">
                {activeFactor
                  ? 'Ativo — sua conta está protegida com TOTP'
                  : 'Inativo — adicione uma camada extra de segurança'}
              </p>
            </div>
          </div>
          {!loadingFactors && activeFactor && setupStep === 'idle' && (
            <span className="flex-shrink-0 text-xs font-medium px-2.5 py-1 bg-green-50 text-green-700 rounded-full border border-green-100">
              Ativo
            </span>
          )}
        </div>

        {loadingFactors ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
            Verificando configurações...
          </div>
        ) : (
          <>
            {/* Sem MFA ativo */}
            {setupStep === 'idle' && !activeFactor && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-sm text-blue-800">
                    Com o MFA ativado, você precisará de um código do seu aplicativo autenticador
                    (Google Authenticator, Authy) ao fazer login.
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={handleStartEnroll}
                  loading={loading}
                  icon={<QrCode size={16} />}
                >
                  Ativar autenticação em 2 fatores
                </Button>
              </div>
            )}

            {/* Step QR Code */}
            {setupStep === 'qr' && (
              <div className="space-y-5">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-sm text-amber-800 font-medium mb-1">Passo 1: Escaneie o QR Code</p>
                  <p className="text-sm text-amber-700">
                    Abra seu aplicativo autenticador (Google Authenticator, Authy) e escaneie o código abaixo.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-4">
                  {qrCode && (
                    <img
                      src={qrCode}
                      alt="QR Code MFA"
                      className="w-48 h-48 border border-gray-200 rounded-xl p-2 bg-white"
                    />
                  )}
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Ou insira este código manualmente:</p>
                    <code className="text-xs font-mono bg-gray-100 px-3 py-1.5 rounded-lg text-gray-700 break-all select-all">
                      {secret}
                    </code>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    onClick={() => setSetupStep('verify')}
                    className="flex-1"
                    icon={<KeyRound size={16} />}
                  >
                    Continuar para verificação
                  </Button>
                  <Button variant="secondary" onClick={handleCancelSetup}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Step Verify */}
            {setupStep === 'verify' && (
              <div className="space-y-5">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-sm text-blue-800 font-medium mb-1">Passo 2: Confirme o código</p>
                  <p className="text-sm text-blue-700">
                    Insira o código de 6 dígitos gerado pelo seu aplicativo autenticador para confirmar a ativação.
                  </p>
                </div>

                <Input
                  label="Código de verificação"
                  id="verify-mfa-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  error={verifyError}
                  autoFocus
                  className="text-center text-2xl tracking-widest font-mono"
                />

                <div className="flex gap-3">
                  <Button variant="primary" onClick={handleVerify} loading={loading} className="flex-1">
                    Confirmar ativação
                  </Button>
                  <Button variant="secondary" onClick={() => setSetupStep('qr')}>
                    Voltar
                  </Button>
                </div>
              </div>
            )}

            {/* Sucesso */}
            {setupStep === 'success' && (
              <div className="flex flex-col items-center gap-3 py-4">
                <CheckCircle2 size={40} className="text-green-500" />
                <p className="text-base font-semibold text-gray-900">MFA ativado com sucesso!</p>
                <p className="text-sm text-gray-500 text-center">
                  A partir do próximo login, você precisará do código do seu aplicativo autenticador.
                </p>
                <Button variant="secondary" onClick={handleCancelSetup}>
                  Fechar
                </Button>
              </div>
            )}

            {/* Desativar MFA */}
            {setupStep === 'idle' && activeFactor && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-green-50 border border-green-100 rounded-xl p-4">
                  <CheckCircle2 size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800">
                    MFA está ativo. Seu login exige um código do aplicativo autenticador.
                  </p>
                </div>
                <Button
                  variant="danger"
                  onClick={handleDisableMfa}
                  loading={loading}
                  icon={<AlertCircle size={16} />}
                >
                  Desativar autenticação em 2 fatores
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SecuritySettings;
