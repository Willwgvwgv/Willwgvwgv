import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { createPublicAppointmentInFirestore } from '../../lib/firebaseFirestoreService';
import { getStatusBadgeColor, LEAD_SOURCES, BRAZILIAN_STATES } from '../../utils/helpers';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Globe,
  Share2,
  Copy,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';

export const PublicBookingView: React.FC = () => {
  const { availability, blockedDates, appointments, plans, users } = useApp();

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [leadSource, setLeadSource] = useState<'Website' | 'Instagram' | 'Indicação' | 'Cold Call' | 'Tráfego Pago' | 'Evento' | 'Outro'>('Website');
  const [notes, setNotes] = useState('');

  // Calculate available dates for next 14 days based on availability & blocked dates
  const availableNextDays = useMemo(() => {
    const dates: { dateIso: string; label: string; enabled: boolean }[] = [];
    const today = new Date();

    for (let i = 1; i <= 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateIso = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon...

      // Check day configuration
      const dayConfig = availability.find(a => a.dayOfWeek === dayOfWeek);
      const isDayEnabled = dayConfig ? dayConfig.enabled : false;

      // Check blocked dates
      const isBlocked = blockedDates.some(bd => {
        if (bd.fullDay && bd.date === dateIso) return true;
        if (bd.endDate && dateIso >= bd.date && dateIso <= bd.endDate) return true;
        return false;
      });

      const label = d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
      dates.push({
        dateIso,
        label,
        enabled: isDayEnabled && !isBlocked
      });
    }

    return dates;
  }, [availability, blockedDates]);

  // Compute available time slots for selectedDate
  const availableTimeSlots = useMemo(() => {
    if (!selectedDate) return [];

    const d = new Date(selectedDate + 'T00:00:00');
    const dayOfWeek = d.getDay();
    const dayConfig = availability.find(a => a.dayOfWeek === dayOfWeek);

    if (!dayConfig || !dayConfig.enabled) return [];

    // Filter out already booked slots on that date
    const bookedTimes = appointments
      .filter(apt => apt.date === selectedDate && apt.status !== 'Cancelada')
      .map(apt => apt.time);

    return dayConfig.timeSlots.filter(slot => !bookedTimes.includes(slot));
  }, [selectedDate, availability, appointments]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !clientName || !phone) {
      setError('Por favor, preencha todos os campos obrigatórios (data, horário, nome e telefone).');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const assignedUser = users.find(u => u.id === assignedTo) || users[0] || { id: 'admin-1' };

      const res = await createPublicAppointmentInFirestore({
        clientName,
        clientEmail: email || 'cliente@contato.com.br',
        clientPhone: phone,
        date: selectedDate,
        time: selectedTime,
        planId: selectedPlanId,
        notes,
        assignedTo: assignedUser.id
      });

      if (res.error) {
        setError(res.error);
        return;
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Erro ao processar reserva. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setSelectedTime('');
    setClientName('');
    setCompanyName('');
    setPhone('');
    setNotes('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Banner & Share Controls */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-indigo-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
            <Globe className="w-3.5 h-3.5" /> Página Pública de Agendamento Comercial
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Agenda de Apresentação Comercial Ponto Chave
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200 mt-1">
            Link exclusivo para clientes e pré-vendedores agendarem demonstrações ao vivo.
          </p>
        </div>

        <button
          onClick={handleCopyLink}
          className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0"
        >
          {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link Público'}</span>
        </button>
      </div>

      {/* Main Booking Box */}
      {isSubmitted ? (
        <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Agendamento Confirmado com Sucesso!
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              A apresentação para <strong>{companyName}</strong> ({clientName}) foi bloqueada na agenda oficial para o dia <strong>{selectedDate} às {selectedTime}</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 max-w-sm mx-auto text-left text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
            <p className="font-bold text-slate-900 dark:text-white border-b pb-1">Resumo do Agendamento:</p>
            <p>• Data: <strong>{selectedDate} às {selectedTime}</strong></p>
            <p>• Cliente: <strong>{clientName}</strong> ({companyName})</p>
            <p>• Contato: <strong>{phone}</strong></p>
            <p>• Link da Reunião: <span className="text-indigo-600 dark:text-indigo-400 font-mono">Google Meet automático</span></p>
          </div>

          <button
            onClick={resetForm}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition-colors shadow-md"
          >
            Realizar Novo Agendamento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          {/* Left Column: Information Card */}
          <div className="lg:col-span-4 p-6 bg-slate-50 dark:bg-slate-950/60 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                  P
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Ponto Chave Comercial</h3>
                  <p className="text-xs text-slate-500">Apresentação de Soluções Comerciais</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 text-xs text-slate-600 dark:text-slate-300">
                <p className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                  <Clock className="w-4 h-4 text-indigo-600" /> Duração: 60 minutos
                </p>
                <p className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Formato: Videoconferência ao vivo
                </p>
                <p className="leading-relaxed text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                  Nesta reunião apresentaremos como o Ponto Chave acelera suas vendas, qualifica corretores e organiza a gestão comercial em tempo real.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-xs text-indigo-800 dark:text-indigo-300">
              🔒 <strong>Privacidade Garantida:</strong> Apenas horários livres são exibidos. Nenhuma informação de outros clientes é visível nesta tela.
            </div>
          </div>

          {/* Right Column: Date, Time & Lead Details Form */}
          <div className="lg:col-span-8 p-6 sm:p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Select Date */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-indigo-600" /> 1. Escolha a Data da Apresentação
                </label>

                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {availableNextDays.map(item => (
                    <button
                      key={item.dateIso}
                      type="button"
                      disabled={!item.enabled}
                      onClick={() => {
                        setSelectedDate(item.dateIso);
                        setSelectedTime('');
                      }}
                      className={`p-3 rounded-2xl border text-center shrink-0 min-w-[90px] transition-all ${
                        selectedDate === item.dateIso
                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-md'
                          : item.enabled
                          ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-indigo-400'
                          : 'bg-slate-100 dark:bg-slate-900 border-slate-100 text-slate-400 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <p className="text-[10px] uppercase font-bold opacity-80">{item.label.split(',')[0]}</p>
                      <p className="text-sm font-extrabold mt-0.5">{item.dateIso.split('-')[2]}/{item.dateIso.split('-')[1]}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Select Available Slot */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" /> 2. Escolha o Horário Disponível
                </label>

                {availableTimeSlots.length === 0 ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200">
                    Nenhum horário livre nesta data. Por favor, selecione outra data acima.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableTimeSlots.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all ${
                          selectedTime === slot
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 3: Lead Information Form */}
              {selectedTime && (
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-200">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-indigo-600" /> 3. Dados para Agendamento
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Cidade
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        placeholder="Ex: São Paulo"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
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

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Telefone *
                      </label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="(11) 98765-4321"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="roberto@empresa.com.br"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
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

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Observações / Necessidades
                      </label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Conte-nos brevemente sobre o número de corretores ou desafios atuais da imobiliária..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-2xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                  >
                    Confirmar e Bloquear Horário <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
