import React, { useMemo } from 'react';
import { LoanParams, PrepaymentScenario } from '../types';
import { formatCurrency, generatePrepaymentScenarios } from '../services/loanUtils';
import { ArrowRight, Clock, PiggyBank, TrendingDown } from 'lucide-react';

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
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
         <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700">
            <TrendingDown size={18} />
         </div>
         <h3 className="text-lg font-bold text-slate-800">Smart Payoff Strategies</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((scenario) => (
          <div 
            key={scenario.label}
            className={`
                relative p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg group
                ${params.extraPayment === scenario.extraAmount 
                    ? 'bg-emerald-50 border-emerald-500 shadow-md ring-1 ring-emerald-500' 
                    : 'bg-white border-slate-200 hover:border-emerald-300'
                }
            `}
          >
             {params.extraPayment === scenario.extraAmount && (
                <div className="absolute top-3 right-3 text-xs font-bold text-emerald-600 bg-white px-2 py-1 rounded-full shadow-sm">
                    Active
                </div>
             )}

             <h4 className="font-bold text-slate-700 mb-1">{scenario.label}</h4>
             <div className="text-2xl font-bold text-slate-900 mb-4">
                +{formatCurrency(scenario.extraAmount)}
                <span className="text-xs font-medium text-slate-400 ml-1">/mo</span>
             </div>

             <div className="space-y-3 mb-5">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <PiggyBank size={16} className="text-emerald-500" />
                    <span>Save <span className="font-bold text-emerald-600">{formatCurrency(scenario.interestSaved)}</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock size={16} className="text-indigo-500" />
                    <span>Finish <span className="font-bold text-indigo-600">{Math.floor(scenario.timeSavedMonths/12)}y {scenario.timeSavedMonths%12}m</span> early</span>
                </div>
             </div>

             <button 
                onClick={() => onApply(scenario.extraAmount)}
                className={`
                    w-full py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2
                    ${params.extraPayment === scenario.extraAmount
                        ? 'bg-emerald-600 text-white shadow-emerald-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-800 hover:text-white'
                    }
                `}
             >
                {params.extraPayment === scenario.extraAmount ? 'Applied' : 'Apply Strategy'}
                {params.extraPayment !== scenario.extraAmount && <ArrowRight size={14} />}
             </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrepaymentStrategy;