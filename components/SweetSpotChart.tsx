import React from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label
} from 'recharts';
import { TenureComparisonPoint } from '../types';

interface SweetSpotChartProps {
  data: TenureComparisonPoint[];
  currentTenure: number;
  actualTenure?: number; // New prop for when extra payments reduce tenure
}

const CustomEmiDot = (props: any) => {
  const { cx, cy, payload, currentTenure } = props;
  if (payload.tenureMonths === currentTenure) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill="#4f46e5" stroke="#ffffff" strokeWidth={3} />
        <circle cx={cx} cy={cy} r={12} fill="none" stroke="#4f46e5" strokeWidth={2} opacity={0.4} />
      </g>
    );
  }
  return null;
};

const CustomInterestDot = (props: any) => {
  const { cx, cy, payload, currentTenure } = props;
  if (payload.tenureMonths === currentTenure) {
    return (
      <circle cx={cx} cy={cy} r={5} fill="#f43f5e" stroke="#ffffff" strokeWidth={2} />
    );
  }
  return null;
};

const SweetSpotChart: React.FC<SweetSpotChartProps> = ({ data, currentTenure, actualTenure }) => {
  
  // Determine displayed tenure logic
  const displayTenure = actualTenure && actualTenure < currentTenure ? actualTenure : currentTenure;

  return (
    <div className="h-[450px] w-full bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col">
      <div className="mb-2">
            <h3 className="text-lg font-bold text-slate-800">Optimization Graph</h3>
            <p className="text-sm text-slate-500">
                Visualize how changing tenure affects your 
                <span className="text-indigo-600 font-medium ml-1">Monthly Payment</span> & 
                <span className="text-rose-500 font-medium ml-1">Total Interest</span>
            </p>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <defs>
              <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <XAxis 
              dataKey="tenureMonths" 
              axisLine={false}
              tickLine={false}
              tick={{fontSize: 12, fill: '#94a3b8'}}
              dy={10}
              tickFormatter={(val) => `${val/12}y`}
              padding={{ left: 30, right: 30 }}
            />
            
            <YAxis 
              yAxisId="left"
              orientation="left" 
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${(value/1000).toFixed(0)}k`}
              tick={{fontSize: 12, fill: '#6366f1', fontWeight: 500}}
              width={40}
              padding={{ top: 20, bottom: 20 }}
            />
            
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${(value/100000).toFixed(1)}L`}
              tick={{fontSize: 12, fill: '#f43f5e', fontWeight: 500}}
              width={40}
              padding={{ top: 20, bottom: 20 }}
            />

            <Tooltip 
              cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }}
              formatter={(value: number, name: string) => [
                  new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(value),
                  name === 'emi' ? 'Monthly Payment' : 'Total Interest'
              ]}
              labelFormatter={(label) => {
                const years = (Number(label) / 12).toFixed(1);
                return `${label} Months (${years} Years)`;
              }}
              contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  borderRadius: '16px', 
                  border: '1px solid #e2e8f0', 
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  padding: '12px 16px',
                  fontFamily: 'Inter, sans-serif'
              }}
            />
            
            {/* Base Tenure Reference */}
            <ReferenceLine 
                x={currentTenure} 
                stroke="#cbd5e1" 
                strokeDasharray="3 3" 
                yAxisId="left" 
            />

            {/* Actual Payoff Reference (Green) if different */}
            {actualTenure && actualTenure < currentTenure && (
                 <ReferenceLine 
                    x={actualTenure} 
                    stroke="#10b981" 
                    strokeDasharray="4 2" 
                    yAxisId="left"
                    strokeWidth={2}
                 >
                    <Label 
                        value="Payoff" 
                        position="insideTopRight" 
                        fill="#10b981" 
                        fontSize={10} 
                        fontWeight="bold" 
                        offset={10}
                    />
                 </ReferenceLine>
            )}

            <Area 
              yAxisId="right"
              type="monotone" 
              dataKey="totalInterest" 
              fill="url(#colorInterest)" 
              stroke="#f43f5e" 
              strokeWidth={3}
              name="Total Interest Cost"
              animationDuration={500}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#f43f5e' }}
              dot={(props) => <CustomInterestDot {...props} currentTenure={currentTenure} />}
            />
            
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="emi" 
              stroke="#4f46e5" 
              strokeWidth={4}
              dot={(props) => <CustomEmiDot {...props} currentTenure={currentTenure} />}
              activeDot={{ r: 8, strokeWidth: 0, fill: '#4f46e5' }}
              name="Monthly EMI"
              animationDuration={500}
            />
            
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SweetSpotChart;