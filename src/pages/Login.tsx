import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Activity, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type TMode = 'login' | 'signup';

/**
 * Página de Login e Cadastro do SLA Tracker.
 */
const Login: React.FC = () => {
  const [mode, setMode] = useState<TMode>('login');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { login, signup } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (mode === 'signup' && !nome.trim()) errs.nome = 'Nome é obrigatório';
    if (!email.trim()) errs.email = 'E-mail é obrigatório';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'E-mail inválido';
    if (!senha) errs.senha = 'Senha é obrigatória';
    else if (senha.length < 6) errs.senha = 'Mínimo de 6 caracteres';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, senha);
        navigate(from, { replace: true });
      } else {
        await signup(email, senha, nome);
        showToast('Cadastro realizado! Verifique seu e-mail para confirmar.', 'success');
        setMode('login');
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.';
      // Traduções comuns de erro do Supabase
      if (msg.includes('Invalid login credentials')) {
        showToast('E-mail ou senha incorretos.', 'error');
      } else if (msg.includes('Email already registered')) {
        showToast('Este e-mail já está cadastrado.', 'error');
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E3A5F] to-[#0F172A] flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#1A56A0]/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#1A56A0]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-[#1A56A0] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Activity size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">SLA Tracker</h1>
            <p className="text-sm text-gray-500 mt-1">Recrutamento & Seleção — Unimed</p>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={[
                'flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                mode === 'login'
                  ? 'bg-white text-[#1A56A0] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
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
                mode === 'signup'
                  ? 'bg-white text-[#1A56A0] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
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
                  placeholder="••••••••"
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
            </div>

            <Button
              type="submit"
              variant="primary"
              className="mt-2 w-full"
              disabled={loading}
            >
              {loading
                ? 'Aguarde...'
                : mode === 'login'
                ? 'Entrar'
                : 'Criar conta'}
            </Button>
          </form>

          {/* Switch mode */}
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
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-4">
          © {new Date().getFullYear()} Unimed · Sistema interno de RH
        </p>
      </div>
    </div>
  );
};

export default Login;
