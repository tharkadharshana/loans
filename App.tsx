import React, { useState, useMemo } from 'react';
import { Info, TrendingUp, Calendar, Table2 } from 'lucide-react';
import LoanControls from './components/LoanControls';
import SweetSpotChart from './components/SweetSpotChart';
import AIAdvisor from './components/AIAdvisor';
import AmortizationTable from './components/AmortizationTable';
import PrepaymentStrategy from './components/PrepaymentStrategy';
import { LoanParams } from './types';
import { calculateEMI, formatCurrency, generateAmortizationSchedule, generateSweetSpotData, calculateMaxLoanAmount, findOptimalTenureForBudget } from './services/loanUtils';

const App: React.FC = () => {
  const [params, setParams] = useState<LoanParams>({
    amount: 1000000,
    interestRate: 22,
    tenureMonths: 60,
    extraPayment: 0,
    monthlyBudget: 0,
  });

  const [isTableOpen, setIsTableOpen] = useState(false);

  // Calculations
  const baseEmi = useMemo(() => calculateEMI(params.amount, params.interestRate, params.tenureMonths), [params.amount, params.interestRate, params.tenureMonths]);
  
  const actualSchedule = useMemo(() => 
    generateAmortizationSchedule(params.amount, params.interestRate, params.tenureMonths, params.extraPayment),
    [params]
  );

  const actualTotalInterest = actualSchedule.reduce((sum, row) => sum + row.interestComponent, 0);
  const actualTotalPayment = actualSchedule.reduce((sum, row) => sum + row.totalPayment, 0);
  const actualTenureMonths = actualSchedule.length;

  const chartMaxMonths = useMemo(() => {
     if (params.monthlyBudget > 0) return 240; 
     return 120;
  }, [params.monthlyBudget]);

  const chartData = useMemo(() => generateSweetSpotData(params.amount, params.interestRate, 6, chartMaxMonths), [params.amount, params.interestRate, chartMaxMonths]);

  const borrowingPower = useMemo(() => {
    if (params.monthlyBudget <= 0) return 0;
    return calculateMaxLoanAmount(params.monthlyBudget, params.interestRate, params.tenureMonths);
  }, [params.monthlyBudget, params.interestRate, params.tenureMonths]);

  const budgetOptimalTenure = useMemo(() => {
    if (params.monthlyBudget <= 0) return null;
    return findOptimalTenureForBudget(params.amount, params.interestRate, params.monthlyBudget);
  }, [params.amount, params.interestRate, params.monthlyBudget]);

  const applyBorrowingPower = () => {
      if (borrowingPower > 0) {
          const roundedAmount = Math.floor(borrowingPower / 10000) * 10000;
          setParams(prev => ({...prev, amount: roundedAmount}));
      }
  };

  return (
    <>
      <div className="min-h-screen bg-[#f5f5f7] pb-32">
        <div className="max-w-xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-[#0a0a0a]">Loan Calculator</h1>
              <div className="flex items-center gap-2 px-3 py-2 bg-[#fef9ed] rounded-full border border-[#7a5f00]/10">
                  <Info size={14} className="text-[#7a5f00]" />
                  <span className="text-[10px] font-bold text-[#7a5f00] tracking-wide uppercase">Reducing Balance Method</span>
              </div>
          </div>

          {/* 1. Loan Controls Card */}
          <div className="mb-4">
              <LoanControls 
                  params={params} 
                  onChange={setParams} 
                  baseEmi={baseEmi}
                  borrowingPower={borrowingPower}
                  onApplyBorrowingPower={applyBorrowingPower}
              />
          </div>

          {/* 2. AI Advisor (Purple Bar) */}
          <AIAdvisor params={params} />

          {/* 3. Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#e5e5e5]">
                  <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={16} className="text-[#dc2626]" />
                      <span className="text-xs font-bold text-[#6b6b6b] uppercase">Total Interest</span>
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-[#0a0a0a]">{formatCurrency(actualTotalInterest)}</div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#e5e5e5]">
                  <div className="flex items-center gap-2 mb-2">
                      <Calendar size={16} className="text-[#6b6b6b]" />
                      <span className="text-xs font-bold text-[#6b6b6b] uppercase">Total Cost</span>
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-[#0a0a0a]">{formatCurrency(actualTotalPayment)}</div>
              </div>
          </div>

          {/* 4. Visual Optimization Chart */}
          <SweetSpotChart 
              data={chartData} 
              currentTenure={params.tenureMonths} 
              actualTenure={params.extraPayment > 0 ? actualTenureMonths : undefined}
              monthlyBudget={params.monthlyBudget}
              budgetOptimalTenure={budgetOptimalTenure}
              onSelectTenure={(months) => setParams(prev => ({...prev, tenureMonths: months}))}
          />

          {/* 5. Strategies */}
          <div className="mb-4">
              <PrepaymentStrategy params={params} onApply={(extra) => setParams(p => ({...p, extraPayment: extra}))} />
          </div>

          {/* 6. Footer / Deep Dive */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#e5e5e5]">
              <div className="flex items-center justify-between">
                  <div>
                      <h2 className="text-base font-bold text-[#0a0a0a] mb-1">Deep Dive</h2>
                      <p className="text-xs text-[#6b6b6b]">See exactly how every rupee is allocated each month.</p>
                  </div>
                  <button 
                      onClick={() => setIsTableOpen(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#f0f0f2] text-[#0a0a0a] rounded-lg text-sm font-bold hover:bg-[#e8e8ea] transition-colors"
                  >
                      <Table2 size={18} />
                      View Full Schedule
                  </button>
              </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar - Moved OUTSIDE the main container to ensure proper fixed positioning */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5e5e5] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#6b6b6b] uppercase tracking-wide">Monthly EMI</span>
                <span className="text-xl font-bold text-[#4c3bdb]">{formatCurrency(baseEmi)}</span>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-[#6b6b6b] uppercase tracking-wide">Total Interest</span>
                <span className="text-lg font-bold text-[#dc2626]">{formatCurrency(actualTotalInterest)}</span>
            </div>
        </div>
      </div>

      <AmortizationTable 
        schedule={actualSchedule} 
        isOpen={isTableOpen} 
        onClose={() => setIsTableOpen(false)} 
      />
    </>
  );
};

export default App;