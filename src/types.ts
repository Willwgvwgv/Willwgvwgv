export type AppointmentStatus =
  | 'Agendada'
  | 'Confirmada'
  | 'Apresentação realizada'
  | 'Proposta enviada'
  | 'Negociação'
  | 'Venda fechada'
  | 'Venda perdida'
  | 'Cancelada';

export type UserRole = 'Administrador' | 'Comercial' | 'Agendador' | 'Financeiro';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
}

export interface Plan {
  id: string;
  name: string; // e.g., 'Plano Bronze', 'Plano Prata', 'Plano Ouro', 'Plano Premium'
  price: number;
  description: string;
  active: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
  url?: string;
}

export interface HistoryEntry {
  id: string;
  appointmentId: string;
  user: string;
  timestamp: string; // ISO or formatted date string
  description: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
}

export interface Sale {
  id: string;
  appointmentId: string;
  clientName: string;
  companyName: string;
  planId: string;
  planName: string;
  planPrice: number;
  amountPaid: number;
  paymentMethod: 'Pix' | 'Cartão de Crédito' | 'Boleto' | 'Transferência';
  installments: number;
  closedAt: string; // YYYY-MM-DD
  commissionAmount: number;
  salesRepId: string;
  salesRepName: string;
  notes?: string;
}

export interface Appointment {
  id: string;
  title: string;
  clientName: string;
  companyName: string;
  city: string;
  state: string;
  phone: string;
  whatsapp: string;
  email: string;
  leadSource: 'Website' | 'Instagram' | 'Indicação' | 'Cold Call' | 'Tráfego Pago' | 'Evento' | 'Outro';
  schedulerName: string; // Responsável pelo agendamento
  assignedRepId: string; // Responsável comercial
  assignedRepName: string;
  
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (e.g. "09:00")
  durationMinutes: number; // e.g. 60
  
  meetingType: 'Meet' | 'Zoom' | 'Presencial';
  meetLink?: string;
  zoomLink?: string;
  locationAddress?: string;

  status: AppointmentStatus;
  
  notes?: string;
  postPresentationNotes?: string;
  lostReason?: string;
  nextContactDate?: string;
  remindNextContact?: boolean;
  
  attachments: Attachment[];
  saleDetails?: Sale;
  
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilityDay {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  dayName: string;
  enabled: boolean;
  timeSlots: string[]; // ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"]
}

export interface BlockedDate {
  id: string;
  date: string; // YYYY-MM-DD or range
  endDate?: string; // YYYY-MM-DD
  reason: string; // "Férias", "Feriado", "Viagem", "Evento", "Manutenção"
  fullDay: boolean;
  startTime?: string;
  endTime?: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'booking' | 'cancellation' | 'reschedule' | 'reminder' | 'sale';
  appointmentId?: string;
  timestamp: string;
  read: boolean;
}

export interface CommissionConfig {
  feePerPresentation: number; // e.g. R$ 50 per presentation performed
  commissionPercentageOnSale: number; // e.g. 5%
  fixedCommissionOnSale: number; // e.g. R$ 0 or R$ 200
  type: 'percentage' | 'fixed' | 'hybrid';
}
