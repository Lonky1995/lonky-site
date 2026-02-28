'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface Props {
  scores: {
    profitability: number;
    riskControl: number;
    discipline: number;
    timing: number;
    consistency: number;
    moneyManagement: number;
  };
}

export default function TraderProfile({ scores }: Props) {
  const data = [
    { dim: '盈利能力', value: scores.profitability },
    { dim: '风险控制', value: scores.riskControl },
    { dim: '交易纪律', value: scores.discipline },
    { dim: '择时能力', value: scores.timing },
    { dim: '一致性', value: scores.consistency },
    { dim: '资金管理', value: scores.moneyManagement },
  ];

  return (
    <ResponsiveContainer width="100%" height={240}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="68%">
        <PolarGrid stroke="rgba(99,102,241,0.2)" />
        <PolarAngleAxis dataKey="dim" tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          dataKey="value"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.25}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
