import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChangedListener, logout, getUserProfile } from '../lib/firebaseAuthService';
import {
  fetchAppointmentsFromFirestore,
  saveAppointmentToFirestore,
  deleteAppointmentFromFirestore,
  fetchPlansFromFirestore,
  savePlanToFirestore,
  deletePlanFromFirestore,
  fetchUsersFromFirestore,
  fetchAvailabilityFromFirestore,
  saveAvailabilityDayToFirestore,
  fetchBlockedDatesFromFirestore,
  saveBlockedDateToFirestore,
  deleteBlockedDateFromFirestore,
  fetchSalesFromFirestore,
  saveSaleToFirestore,
  fetchNotificationsFromFirestore,
  fetchHistoryFromFirestore,
  addHistoryEntryToFirestore
} from '../lib/firebaseFirestoreService';
import {
  Appointment,
  AppointmentStatus,
  Plan,
  User,
  UserRole,
  AvailabilityDay,
  BlockedDate,
  SystemNotification,
  HistoryEntry,
  Sale,
  CommissionConfig,
  Attachment
} from '../types';

export type ActiveTab = 'agenda' | 'dashboard' | 'relatorios' | 'planos' | 'disponibilidade' | 'comissoes' | 'booking-publico';

interface AppContextType {
  // Authentication State
  authLoading: boolean;
  isAuthenticated: boolean;
  logoutUser: () => Promise<void>;

  // Database Connection Status/Error
  dbError: string | null;

  // Navigation & Theme
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  
  // User & Roles
  currentUser: User;
  setCurrentUserRole: (role: UserRole) => void;
  users: User[];

  // Data Collections
  appointments: Appointment[];
  plans: Plan[];
  availability: AvailabilityDay[];
  blockedDates: BlockedDate[];
  history: HistoryEntry[];
  notifications: SystemNotification[];
  commissionConfig: CommissionConfig;

  // Search & Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Actions
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'attachments'> & { attachments?: Attachment[] }) => Appointment;
  updateAppointment: (id: string, updates: Partial<Appointment>, changeDescription?: string) => void;
  updateAppointmentStatus: (id: string, newStatus: AppointmentStatus, saleInfo?: Partial<Sale>, lostReason?: string) => void;
  rescheduleAppointment: (id: string, newDate: string, newTime: string) => void;
  duplicateAppointment: (id: string) => void;
  deleteAppointment: (id: string) => void;

  // Plans Management
  addPlan: (plan: Omit<Plan, 'id'>) => void;
  updatePlan: (id: string, updates: Partial<Plan>) => void;
  deletePlan: (id: string) => void;

  // Availability & Blocked Dates
  updateAvailabilityDay: (dayOfWeek: number, enabled: boolean, timeSlots: string[]) => void;
  addBlockedDate: (blockedDate: Omit<BlockedDate, 'id'>) => void;
  deleteBlockedDate: (id: string) => void;
  updateCommissionConfig: (config: Partial<CommissionConfig>) => void;

  // Attachments & Notes
  addAttachment: (appointmentId: string, attachment: Omit<Attachment, 'id' | 'uploadedAt'>) => void;
  removeAttachment: (appointmentId: string, attachmentId: string) => void;

  // Notifications
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Modals state
  selectedAppointmentId: string | null;
  setSelectedAppointmentId: (id: string | null) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  isSaleClosingModalOpen: boolean;
  setIsSaleClosingModalOpen: (open: boolean) => void;
  appointmentToCloseSale: Appointment | null;
  setAppointmentToCloseSale: (apt: Appointment | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_USER: User = {
  id: 'user-default',
  name: 'Usuário Comercial',
  email: 'comercial@pontochave.com.br',
  role: 'Administrador',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
};

const DEFAULT_COMMISSION_CONFIG: CommissionConfig = {
  feePerPresentation: 50,
  commissionPercentageOnSale: 5,
  fixedCommissionOnSale: 0,
  type: 'percentage'
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);

  const getInitialTabFromUrl = (): ActiveTab => {
    const path = window.location.pathname;
    if (path.includes('/agendamento-publico')) return 'booking-publico';
    if (path.includes('/agenda-comercial/agendamentos') || path === '/agenda' || path === '/agenda-comercial') return 'agenda';
    if (path.includes('/agenda-comercial/relatorios') || path === '/relatorios') return 'relatorios';
    if (path.includes('/agenda-comercial/planos') || path === '/planos') return 'planos';
    if (path.includes('/agenda-comercial/disponibilidade') || path === '/disponibilidade') return 'disponibilidade';
    if (path.includes('/agenda-comercial/vendas') || path.includes('/comissoes')) return 'comissoes';
    return 'dashboard';
  };

  const [activeTab, setActiveTabState] = useState<ActiveTab>(getInitialTabFromUrl);

  const setActiveTab = (tab: ActiveTab) => {
    setActiveTabState(tab);
    let path = '/agenda-comercial';
    if (tab === 'agenda') path = '/agenda-comercial/agendamentos';
    else if (tab === 'dashboard') path = '/agenda-comercial';
    else if (tab === 'booking-publico') path = '/agendamento-publico';
    else if (tab === 'relatorios') path = '/agenda-comercial/relatorios';
    else if (tab === 'planos') path = '/agenda-comercial/planos';
    else if (tab === 'disponibilidade') path = '/agenda-comercial/disponibilidade';
    else if (tab === 'comissoes') path = '/agenda-comercial/vendas';

    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
  };

  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [users, setUsers] = useState<User[]>([]);

  // Firebase Auth Observer & Profile Fetching
  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener(async (user) => {
      if (user && user.email) {
        setIsAuthenticated(true);
        const profile = await getUserProfile(user.uid);
        const roleMap: Record<string, UserRole> = {
          admin: 'Administrador',
          comercial: 'Comercial',
          agendador: 'Agendador',
          financeiro: 'Financeiro'
        };
        const mappedRole: UserRole = profile?.role ? (roleMap[profile.role] || 'Comercial') : 'Administrador';

        setCurrentUser({
          id: user.uid,
          name: profile?.name || user.displayName || user.email.split('@')[0],
          email: user.email,
          role: mappedRole,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || user.email)}&background=4F46E5&color=fff`
        });
      } else {
        setIsAuthenticated(false);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logoutUser = async () => {
    try {
      await logout();
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
  };

  // Data Collections initialized strictly empty
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [availability, setAvailability] = useState<AvailabilityDay[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [commissionConfig, setCommissionConfig] = useState<CommissionConfig>(DEFAULT_COMMISSION_CONFIG);

  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isSaleClosingModalOpen, setIsSaleClosingModalOpen] = useState<boolean>(false);
  const [appointmentToCloseSale, setAppointmentToCloseSale] = useState<Appointment | null>(null);

  // Load all remote collections from Firestore
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      const dbRole = currentUser.role === 'Comercial' ? 'comercial' : 'admin';
      const [
        aptsRes,
        plansRes,
        usersRes,
        availRes,
        blockedRes,
        notifRes,
        histRes
      ] = await Promise.all([
        fetchAppointmentsFromFirestore(dbRole, currentUser.id),
        fetchPlansFromFirestore(),
        fetchUsersFromFirestore(),
        fetchAvailabilityFromFirestore(),
        fetchBlockedDatesFromFirestore(),
        fetchNotificationsFromFirestore(currentUser.id),
        fetchHistoryFromFirestore(currentUser.id)
      ]);

      if (!mounted) return;

      if (aptsRes.error) setDbError(aptsRes.error);
      setAppointments(aptsRes.data || []);
      setPlans(plansRes.data || []);
      setUsers(usersRes.data || []);
      setAvailability(availRes.data || []);
      setBlockedDates(blockedRes.data || []);
      setNotifications(notifRes.data || []);
      setHistory(histRes.data || []);
    }

    if (isAuthenticated) {
      loadData();
    } else {
      // Load public-safe data for booking screen if unauthenticated
      fetchPlansFromFirestore().then(res => setPlans(res.data || []));
      fetchAvailabilityFromFirestore().then(res => setAvailability(res.data || []));
      fetchBlockedDatesFromFirestore().then(res => setBlockedDates(res.data || []));
      fetchUsersFromFirestore().then(res => setUsers(res.data || []));
    }

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, currentUser.id, currentUser.role]);

  // Dark mode HTML class handler
  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  const setCurrentUserRole = (role: UserRole) => {
    setCurrentUser(prev => ({ ...prev, role }));
  };

  const logHistory = (appointmentId: string, description: string) => {
    const newEntry: HistoryEntry = {
      id: `h-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      appointmentId,
      user: currentUser.name,
      timestamp: new Date().toLocaleString('pt-BR'),
      description
    };
    setHistory(prev => [newEntry, ...prev]);
  };

  const addNotification = (title: string, message: string, type: SystemNotification['type'], appointmentId?: string) => {
    const newNotif: SystemNotification = {
      id: `n-${Date.now()}`,
      title,
      message,
      type,
      appointmentId,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const addAppointment = (data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'attachments'> & { attachments?: Attachment[] }): Appointment => {
    const newId = `apt-${Date.now()}`;
    const nowIso = new Date().toISOString();
    
    const newApt: Appointment = {
      ...data,
      id: newId,
      attachments: data.attachments || [],
      createdAt: nowIso,
      updatedAt: nowIso
    };

    setAppointments(prev => [newApt, ...prev]);
    saveAppointmentToFirestore(newApt);
    if (isAuthenticated) {
      addHistoryEntryToFirestore({
        appointmentId: newId,
        user: currentUser.name,
        userId: currentUser.id,
        timestamp: new Date().toLocaleString('pt-BR'),
        description: `Reunião agendada com ${newApt.clientName} (${newApt.companyName}) para ${newApt.date} às ${newApt.time}.`
      });
    }
    addNotification(
      'Nova Reunião Agendada!',
      `${newApt.clientName} (${newApt.companyName}) agendou para ${newApt.date} às ${newApt.time}.`,
      'booking',
      newId
    );

    return newApt;
  };

  const updateAppointment = (id: string, updates: Partial<Appointment>, changeDescription?: string) => {
    let targetApt: Appointment | undefined;
    setAppointments(prev =>
      prev.map(apt => {
        if (apt.id === id) {
          const updated = { ...apt, ...updates, updatedAt: new Date().toISOString() };
          targetApt = updated;
          return updated;
        }
        return apt;
      })
    );

    if (targetApt) {
      saveAppointmentToFirestore(targetApt);
    }

    if (changeDescription) {
      logHistory(id, changeDescription);
    } else {
      logHistory(id, `Dados da reunião atualizados por ${currentUser.name}.`);
    }
  };

  const updateAppointmentStatus = (id: string, newStatus: AppointmentStatus, saleInfo?: Partial<Sale>, lostReason?: string) => {
    const apt = appointments.find(a => a.id === id);
    if (!apt) return;

    const oldStatus = apt.status;
    let newSaleDetails: Sale | undefined = apt.saleDetails;

    // Calculate commission if sale closed
    if (newStatus === 'Venda fechada' && saleInfo) {
      const planPrice = saleInfo.planPrice || 0;
      const amountPaid = saleInfo.amountPaid || planPrice;
      const presFee = commissionConfig.feePerPresentation;
      const salePercent = (amountPaid * commissionConfig.commissionPercentageOnSale) / 100;
      const fixedSale = commissionConfig.fixedCommissionOnSale;
      const totalCommission = presFee + salePercent + fixedSale;

      newSaleDetails = {
        id: `sale-${Date.now()}`,
        appointmentId: id,
        clientName: apt.clientName,
        companyName: apt.companyName,
        planId: saleInfo.planId || '',
        planName: saleInfo.planName || 'Plano Personalizado',
        planPrice: planPrice,
        amountPaid: amountPaid,
        paymentMethod: saleInfo.paymentMethod || 'Pix',
        installments: saleInfo.installments || 1,
        closedAt: saleInfo.closedAt || new Date().toISOString().split('T')[0],
        commissionAmount: Math.round(totalCommission),
        salesRepId: currentUser.id,
        salesRepName: currentUser.name,
        notes: saleInfo.notes || ''
      };

      saveSaleToFirestore(newSaleDetails);

      addNotification(
        '🎉 Venda Fechada!',
        `${currentUser.name} fechou ${saleInfo.planName || 'um plano'} com ${apt.companyName} no valor de R$ ${amountPaid.toLocaleString('pt-BR')}!`,
        'sale',
        id
      );
    }

    if (newStatus === 'Cancelada') {
      addNotification(
        'Reunião Cancelada',
        `A reunião com ${apt.clientName} (${apt.companyName}) foi cancelada.`,
        'cancellation',
        id
      );
    }

    const updatedApt: Appointment = {
      ...apt,
      status: newStatus,
      saleDetails: newSaleDetails,
      lostReason: lostReason !== undefined ? lostReason : apt.lostReason,
      updatedAt: new Date().toISOString()
    };

    setAppointments(prev =>
      prev.map(a => (a.id === id ? updatedApt : a))
    );
    saveAppointmentToFirestore(updatedApt);

    logHistory(
      id,
      `Status alterado de "${oldStatus}" para "${newStatus}".${lostReason ? ` Motivo da perda: ${lostReason}` : ''}${newSaleDetails ? ` Plano: ${newSaleDetails.planName} (R$ ${newSaleDetails.amountPaid.toLocaleString('pt-BR')})` : ''}`
    );
  };

  const rescheduleAppointment = (id: string, newDate: string, newTime: string) => {
    const apt = appointments.find(a => a.id === id);
    if (!apt) return;

    const oldDate = apt.date;
    const oldTime = apt.time;

    const updatedApt: Appointment = {
      ...apt,
      date: newDate,
      time: newTime,
      updatedAt: new Date().toISOString()
    };

    setAppointments(prev =>
      prev.map(a => (a.id === id ? updatedApt : a))
    );
    saveAppointmentToFirestore(updatedApt);

    logHistory(id, `Reagendado de ${oldDate} às ${oldTime} para ${newDate} às ${newTime}.`);
    addNotification(
      'Reunião Reagendada',
      `Reunião com ${apt.clientName} (${apt.companyName}) reagendada para ${newDate} às ${newTime}.`,
      'reschedule',
      id
    );
  };

  const duplicateAppointment = (id: string) => {
    const apt = appointments.find(a => a.id === id);
    if (!apt) return;

    const newId = `apt-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const duplicated: Appointment = {
      ...apt,
      id: newId,
      title: `${apt.title} (Cópia)`,
      status: 'Agendada',
      saleDetails: undefined,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    setAppointments(prev => [duplicated, ...prev]);
    saveAppointmentToFirestore(duplicated);
    logHistory(newId, `Reunião duplicada a partir de #${id}.`);
  };

  const deleteAppointment = (id: string) => {
    const apt = appointments.find(a => a.id === id);
    if (apt) {
      logHistory(id, `Reunião excluída por ${currentUser.name}.`);
    }
    setAppointments(prev => prev.filter(a => a.id !== id));
    deleteAppointmentFromFirestore(id);
  };

  // Plans CRUD
  const addPlan = (planData: Omit<Plan, 'id'>) => {
    const newPlan: Plan = { ...planData, id: `p-${Date.now()}` };
    setPlans(prev => [...prev, newPlan]);
    savePlanToFirestore(newPlan);
  };

  const updatePlan = (id: string, updates: Partial<Plan>) => {
    setPlans(prev =>
      prev.map(p => {
        if (p.id === id) {
          const updated = { ...p, ...updates };
          savePlanToFirestore(updated);
          return updated;
        }
        return p;
      })
    );
  };

  const deletePlan = (id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id));
    deletePlanFromFirestore(id);
  };

  // Availability & Blocked dates
  const updateAvailabilityDay = (dayOfWeek: number, enabled: boolean, timeSlots: string[]) => {
    setAvailability(prev =>
      prev.map(a => {
        if (a.dayOfWeek === dayOfWeek) {
          const updated = { ...a, enabled, timeSlots };
          saveAvailabilityDayToFirestore(updated);
          return updated;
        }
        return a;
      })
    );
  };

  const addBlockedDate = (blockedData: Omit<BlockedDate, 'id'>) => {
    const newBd: BlockedDate = { ...blockedData, id: `bd-${Date.now()}` };
    setBlockedDates(prev => [...prev, newBd]);
    saveBlockedDateToFirestore(newBd);
  };

  const deleteBlockedDate = (id: string) => {
    setBlockedDates(prev => prev.filter(b => b.id !== id));
    deleteBlockedDateFromFirestore(id);
  };

  const updateCommissionConfig = (config: Partial<CommissionConfig>) => {
    setCommissionConfig(prev => ({ ...prev, ...config }));
  };

  // Attachments
  const addAttachment = (appointmentId: string, attachment: Omit<Attachment, 'id' | 'uploadedAt'>) => {
    const newAtt: Attachment = {
      ...attachment,
      id: `att-${Date.now()}`,
      uploadedAt: new Date().toISOString().split('T')[0]
    };
    setAppointments(prev =>
      prev.map(a => {
        if (a.id === appointmentId) {
          const updated = { ...a, attachments: [...a.attachments, newAtt] };
          saveAppointmentToFirestore(updated);
          return updated;
        }
        return a;
      })
    );
    logHistory(appointmentId, `Documento "${attachment.name}" anexado à reunião.`);
  };

  const removeAttachment = (appointmentId: string, attachmentId: string) => {
    setAppointments(prev =>
      prev.map(a => {
        if (a.id === appointmentId) {
          const updated = {
            ...a,
            attachments: a.attachments.filter(att => att.id !== attachmentId)
          };
          saveAppointmentToFirestore(updated);
          return updated;
        }
        return a;
      })
    );
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <AppContext.Provider
      value={{
        authLoading,
        isAuthenticated,
        logoutUser,
        dbError,
        activeTab,
        setActiveTab,
        isDarkMode,
        toggleDarkMode,
        currentUser,
        setCurrentUserRole,
        users,
        appointments,
        plans,
        availability,
        blockedDates,
        history,
        notifications,
        commissionConfig,
        searchQuery,
        setSearchQuery,
        addAppointment,
        updateAppointment,
        updateAppointmentStatus,
        rescheduleAppointment,
        duplicateAppointment,
        deleteAppointment,
        addPlan,
        updatePlan,
        deletePlan,
        updateAvailabilityDay,
        addBlockedDate,
        deleteBlockedDate,
        updateCommissionConfig,
        addAttachment,
        removeAttachment,
        markNotificationAsRead,
        clearAllNotifications,
        selectedAppointmentId,
        setSelectedAppointmentId,
        isCreateModalOpen,
        setIsCreateModalOpen,
        isSaleClosingModalOpen,
        setIsSaleClosingModalOpen,
        appointmentToCloseSale,
        setAppointmentToCloseSale
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
