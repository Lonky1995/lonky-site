'use client';

const DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${i}:00`);

function getColor(value: number, max: number): string {
  if (value === 0) return 'rgba(99,102,241,0.05)';
  const intensity = value / max;
  if (intensity > 0.7) return 'rgba(99,102,241,0.8)';
  if (intensity > 0.4) return 'rgba(99,102,241,0.5)';
  if (intensity > 0.15) return 'rgba(99,102,241,0.25)';
  return 'rgba(99,102,241,0.12)';
}

export default function TradingHeatmap({ data }: { data: number[][] }) {
  const max = Math.max(...data.flat(), 1);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        <div className="ml-10 flex">
          {HOURS.filter((_, i) => i % 3 === 0).map(h => (
            <div key={h} className="w-[calc(100%/8)] text-center text-[10px] text-muted">{h}</div>
          ))}
        </div>
        {data.map((row, dayIdx) => (
          <div key={dayIdx} className="mb-1 flex items-center gap-1">
            <span className="w-9 pr-1 text-right text-xs text-muted">{DAYS[dayIdx]}</span>
            <div className="flex flex-1 gap-[2px]">
              {row.map((val, hourIdx) => (
                <div
                  key={hourIdx}
                  className="h-5 flex-1 cursor-default rounded-sm transition-colors"
                  style={{ background: getColor(val, max) }}
                  title={`${DAYS[dayIdx]} ${hourIdx}:00 UTC - ${val} 笔`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
