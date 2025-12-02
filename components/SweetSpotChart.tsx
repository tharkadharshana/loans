import React, { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label,
  ReferenceArea
} from 'recharts';
import { TenureComparisonPoint } from '../types';
import { Target } from 'lucide-react';

interface SweetSpotChartProps {
  data: TenureComparisonPoint[];
  currentTenure: number;
  actualTenure?: number;
  monthlyBudget?: number;
  budgetOptimalTenure?: number | null;
  onSelectTenure?: (months: number) => void;
}

const CustomEmiDot = (props: any) => {
  const { cx, cy, payload, currentTenure } = props;
  if (payload.tenureMonths === currentTenure) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill="#4c3bdb" stroke="#ffffff" strokeWidth={2} />
      </g>
    );
  }
  return null;
};

const SweetSpotChart: React.FC<SweetSpotChartProps> = ({ 
    data, 
    currentTenure, 
    actualTenure, 
    monthlyBudget = 0,
    budgetOptimalTenure,
    onSelectTenure 
}) => {

  const { minEmi, maxEmi, minInt, maxInt } = useMemo(() => {
    if (!data || data.length === 0) return { minEmi: 0, maxEmi: 0, minInt: 0, maxInt: 0 };
    const emis = data.map(d => d.emi);
    const ints = data.map(d => d.totalInterest);
    
    let maxE = Math.max(...emis);
    if (monthlyBudget > 0) {
        maxE = Math.max(maxE, monthlyBudget);
    }

    return {
      minEmi: Math.min(...emis),
      maxEmi: maxE,
      minInt: Math.min(...ints),
      maxInt: Math.max(...ints)
    };
  }, [data, monthlyBudget]);

  const PADDING = 0.1;
  const emiRange = maxEmi - minEmi;
  const intRange = maxInt - minInt;
  
  const emiDomain = [Math.max(0, minEmi - emiRange * PADDING), maxEmi + emiRange * PADDING];
  const intDomain = [Math.max(0, minInt - intRange * PADDING), maxInt + intRange * PADDING];

  const intersectionTenure = useMemo(() => {
    if (data.length < 2) return null;
    const normalize = (val: number, min: number, max: number) => (val - min) / (max - min);

    for (let i = 0; i < data.length - 1; i++) {
        const d1 = data[i];
        const d2 = data[i+1];
        const nE1 = normalize(d1.emi, emiDomain[0], emiDomain[1]);
        const nI1 = normalize(d1.totalInterest, intDomain[0], intDomain[1]);
        const nE2 = normalize(d2.emi, emiDomain[0], emiDomain[1]);
        const nI2 = normalize(d2.totalInterest, intDomain[0], intDomain[1]);

        const diff1 = nE1 - nI1;
        const diff2 = nE2 - nI2;

        if (Math.sign(diff1) !== Math.sign(diff2)) {
            const fraction = Math.abs(diff1) / (Math.abs(diff1) + Math.abs(diff2));
            return d1.tenureMonths + fraction * (d2.tenureMonths - d1.tenureMonths);
        }
    }
    return null;
  }, [data, emiDomain, intDomain]);

  const handleChartClick = (e: any) => {
    if (onSelectTenure && e && e.activeLabel) {
      onSelectTenure(Number(e.activeLabel));
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm mb-4 border border-[#e5e5e5]">
      
      <div className="flex items-center justify-between mb-4">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-base font-semibold text-[#0a0a0a]">
                        Visual Optimization
                    </h2>
                    <span className="text-xs text-[#6b6b6b] bg-[#f0f0f2] px-2 py-0.5 rounded-md">Click graph to select</span>
                </div>
                <p className="text-xs text-[#6b6b6b]">
                    Trade-off: <span className="text-[#3b5ee8] font-bold">EMI</span> vs <span className="text-[#dc2626] font-bold">Interest</span>
                </p>
            </div>
            
            {(!monthlyBudget && intersectionTenure) && (
                <button 
                    onClick={() => onSelectTenure && onSelectTenure(Math.round(intersectionTenure))}
                    className="flex items-center gap-2 px-3 py-2 bg-[#4c3bdb] text-white rounded-lg text-xs font-bold hover:bg-[#3b2db8] transition-colors"
                >
                    <Target size={14} />
                    Apply Sweet Spot ({Math.round(intersectionTenure)}m)
                </button>
            )}
             {monthlyBudget > 0 && budgetOptimalTenure && (
                 <button 
                    onClick={() => onSelectTenure && onSelectTenure(budgetOptimalTenure)}
                    className="flex items-center gap-2 px-3 py-2 bg-[#fef9ed] text-[#7a5f00] border border-[#7a5f00]/20 rounded-lg text-xs font-bold"
                >
                    <Target size={14} />
                    Budget Fit ({budgetOptimalTenure}m)
                </button>
             )}
      </div>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 20, right: 0, bottom: 20, left: 0 }}
            onClick={handleChartClick}
          >
            <defs>
              <linearGradient id="emiGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3b5ee8" />
                <stop offset="100%" stopColor="#3b5ee8" />
              </linearGradient>
               <linearGradient id="interestGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>
            
            <XAxis 
              dataKey="tenureMonths" 
              axisLine={false}
              tickLine={false}
              tick={{fontSize: 12, fill: '#6b6b6b'}}
              dy={10}
              tickFormatter={(val) => `${val/12}y`}
            />
            
            <YAxis 
              yAxisId="left"
              orientation="left" 
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${(value/1000).toFixed(0)}k`}
              tick={{fontSize: 10, fill: '#6b6b6b', fontWeight: 500}}
              width={35}
              domain={emiDomain}
            />
            
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${(value/100000).toFixed(1)}L`}
              tick={{fontSize: 10, fill: '#6b6b6b', fontWeight: 500}}
              width={35}
              domain={intDomain}
            />

            <Tooltip 
              cursor={{ stroke: '#e5e5e5', strokeWidth: 1, strokeDasharray: '4 4' }}
              formatter={(value: number, name: string) => [
                  new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(value),
                  (name === 'Monthly EMI') ? 'Monthly Payment' : 'Total Interest'
              ]}
              labelFormatter={(label) => `${Number(label).toFixed(0)} Months`}
              contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  padding: '12px',
                  fontSize: '12px'
              }}
            />

             {/* Budget Line */}
            {monthlyBudget > 0 && (
                <ReferenceLine
                    y={monthlyBudget}
                    yAxisId="left"
                    stroke="#f59e0b"
                    strokeDasharray="5 2"
                >
                     <Label 
                            value={`Budget`} 
                            position="insideTopRight"
                            fill="#d97706"
                            fontSize={10}
                            fontWeight="bold"
                        />
                </ReferenceLine>
            )}

            {/* Unaffordable Zone */}
             {monthlyBudget > 0 && budgetOptimalTenure && (
                 <ReferenceArea 
                    x1={data[0].tenureMonths} 
                    x2={budgetOptimalTenure} 
                    yAxisId="left"
                    fill="#ef4444"
                    fillOpacity={0.05}
                 />
            )}

            <ReferenceLine 
                x={currentTenure} 
                stroke="#e5e5e5" 
                strokeDasharray="4 4" 
                yAxisId="left" 
            >
                 <Label 
                    value="Selected" 
                    position="insideTop" 
                    fill="#0a0a0a" 
                    fontSize={10} 
                    fontWeight="600"
                    offset={10}
                />
            </ReferenceLine>

            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="totalInterest" 
              stroke="url(#interestGradient)"
              strokeWidth={2.5}
              name="Total Interest"
              dot={false}
            />
            
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="emi" 
              stroke="url(#emiGradient)"
              strokeWidth={2.5}
              name="Monthly EMI"
              dot={(props) => <CustomEmiDot {...props} currentTenure={currentTenure} />}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#4c3bdb' }}
            />
            
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SweetSpotChart;