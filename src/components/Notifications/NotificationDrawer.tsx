import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Bell, CheckCheck, Calendar, DollarSign, AlertTriangle, Clock } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationAsRead, clearAllNotifications, setSelectedAppointmentId, setActiveTab } = useApp();

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'sale':
        return <DollarSign className="w-4 h-4 text-emerald-500" />;
      case 'cancellation':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      default:
        return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs animate-in fade-in" />

      <div className="relative z-10 w-full max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Notificações</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearAllNotifications}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
              title="Marcar todas como lidas"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Limpar
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 space-y-2">
              <Bell className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-sm">Nenhuma notificação recente.</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => {
                  markNotificationAsRead(notif.id);
                  if (notif.appointmentId) {
                    setSelectedAppointmentId(notif.appointmentId);
                    setActiveTab('agenda');
                  }
                  onClose();
                }}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  notif.read
                    ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    : 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-900 shadow-xs text-slate-900 dark:text-white font-medium'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700/60 shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <span className="truncate">{notif.title}</span>
                      {!notif.read && <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-1">
                      {new Date(notif.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
