import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';


interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Wrapper de proteção de rotas autenticadas.
 * Redireciona para /login se não houver sessão ativa.
 * Exibe esqueleto de carregamento enquanto verifica a sessão.
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#1A56A0] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Verificando sessão...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redireciona para login preservando a rota original para redirect pós-login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
