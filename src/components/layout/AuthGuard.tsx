import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const SESSION_EXPIRED_KEY = 'sla_session_expired';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading && !user) {
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
    const sessionExpired = sessionStorage.getItem(SESSION_EXPIRED_KEY) === 'true';
    if (sessionExpired) sessionStorage.removeItem(SESSION_EXPIRED_KEY);
    return <Navigate to="/login" state={{ from: location, sessionExpired }} replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
