import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateBR, exportToCSV, LEAD_SOURCES, BRAZILIAN_STATES, ALL_STATUSES } from '../../utils/helpers';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Printer,
  FileText,
  DollarSign,
  Search,
  CheckCircle2,
  Calendar,
  Building,
  Users
} from 'lucide-react';
import { AppointmentStatus } from '../../types';

export const FinancialReports: React.FC = () => {
  const { appointments, plans, users } = useApp();

  // Date Presets
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('ESTE_MES');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Granular Filters
  const [filterCity, setFilterCity] = useState<string>('');
  const [filterState, setFilterState] = useState<string>('TODOS');
  const [filterOrigin, setFilterOrigin] = useState<string>('TODOS');
  const [filterPlan, setFilterPlan] = useState<string>('TODOS');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [filterRep, setFilterRep] = useState<string>('TODOS');
  const [filterClientOrCompany, setFilterClientOrCompany] = useState<string>('');

  // Date filtering logic
  const filteredAppointments = useMemo(() => {
    const today = new Date();
    const todayIso = today.toISOString().split('T')[0];

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayIso = yesterday.toISOString().split('T')[0];

    return appointments.filter(apt => {
      const aptDate = apt.date;

      // Date Range Filter
      if (dateRangeFilter === 'HOJE' && aptDate !== todayIso) return false;
      if (dateRangeFilter === 'ONTEM' && aptDate !== yesterdayIso) return false;

      if (dateRangeFilter === 'ESTA_SEMANA') {
        const d = new Date(aptDate + 'T00:00:00');
        const diff = (today.getTime() - d.getTime()) / (1000 * 3600 * 24);
        if (diff < -1 || diff > 7) return false;
      }

      if (dateRangeFilter === 'ULTIMOS_7_DIAS') {
        const d = new Date(aptDate + 'T00:00:00');
        const diff = (today.getTime() - d.getTime()) / (1000 * 3600 * 24);
        if (diff < 0 || diff > 7) return false;
      }

      if (dateRangeFilter === 'ESTE_MES') {
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        if (!aptDate.startsWith(`${year}-${month}`)) return false;
      }

      if (dateRangeFilter === 'PERSONALIZADO') {
        if (customStartDate && aptDate < customStartDate) return false;
        if (customEndDate && aptDate > customEndDate) return false;
      }

      // Granular Filters
      if (filterCity && !apt.city.toLowerCase().includes(filterCity.toLowerCase())) return false;
      if (filterState !== 'TODOS' && apt.state !== filterState) return false;
      if (filterOrigin !== 'TODOS' && apt.leadSource !== filterOrigin) return false;
      if (filterPlan !== 'TODOS' && apt.saleDetails?.planName !== filterPlan) return false;
      if (filterStatus !== 'TODOS' && apt.status !== filterStatus) return false;
      if (filterRep !== 'TODOS' && apt.assignedRepId !== filterRep) return false;

      if (filterClientOrCompany) {
        const q = filterClientOrCompany.toLowerCase();
        const matchesC = apt.clientName.toLowerCase().includes(q);
        const matchesComp = apt.companyName.toLowerCase().includes(q);
        if (!matchesC && !matchesComp) return false;
      }

      return true;
    });
  }, [
    appointments,
    dateRangeFilter,
    customStartDate,
    customEndDate,
    filterCity,
    filterState,
    filterOrigin,
    filterPlan,
    filterStatus,
    filterRep,
    filterClientOrCompany
  ]);

  // Financial Totals
  const totals = useMemo(() => {
    const closedSales = filteredAppointments.filter(a => a.status === 'Venda fechada');
    const totalVendido = closedSales.reduce((acc, a) => acc + (a.saleDetails?.amountPaid || 0), 0);
    const totalRecebido = totalVendido; // Pix/Credit full settlement
    const totalComissoes = closedSales.reduce((acc, a) => acc + (a.saleDetails?.commissionAmount || 0), 0);

    const pipelineApts = filteredAppointments.filter(a => a.status === 'Proposta enviada' || a.status === 'Negociação');
    const totalPrevisto = pipelineApts.length * (plans[1]?.price || 3000);

    return {
      totalVendido,
      totalRecebido,
      totalPrevisto,
      totalComissoes,
      countClosed: closedSales.length,
      countTotal: filteredAppointments.length
    };
  }, [filteredAppointments, plans]);

  // Export handlers
  const handleExportCSV = () => {
    const data = filteredAppointments.map(a => ({
      Cliente: a.clientName,
      Empresa: a.companyName,
      Cidade: a.city,
      Estado: a.state,
      Telefone: a.phone,
      WhatsApp: a.whatsapp,
      Email: a.email,
      Data: a.date,
      Horário: a.time,
      Status: a.status,
      Origem: a.leadSource,
      Responsavel: a.assignedRepName,
      PlanoVendido: a.saleDetails?.planName || '-',
      ValorPago: a.saleDetails?.amountPaid || 0,
      FormaPagamento: a.saleDetails?.paymentMethod || '-',
      Comissao: a.saleDetails?.commissionAmount || 0
    }));

    exportToCSV(`Relatorio_PontoChave_${new Date().toISOString().split('T')[0]}`, data);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-indigo-600" /> Relatórios & Financeiro
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Filtros avançados para auditoria de vendas, controle financeiro e comissões da equipe.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
            title="Exportar dados para Excel/CSV"
          >
            <Download className="w-4 h-4" /> Exportar Excel/CSV
          </button>

          <button
            onClick={handlePrintPDF}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
            title="Imprimir ou Salvar PDF"
          >
            <Printer className="w-4 h-4" /> PDF / Imprimir
          </button>
        </div>
      </div>

      {/* Financial Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
            Total Vendido ({totals.countClosed} vendas)
          </span>
          <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100 font-mono">
            {formatCurrency(totals.totalVendido)}
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-300">Total contratado no período</p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
            Total Recebido
          </span>
          <p className="text-2xl font-black text-blue-900 dark:text-blue-100 font-mono">
            {formatCurrency(totals.totalRecebido)}
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300">Pagamentos confirmados</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
            Total Previsto
          </span>
          <p className="text-2xl font-black text-amber-900 dark:text-amber-100 font-mono">
            {formatCurrency(totals.totalPrevisto)}
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300">Pipeline de propostas em aberto</p>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-300">
            Comissões Acumuladas
          </span>
          <p className="text-2xl font-black text-indigo-900 dark:text-indigo-100 font-mono">
            {formatCurrency(totals.totalComissoes)}
          </p>
          <p className="text-xs text-indigo-700 dark:text-indigo-300">Ganhos de corretores/equipe</p>
        </div>
      </div>

      {/* Advanced Filter Box */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-indigo-600" /> Filtros e Período de Análise
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {filteredAppointments.length} resultados encontrados
          </span>
        </div>

        {/* Date Presets */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {[
            { id: 'HOJE', label: 'Hoje' },
            { id: 'ONTEM', label: 'Ontem' },
            { id: 'ESTA_SEMANA', label: 'Esta Semana' },
            { id: 'ULTIMOS_7_DIAS', label: 'Últimos 7 dias' },
            { id: 'ESTE_MES', label: 'Este Mês' },
            { id: 'PERSONALIZADO', label: 'Período Personalizado' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setDateRangeFilter(p.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                dateRangeFilter === p.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {dateRangeFilter === 'PERSONALIZADO' && (
          <div className="flex gap-3 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Data Inicial</label>
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Data Final</label>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* Granular Filters Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-2">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cliente / Empresa
            </label>
            <input
              type="text"
              value={filterClientOrCompany}
              onChange={e => setFilterClientOrCompany(e.target.value)}
              placeholder="Buscar por nome..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status da Apresentação
            </label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden"
            >
              <option value="TODOS">Todos os Status</option>
              {ALL_STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Origem do Lead
            </label>
            <select
              value={filterOrigin}
              onChange={e => setFilterOrigin(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden"
            >
              <option value="TODOS">Todas as Origens</option>
              {LEAD_SOURCES.map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Executivo Comercial
            </label>
            <select
              value={filterRep}
              onChange={e => setFilterRep(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden"
            >
              <option value="TODOS">Todos os Vendedores</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Financial Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
            Relatório Detalhado de Vendas & Apresentações
          </h3>
          <span className="text-xs text-slate-400">Tabela de controle financeiro imobiliário</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold text-[10px]">
                <th className="p-3">Cliente / Empresa</th>
                <th className="p-3">Cidade/UF</th>
                <th className="p-3">Data</th>
                <th className="p-3">Status</th>
                <th className="p-3">Plano Vendido</th>
                <th className="p-3 text-right">Valor Pago</th>
                <th className="p-3">Forma Pagto</th>
                <th className="p-3 text-right">Comissão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Nenhum registro encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <p className="font-bold text-slate-900 dark:text-white">{a.companyName}</p>
                      <p className="text-[10px] text-slate-500">{a.clientName}</p>
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {a.city} - {a.state}
                    </td>
                    <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                      {formatDateBR(a.date)}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {a.status}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                      {a.saleDetails ? a.saleDetails.planName : '-'}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {a.saleDetails ? formatCurrency(a.saleDetails.amountPaid) : 'R$ 0,00'}
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {a.saleDetails ? a.saleDetails.paymentMethod : '-'}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {a.saleDetails ? formatCurrency(a.saleDetails.commissionAmount) : 'R$ 0,00'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
