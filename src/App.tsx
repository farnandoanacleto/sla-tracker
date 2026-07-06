import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ToastProvider } from '@/contexts/ToastContext';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AppFooter } from '@/components/layout/AppFooter';
import { IdleSessionGuard } from '@/components/layout/IdleSessionGuard';

import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Vagas from '@/pages/Vagas';
import VagaDetalhe from '@/pages/VagaDetalhe';
import Consultorias from '@/pages/Consultorias';
import Areas from '@/pages/Areas';
import Feriados from '@/pages/Feriados';
import Relatorios from '@/pages/Relatorios';
import SecuritySettings from '@/pages/SecuritySettings';
import MeusDados from '@/pages/MeusDados';
import PoliticaPrivacidade from '@/pages/PoliticaPrivacidade';
import TermosDeUso from '@/pages/TermosDeUso';

const AppLayout: React.FC = () => {
  const { collapsed } = useSidebar();
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <IdleSessionGuard />
      <Sidebar />
      <div className={`flex flex-col flex-1 transition-all duration-300 min-w-0 ${collapsed ? 'ml-16' : 'ml-64'}`}>
        <main className="flex-1">
          <Outlet />
        </main>
        <AppFooter />
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <SidebarProvider>
        <BrowserRouter>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
            <Route path="/termos-de-uso" element={<TermosDeUso />} />

            {/* Rotas protegidas */}
            <Route
              path="/"
              element={
                <AuthGuard>
                  <AppLayout />
                </AuthGuard>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="vagas" element={<Vagas />} />
              <Route path="vagas/:id" element={<VagaDetalhe />} />
              <Route path="consultorias" element={<Consultorias />} />
              <Route path="areas" element={<Areas />} />
              <Route path="feriados" element={<Feriados />} />
              <Route path="relatorios" element={<Relatorios />} />
              <Route path="configuracoes-seguranca" element={<SecuritySettings />} />
              <Route path="configuracoes/meus-dados" element={<MeusDados />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SidebarProvider>
    </ToastProvider>
  );
};

export default App;
