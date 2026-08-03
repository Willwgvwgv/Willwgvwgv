import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Appointment, AppointmentStatus } from '../../types';
import { getStatusBadgeColor, ALL_STATUSES, formatDateBR, formatCurrency } from '../../utils/helpers';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  MapPin,
  Video,
  Copy,
  RefreshCw,
  MoreVertical,
  Filter,
  Users,
  Building,
  Phone,
  CheckCircle2,
  FileText,
  DollarSign
} from 'lucide-react';

export type CalendarMode = 'dia' | 'semana' | 'mes' | 'lista';

export const CalendarView: React.FC = () => {
  const {
    appointments,
    selectedAppointmentId,
    setSelectedAppointmentId,
    setIsCreateModalOpen,
    rescheduleAppointment,
    duplicateAppointment,
    updateAppointmentStatus,
    setAppointmentToCloseSale,
    setIsSaleClosingModalOpen,
    searchQuery,
    currentUser
  } = useApp();

  const [mode, setMode] = useState<CalendarMode>('semana');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  
  // Drag & drop state
  const [draggedAptId, setDraggedAptId] = useState<string | null>(null);

  // Quick date navigation
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (mode === 'dia') d.setDate(d.getDate() - 1);
    else if (mode === 'semana') d.setDate(d.getDate() - 7);
    else if (mode === 'mes') d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (mode === 'dia') d.setDate(d.getDate() + 1);
    else if (mode === 'semana') d.setDate(d.getDate() + 7);
    else if (mode === 'mes') d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Helper to format date YYYY-MM-DD
  const formatIsoDate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Compute week dates (Monday to Sunday)
  const weekDates = useMemo(() => {
    const dates: Date[] = [];
    const curr = new Date(currentDate);
    const day = curr.getDay();
    // Move to Monday (if Sunday (0), go back 6 days)
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(curr.setDate(diff));

    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(startOfWeek);
      nextDay.setDate(startOfWeek.getDate() + i);
      dates.push(nextDay);
    }
    return dates;
  }, [currentDate]);

  // Compute month calendar grid (42 days)
  const monthDates = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
    // Adjust to Monday start
    const offset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - offset);

    const dates: Date[] = [];
    for (let i = 0; i < 35; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [currentDate]);

  // Filter appointments by role permissions and search query
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      // Role filter: Comercial only sees assigned presentations
      if (currentUser.role === 'Comercial' && apt.assignedRepId !== currentUser.id) {
        // Allow if currentUser is assigned
      }

      // Status filter
      if (statusFilter !== 'TODOS' && apt.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesClient = apt.clientName.toLowerCase().includes(q);
        const matchesCompany = apt.companyName.toLowerCase().includes(q);
        const matchesCity = apt.city.toLowerCase().includes(q);
        const matchesPhone = apt.phone.includes(q) || apt.whatsapp.includes(q);
        const matchesEmail = apt.email.toLowerCase().includes(q);
        const matchesPlan = apt.saleDetails?.planName?.toLowerCase().includes(q);

        if (!matchesClient && !matchesCompany && !matchesCity && !matchesPhone && !matchesEmail && !matchesPlan) {
          return false;
        }
      }

      return true;
    });
  }, [appointments, currentUser, statusFilter, searchQuery]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedAptId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropSlot = (e: React.DragEvent, dateStr: string, timeStr?: string) => {
    e.preventDefault();
    const aptId = e.dataTransfer.getData('text/plain') || draggedAptId;
    if (aptId) {
      const apt = appointments.find(a => a.id === aptId);
      if (apt) {
        rescheduleAppointment(aptId, dateStr, timeStr || apt.time);
      }
    }
    setDraggedAptId(null);
  };

  // Time slots for day and week views
  const timeHours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Calendar Header Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation & Mode selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
              title="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Hoje
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
              title="Próximo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white capitalize">
            {mode === 'dia' && currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {mode === 'semana' && `Semana de ${formatDateBR(formatIsoDate(weekDates[0]))} até ${formatDateBR(formatIsoDate(weekDates[6]))}`}
            {mode === 'mes' && currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            {mode === 'lista' && 'Lista Geral de Apresentações'}
          </h2>
        </div>

        {/* View mode toggle (Dia, Semana, Mês, Lista) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(['dia', 'semana', 'mes', 'lista'] as CalendarMode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  mode === m
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {m === 'dia' && 'Dia'}
                {m === 'semana' && 'Semana'}
                {m === 'mes' && 'Mês'}
                {m === 'lista' && 'Lista'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Status Filter Badges Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 shrink-0 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filtrar Status:
        </span>
        <button
          onClick={() => setStatusFilter('TODOS')}
          className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors ${
            statusFilter === 'TODOS'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          Todos ({appointments.length})
        </button>

        {ALL_STATUSES.map(st => {
          const colors = getStatusBadgeColor(st);
          const count = appointments.filter(a => a.status === st).length;
          const isSelected = statusFilter === st;

          return (
            <button
              key={st}
              onClick={() => setStatusFilter(isSelected ? 'TODOS' : st)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 shrink-0 transition-all ${colors.bg} ${colors.text} ${colors.border} ${
                isSelected ? 'ring-2 ring-indigo-500' : 'opacity-85 hover:opacity-100'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
              <span>{st}</span>
              <span className="opacity-75 font-mono text-[10px]">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Main Calendar Render Area */}
      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* WEEK VIEW */}
        {mode === 'semana' && (
          <div className="h-full flex flex-col overflow-y-auto">
            {/* Week Header */}
            <div className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 sticky top-0 z-10">
              <div className="p-3 text-center text-xs font-bold text-slate-400 dark:text-slate-500 border-r border-slate-200 dark:border-slate-800">
                Horário
              </div>
              {weekDates.map((dateObj, idx) => {
                const dateIso = formatIsoDate(dateObj);
                const isToday = dateIso === formatIsoDate(new Date());
                return (
                  <div
                    key={idx}
                    className={`p-3 text-center border-r border-slate-200 dark:border-slate-800 ${
                      isToday ? 'bg-indigo-50/60 dark:bg-indigo-950/30' : ''
                    }`}
                  >
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase">
                      {dateObj.toLocaleDateString('pt-BR', { weekday: 'short' })}
                    </p>
                    <p
                      className={`text-sm font-extrabold mt-0.5 inline-block w-7 h-7 leading-7 rounded-full text-center ${
                        isToday
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {dateObj.getDate()}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Week Hours Grid */}
            <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800/60">
              {timeHours.map(hour => (
                <div key={hour} className="grid grid-cols-8 min-h-[85px]">
                  {/* Hour label */}
                  <div className="p-2 text-center text-xs font-medium text-slate-400 dark:text-slate-500 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                    {hour}
                  </div>

                  {/* Days slots */}
                  {weekDates.map(dateObj => {
                    const dateIso = formatIsoDate(dateObj);
                    const slotAppointments = filteredAppointments.filter(
                      a => a.date === dateIso && a.time.startsWith(hour.substring(0, 2))
                    );

                    return (
                      <div
                        key={dateIso}
                        onDragOver={handleDragOver}
                        onDrop={e => handleDropSlot(e, dateIso, hour)}
                        className="p-1 border-r border-slate-100 dark:border-slate-800/60 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-colors relative min-h-[85px]"
                      >
                        {slotAppointments.map(apt => {
                          const badge = getStatusBadgeColor(apt.status);
                          return (
                            <div
                              key={apt.id}
                              draggable
                              onDragStart={e => handleDragStart(e, apt.id)}
                              onClick={() => setSelectedAppointmentId(apt.id)}
                              className={`p-2 mb-1 rounded-xl border text-xs cursor-pointer shadow-2xs hover:shadow-md hover:scale-[1.02] transition-all ${badge.bg} ${badge.border} ${badge.text}`}
                            >
                              <div className="flex items-center justify-between font-bold text-[11px] mb-0.5">
                                <span className="flex items-center gap-1 truncate">
                                  <Clock className="w-3 h-3 shrink-0 opacity-70" />
                                  {apt.time}
                                </span>
                                <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                              </div>

                              <p className="font-bold text-xs truncate leading-snug">{apt.companyName}</p>
                              <p className="text-[10px] opacity-80 truncate">{apt.clientName}</p>
                              
                              <div className="mt-1 flex items-center justify-between text-[10px] opacity-75 pt-1 border-t border-current/10">
                                <span>{apt.meetingType}</span>
                                <span>{apt.city}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DAY VIEW */}
        {mode === 'dia' && (
          <div className="h-full flex flex-col overflow-y-auto p-4 space-y-4">
            <div className="bg-indigo-50 dark:bg-indigo-950/40 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 flex items-center justify-between">
              <div>
                <p className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold uppercase tracking-wider">
                  Programação do Dia
                </p>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-indigo-600 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" /> Agendar para Hoje
              </button>
            </div>

            <div className="space-y-3">
              {timeHours.map(hour => {
                const dayIso = formatIsoDate(currentDate);
                const hourApts = filteredAppointments.filter(
                  a => a.date === dayIso && a.time.startsWith(hour.substring(0, 2))
                );

                return (
                  <div
                    key={hour}
                    onDragOver={handleDragOver}
                    onDrop={e => handleDropSlot(e, dayIso, hour)}
                    className="flex gap-4 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20"
                  >
                    <div className="w-16 font-mono text-xs font-bold text-slate-400 dark:text-slate-500 pt-1">
                      {hour}
                    </div>

                    <div className="flex-1 space-y-2">
                      {hourApts.length === 0 ? (
                        <div className="h-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center text-xs text-slate-400 hover:bg-indigo-50/30 transition-colors cursor-pointer"
                             onClick={() => setIsCreateModalOpen(true)}>
                          + Livre para agendamento
                        </div>
                      ) : (
                        hourApts.map(apt => {
                          const badge = getStatusBadgeColor(apt.status);
                          return (
                            <div
                              key={apt.id}
                              draggable
                              onDragStart={e => handleDragStart(e, apt.id)}
                              onClick={() => setSelectedAppointmentId(apt.id)}
                              className={`p-4 rounded-xl border shadow-xs hover:shadow-md transition-all cursor-pointer ${badge.bg} ${badge.border}`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-current/10 pb-2 mb-2">
                                <div>
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${badge.bg} ${badge.text} border ${badge.border}`}>
                                    <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                                    {apt.status}
                                  </span>
                                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                                    {apt.companyName}
                                  </h4>
                                </div>

                                <div className="text-right text-xs">
                                  <span className="font-bold text-slate-700 dark:text-slate-300">
                                    {apt.time} ({apt.durationMinutes} min)
                                  </span>
                                  <p className="text-slate-500">{apt.meetingType}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-700 dark:text-slate-300">
                                <p className="flex items-center gap-1.5 font-medium">
                                  <Users className="w-3.5 h-3.5 opacity-70" /> {apt.clientName}
                                </p>
                                <p className="flex items-center gap-1.5 font-medium">
                                  <MapPin className="w-3.5 h-3.5 opacity-70" /> {apt.city} - {apt.state}
                                </p>
                                <p className="flex items-center gap-1.5 font-medium">
                                  <Phone className="w-3.5 h-3.5 opacity-70" /> {apt.whatsapp}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MONTH VIEW */}
        {mode === 'mes' && (
          <div className="h-full flex flex-col overflow-y-auto">
            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-center py-2 text-xs font-bold text-slate-500 uppercase">
              <span>Seg</span>
              <span>Ter</span>
              <span>Qua</span>
              <span>Qui</span>
              <span>Sex</span>
              <span>Sáb</span>
              <span>Dom</span>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 flex-1 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800/80">
              {monthDates.map(dObj => {
                const dateIso = formatIsoDate(dObj);
                const isCurrentMonth = dObj.getMonth() === currentDate.getMonth();
                const isToday = dateIso === formatIsoDate(new Date());
                const dayApts = filteredAppointments.filter(a => a.date === dateIso);

                return (
                  <div
                    key={dateIso}
                    onDragOver={handleDragOver}
                    onDrop={e => handleDropSlot(e, dateIso)}
                    className={`min-h-[100px] p-1.5 transition-colors relative ${
                      !isCurrentMonth ? 'bg-slate-50/50 dark:bg-slate-950/50 opacity-40' : ''
                    } ${isToday ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''}`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span
                        className={`font-bold w-6 h-6 leading-6 rounded-full text-center ${
                          isToday
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {dObj.getDate()}
                      </span>
                      {dayApts.length > 0 && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          {dayApts.length} reuniões
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      {dayApts.slice(0, 3).map(apt => {
                        const badge = getStatusBadgeColor(apt.status);
                        return (
                          <div
                            key={apt.id}
                            draggable
                            onDragStart={e => handleDragStart(e, apt.id)}
                            onClick={() => setSelectedAppointmentId(apt.id)}
                            className={`p-1 rounded-md text-[10px] font-medium border truncate cursor-pointer transition-transform hover:scale-102 ${badge.bg} ${badge.border} ${badge.text}`}
                            title={`${apt.time} - ${apt.companyName} (${apt.status})`}
                          >
                            <span className="font-mono font-bold">{apt.time}</span> {apt.companyName}
                          </div>
                        );
                      })}

                      {dayApts.length > 3 && (
                        <p className="text-[10px] text-center font-bold text-indigo-600 dark:text-indigo-400 pt-0.5">
                          +{dayApts.length - 3} mais...
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LIST VIEW */}
        {mode === 'lista' && (
          <div className="h-full overflow-y-auto p-4 space-y-3">
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <CalendarIcon className="w-10 h-10 mx-auto opacity-40" />
                <p className="text-base font-semibold">Nenhuma apresentação encontrada.</p>
                <p className="text-xs text-slate-500">
                  Tente alterar os filtros ou clique em "Nova Reunião" para agendar.
                </p>
              </div>
            ) : (
              filteredAppointments.map(apt => {
                const badge = getStatusBadgeColor(apt.status);
                return (
                  <div
                    key={apt.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {apt.status}
                        </span>
                        <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {formatDateBR(apt.date)} às {apt.time}
                        </span>
                        <span className="text-xs text-slate-400">• Origem: {apt.leadSource}</span>
                      </div>

                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        {apt.companyName}
                      </h3>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {apt.clientName}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {apt.city} - {apt.state}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {apt.whatsapp}</span>
                        <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5" /> Rep: {apt.assignedRepName}</span>
                      </div>

                      {apt.saleDetails && (
                        <div className="mt-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center justify-between">
                          <span>Venda Fechada: <strong>{apt.saleDetails.planName}</strong> ({formatCurrency(apt.saleDetails.amountPaid)})</span>
                          <span>Comissão: <strong>{formatCurrency(apt.saleDetails.commissionAmount)}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-3 md:pt-0">
                      {apt.status !== 'Venda fechada' && (
                        <button
                          onClick={() => {
                            setAppointmentToCloseSale(apt);
                            setIsSaleClosingModalOpen(true);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors shadow-xs"
                        >
                          <DollarSign className="w-3.5 h-3.5" /> Fechar Venda
                        </button>
                      )}

                      <button
                        onClick={() => duplicateAppointment(apt.id)}
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Duplicar Reunião"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setSelectedAppointmentId(apt.id)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-colors"
                      >
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
