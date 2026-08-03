import { AppointmentStatus } from '../types';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatDateBR = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export const getStatusBadgeColor = (status: AppointmentStatus): { bg: string; text: string; border: string; dot: string } => {
  switch (status) {
    case 'Agendada':
      return {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-300 dark:border-slate-700',
        dot: 'bg-slate-400'
      };
    case 'Confirmada':
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/60',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800',
        dot: 'bg-blue-500'
      };
    case 'Apresentação realizada':
      return {
        bg: 'bg-orange-50 dark:bg-orange-950/60',
        text: 'text-orange-700 dark:text-orange-300',
        border: 'border-orange-200 dark:border-orange-800',
        dot: 'bg-orange-500'
      };
    case 'Proposta enviada':
      return {
        bg: 'bg-purple-50 dark:bg-purple-950/60',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800',
        dot: 'bg-purple-500'
      };
    case 'Negociação':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/60',
        text: 'text-amber-800 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500'
      };
    case 'Venda fechada':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/60',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500'
      };
    case 'Venda perdida':
      return {
        bg: 'bg-stone-100 dark:bg-stone-800/80',
        text: 'text-stone-700 dark:text-stone-300',
        border: 'border-stone-300 dark:border-stone-700',
        dot: 'bg-stone-500'
      };
    case 'Cancelada':
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/60',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800',
        dot: 'bg-rose-500'
      };
    default:
      return {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-300 dark:border-slate-700',
        dot: 'bg-slate-400'
      };
  }
};

export const ALL_STATUSES: AppointmentStatus[] = [
  'Agendada',
  'Confirmada',
  'Apresentação realizada',
  'Proposta enviada',
  'Negociação',
  'Venda fechada',
  'Venda perdida',
  'Cancelada'
];

export const LEAD_SOURCES = [
  'Website',
  'Instagram',
  'Indicação',
  'Cold Call',
  'Tráfego Pago',
  'Evento',
  'Outro'
];

export const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

// Helper to export data to CSV
export const exportToCSV = (filename: string, rows: Record<string, any>[]) => {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      headers
        .map(header => {
          let val = row[header] === undefined || row[header] === null ? '' : String(row[header]);
          val = val.replace(/"/g, '""');
          if (val.includes(',') || val.includes('\n') || val.includes('"')) {
            val = `"${val}"`;
          }
          return val;
        })
        .join(',')
    )
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
