import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSidebar } from '@/contexts/SidebarContext';
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  Users,
  CalendarOff,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Activity,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
  { to: '/vagas', icon: <Briefcase size={20} />, label: 'Vagas' },
  { to: '/consultorias', icon: <Building2 size={20} />, label: 'Consultorias' },
  { to: '/areas', icon: <Users size={20} />, label: 'Áreas' },
  { to: '/feriados', icon: <CalendarOff size={20} />, label: 'Feriados' },
  { to: '/relatorios', icon: <BarChart3 size={20} />, label: 'Relatórios' },
];

/**
 * Sidebar fixa colapsável com navegação principal.
 * Fundo escuro #0F172A. Colapsa para 64px mostrando apenas ícones.
 */
export const Sidebar: React.FC = () => {
  const { collapsed, setCollapsed } = useSidebar();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      showToast('Erro ao sair. Tente novamente.', 'error');
    }
  };

  const sidebarWidth = collapsed ? 'w-16' : 'w-64';

  return (
    <aside
      className={[
        'fixed inset-y-0 left-0 z-40 flex flex-col',
        'bg-[#0F172A] text-white transition-all duration-300 ease-in-out',
        sidebarWidth,
      ].join(' ')}
      aria-label="Navegação principal"
    >
      {/* Logo / Brand */}
      <div className="flex items-center h-16 px-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 bg-[#1A56A0] rounded-lg flex items-center justify-center">
            <Activity size={16} className="text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white leading-tight truncate">SLA Tracker</p>
              <p className="text-xs text-slate-400 leading-tight truncate">Recrutamento & Seleção</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2">
        <ul className="flex flex-col gap-1" role="list">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                    'transition-all duration-150 group relative',
                    isActive
                      ? 'bg-[#1A56A0] text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white',
                    collapsed ? 'justify-center' : '',
                  ].join(' ')
                }
                aria-label={collapsed ? item.label : undefined}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}

                {/* Tooltip quando collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
                    {item.label}
                  </div>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User info + logout */}
      <div className="flex-shrink-0 border-t border-white/10 p-2">
        {!collapsed && user?.profile && (
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium text-white truncate">
              {user.profile.nome}
            </p>
            <p className="text-xs text-slate-500 truncate">{user.profile.email}</p>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className={[
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg',
            'text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400',
            'transition-all duration-150',
            collapsed ? 'justify-center' : '',
          ].join(' ')}
          aria-label="Sair da conta"
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>

      {/* Toggle collapse */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-20 w-6 h-6 bg-[#1A56A0] rounded-full flex items-center justify-center text-white shadow-md hover:bg-blue-700 transition-colors z-50"
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
};

export default Sidebar;
