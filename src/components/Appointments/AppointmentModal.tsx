import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Appointment, AppointmentStatus, Attachment } from '../../types';
import { getStatusBadgeColor, ALL_STATUSES, LEAD_SOURCES, BRAZILIAN_STATES, formatDateBR, formatCurrency } from '../../utils/helpers';
import {
  X,
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Video,
  FileText,
  Paperclip,
  History,
  DollarSign,
  Trash2,
  Copy,
  Plus,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId?: string | null; // If null, create mode
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({ isOpen, onClose, appointmentId }) => {
  const {
    appointments,
    users,
    history,
    addAppointment,
    updateAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    duplicateAppointment,
    addAttachment,
    removeAttachment,
    setAppointmentToCloseSale,
    setIsSaleClosingModalOpen,
    currentUser
  } = useApp();

  const isEdit = Boolean(appointmentId);
  const existingApt = appointments.find(a => a.id === appointmentId);

  const [activeTab, setActiveTab] = useState<'geral' | 'estagio' | 'anexos' | 'historico'>('geral');

  // Form states
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [leadSource, setLeadSource] = useState<Appointment['leadSource']>('Website');
  const [schedulerName, setSchedulerName] = useState(currentUser.name);
  const [assignedRepId, setAssignedRepId] = useState(currentUser.id);

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');
  const [durationMinutes, setDurationMinutes] = useState(60);

  const [meetingType, setMeetingType] = useState<'Meet' | 'Zoom' | 'Presencial'>('Meet');
  const [meetLink, setMeetLink] = useState('');
  const [zoomLink, setZoomLink] = useState('');
  const [locationAddress, setLocationAddress] = useState('');

  const [status, setStatus] = useState<AppointmentStatus>('Agendada');
  const [notes, setNotes] = useState('');
  const [postPresentationNotes, setPostPresentationNotes] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [nextContactDate, setNextContactDate] = useState('');
  const [remindNextContact, setRemindNextContact] = useState(false);

  // Attachment upload simulation
  const [newAttName, setNewAttName] = useState('');

  useEffect(() => {
    if (existingApt) {
      setTitle(existingApt.title || '');
      setClientName(existingApt.clientName || '');
      setCompanyName(existingApt.companyName || '');
      setCity(existingApt.city || '');
      setState(existingApt.state || 'SP');
      setPhone(existingApt.phone || '');
      setWhatsapp(existingApt.whatsapp || '');
      setEmail(existingApt.email || '');
      setLeadSource(existingApt.leadSource || 'Website');
      setSchedulerName(existingApt.schedulerName || currentUser.name);
      setAssignedRepId(existingApt.assignedRepId || currentUser.id);
      setDate(existingApt.date);
      setTime(existingApt.time);
      setDurationMinutes(existingApt.durationMinutes || 60);
      setMeetingType(existingApt.meetingType || 'Meet');
      setMeetLink(existingApt.meetLink || '');
      setZoomLink(existingApt.zoomLink || '');
      setLocationAddress(existingApt.locationAddress || '');
      setStatus(existingApt.status);
      setNotes(existingApt.notes || '');
      setPostPresentationNotes(existingApt.postPresentationNotes || '');
      setLostReason(existingApt.lostReason || '');
      setNextContactDate(existingApt.nextContactDate || '');
      setRemindNextContact(existingApt.remindNextContact || false);
    } else {
      // Reset for new creation
      setTitle('');
      setClientName('');
      setCompanyName('');
      setCity('');
      setState('SP');
      setPhone('');
      setWhatsapp('');
      setEmail('');
      setLeadSource('Website');
      setSchedulerName(currentUser.name);
      setAssignedRepId(currentUser.id);
      setDate(new Date().toISOString().split('T')[0]);
      setTime('09:00');
      setDurationMinutes(60);
      setMeetingType('Meet');
      setMeetLink('https://meet.google.com/imo-' + Math.random().toString(36).substring(2, 7));
      setZoomLink('');
      setLocationAddress('');
      setStatus('Agendada');
      setNotes('');
      setPostPresentationNotes('');
      setLostReason('');
      setNextContactDate('');
      setRemindNextContact(false);
    }
  }, [existingApt, isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedRep = users.find(u => u.id === assignedRepId);

    if (isEdit && appointmentId) {
      updateAppointment(appointmentId, {
        title: title || `Apresentação Comercial - ${companyName}`,
        clientName,
        companyName,
        city,
        state,
        phone,
        whatsapp,
        email,
        leadSource,
        schedulerName,
        assignedRepId,
        assignedRepName: assignedRep ? assignedRep.name : currentUser.name,
        date,
        time,
        durationMinutes: Number(durationMinutes),
        meetingType,
        meetLink,
        zoomLink,
        locationAddress,
        notes,
        postPresentationNotes,
        lostReason,
        nextContactDate,
        remindNextContact
      });

      if (status !== existingApt?.status) {
        if (status === 'Venda fechada' && existingApt) {
          setAppointmentToCloseSale(existingApt);
          setIsSaleClosingModalOpen(true);
        } else {
          updateAppointmentStatus(appointmentId, status, undefined, status === 'Venda perdida' ? lostReason : undefined);
        }
      }
    } else {
      const created = addAppointment({
        title: title || `Apresentação Comercial - ${companyName}`,
        clientName,
        companyName,
        city,
        state,
        phone,
        whatsapp,
        email,
        leadSource,
        schedulerName,
        assignedRepId,
        assignedRepName: assignedRep ? assignedRep.name : currentUser.name,
        date,
        time,
        durationMinutes: Number(durationMinutes),
        meetingType,
        meetLink,
        zoomLink,
        locationAddress,
        status,
        notes,
        postPresentationNotes,
        lostReason,
        nextContactDate,
        remindNextContact
      });

      if (status === 'Venda fechada') {
        setAppointmentToCloseSale(created);
        setIsSaleClosingModalOpen(true);
      }
    }

    onClose();
  };

  const handleAddAttachmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttName.trim() || !appointmentId) return;
    addAttachment(appointmentId, {
      name: newAttName,
      size: `${(Math.random() * 3 + 0.5).toFixed(1)} MB`,
      type: newAttName.endsWith('.pdf') ? 'application/pdf' : 'application/docx'
    });
    setNewAttName('');
  };

  const currentHistory = appointmentId
    ? history.filter(h => h.appointmentId === appointmentId)
    : [];

  const statusBadge = getStatusBadgeColor(status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in" />

      <div className="relative z-10 w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border ${statusBadge.bg} ${statusBadge.border} ${statusBadge.text}`}>
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                  {status}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  #{appointmentId || 'NOVO'}
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                {isEdit ? companyName || 'Editar Reunião' : 'Nova Apresentação Comercial'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 bg-white dark:bg-slate-900 overflow-x-auto">
          <button
            onClick={() => setActiveTab('geral')}
            className={`py-3 px-4 font-bold text-xs border-b-2 flex items-center gap-2 shrink-0 transition-colors ${
              activeTab === 'geral'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" /> Dados Gerais
          </button>

          <button
            onClick={() => setActiveTab('estagio')}
            className={`py-3 px-4 font-bold text-xs border-b-2 flex items-center gap-2 shrink-0 transition-colors ${
              activeTab === 'estagio'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" /> Funil & Observações
          </button>

          {isEdit && (
            <button
              onClick={() => setActiveTab('anexos')}
              className={`py-3 px-4 font-bold text-xs border-b-2 flex items-center gap-2 shrink-0 transition-colors ${
                activeTab === 'anexos'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Paperclip className="w-4 h-4" /> Documentos ({existingApt?.attachments.length || 0})
            </button>
          )}

          {isEdit && (
            <button
              onClick={() => setActiveTab('historico')}
              className={`py-3 px-4 font-bold text-xs border-b-2 flex items-center gap-2 shrink-0 transition-colors ${
                activeTab === 'historico'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <History className="w-4 h-4" /> Histórico ({currentHistory.length})
            </button>
          )}
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: GERAL */}
          {activeTab === 'geral' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="Ex: Roberto Silva"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Empresa / Imobiliária *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="Ex: Imobiliária Alta Vista"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail do Cliente
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="cliente@imobiliaria.com.br"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Origem do Lead
                  </label>
                  <select
                    value={leadSource}
                    onChange={e => setLeadSource(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:border-indigo-500"
                  >
                    {LEAD_SOURCES.map(src => (
                      <option key={src} value={src}>{src}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="São Paulo"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Estado
                  </label>
                  <select
                    value={state}
                    onChange={e => setState(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:border-indigo-500"
                  >
                    {BRAZILIAN_STATES.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data da Reunião *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Horário *
                  </label>
                  <input
                    type="text"
                    required
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    placeholder="09:00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Duração (Minutos)
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={e => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:border-indigo-500"
                  >
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min (1h)</option>
                    <option value={90}>90 min (1h30)</option>
                  </select>
                </div>
              </div>

              {/* Responsáveis */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Responsável pelo Agendamento (SDR/BDR)
                  </label>
                  <input
                    type="text"
                    value={schedulerName}
                    onChange={e => setSchedulerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Executivo Comercial Responsável
                  </label>
                  <select
                    value={assignedRepId}
                    onChange={e => setAssignedRepId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:border-indigo-500"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Format & Links */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Formato da Reunião
                </label>
                <div className="flex gap-3">
                  {(['Meet', 'Zoom', 'Presencial'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setMeetingType(type)}
                      className={`px-4 py-2 rounded-xl border font-bold text-xs transition-all ${
                        meetingType === type
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {type === 'Meet' && 'Google Meet'}
                      {type === 'Zoom' && 'Zoom Video'}
                      {type === 'Presencial' && 'Presencial / Visita'}
                    </button>
                  ))}
                </div>

                {meetingType === 'Meet' && (
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Link do Google Meet
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={meetLink}
                        onChange={e => setMeetLink(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden font-mono"
                      />
                      {meetLink && (
                        <a
                          href={meetLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-xl border border-indigo-200 dark:border-indigo-800 font-bold flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Entrar
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {meetingType === 'Zoom' && (
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Link da Reunião Zoom
                    </label>
                    <input
                      type="url"
                      value={zoomLink}
                      onChange={e => setZoomLink(e.target.value)}
                      placeholder="https://zoom.us/j/12345678"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden font-mono"
                    />
                  </div>
                )}

                {meetingType === 'Presencial' && (
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Endereço Presencial
                    </label>
                    <input
                      type="text"
                      value={locationAddress}
                      onChange={e => setLocationAddress(e.target.value)}
                      placeholder="Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ESTÁGIO DA VENDA */}
          {activeTab === 'estagio' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 space-y-2">
                <label className="block font-bold text-indigo-900 dark:text-indigo-200 text-sm">
                  Estágio do Funil Comercial
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as AppointmentStatus)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 text-slate-900 dark:text-white font-extrabold text-sm outline-hidden"
                >
                  {ALL_STATUSES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                  Alterações de estágio gravam automaticamente data, hora e responsável no histórico imutável.
                </p>
              </div>

              {status === 'Venda perdida' && (
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2 animate-in fade-in">
                  <label className="block font-bold text-stone-900 dark:text-stone-200 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-500" /> Motivo da Perda da Venda *
                  </label>
                  <textarea
                    rows={2}
                    value={lostReason}
                    onChange={e => setLostReason(e.target.value)}
                    placeholder="Descreva o motivo pelo qual a venda foi perdida (ex: preço, concorrente, falta de orçamento)..."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-stone-700 text-slate-900 dark:text-white outline-hidden"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Observações Gerais do Agendamento
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Anotações prévias, perfil do cliente, demandas específicas..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Registrar Observações Pós-Apresentação
                </label>
                <textarea
                  rows={3}
                  value={postPresentationNotes}
                  onChange={e => setPostPresentationNotes(e.target.value)}
                  placeholder="Resumo da conversa, dúvidas tiradas, reação do cliente, acordos estabelecidos..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden"
                />
              </div>

              {/* Próximo Contato */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">Próximo Contato</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={remindNextContact}
                      onChange={e => setRemindNextContact(e.target.checked)}
                      className="rounded-md text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Lembrete Automático
                    </span>
                  </label>
                </div>

                <input
                  type="date"
                  value={nextContactDate}
                  onChange={e => setNextContactDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden"
                />
              </div>
            </div>
          )}

          {/* TAB 3: ANEXOS */}
          {activeTab === 'anexos' && existingApt && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white">Anexar Novo Documento</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAttName}
                    onChange={e => setNewAttName(e.target.value)}
                    placeholder="Ex: Proposta_Comercial_PontoChave_2026.pdf"
                    className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddAttachmentSubmit}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Anexar
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white">Documentos Anexados ({existingApt.attachments.length})</h4>
                {existingApt.attachments.length === 0 ? (
                  <p className="text-slate-400 text-xs py-4 text-center">Nenhum documento anexado a esta reunião.</p>
                ) : (
                  existingApt.attachments.map(att => (
                    <div
                      key={att.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <Paperclip className="w-4 h-4 text-indigo-600" />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{att.name}</p>
                          <p className="text-[10px] text-slate-400">{att.size} • Anexado em {formatDateBR(att.uploadedAt)}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeAttachment(existingApt.id, att.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg"
                        title="Remover anexo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: HISTÓRICO COMPLETO */}
          {activeTab === 'historico' && (
            <div className="space-y-3 text-xs">
              <p className="text-slate-500 text-xs">
                Log imutável de alterações realizadas neste agendamento (quem, quando, o que):
              </p>

              {currentHistory.length === 0 ? (
                <p className="text-slate-400 py-6 text-center">Nenhum registro no histórico.</p>
              ) : (
                <div className="space-y-2 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {currentHistory.map(h => (
                    <div key={h.id} className="relative pl-7 py-1">
                      <span className="absolute left-1.5 top-2.5 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-slate-900" />
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono mb-1">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">{h.user}</span>
                          <span>{h.timestamp}</span>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{h.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            {isEdit && appointmentId ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Tem certeza que deseja excluir esta reunião?')) {
                    deleteAppointment(appointmentId);
                    onClose();
                  }
                }}
                className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Excluir
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-colors"
              >
                {isEdit ? 'Salvar Alterações' : 'Confirmar Agendamento'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
