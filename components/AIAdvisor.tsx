import React, { useState, useEffect } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { LoanParams } from '../types';
import { getLoanAdvice } from '../services/geminiService';

interface AIAdvisorProps {
  params: LoanParams;
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ params }) => {
  const [advice, setAdvice] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [hasFetched, setHasFetched] = useState<boolean>(false);

  useEffect(() => {
     // Reset logic if needed
  }, [params.amount]);

  const handleAnalyze = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) setIsOpen(true);
    setLoading(true);
    const result = await getLoanAdvice(params);
    setAdvice(result);
    setLoading(false);
    setHasFetched(true);
  };

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div className="rounded-2xl shadow-lg bg-white overflow-hidden mb-4">
      <button 
        onClick={hasFetched ? toggleOpen : handleAnalyze}
        className="w-full flex items-center justify-between px-5 py-4 bg-[#4c3bdb] text-white transition-all active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-white" />
          <div className="text-left">
            <div className="text-base font-semibold text-white">
              AI Financial Advisor
            </div>
            <div className="text-xs text-white/90">
              Get smart insights for this loan
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">
             {loading ? 'Analyzing...' : (hasFetched ? (isOpen ? 'Hide' : 'Show') : 'Analyze')}
          </span>
          {loading ? (
             <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
             isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />
          )}
        </div>
      </button>

      {/* Content Area */}
      <div className={`transition-all duration-300 ease-in-out bg-white ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
        {advice && (
             <div className="p-5 border-t border-slate-100">
                <div className="prose prose-sm prose-slate text-slate-600 leading-relaxed text-xs">
                    <ReactMarkdown>{advice}</ReactMarkdown>
                </div>
                <div className="flex justify-end mt-2">
                     <button onClick={handleAnalyze} className="text-xs text-[#4c3bdb] font-bold hover:underline">
                        Regenerate Analysis
                     </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AIAdvisor;