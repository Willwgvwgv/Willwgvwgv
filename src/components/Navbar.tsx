import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { logout } from '../lib/firebaseAuthService';
import {
  Calendar,
  Search,
  Bell,
  Sun,
  Moon,
  ExternalLink,
  Shield,
  UserCheck,
  Briefcase,
  DollarSign,
  Plus,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  onToggleMobileSidebar: () => void;
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar, onOpenNotifications }) => {
  const {
    currentUser,
    setCurrentUserRole,
    isDarkMode,
    toggleDarkMode,
    searchQuery,
    setSearchQuery,
    setIsCreateModalOpen,
    setActiveTab,
    notifications
  } = useApp();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const roles: { role: UserRole; label: string; icon: any; color: string }[] = [
    { role: 'Administrador', label: 'Administrador (Acesso Total)', icon: Shield, color: 'text-indigo-600 dark:text-indigo-400' },
    { role: 'Comercial', label: 'Comercial (Executivo de Vendas)', icon: Briefcase, color: 'text-emerald-600 dark:text-emerald-400' },
    { role: 'Agendador', label: 'Agendador (SDR / BDR)', icon: UserCheck, color: 'text-blue-600 dark:text-blue-400' },
    { role: 'Financeiro', label: 'Financeiro (Vendas & Comissões)', icon: DollarSign, color: 'text-amber-600 dark:text-amber-400' }
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 lg:px-6 flex items-center justify-between shadow-xs transition-colors">
      {/* Left: Brand logo & mobile toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-hidden"
          title="Abrir Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div
          onClick={() => setActiveTab('agenda')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              Agenda Comercial
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
                Ponto Chave
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Middle: Global Search Input */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por cliente, empresa, cidade, telefone, plano..."
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg outline-hidden transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick New Appointment Button */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-xs sm:text-sm px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Reunião</span>
        </button>

        {/* Public Booking Link Direct Shortcut */}
        <button
          onClick={() => setActiveTab('booking-publico')}
          className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-medium text-xs px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors"
          title="Acessar Link Público de Agendamento"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Link Público</span>
        </button>

        {/* Notifications Icon */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Notificações"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isDarkMode ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Logout Button */}
        <button
          onClick={async () => {
            try {
              await logout();
            } catch (err) {
              console.error('Erro ao sair:', err);
            }
          }}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
          title="Sair do sistema (Logout)"
        >
          <LogOut className="w-5 h-5" />
        </button>

        {/* Role Simulator Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
            title="Simular Permissões de Usuário"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-7 h-7 rounded-full object-cover"
            />
            <div className="hidden md:block text-left text-xs">
              <p className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[110px]">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {currentUser.role}
              </p>
            </div>
          </button>

          {isRoleDropdownOpen && (
            <div
              onClick={() => setIsRoleDropdownOpen(false)}
              className="fixed inset-0 z-40"
            />
          )}

          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Simular Perfil de Acesso
                </p>
              </div>

              {roles.map(r => {
                const IconComp = r.icon;
                const isSelected = currentUser.role === r.role;
                return (
                  <button
                    key={r.role}
                    onClick={() => {
                      setCurrentUserRole(r.role);
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <IconComp className={`w-4 h-4 ${r.color}`} />
                    <span className="flex-1">{r.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
