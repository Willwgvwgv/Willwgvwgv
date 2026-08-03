import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/helpers';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';
import {
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Award,
  DollarSign,
  Users,
  Percent,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const CommercialDashboard: React.FC = () => {
  const { appointments, users, plans } = useApp();

  // Compute Core Indicators
  const metrics = useMemo(() => {
    const totalAgendadas = appointments.length;
    const confirmadas = appointments.filter(a => a.status === 'Confirmada').length;
    const realizadas = appointments.filter(
      a =>
        a.status === 'Apresentação realizada' ||
        a.status === 'Proposta enviada' ||
        a.status === 'Negociação' ||
        a.status === 'Venda fechada' ||
        a.status === 'Venda perdida'
    ).length;
    const canceladas = appointments.filter(a => a.status === 'Cancelada').length;

    // Show rate (Taxa de comparecimento)
    const totalFinishedOrCanceled = realizadas + canceladas;
    const attendanceRate = totalFinishedOrCanceled > 0 ? (realizadas / totalFinishedOrCanceled) * 100 : 0;

    const vendasFechadas = appointments.filter(a => a.status === 'Venda fechada');
    const totalVendasFechadas = vendasFechadas.length;
    const vendasPerdidas = appointments.filter(a => a.status === 'Venda perdida').length;

    // Conversion rate
    const conversionRate = realizadas > 0 ? (totalVendasFechadas / realizadas) * 100 : 0;

    // Revenue metrics
    const valorVendido = vendasFechadas.reduce((acc, a) => acc + (a.saleDetails?.amountPaid || 0), 0);
    const ticketMedio = totalVendasFechadas > 0 ? valorVendido / totalVendasFechadas : 0;

    // Pipeline expected revenue (Proposta + Negociação)
    const pipelineApts = appointments.filter(a => a.status === 'Proposta enviada' || a.status === 'Negociação');
    const valorPrevisto = pipelineApts.length * (plans[1]?.price || 3000); // estimated at average plan price

    // Commissions
    const comissaoTotal = vendasFechadas.reduce((acc, a) => acc + (a.saleDetails?.commissionAmount || 0), 0);
    const comissaoMensal = comissaoTotal; // current period simulation

    return {
      totalAgendadas,
      confirmadas,
      realizadas,
      canceladas,
      attendanceRate: Math.round(attendanceRate),
      totalVendasFechadas,
      vendasPerdidas,
      conversionRate: Math.round(conversionRate),
      valorVendido,
      ticketMedio,
      valorPrevisto,
      comissaoTotal,
      comissaoMensal
    };
  }, [appointments, plans]);

  // Compute Sales Funnel Data
  const funnelData = useMemo(() => {
    const agendada = appointments.length;
    const confirmada = appointments.filter(a => a.status !== 'Agendada' && a.status !== 'Cancelada').length;
    const realizada = appointments.filter(
      a =>
        a.status === 'Apresentação realizada' ||
        a.status === 'Proposta enviada' ||
        a.status === 'Negociação' ||
        a.status === 'Venda fechada' ||
        a.status === 'Venda perdida'
    ).length;
    const proposta = appointments.filter(
      a => a.status === 'Proposta enviada' || a.status === 'Negociação' || a.status === 'Venda fechada'
    ).length;
    const negociacao = appointments.filter(
      a => a.status === 'Negociação' || a.status === 'Venda fechada'
    ).length;
    const fechada = appointments.filter(a => a.status === 'Venda fechada').length;

    return [
      { stage: 'Agendada', count: agendada, color: 'bg-slate-400' },
      { stage: 'Confirmada', count: confirmada, color: 'bg-blue-500' },
      { stage: 'Realizada', count: realizada, color: 'bg-orange-500' },
      { stage: 'Proposta', count: proposta, color: 'bg-purple-500' },
      { stage: 'Negociação', count: negociacao, color: 'bg-amber-500' },
      { stage: 'Venda Fechada', count: fechada, color: 'bg-emerald-500' }
    ];
  }, [appointments]);

  // Compute Ranking by Sales Rep
  const repRanking = useMemo(() => {
    return users.map(user => {
      const repApts = appointments.filter(a => a.assignedRepId === user.id || a.assignedRepName === user.name);
      const totalPres = repApts.length;
      const closedSales = repApts.filter(a => a.status === 'Venda fechada');
      const salesCount = closedSales.length;
      const revenue = closedSales.reduce((sum, a) => sum + (a.saleDetails?.amountPaid || 0), 0);
      const conversion = totalPres > 0 ? (salesCount / totalPres) * 100 : 0;
      const commission = closedSales.reduce((sum, a) => sum + (a.saleDetails?.commissionAmount || 0), 0);

      return {
        id: user.id,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        totalPres,
        salesCount,
        revenue,
        conversion: Math.round(conversion),
        commission
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [users, appointments]);

  // Recharts Monthly Presentations vs Sales calculated dynamically
  const chartMonthlyData = useMemo(() => {
    if (appointments.length === 0) {
      return [
        { month: 'Sem dados', apresentacoes: 0, vendas: 0, faturamento: 0 }
      ];
    }
    const monthlyMap: Record<string, { apresentacoes: number; vendas: number; faturamento: number }> = {};
    appointments.forEach(apt => {
      const d = new Date(apt.date || Date.now());
      const monthLabel = d.toLocaleString('pt-BR', { month: 'short' });
      if (!monthlyMap[monthLabel]) {
        monthlyMap[monthLabel] = { apresentacoes: 0, vendas: 0, faturamento: 0 };
      }
      if (
        apt.status === 'Apresentação realizada' ||
        apt.status === 'Proposta enviada' ||
        apt.status === 'Negociação' ||
        apt.status === 'Venda fechada' ||
        apt.status === 'Venda perdida'
      ) {
        monthlyMap[monthLabel].apresentacoes += 1;
      }
      if (apt.status === 'Venda fechada') {
        monthlyMap[monthLabel].vendas += 1;
        monthlyMap[monthLabel].faturamento += apt.saleDetails?.amountPaid || 0;
      }
    });

    return Object.entries(monthlyMap).map(([month, data]) => ({
      month,
      ...data
    }));
  }, [appointments]);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Dashboard Comercial Ponto Chave <Sparkles className="w-5 h-5 text-indigo-500" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Acompanhamento em tempo real do funil de vendas, faturamento e performance da equipe via Firebase.
          </p>
        </div>
      </div>

      {/* Empty State Banner when no appointments in database */}
      {appointments.length === 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-bold text-xs shrink-0">
              Banco Sem Dados
            </span>
            <div>
              <p className="font-bold">Nenhum agendamento cadastrado no Firebase</p>
              <p className="text-amber-700 dark:text-amber-400">
                Os dados exibidos estão em zero. Crie o primeiro agendamento na aba Agenda ou através do link de agendamento público.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Reuniões Agendadas */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Agendadas</span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics.totalAgendadas}</p>
          <p className="text-[10px] text-slate-400">{metrics.confirmadas} confirmadas</p>
        </div>

        {/* Realizadas */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Realizadas</span>
            <CheckCircle2 className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics.realizadas}</p>
          <p className="text-[10px] text-slate-400">{metrics.canceladas} canceladas</p>
        </div>

        {/* Taxa de Comparecimento */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Comparecimento</span>
            <Percent className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics.attendanceRate}%</p>
          <p className="text-[10px] text-emerald-600 font-semibold">Alta aderência</p>
        </div>

        {/* Vendas Fechadas */}
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300">
            <span className="text-[11px] font-bold uppercase tracking-wider">Vendas Fechadas</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100">{metrics.totalVendasFechadas}</p>
          <p className="text-[10px] text-emerald-700 dark:text-emerald-300">{metrics.vendasPerdidas} perdidas</p>
        </div>

        {/* Taxa de Conversão */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Taxa Conversão</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics.conversionRate}%</p>
          <p className="text-[10px] text-slate-400">Vendas / Realizadas</p>
        </div>

        {/* Valor Vendido */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-md space-y-1">
          <div className="flex items-center justify-between text-indigo-200">
            <span className="text-[11px] font-bold uppercase tracking-wider">Faturamento</span>
            <DollarSign className="w-4 h-4 text-white" />
          </div>
          <p className="text-xl sm:text-2xl font-black truncate">{formatCurrency(metrics.valorVendido)}</p>
          <p className="text-[10px] text-indigo-200">Ticket médio: {formatCurrency(metrics.ticketMedio)}</p>
        </div>
      </div>

      {/* Commercial Sales Funnel & Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Funnel visual representation */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" /> Funil Comercial de Apresentações
              </h3>
              <p className="text-xs text-slate-500">Conversão por etapa da oportunidade</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              Taxa Geral: {metrics.conversionRate}%
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {funnelData.map((item, idx) => {
              const maxCount = funnelData[0].count || 1;
              const widthPct = Math.max(15, Math.round((item.count / maxCount) * 100));
              const prevCount = idx > 0 ? funnelData[idx - 1].count : item.count;
              const stepConversion = prevCount > 0 ? Math.round((item.count / prevCount) * 100) : 100;

              return (
                <div key={item.stage} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      {item.stage}
                    </span>
                    <span className="font-mono">
                      {item.count} {item.count === 1 ? 'oportunidade' : 'oportunidades'} ({stepConversion}% da etapa anterior)
                    </span>
                  </div>

                  <div className="h-8 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center p-1">
                    <div
                      style={{ width: `${widthPct}%` }}
                      className={`h-full rounded-lg ${item.color} text-white font-extrabold text-xs flex items-center justify-end pr-3 transition-all duration-500 shadow-xs`}
                    >
                      {widthPct > 20 && `${item.count}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pipeline & Commissions summary */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" /> Previsão & Comissões
            </h3>
            <p className="text-xs text-slate-500">Valores previstos e ganhos acumulados</p>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Valor Previsto em Negociação
              </span>
              <p className="text-2xl font-black text-amber-900 dark:text-amber-100 font-mono">
                {formatCurrency(metrics.valorPrevisto)}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Oportunidades ativas em Proposta / Negociação
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Comissão Total Distribuída
              </span>
              <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100 font-mono">
                {formatCurrency(metrics.comissaoTotal)}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Taxa de apresentação + bônus de fechamento
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Graphs & Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recharts Monthly Performance */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Evolução: Apresentações × Vendas Fechadas
            </h3>
            <span className="text-xs text-slate-400">Últimos meses</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartMonthlyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="apresentacoes" name="Apresentações" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="vendas" name="Vendas Fechadas" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales Rep Ranking */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" /> Ranking por Vendedor
            </h3>
            <p className="text-xs text-slate-500">Taxa de conversão e faturamento</p>
          </div>

          <div className="space-y-3">
            {repRanking.map((rep, idx) => (
              <div
                key={rep.id}
                className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </span>
                  <img src={rep.avatar} alt={rep.name} className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{rep.name}</p>
                    <p className="text-[10px] text-slate-500">{rep.salesCount} vendas de {rep.totalPres} apresentações</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(rep.revenue)}
                  </p>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                    {rep.conversion}% conversão
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
