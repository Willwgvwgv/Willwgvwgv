import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Appointment, Plan } from '../../types';
import { formatCurrency, formatDateBR } from '../../utils/helpers';
import confetti from 'canvas-confetti';
import { X, DollarSign, CheckCircle2, Award, Sparkles, CreditCard, Calendar } from 'lucide-react';

interface SaleClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

export const SaleClosingModal: React.FC<SaleClosingModalProps> = ({ isOpen, onClose, appointment }) => {
  const { plans, updateAppointmentStatus, commissionConfig, currentUser } = useApp();

  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [planPrice, setPlanPrice] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Pix' | 'Cartão de Crédito' | 'Boleto' | 'Transferência'>('Pix');
  const [installments, setInstallments] = useState<number>(1);
  const [closedAt, setClosedAt] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (plans.length > 0) {
      const activePlans = plans.filter(p => p.active);
      const defaultPlan = activePlans[0] || plans[0];
      if (defaultPlan) {
        setSelectedPlanId(defaultPlan.id);
        setPlanPrice(defaultPlan.price);
        setAmountPaid(defaultPlan.price);
      }
    }
  }, [plans, isOpen]);

  if (!isOpen || !appointment) return null;

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      setPlanPrice(plan.price);
      setAmountPaid(plan.price);
    }
  };

  // Compute calculated commission for real-time preview
  const presFee = commissionConfig.feePerPresentation;
  const percentFee = (amountPaid * commissionConfig.commissionPercentageOnSale) / 100;
  const fixedFee = commissionConfig.fixedCommissionOnSale;
  const calculatedCommission = Math.round(presFee + percentFee + fixedFee);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const plan = plans.find(p => p.id === selectedPlanId);

    // Trigger celebratory confetti!
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });

    updateAppointmentStatus(appointment.id, 'Venda fechada', {
      planId: selectedPlanId,
      planName: plan ? plan.name : 'Plano Personalizado',
      planPrice,
      amountPaid,
      paymentMethod,
      installments,
      closedAt,
      commissionAmount: calculatedCommission,
      notes
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in" />

      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-emerald-500/30 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Banner Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center shadow-inner">
              <DollarSign className="w-7 h-7" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" /> Fechamento Comercial
              </span>
              <h2 className="text-xl font-extrabold tracking-tight">Venda Fechada!</h2>
              <p className="text-xs text-emerald-100">{appointment.companyName} ({appointment.clientName})</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Select Plan */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Plano Vendido *
            </label>
            <select
              value={selectedPlanId}
              onChange={e => handlePlanChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-sm text-slate-900 dark:text-white outline-hidden focus:border-emerald-500"
            >
              {plans.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} - {formatCurrency(p.price)} {!p.active ? '(Inativo)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valor do Plano
              </label>
              <input
                type="number"
                value={planPrice}
                onChange={e => setPlanPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valor Efetivo Pago *
              </label>
              <input
                type="number"
                required
                value={amountPaid}
                onChange={e => setAmountPaid(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden"
              >
                <option value="Pix">Pix (À vista)</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Boleto">Boleto Bancário</option>
                <option value="Transferência">Transferência / TED</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Parcelas
              </label>
              <select
                value={installments}
                onChange={e => setInstallments(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden"
              >
                <option value={1}>1x à vista</option>
                <option value={3}>3x sem juros</option>
                <option value={6}>6x</option>
                <option value={12}>12x</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Data do Fechamento
            </label>
            <input
              type="date"
              value={closedAt}
              onChange={e => setClosedAt(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden"
            />
          </div>

          {/* Commission Calculation Preview */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="font-bold">Comissão Estimada do Vendedor</p>
                <p className="text-[10px] opacity-80">
                  Apresentação ({formatCurrency(presFee)}) + {commissionConfig.commissionPercentageOnSale}% sobre a venda
                </p>
              </div>
            </div>

            <span className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-300">
              {formatCurrency(calculatedCommission)}
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações do Fechamento
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Desconto aplicado, prazo especial de onboarding, observações contratuais..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Registrar Fechamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
