import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateBR } from '../../utils/helpers';
import { Award, DollarSign, Percent, Settings, CheckCircle2, TrendingUp, Users } from 'lucide-react';

export const CommissionsOverview: React.FC = () => {
  const {
    commissionConfig,
    updateCommissionConfig,
    appointments,
    users,
    currentUser
  } = useApp();

  const [feePerPres, setFeePerPres] = useState<number>(commissionConfig.feePerPresentation);
  const [percentOnSale, setPercentOnSale] = useState<number>(commissionConfig.commissionPercentageOnSale);
  const [fixedOnSale, setFixedOnSale] = useState<number>(commissionConfig.fixedCommissionOnSale);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateCommissionConfig({
      feePerPresentation: Number(feePerPres),
      commissionPercentageOnSale: Number(percentOnSale),
      fixedCommissionOnSale: Number(fixedOnSale)
    });
    setIsConfigOpen(false);
  };

  // Compute total sales closed
  const closedAppointments = appointments.filter(a => a.status === 'Venda fechada');
  const totalCommissionsAll = closedAppointments.reduce(
    (sum, a) => sum + (a.saleDetails?.commissionAmount || 0),
    0
  );

  // Per user breakdown
  const repCommissions = users.map(user => {
    const userClosedSales = closedAppointments.filter(
      a => a.saleDetails?.salesRepId === user.id || a.assignedRepId === user.id
    );
    const totalGains = userClosedSales.reduce(
      (sum, a) => sum + (a.saleDetails?.commissionAmount || 0),
      0
    );
    return {
      user,
      salesCount: userClosedSales.length,
      totalGains
    };
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-indigo-600" /> Controle de Comissões e Ganhos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Acompanhe o pagamento de comissões por apresentações realizadas e bônus de vendas fechadas.
          </p>
        </div>

        {currentUser.role === 'Administrador' && (
          <button
            onClick={() => setIsConfigOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
          >
            <Settings className="w-4 h-4" /> Configurar Regra de Comissão
          </button>
        )}
      </div>

      {/* Current Rules Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-md border border-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
            Regra Ativa no Ponto Chave
          </span>
          <h3 className="text-lg font-bold">Comissão Híbrida Ativa</h3>
          <p className="text-xs text-slate-300">
            • Taxa fixa por apresentação realizada: <strong>{formatCurrency(commissionConfig.feePerPresentation)}</strong>
            <br />
            • Percentual sobre venda fechada: <strong>{commissionConfig.commissionPercentageOnSale}%</strong> + <strong>{formatCurrency(commissionConfig.fixedCommissionOnSale)}</strong> fixo
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/10 border border-white/20 text-right shrink-0">
          <p className="text-[10px] uppercase font-bold text-indigo-200">Total em Comissões Distribuídas</p>
          <p className="text-2xl font-black font-mono">{formatCurrency(totalCommissionsAll)}</p>
        </div>
      </div>

      {/* Rep Earnings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {repCommissions.map(item => (
          <div
            key={item.user.id}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <img src={item.user.avatar} alt={item.user.name} className="w-10 h-10 rounded-full object-cover" />
              <div>
                <p className="font-extrabold text-slate-900 dark:text-white text-sm">{item.user.name}</p>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">{item.user.role}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Ganhos em Comissões</p>
              <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(item.totalGains)}
              </p>
              <p className="text-xs text-slate-500 pt-0.5">{item.salesCount} contratos fechados</p>
            </div>
          </div>
        ))}
      </div>

      {/* Closed Sales Commission Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" /> Extrato de Comissões por Venda Fechada
          </h3>
          <p className="text-xs text-slate-500">Extrato detalhado de pagamentos gerados por apresentação e fechamento</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold text-[10px]">
                <th className="p-3">Data</th>
                <th className="p-3">Cliente / Empresa</th>
                <th className="p-3">Vendedor</th>
                <th className="p-3">Plano Sold</th>
                <th className="p-3 text-right">Valor Venda</th>
                <th className="p-3 text-right">Comissão Calculada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {closedAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Nenhuma venda registrada até o momento.
                  </td>
                </tr>
              ) : (
                closedAppointments.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                      {formatDateBR(a.saleDetails?.closedAt || a.date)}
                    </td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                      {a.companyName} ({a.clientName})
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {a.saleDetails?.salesRepName || a.assignedRepName}
                    </td>
                    <td className="p-3 text-indigo-600 dark:text-indigo-400 font-semibold">
                      {a.saleDetails?.planName}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(a.saleDetails?.amountPaid || 0)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(a.saleDetails?.commissionAmount || 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Config Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsConfigOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in" />

          <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Regras de Comissão Ponto Chave
            </h2>

            <form onSubmit={handleSaveConfig} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Taxa Fixa por Apresentação Realizada (R$)
                </label>
                <input
                  type="number"
                  value={feePerPres}
                  onChange={e => setFeePerPres(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Percentual sobre Venda Fechada (%)
                </label>
                <input
                  type="number"
                  value={percentOnSale}
                  onChange={e => setPercentOnSale(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bônus Fixo Adicional por Venda Fechada (R$)
                </label>
                <input
                  type="number"
                  value={fixedOnSale}
                  onChange={e => setFixedOnSale(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md"
                >
                  Salvar Regras
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
