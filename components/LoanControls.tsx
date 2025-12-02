import React from 'react';
import { LoanParams } from '../types';
import { formatCurrency } from '../services/loanUtils';
import { CreditCard, FileText, X } from 'lucide-react';

interface LoanControlsProps {
  params: LoanParams;
  onChange: (newParams: LoanParams) => void;
  baseEmi: number;
  borrowingPower: number;
  onApplyBorrowingPower: () => void;
}

const LoanControls: React.FC<LoanControlsProps> = ({ 
    params, 
    onChange, 
    baseEmi,
    borrowingPower,
    onApplyBorrowingPower
}) => {
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

  const handleBudgetChange = (val: number) => {
    onChange({ ...params, monthlyBudget: val });
  }

  // Calculate percentage for progress bars
  const getProgress = (value: number, min: number, max: number) => {
    return ((value - min) / (max - min)) * 100;
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#e5e5e5]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-[#4c3bdb]" />
          <h2 className="text-base font-bold text-[#0a0a0a]">
            Loan Configuration
          </h2>
        </div>
        <div className="px-3 py-1.5 bg-[#f0f0f2] rounded-lg">
          <span className="text-xs font-medium text-[#0a0a0a]">Payoff in {params.tenureMonths} months</span>
        </div>
      </div>

      {/* Loan Amount */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-[#0a0a0a] mb-3 uppercase tracking-wide">
          Loan Amount (LKR)
        </label>
        <div className="text-2xl font-bold text-[#0a0a0a] mb-3">{formatCurrency(params.amount)}</div>
        <div className="relative h-6 flex items-center">
            <input 
                type="range"
                min="50000"
                max="10000000"
                step="50000"
                value={params.amount}
                onChange={(e) => handleAmountChange(Number(e.target.value))}
                className="absolute w-full z-20 opacity-0 cursor-pointer h-full"
            />
             {/* Custom Track */}
            <div className="w-full h-1.5 bg-[#e8e8ea] rounded-full overflow-hidden relative z-10">
                <div 
                    className="h-full bg-[#4c3bdb] rounded-full" 
                    style={{ width: `${getProgress(params.amount, 50000, 10000000)}%` }}
                />
            </div>
            {/* Custom Thumb */}
            <div 
                className="absolute h-5 w-5 bg-white border-4 border-[#4c3bdb] rounded-full shadow-md z-10 pointer-events-none"
                style={{ left: `calc(${getProgress(params.amount, 50000, 10000000)}% - 10px)` }}
            />
        </div>
      </div>

      {/* Grid: Rate & Duration */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Interest Rate */}
        <div>
          <label className="block text-xs font-bold text-[#0a0a0a] mb-2 uppercase tracking-wide">
            Interest Rate
          </label>
          <div className="text-xl font-bold text-[#0a0a0a] mb-3">{params.interestRate}%</div>
          <div className="relative h-6 flex items-center">
             <input
                type="range"
                min="1"
                max="30"
                step="0.5"
                value={params.interestRate}
                onChange={(e) => handleRateChange(Number(e.target.value))}
                className="absolute w-full z-20 opacity-0 cursor-pointer h-full"
             />
             <div className="w-full h-1.5 bg-[#e8e8ea] rounded-full overflow-hidden relative z-10">
                <div 
                    className="h-full bg-[#4c3bdb] rounded-full" 
                    style={{ width: `${getProgress(params.interestRate, 1, 30)}%` }}
                />
            </div>
            <div 
                className="absolute h-5 w-5 bg-white border-4 border-[#4c3bdb] rounded-full shadow-md z-10 pointer-events-none"
                style={{ left: `calc(${getProgress(params.interestRate, 1, 30)}% - 10px)` }}
            />
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-xs font-bold text-[#0a0a0a] mb-2 uppercase tracking-wide">Duration</label>
          <div className="text-xl font-bold text-[#0a0a0a] mb-3">
             {Math.floor(params.tenureMonths / 12)}y {params.tenureMonths % 12 > 0 && `${params.tenureMonths % 12}m`}
          </div>
          <div className="relative h-6 flex items-center">
            <input
                type="range"
                min="6"
                max="120"
                step="6"
                value={params.tenureMonths}
                onChange={(e) => handleTenureChange(Number(e.target.value))}
                className="absolute w-full z-20 opacity-0 cursor-pointer h-full"
            />
            <div className="w-full h-1.5 bg-[#e8e8ea] rounded-full overflow-hidden relative z-10">
                <div 
                    className="h-full bg-[#4c3bdb] rounded-full" 
                    style={{ width: `${getProgress(params.tenureMonths, 6, 120)}%` }}
                />
            </div>
            <div 
                className="absolute h-5 w-5 bg-white border-4 border-[#4c3bdb] rounded-full shadow-md z-10 pointer-events-none"
                style={{ left: `calc(${getProgress(params.tenureMonths, 6, 120)}% - 10px)` }}
            />
          </div>
        </div>
      </div>

      {/* Affordability Calculator */}
      <div className="bg-[#fef9ed] rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-[#7a5f00]" />
          <h3 className="text-sm font-bold text-[#7a5f00] uppercase tracking-wide">
            Affordability Calculator
          </h3>
        </div>
        <label className="block text-xs font-bold text-[#7a5f00] mb-2">
          My Max Monthly Budget
        </label>
        <div className="relative mb-2">
             <input
                type="number"
                value={params.monthlyBudget === 0 ? '' : params.monthlyBudget}
                placeholder="Rs. Enter your limit (e.g. 40000)"
                onChange={(e) => handleBudgetChange(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-[#7a5f00]/20 bg-white text-[#0a0a0a] placeholder:text-[#6b6b6b] outline-none focus:ring-2 focus:ring-[#7a5f00]/20"
            />
            {params.monthlyBudget > 0 && (
                <button 
                onClick={() => handleBudgetChange(0)}
                className="absolute inset-y-0 right-3 flex items-center text-[#7a5f00]/60 hover:text-[#7a5f00]"
                >
                <X size={16} />
                </button>
            )}
        </div>
       
        {params.monthlyBudget > 0 && borrowingPower > 0 ? (
             <div className="mt-3 pt-3 border-t border-[#7a5f00]/10 animate-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-1">
                    <div>
                        <div className="text-[10px] font-bold text-[#7a5f00] uppercase tracking-wide opacity-80">Your Borrowing Power</div>
                        <div className="text-lg font-bold text-[#7a5f00]">{formatCurrency(borrowingPower)}</div>
                    </div>
                    <button
                        onClick={onApplyBorrowingPower}
                        className="px-3 py-1.5 bg-[#7a5f00] text-[#fef9ed] text-xs font-bold rounded-lg hover:bg-[#5c4700] transition-colors shadow-sm"
                    >
                        Apply Limit
                    </button>
                </div>
                <p className="text-[10px] text-[#7a5f00]/80">
                    Based on your budget and current interest rate.
                </p>
             </div>
        ) : (
            <p className="text-xs text-[#7a5f00]">
            We'll highlight the "Budget Sweet Spot" on the chart and calculate your borrowing power.
            </p>
        )}
      </div>

      {/* Extra Monthly Payment */}
      <div className="mb-2">
        <label className="block text-xs font-bold text-[#0a0a0a] mb-3 uppercase tracking-wide">
          Extra Monthly Payment
        </label>
        <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-[#e5e5e5] bg-[#f8f8f9] mb-3">
          <span className="text-[#0a0a0a] font-medium">{params.extraPayment > 0 ? 'Custom Amount' : 'None'}</span>
          <span className="text-lg font-bold text-[#0a0a0a]">{formatCurrency(params.extraPayment)}</span>
        </div>
        
        <div className="relative h-6 flex items-center mb-2">
             <input
                type="range"
                min="0"
                max={Math.max(baseEmi * 1.5, 50000)}
                step="500"
                value={params.extraPayment}
                onChange={(e) => handleExtraPaymentChange(Number(e.target.value))}
                className="absolute w-full z-20 opacity-0 cursor-pointer h-full"
            />
             <div className="w-full h-1.5 bg-[#e8e8ea] rounded-full overflow-hidden relative z-10">
                <div 
                    className="h-full bg-[#4c3bdb] rounded-full" 
                    style={{ width: `${getProgress(params.extraPayment, 0, Math.max(baseEmi * 1.5, 50000))}%` }}
                />
            </div>
            <div 
                className="absolute h-5 w-5 bg-white border-4 border-[#4c3bdb] rounded-full shadow-md z-10 pointer-events-none"
                style={{ left: `calc(${getProgress(params.extraPayment, 0, Math.max(baseEmi * 1.5, 50000))}% - 10px)` }}
            />
        </div>
        
        <div className="flex items-center justify-between">
           <span className="text-sm text-[#0a0a0a]">None</span>
           <span className="text-sm font-medium text-[#4c3bdb]">+ {formatCurrency(Math.max(baseEmi * 1.5, 50000))}</span>
        </div>
      </div>

    </div>
  );
};

export default LoanControls;