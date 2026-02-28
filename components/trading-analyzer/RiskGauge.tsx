'use client';

export default function RiskGauge({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const angle = (clamped / 100) * 180;
  const label = clamped > 70 ? '激进' : clamped > 40 ? '适中' : '保守';
  const color = clamped > 70 ? '#ef4444' : clamped > 40 ? '#f59e0b' : '#22c55e';

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 120" className="w-full max-w-[200px]">
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="rgba(99,102,241,0.15)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(angle / 180) * 251.2} 251.2`}
        />
        <line
          x1="100"
          y1="100"
          x2={100 + 60 * Math.cos(((180 - angle) * Math.PI) / 180)}
          y2={100 - 60 * Math.sin(((180 - angle) * Math.PI) / 180)}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="100" cy="100" r="4" fill={color} />
        <text x="100" y="88" textAnchor="middle" fill={color} fontSize="24" fontWeight="bold">
          {clamped}
        </text>
      </svg>
      <span className="mt-1 text-sm font-medium" style={{ color }}>{label}</span>
    </div>
  );
}
