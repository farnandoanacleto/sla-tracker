import React from 'react';
import { Link } from 'react-router-dom';

export const AppFooter: React.FC = () => (
  <footer className="border-t border-gray-100 px-6 py-3 bg-white mt-auto">
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
      <span>© {new Date().getFullYear()} Attrax Digital — Todos os direitos reservados</span>
      <div className="flex items-center gap-4">
        <Link
          to="/politica-privacidade"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[#1A56A0] transition-colors"
        >
          Política de Privacidade
        </Link>
        <Link
          to="/termos-de-uso"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[#1A56A0] transition-colors"
        >
          Termos de Uso
        </Link>
      </div>
    </div>
  </footer>
);

export default AppFooter;
