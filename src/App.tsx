import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ToastProvider } from '@/contexts/ToastContext';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { AuthGuard } from '@/components/layout/AuthGuard';

import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Vagas from '@/pages/Vagas';
import VagaDetalhe from '@/pages/VagaDetalhe';
import Consultorias from '@/pages/Consultorias';
import Areas from '@/pages/Areas';
import Feriados from '@/pages/Feriados';
import Relatorios from '@/pages/Relatorios';

/**
 * Layout autenticado: Sidebar fixa à esquerda + área de conteúdo.
 * Margem esquerda reage ao estado colapsado da sidebar via contexto.
 */
const AppLayout: React.FC = () => {
  const { collapsed } = useSidebar();
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className={`flex-1 transition-all duration-300 min-w-0 ${collapsed ? 'ml-16' : 'ml-64'}`}>
        <Outlet />
      </main>
    </div>
  );
};

/**
 * Ponto de entrada da aplicação.
 * Rotas públicas: /login
 * Rotas privadas: encapsuladas em AuthGuard + AppLayout
 */
export const App: React.FC = () => {
  return (
    <ToastProvider>
      <SidebarProvider>
        <BrowserRouter>
          <Routes>
            {/* Rota pública */}
            <Route path="/login" element={<Login />} />

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
