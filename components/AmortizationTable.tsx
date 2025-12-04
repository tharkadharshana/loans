import React from 'react';
import { X, ArrowDownCircle } from 'lucide-react';
import { AmortizationRow } from '../types';
import { formatCurrency } from '../services/loanUtils';

interface AmortizationTableProps {
  schedule: AmortizationRow[];
  isOpen: boolean;
  onClose: () => void;
}

const AmortizationTable: React.FC<AmortizationTableProps> = ({ schedule, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 zoom-in-95 duration-300 border border-white/20">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600 hidden sm:block">
                <ArrowDownCircle size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-slate-900">Amortization Schedule</h2>
                <p className="text-sm text-slate-500">Monthly breakdown of Principal vs Interest</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto bg-slate-50/50">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-white sticky top-0 z-10 shadow-sm shadow-slate-200/50">
              <tr>
                <th className="p-4 font-bold text-slate-700 uppercase tracking-wider text-xs border-b border-slate-100">Month</th>
                <th className="p-4 font-bold text-slate-700 uppercase tracking-wider text-xs border-b border-slate-100 text-right">Opening Bal.</th>
                <th className="p-4 font-bold text-slate-700 uppercase tracking-wider text-xs border-b border-slate-100 text-right">EMI</th>
                <th className="p-4 font-bold text-emerald-600 uppercase tracking-wider text-xs border-b border-slate-100 text-right">Extra Paid</th>
                <th className="p-4 font-bold text-amber-600 uppercase tracking-wider text-xs border-b border-slate-100 text-right">Fees (4%)</th>
                <th className="p-4 font-bold text-slate-700 uppercase tracking-wider text-xs border-b border-slate-100 text-right">Principal</th>
                <th className="p-4 font-bold text-rose-500 uppercase tracking-wider text-xs border-b border-slate-100 text-right">Interest</th>
                <th className="p-4 font-bold text-slate-700 uppercase tracking-wider text-xs border-b border-slate-100 text-right">Closing Bal.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {schedule.map((row) => (
                <tr key={row.month} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="p-4 text-slate-500 font-medium group-hover:text-indigo-600">{row.month}</td>
                  <td className="p-4 text-slate-600 text-right tabular-nums">{formatCurrency(row.openingBalance)}</td>
                  <td className="p-4 text-slate-900 font-bold text-right tabular-nums">{formatCurrency(row.emi)}</td>
                  <td className="p-4 text-emerald-600 font-bold text-right tabular-nums">
                    {row.extraPayment > 0 ? `+${formatCurrency(row.extraPayment)}` : '-'}
                  </td>
                  <td className="p-4 text-amber-600 font-medium text-right tabular-nums">
                     {row.fee > 0 ? formatCurrency(row.fee) : '-'}
                  </td>
                  <td className="p-4 text-emerald-600 font-medium text-right tabular-nums">{formatCurrency(row.principalComponent)}</td>
                  <td className="p-4 text-rose-500 font-medium text-right tabular-nums">{formatCurrency(row.interestComponent)}</td>
                  <td className="p-4 text-slate-600 text-right tabular-nums">{formatCurrency(row.closingBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
           <button 
            onClick={onClose}
            className="px-8 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-semibold shadow-lg shadow-slate-200 transition-all active:scale-95"
           >
            Done
           </button>
        </div>
      </div>
    </div>
  );
};

export default AmortizationTable;