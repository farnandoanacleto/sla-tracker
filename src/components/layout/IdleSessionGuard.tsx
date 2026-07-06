import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, LogIn } from 'lucide-react';
import { useIdleTimer } from '@/hooks/useIdleTimer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';

const SESSION_EXPIRED_KEY = 'sla_session_expired';

export const IdleSessionGuard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleTimeout = useCallback(async () => {
    sessionStorage.setItem(SESSION_EXPIRED_KEY, 'true');
    await supabase.auth.signOut();
    navigate('/login');
  }, [navigate]);

  const { showWarning, countdown, continueSession } = useIdleTimer(
    user ? handleTimeout : () => {}
  );

  if (!showWarning || !user) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
        <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock size={28} className="text-amber-500" />
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Sessão prestes a expirar
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Você ficou inativo por 30 minutos. A sessão será encerrada automaticamente em:
        </p>

        <div className="text-5xl font-bold text-amber-500 mb-6 tabular-nums">
          {countdown}s
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleTimeout}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Sair agora
          </button>
          <button
            type="button"
            onClick={continueSession}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#1A56A0] rounded-lg hover:bg-blue-800 transition-colors"
          >
            <LogIn size={15} />
            Continuar logado
          </button>
        </div>
      </div>
    </div>
  );
};

export default IdleSessionGuard;
