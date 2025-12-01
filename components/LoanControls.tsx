import React from 'react';
import { LoanParams } from '../types';
import { formatCurrency } from '../services/loanUtils';
import { Banknote, Wallet } from 'lucide-react';

interface LoanControlsProps {
  params: LoanParams;
  onChange: (newParams: LoanParams) => void;
  baseEmi: number;
}

const LoanControls: React.FC<LoanControlsProps> = ({ params, onChange, baseEmi }) => {
  const handleAmountChange = (val: number) => {
    const newAmount = Math.max(50000, Math.min(10000000, val));
    onChange({ ...params, amount: newAmount });
  };

  const handleRateChange = (val: number) => {
    onChange({ ...params, interestRate: val });
  };

  const handleTenureChange = (val: number) => {
    onChange({ ...params, tenureMonths: val });
  };

  const handleExtraPaymentChange = (val: number) => {
    onChange({ ...params, extraPayment: val });
  };

  // Quick select presets
  const amountPresets = [500000, 1000000, 2500000, 5000000];

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
           <Banknote size={20} />
        </div>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Loan Configuration</h2>
      </div>
      
      {/* Amount Input */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Loan Amount (LKR)</label>
        
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="text-slate-400 font-medium">Rs.</span>
          </div>
          <input 
              type="number" 
              value={params.amount} 
              onChange={(e) => handleAmountChange(Number(e.target.value))}
              className="block w-full pl-12 pr-4 py-2.5 text-xl font-bold text-slate-800 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
          />
        </div>

        <input
          type="range"
          min="50000"
          max="10000000"
          step="50000"
          value={params.amount}
          onChange={(e) => handleAmountChange(Number(e.target.value))}
          className="w-full accent-indigo-600 cursor-pointer"
        />
        
        <div className="flex flex-wrap gap-2">
            {amountPresets.map((preset) => (
                <button
                    key={preset}
                    onClick={() => handleAmountChange(preset)}
                    className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                >
                    {formatCurrency(preset).replace('LKR', '').trim()}
                </button>
            ))}
        </div>
      </div>

      <div className="h-px bg-slate-100 w-full"></div>

      {/* Interest Rate & Tenure Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Interest Rate Input */}
        <div className="space-y-1">
            <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Interest Rate</label>
                <div className="text-lg font-bold text-slate-800 tabular-nums">
                    {params.interestRate}%
                </div>
            </div>
            
            <input
                type="range"
                min="1"
                max="30"
                step="0.5"
                value={params.interestRate}
                onChange={(e) => handleRateChange(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
            />
        </div>

        {/* Tenure Input */}
        <div className="space-y-1">
            <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Duration</label>
                <div className="text-lg font-bold text-slate-800 tabular-nums">
                    {Math.floor(params.tenureMonths / 12)}<span className="text-xs text-slate-500 ml-0.5">y</span>
                    {params.tenureMonths % 12 > 0 && <span className="ml-1">{params.tenureMonths % 12}<span className="text-xs text-slate-500 ml-0.5">m</span></span>}
                </div>
            </div>

            <input
                type="range"
                min="6"
                max="120"
                step="6"
                value={params.tenureMonths}
                onChange={(e) => handleTenureChange(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
            />
        </div>
      </div>

      <div className="h-px bg-slate-100 w-full"></div>

      {/* Extra Payment Strategy */}
      <div className="space-y-2 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
        <div className="flex items-center gap-2 mb-1 text-emerald-700">
           <Wallet size={16} />
           <span className="text-xs font-bold uppercase tracking-wider">Extra Monthly Payment</span>
        </div>
        
        <div className="flex justify-between items-end">
             <div className="text-[10px] text-emerald-600 font-medium max-w-[60%] leading-tight">
                Pay more to reduce tenure & interest
             </div>
             <div className="text-lg font-bold text-emerald-700 tabular-nums">
                {params.extraPayment > 0 ? formatCurrency(params.extraPayment) : 'Rs. 0'}
             </div>
        </div>

        <input
          type="range"
          min="0"
          max={baseEmi * 2} // Allow up to double the EMI or 100k, whichever is reasonable dynamically
          step="1000"
          value={params.extraPayment}
          onChange={(e) => handleExtraPaymentChange(Number(e.target.value))}
          className="w-full accent-emerald-500 cursor-pointer"
        />
        <div className="flex justify-between text-[9px] font-semibold text-emerald-400 uppercase tracking-wide">
            <span>None</span>
            <span>+ {formatCurrency(baseEmi)}</span>
        </div>
      </div>

    </div>
  );
};

export default LoanControls;