import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { CalendarView } from './components/Calendar/CalendarView';
import { PublicBookingView } from './components/Calendar/PublicBookingView';
import { CommercialDashboard } from './components/Dashboard/CommercialDashboard';
import { FinancialReports } from './components/Reports/FinancialReports';
import { PlansManager } from './components/Plans/PlansManager';
import { AvailabilityManager } from './components/Availability/AvailabilityManager';
import { CommissionsOverview } from './components/Commissions/CommissionsOverview';
import { AppointmentModal } from './components/Appointments/AppointmentModal';
import { SaleClosingModal } from './components/Appointments/SaleClosingModal';
import { NotificationDrawer } from './components/Notifications/NotificationDrawer';
import { LoginScreen } from './components/Auth/LoginScreen';
import { Loader2 } from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    activeTab,
    selectedAppointmentId,
    setSelectedAppointmentId,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isSaleClosingModalOpen,
    setIsSaleClosingModalOpen,
    appointmentToCloseSale
  } = useApp();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Navbar */}
      <Navbar
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Content View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {activeTab === 'agenda' && <CalendarView />}
          {activeTab === 'dashboard' && <CommercialDashboard />}
          {activeTab === 'relatorios' && <FinancialReports />}
          {activeTab === 'planos' && <PlansManager />}
          {activeTab === 'disponibilidade' && <AvailabilityManager />}
          {activeTab === 'comissoes' && <CommissionsOverview />}
          {activeTab === 'booking-publico' && <PublicBookingView />}
        </main>
      </div>

      {/* Global Modals */}
      <AppointmentModal
        isOpen={Boolean(selectedAppointmentId) || isCreateModalOpen}
        onClose={() => {
          setSelectedAppointmentId(null);
          setIsCreateModalOpen(false);
        }}
        appointmentId={selectedAppointmentId}
      />

      <SaleClosingModal
        isOpen={isSaleClosingModalOpen}
        onClose={() => setIsSaleClosingModalOpen(false)}
        appointment={appointmentToCloseSale}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
};

const MainApp: React.FC = () => {
  const { authLoading, isAuthenticated } = useApp();
  const currentPath = window.location.pathname;

  // Handle public booking URL directly without authentication
  if (currentPath === '/agendamento-publico' || currentPath.startsWith('/agendamento-publico')) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 antialiased p-4 sm:p-6 lg:p-8">
        <PublicBookingView />
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-indigo-400 font-bold text-sm">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Carregando Ponto Chave...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <MainLayout />;
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
