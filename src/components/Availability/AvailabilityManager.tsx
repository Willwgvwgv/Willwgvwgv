import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Clock, CalendarX, Plus, Trash2, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { BlockedDate } from '../../types';

export const AvailabilityManager: React.FC = () => {
  const {
    availability,
    updateAvailabilityDay,
    blockedDates,
    addBlockedDate,
    deleteBlockedDate
  } = useApp();

  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('Férias');
  const [blockDate, setBlockDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [blockEndDate, setBlockEndDate] = useState('');
  const [fullDay, setFullDay] = useState(true);
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('14:00');

  // Time slot toggle for a day
  const handleToggleSlot = (dayOfWeek: number, slot: string) => {
    const dayObj = availability.find(a => a.dayOfWeek === dayOfWeek);
    if (!dayObj) return;

    let newSlots: string[];
    if (dayObj.timeSlots.includes(slot)) {
      newSlots = dayObj.timeSlots.filter(s => s !== slot);
    } else {
      newSlots = [...dayObj.timeSlots, slot].sort();
    }

    updateAvailabilityDay(dayOfWeek, dayObj.enabled, newSlots);
  };

  const handleToggleDayEnabled = (dayOfWeek: number, enabled: boolean) => {
    const dayObj = availability.find(a => a.dayOfWeek === dayOfWeek);
    if (!dayObj) return;
    updateAvailabilityDay(dayOfWeek, enabled, dayObj.timeSlots);
  };

  const handleAddBlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDate || !blockReason) return;

    addBlockedDate({
      date: blockDate,
      endDate: blockEndDate || undefined,
      reason: blockReason,
      fullDay,
      startTime: !fullDay ? startTime : undefined,
      endTime: !fullDay ? endTime : undefined
    });

    setIsBlockModalOpen(false);
    setBlockReason('Férias');
  };

  const ALL_HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-600" /> Configuração de Disponibilidade e Horários
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Defina os dias da semana e intervalos de horários livres para agendamento público e bloqueios de férias ou viagens.
          </p>
        </div>

        <button
          onClick={() => setIsBlockModalOpen(true)}
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
        >
          <CalendarX className="w-4 h-4" /> Bloquear Data / Período
        </button>
      </div>

      {/* Weekdays Availability Configuration */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Dias da Semana e Grades de Horário
            </h3>
            <p className="text-xs text-slate-500">Clique nos horários para ativar ou desativar do agendamento público</p>
          </div>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-full">
            Grade Ponto Chave
          </span>
        </div>

        <div className="space-y-4">
          {availability.map(day => (
            <div
              key={day.dayOfWeek}
              className={`p-4 rounded-2xl border transition-all ${
                day.enabled
                  ? 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                  : 'bg-slate-100 dark:bg-slate-950/40 border-slate-200 dark:border-slate-900 opacity-60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={day.enabled}
                    onChange={e => handleToggleDayEnabled(day.dayOfWeek, e.target.checked)}
                    className="w-4 h-4 rounded-md text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {day.dayName}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {day.enabled ? `${day.timeSlots.length} horários ativos` : 'Dia desativado para agendamentos'}
                    </p>
                  </div>
                </div>
              </div>

              {day.enabled && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {ALL_HOURS.map(slot => {
                    const isSelected = day.timeSlots.includes(slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => handleToggleSlot(day.dayOfWeek, slot)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-mono transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-400'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Blocked Dates List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" /> Datas e Períodos Bloqueados
            </h3>
            <p className="text-xs text-slate-500">Férias, feriados, viagens ou eventos internos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {blockedDates.length === 0 ? (
            <p className="text-slate-400 text-xs py-4 col-span-2 text-center">Nenhuma data bloqueada.</p>
          ) : (
            blockedDates.map(bd => (
              <div
                key={bd.id}
                className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
                    {bd.reason}
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm pt-1">
                    {bd.date} {bd.endDate ? `até ${bd.endDate}` : ''}
                  </p>
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    {bd.fullDay ? 'Dia inteiro bloqueado' : `Bloqueio parcial (${bd.startTime} às ${bd.endTime})`}
                  </p>
                </div>

                <button
                  onClick={() => deleteBlockedDate(bd.id)}
                  className="p-2 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-xl"
                  title="Desbloquear data"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Block Date Modal */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsBlockModalOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in" />

          <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Bloquear Data ou Período
            </h2>

            <form onSubmit={handleAddBlockSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo do Bloqueio *
                </label>
                <select
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden"
                >
                  <option value="Férias">Férias</option>
                  <option value="Feriado">Feriado Nacional / Regional</option>
                  <option value="Viagem">Viagem de Negócios</option>
                  <option value="Evento">Convenção / Evento Imobiliário</option>
                  <option value="Manutenção">Treinamento de Equipe</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data Inicial *
                  </label>
                  <input
                    type="date"
                    required
                    value={blockDate}
                    onChange={e => setBlockDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data Final (Opcional)
                  </label>
                  <input
                    type="date"
                    value={blockEndDate}
                    onChange={e => setBlockEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="fullDayCheck"
                  checked={fullDay}
                  onChange={e => setFullDay(e.target.checked)}
                  className="rounded-md text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="fullDayCheck" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Bloquear o dia inteiro
                </label>
              </div>

              {!fullDay && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Horário Início
                    </label>
                    <input
                      type="text"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      placeholder="12:00"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Horário Fim
                    </label>
                    <input
                      type="text"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      placeholder="14:00"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBlockModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md"
                >
                  Confirmar Bloqueio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
