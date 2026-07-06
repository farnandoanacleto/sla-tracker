import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Activity, Eye, EyeOff, LogIn, UserPlus, ShieldAlert, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { checkRateLimit, recordFailedAttempt, clearLoginAttempts } from '@/lib/rateLimiter';
import { validateStrongPassword } from '@/lib/passwordPolicy';

type TMode = 'login' | 'signup';
type TLoginStep = 'credentials' | 'mfa';

const Login: React.FC = () => {
  const [mode, setMode] = useState<TMode>('login');
  const [step, setStep] = useState<TLoginStep>('credentials');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [blockInfo, setBlockInfo] = useState<{ blocked: boolean; minutesLeft: number }>({ blocked: false, minutesLeft: 0 });

  const { login, signup, checkMfaRequired, challengeAndVerifyMfa } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';
  const sessionExpired = (location.state as { sessionExpired?: boolean } | null)?.sessionExpired ?? false;

  useEffect(() => {
    if (email) {
      const result = checkRateLimit(email);
      setBlockInfo(result);
    }
  }, [email]);

  useEffect(() => {
    if (!blockInfo.blocked) return;
    const interval = setInterval(() => {
      const result = checkRateLimit(email);
      setBlockInfo(result);
    }, 30000);
    return () => clearInterval(interval);
  }, [blockInfo.blocked, email]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (mode === 'signup' && !nome.trim()) errs.nome = 'Nome é obrigatório';
    if (!email.trim()) errs.email = 'E-mail é obrigatório';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'E-mail inválido';
    if (!senha) {
      errs.senha = 'Senha é obrigatória';
    } else if (mode === 'signup') {
      const result = validateStrongPassword(senha);
      if (!result.isValid) errs.senha = result.errors[0];
    } else if (senha.length < 6) {
      errs.senha = 'Senha inválida';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateMfa = (): boolean => {
    if (!mfaCode || mfaCode.length !== 6 || !/^\d+$/.test(mfaCode)) {
      setErrors({ mfa: 'Código deve ter 6 dígitos numéricos' });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleMfaVerify = async () => {
    if (!validateMfa() || !mfaFactorId) return;
    setLoading(true);
    try {
      await challengeAndVerifyMfa(mfaFactorId, mfaCode);
      clearLoginAttempts(email);
      navigate(from, { replace: true });
    } catch {
      setErrors({ mfa: 'Código inválido ou expirado. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 'mfa') {
      await handleMfaVerify();
      return;
    }

    if (!validate()) return;

    const rateCheck = checkRateLimit(email);
    if (rateCheck.blocked) {
      setBlockInfo(rateCheck);
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, senha);
        const mfaCheck = await checkMfaRequired();
        if (mfaCheck.required && mfaCheck.factorId) {
          setMfaFactorId(mfaCheck.factorId);
          setStep('mfa');
          setLoading(false);
          return;
        }
        clearLoginAttempts(email);
        navigate(from, { replace: true });
      } else {
        await signup(email, senha, nome);
        showToast('Cadastro realizado! Verifique seu e-mail para confirmar.', 'success');
        setMode('login');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.';
      if (mode === 'login') {
        const afterRecord = recordFailedAttempt(email);
        setBlockInfo(afterRecord);
        if (msg.includes('Invalid login credentials')) {
          showToast('E-mail ou senha incorretos.', 'error');
        } else if (msg.includes('Email already registered')) {
          showToast('Este e-mail já está cadastrado.', 'error');
        } else {
          showToast(msg, 'error');
        }
      } else {
        showToast(msg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === 'login' ? 'signup' : 'login'));
    setErrors({});
    setStep('credentials');
  };

  const passwordRequirements = mode === 'signup'
    ? ['Mínimo de 10 caracteres', 'Letra maiúscula e minúscula', 'Pelo menos um número', 'Pelo menos um caractere especial (!@#$%...)']
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E3A5F] to-[#0F172A] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#1A56A0]/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#1A56A0]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-[#1A56A0] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Activity size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">SLA Tracker</h1>
            <p className="text-sm text-gray-500 mt-1">Recrutamento & Seleção — Unimed</p>
          </div>

          {/* Alerta sessão expirada */}
          {sessionExpired && step === 'credentials' && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
              <ShieldAlert size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">Sua sessão expirou por segurança. Faça login novamente.</p>
            </div>
          )}

          {/* Alerta rate limiting */}
          {blockInfo.blocked && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3 mb-5">
              <ShieldAlert size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">
                Muitas tentativas. Tente novamente em {blockInfo.minutesLeft}{' '}
                {blockInfo.minutesLeft === 1 ? 'minuto' : 'minutos'}.
              </p>
            </div>
          )}

          {/* Step MFA */}
          {step === 'mfa' ? (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <div className="flex flex-col items-center gap-2 mb-2">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Lock size={24} className="text-[#1A56A0]" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Verificação em 2 etapas</h2>
                <p className="text-sm text-gray-500 text-center">
                  Abra seu aplicativo autenticador e insira o código de 6 dígitos.
                </p>
              </div>

              <Input
                label="Código de verificação"
                id="mfa-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                error={errors.mfa}
                required
                autoFocus
                className="text-center text-2xl tracking-widest font-mono"
              />

              <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                {loading ? 'Verificando...' : 'Confirmar'}
              </Button>

              <button
                type="button"
                onClick={() => { setStep('credentials'); setMfaCode(''); setErrors({}); }}
                className="text-sm text-center text-gray-500 hover:text-[#1A56A0] transition-colors"
              >
                Voltar para login
              </button>
            </form>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={[
                    'flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    mode === 'login' ? 'bg-white text-[#1A56A0] shadow-sm' : 'text-gray-500 hover:text-gray-700',
                  ].join(' ')}
                  aria-pressed={mode === 'login'}
                >
                  <LogIn size={15} />
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={[
                    'flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    mode === 'signup' ? 'bg-white text-[#1A56A0] shadow-sm' : 'text-gray-500 hover:text-gray-700',
                  ].join(' ')}
                  aria-pressed={mode === 'signup'}
                >
                  <UserPlus size={15} />
                  Cadastrar
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                {mode === 'signup' && (
                  <Input
                    label="Nome completo"
                    id="login-nome"
                    type="text"
                    placeholder="Seu nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    error={errors.nome}
                    required
                    autoComplete="name"
                  />
                )}

                <Input
                  label="E-mail"
                  id="login-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  required
                  autoComplete="email"
                />

                <div className="flex flex-col gap-1">
                  <div className="relative">
                    <Input
                      label="Senha"
                      id="login-senha"
                      type={showSenha ? 'text' : 'password'}
                      placeholder="••••••••••"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      error={errors.senha}
                      required
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSenha((s) => !s)}
                      className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {passwordRequirements.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {passwordRequirements.map((req) => (
                        <li key={req} className="flex items-center gap-1.5 text-xs text-gray-500">
                          <span className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="mt-2 w-full"
                  disabled={loading || blockInfo.blocked}
                >
                  {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
                </Button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-[#1A56A0] font-medium hover:underline"
                >
                  {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
                </button>
              </p>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          © {new Date().getFullYear()} Unimed · Sistema interno de RH
        </p>
      </div>
    </div>
  );
};

export default Login;
