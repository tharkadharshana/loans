import React, { useMemo } from 'react';
import { LoanParams } from '../types';
import { formatCurrency, generatePrepaymentScenarios } from '../services/loanUtils';
import { ArrowRight, CheckCircle, Clock, TrendingUp } from 'lucide-react';

interface PrepaymentStrategyProps {
  params: LoanParams;
  onApply: (extraAmount: number) => void;
}

const PrepaymentStrategy: React.FC<PrepaymentStrategyProps> = ({ params, onApply }) => {
  const scenarios = useMemo(() => 
    generatePrepaymentScenarios(params.amount, params.interestRate, params.tenureMonths),
    [params.amount, params.interestRate, params.tenureMonths]
  );

  return (
    <div className="mb-4">
       <div className="bg-[#f0f0f2] rounded-t-2xl px-5 py-3 mb-1">
            <div className="flex items-center gap-2">
                <TrendingUp size={20} className="text-[#0a0a0a]" />
                <h2 className="text-base font-bold text-[#0a0a0a]">Smart Payoff Strategies</h2>
            </div>
       </div>
       
       <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {scenarios.map((scenario) => (
             <div key={scenario.label} className="bg-white rounded-xl p-4 shadow-sm border border-[#e5e5e5]">
                 <div className="mb-3">
                    <div className="text-xs font-medium text-[#6b6b6b] mb-1">{scenario.label}</div>
                    <div className="text-lg font-bold text-[#0a0a0a]">
                         + {formatCurrency(scenario.extraAmount)}
                         <span className="text-sm font-normal text-[#6b6b6b]">/mo</span>
                    </div>
                 </div>
                 
                 <div className="space-y-2 mb-4">
                     <div className="flex items-center gap-2 text-xs">
                         <CheckCircle size={16} className="text-[#4c3bdb]" />
                         <span className="text-[#6b6b6b]">
                             Save <span className="font-bold text-[#0a0a0a]">{formatCurrency(scenario.interestSaved)}</span>
                         </span>
                     </div>
                      <div className="flex items-center gap-2 text-xs">
                         <Clock size={16} className="text-[#4c3bdb]" />
                         <span className="text-[#6b6b6b]">
                             Finish <span className="font-bold text-[#0a0a0a]">{Math.floor(scenario.timeSavedMonths/12)}y {scenario.timeSavedMonths%12}m</span> early
                         </span>
                     </div>
                 </div>

                 <button 
                    onClick={() => onApply(scenario.extraAmount)}
                    className={`
                        w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-colors
                        ${params.extraPayment === scenario.extraAmount 
                            ? 'bg-[#4c3bdb] text-white' 
                            : 'bg-[#f0f0f2] text-[#0a0a0a] hover:bg-[#e8e8ea]'
                        }
                    `}
                 >
                    {params.extraPayment === scenario.extraAmount ? 'Active Strategy' : 'Apply Strategy'}
                    {params.extraPayment !== scenario.extraAmount && <ArrowRight size={14} />}
                 </button>
             </div>
          ))}
       </div>
    </div>
  );
};

export default PrepaymentStrategy;