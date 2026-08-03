import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/helpers';
import { Package, Plus, Edit2, Trash2, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { Plan } from '../../types';

export const PlansManager: React.FC = () => {
  const { plans, addPlan, updatePlan, deletePlan } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(1500);
  const [description, setDescription] = useState('');
  const [active, setActive] = useState<boolean>(true);

  const handleOpenAdd = () => {
    setEditingPlan(null);
    setName('');
    setPrice(2000);
    setDescription('');
    setActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setPrice(plan.price);
    setDescription(plan.description);
    setActive(plan.active);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingPlan) {
      updatePlan(editingPlan.id, { name, price: Number(price), description, active });
    } else {
      addPlan({ name, price: Number(price), description, active });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-600" /> Cadastro de Planos Comerciais
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Gerencie a tabela de preços oficial do Ponto Chave. Os planos cadastrados são preenchidos automaticamente no fechamento de vendas.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Novo Plano Comercial
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map(plan => (
          <div
            key={plan.id}
            className={`p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
              plan.active
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800'
                : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 opacity-60'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  plan.active
                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200'
                    : 'bg-slate-200 text-slate-600 border-slate-300'
                }`}>
                  {plan.active ? 'Ativo' : 'Inativo'}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(plan)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Editar Plano"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Deseja remover o ${plan.name}?`)) {
                        deletePlan(plan.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                    title="Excluir Plano"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{plan.name}</h3>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1">
                  {formatCurrency(plan.price)}
                </p>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {plan.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Integrado ao CRM</span>
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            </div>
          </div>
        ))}
      </div>

      {/* Plan Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in" />

          <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              {editingPlan ? 'Editar Plano Comercial' : 'Cadastrar Novo Plano'}
            </h2>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Plano *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Plano Ouro"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Valor em Reais (R$) *
                </label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={e => setPrice(Number(e.target.value))}
                  placeholder="5000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descrição dos Benefícios
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Detalhes sobre limite de corretores, integrações ou suporte..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={active}
                  onChange={e => setActive(e.target.checked)}
                  className="rounded-md text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="activeCheck" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Plano Ativo no Comercial
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md"
                >
                  Salvar Plano
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
