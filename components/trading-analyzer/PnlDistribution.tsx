'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { PnlBucket } from '@/lib/trading-analyzer/types';

export default function PnlDistribution({ data }: { data: PnlBucket[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} />
        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
        <Tooltip
          contentStyle={{
            background: 'rgba(17,24,39,0.95)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 8,
            fontSize: 12,
            color: '#f1f5f9',
          }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.min >= 0 ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
