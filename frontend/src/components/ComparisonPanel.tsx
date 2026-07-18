"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

type SolverResult = {
  name: string;
  moves: number;
  time_ms: number;
  nodes_visited: number;
  solution: string[];
};

export default function ComparisonPanel({ 
  optimal, custom 
}: { 
  optimal: SolverResult | null, 
  custom: SolverResult | null 
}) {
  if (!optimal && !custom) return null;

  const data = [];
  if (optimal) data.push({ name: 'Optimal (Kociemba)', Moves: optimal.moves, Time: optimal.time_ms });
  if (custom) data.push({ name: 'Custom (IDDFS)', Moves: custom.moves, Time: custom.time_ms });

  return (
    <div className="glass rounded-xl p-6 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-xl font-bold tracking-tight">Solver Comparison</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {optimal && (
          <div className="bg-black/40 rounded-lg p-4 border border-white/5">
            <h4 className="text-primary font-medium mb-2">Optimal Solver</h4>
            <div className="text-2xl font-bold">{optimal.moves} moves</div>
            <div className="text-sm text-muted-foreground">{optimal.time_ms} ms computation</div>
            <div className="mt-3 flex flex-wrap gap-1">
              {optimal.solution.map((m, i) => (
                <span key={i} className="px-2 py-0.5 bg-white/10 rounded text-xs font-mono">{m}</span>
              ))}
            </div>
          </div>
        )}
        
        {custom && (
          <div className="bg-black/40 rounded-lg p-4 border border-white/5">
            <h4 className="text-green-500 font-medium mb-2">Custom Solver</h4>
            <div className="text-2xl font-bold">{custom.moves} moves</div>
            <div className="text-sm text-muted-foreground">{custom.time_ms} ms • {custom.nodes_visited.toLocaleString()} nodes</div>
            <div className="mt-3 flex flex-wrap gap-1">
              {custom.solution.map((m, i) => (
                <span key={i} className="px-2 py-0.5 bg-white/10 rounded text-xs font-mono">{m}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="h-48 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={120} tick={{fill: '#a1a1aa'}} />
            <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
            <Legend />
            <Bar dataKey="Moves" fill="#3b82f6" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.name.includes('Optimal') ? '#3b82f6' : '#22c55e'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
