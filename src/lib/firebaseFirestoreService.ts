import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  runTransaction,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { Appointment, Plan, User, AvailabilityDay, BlockedDate, SystemNotification, HistoryEntry, Sale } from '../types';

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

// APPOINTMENTS
export async function fetchAppointmentsFromFirestore(userRole?: string, userId?: string): Promise<ServiceResult<Appointment[]>> {
  try {
    let q = query(collection(db, 'agenda_appointments'));
    if (userRole === 'comercial' && userId) {
      q = query(collection(db, 'agenda_appointments'), where('assignedTo', '==', userId));
    }
    const snap = await getDocs(q);
    const list: Appointment[] = snap.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    } as Appointment));
    return { data: list, error: null };
  } catch (error: any) {
    console.error('Error fetching appointments:', error);
    return { data: [], error: error.message };
  }
}

export async function saveAppointmentToFirestore(appointment: Appointment): Promise<ServiceResult<Appointment>> {
  try {
    const docRef = doc(db, 'agenda_appointments', appointment.id);
    await setDoc(docRef, appointment, { merge: true });
    return { data: appointment, error: null };
  } catch (error: any) {
    console.error('Error saving appointment:', error);
    return { data: null, error: error.message };
  }
}

export async function deleteAppointmentFromFirestore(id: string): Promise<ServiceResult<boolean>> {
  try {
    const docRef = doc(db, 'agenda_appointments', id);
    await deleteDoc(docRef);
    return { data: true, error: null };
  } catch (error: any) {
    return { data: false, error: error.message };
  }
}

// PUBLIC BOOKING TRANSACTION WITH ATOMIC DOUBLE-BOOKING PROTECTION
export async function createPublicAppointmentInFirestore(payload: {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  planId: string;
  notes: string;
  assignedTo: string;
}): Promise<ServiceResult<Appointment>> {
  // Validate fields strictly
  if (!payload.clientName || payload.clientName.trim().length < 2) {
    return { data: null, error: 'O nome do cliente é obrigatório (mínimo 2 caracteres).' };
  }
  if (!payload.clientEmail || !payload.clientEmail.includes('@')) {
    return { data: null, error: 'E-mail do cliente inválido.' };
  }
  if (!payload.clientPhone || payload.clientPhone.trim().length < 8) {
    return { data: null, error: 'Telefone do cliente inválido.' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.date)) {
    return { data: null, error: 'Data em formato inválido. Use AAAA-MM-DD.' };
  }
  if (!/^\d{2}:\d{2}$/.test(payload.time)) {
    return { data: null, error: 'Horário em formato inválido. Use HH:MM.' };
  }

  const slotKey = `${payload.date}_${payload.time}_${payload.assignedTo}`;
  const appointmentId = `apt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const lockRef = doc(db, 'agenda_slot_locks', slotKey);
  const appointmentRef = doc(db, 'agenda_appointments', appointmentId);
  const createdAt = new Date().toISOString();

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Check atomic lock doc
      const lockDoc = await transaction.get(lockRef);
      if (lockDoc.exists()) {
        throw new Error('Este horário já foi reservado por outro cliente. Por favor, selecione outro horário.');
      }

      // 2. Write atomic lock
      transaction.set(lockRef, {
        slotKey,
        appointmentId,
        createdAt
      });

      // 3. Write appointment document with strict allowed fields
      const newAppointmentDoc = {
        id: appointmentId,
        clientName: payload.clientName.trim(),
        clientEmail: payload.clientEmail.trim(),
        clientPhone: payload.clientPhone.trim(),
        companyName: payload.clientName.trim(),
        title: `Reunião com ${payload.clientName.trim()}`,
        date: payload.date,
        time: payload.time,
        planId: payload.planId || '',
        notes: payload.notes ? payload.notes.trim() : '',
        status: 'pending',
        assignedTo: payload.assignedTo,
        createdAt,
        slotKey,
        attachments: []
      };

      transaction.set(appointmentRef, newAppointmentDoc);
    });

    const createdAppointment: Appointment = {
      id: appointmentId,
      title: `Reunião com ${payload.clientName.trim()}`,
      clientName: payload.clientName.trim(),
      companyName: payload.clientName.trim(),
      city: 'Não informada',
      state: 'SP',
      phone: payload.clientPhone.trim(),
      whatsapp: payload.clientPhone.trim(),
      email: payload.clientEmail.trim(),
      leadSource: 'Website',
      schedulerName: 'Agendamento Público',
      assignedRepId: payload.assignedTo,
      assignedRepName: 'Consultor Comercial',
      date: payload.date,
      time: payload.time,
      durationMinutes: 60,
      meetingType: 'Meet',
      notes: payload.notes || '',
      status: 'Agendada' as any,
      createdAt,
      updatedAt: createdAt,
      attachments: []
    };

    return { data: createdAppointment, error: null };
  } catch (error: any) {
    console.error('Error in createPublicAppointmentInFirestore:', error);
    return { data: null, error: error.message || 'Falha ao agendar horário.' };
  }
}

// PLANS
export async function fetchPlansFromFirestore(): Promise<ServiceResult<Plan[]>> {
  try {
    const snap = await getDocs(collection(db, 'agenda_plans'));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Plan));
    return { data: list, error: null };
  } catch (error: any) {
    return { data: [], error: error.message };
  }
}

export async function savePlanToFirestore(plan: Plan): Promise<ServiceResult<Plan>> {
  try {
    await setDoc(doc(db, 'agenda_plans', plan.id), plan, { merge: true });
    return { data: plan, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function deletePlanFromFirestore(id: string): Promise<ServiceResult<boolean>> {
  try {
    await deleteDoc(doc(db, 'agenda_plans', id));
    return { data: true, error: null };
  } catch (error: any) {
    return { data: false, error: error.message };
  }
}

// PROFILES / USERS
export async function fetchUsersFromFirestore(): Promise<ServiceResult<User[]>> {
  try {
    const snap = await getDocs(collection(db, 'agenda_profiles'));
    const list = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name || 'Sem nome',
        email: data.email || '',
        role: data.role || 'comercial',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'User')}&background=0D8ABC&color=fff`
      } as User;
    });
    return { data: list, error: null };
  } catch (error: any) {
    return { data: [], error: error.message };
  }
}

// AVAILABILITY
export async function fetchAvailabilityFromFirestore(): Promise<ServiceResult<AvailabilityDay[]>> {
  try {
    const snap = await getDocs(collection(db, 'agenda_availability'));
    const list = snap.docs.map(d => {
      const data = d.data();
      return {
        dayOfWeek: data.dayOfWeek ?? 1,
        dayName: data.dayName ?? '',
        enabled: data.enabled ?? true,
        timeSlots: data.timeSlots ?? []
      } as AvailabilityDay;
    });
    return { data: list, error: null };
  } catch (error: any) {
    return { data: [], error: error.message };
  }
}

export async function saveAvailabilityDayToFirestore(avail: AvailabilityDay): Promise<ServiceResult<AvailabilityDay>> {
  try {
    await setDoc(doc(db, 'agenda_availability', `day-${avail.dayOfWeek}`), avail, { merge: true });
    return { data: avail, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

// BLOCKED DATES
export async function fetchBlockedDatesFromFirestore(): Promise<ServiceResult<BlockedDate[]>> {
  try {
    const snap = await getDocs(collection(db, 'agenda_blocked_dates'));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as BlockedDate));
    return { data: list, error: null };
  } catch (error: any) {
    return { data: [], error: error.message };
  }
}

export async function saveBlockedDateToFirestore(bd: BlockedDate): Promise<ServiceResult<BlockedDate>> {
  try {
    await setDoc(doc(db, 'agenda_blocked_dates', bd.id), bd, { merge: true });
    return { data: bd, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function deleteBlockedDateFromFirestore(id: string): Promise<ServiceResult<boolean>> {
  try {
    await deleteDoc(doc(db, 'agenda_blocked_dates', id));
    return { data: true, error: null };
  } catch (error: any) {
    return { data: false, error: error.message };
  }
}

// SALES
export async function fetchSalesFromFirestore(userRole?: string, userId?: string): Promise<ServiceResult<Sale[]>> {
  try {
    let q = query(collection(db, 'agenda_sales'));
    if (userRole === 'comercial' && userId) {
      q = query(collection(db, 'agenda_sales'), where('sellerId', '==', userId));
    }
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Sale));
    return { data: list, error: null };
  } catch (error: any) {
    return { data: [], error: error.message };
  }
}

export async function saveSaleToFirestore(sale: Sale): Promise<ServiceResult<Sale>> {
  try {
    await setDoc(doc(db, 'agenda_sales', sale.id), sale, { merge: true });
    return { data: sale, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

// NOTIFICATIONS
export async function fetchNotificationsFromFirestore(userId: string): Promise<ServiceResult<SystemNotification[]>> {
  try {
    const q = query(collection(db, 'agenda_notifications'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as SystemNotification));
    return { data: list, error: null };
  } catch (error: any) {
    return { data: [], error: error.message };
  }
}

// HISTORY (Only for authenticated users)
export async function fetchHistoryFromFirestore(userId?: string): Promise<ServiceResult<HistoryEntry[]>> {
  try {
    let q = query(collection(db, 'agenda_history'), orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as HistoryEntry));
    return { data: list, error: null };
  } catch (error: any) {
    return { data: [], error: error.message };
  }
}

export async function addHistoryEntryToFirestore(entry: Omit<HistoryEntry, 'id'> & { userId: string }): Promise<ServiceResult<HistoryEntry>> {
  try {
    const id = `hist-${Date.now()}`;
    const docRef = doc(db, 'agenda_history', id);
    const fullEntry = { ...entry, id, createdAt: new Date().toISOString() };
    await setDoc(docRef, fullEntry);
    return { data: fullEntry as HistoryEntry, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}
