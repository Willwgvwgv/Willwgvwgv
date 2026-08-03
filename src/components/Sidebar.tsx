import React from 'react';
import { useApp, ActiveTab } from '../context/AppContext';
import {
  Calendar,
  LayoutDashboard,
  FileSpreadsheet,
  Package,
  Clock,
  Award,
  Globe,
  Bell,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const { activeTab, setActiveTab, currentUser, notifications } = useApp();
  const unreadNotifs = notifications.filter(n => !n.read).length;

  const navItems: { id: ActiveTab; label: string; icon: any; badge?: number | string; allowedRoles?: string[] }[] = [
    { id: 'agenda', label: 'Minha Agenda', icon: Calendar },
    { id: 'dashboard', label: 'Dashboard & Funil', icon: LayoutDashboard },
    { id: 'relatorios', label: 'Relatórios & Financeiro', icon: FileSpreadsheet },
    { id: 'comissoes', label: 'Controle de Comissões', icon: Award },
    { id: 'planos', label: 'Cadastro de Planos', icon: Package },
    { id: 'disponibilidade', label: 'Disponibilidade & Regras', icon: Clock },
    { id: 'booking-publico', label: 'Link Público de Agendamento', icon: Globe, badge: 'Público' }
  ];

  const handleSelect = (tab: ActiveTab) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 w-64 border-r border-slate-800 transition-colors">
      {/* User profile card */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/30"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-white truncate">{currentUser.name}</p>
            <p className="text-xs text-indigo-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {currentUser.role}
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation Menu */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold tracking-wider uppercase text-slate-500 py-1">
          Menu Principal
        </p>

        {navItems.map(item => {
          const IconComp = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <IconComp className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {item.badge}
                </span>
              )}

              {isActive && !item.badge && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
            </button>
          );
        })}
      </nav>

      {/* Footer info box */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60">
        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-white">
            <span>Status da Operação</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Ativo
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Ponto Chave CRM & Agendamento Integrado v2.4
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block shrink-0">{navContent}</aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          />
          <div className="relative z-10 animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
