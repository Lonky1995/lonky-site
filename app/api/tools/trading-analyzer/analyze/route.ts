import { NextRequest } from 'next/server';
import { computeStats } from '@/lib/trading-analyzer/stats-engine';
import {
  analyzeHabits,
  analyzeMoneyManagement,
  analyzeTiming,
  analyzeDiscipline,
  synthesize,
} from '@/lib/trading-analyzer/ai-analyzer';
import { fetchMarketSnapshots, enrichTradesWithMarket } from '@/lib/trading-analyzer/market-snapshot';
import type { Trade } from '@/lib/trading-analyzer/types';

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const { trades } = await req.json() as { trades: Trade[] };

  if (!trades || trades.length === 0) {
    return new Response(JSON.stringify({ error: 'No trades provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (type: string, data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, data })}\n\n`));
      };

      (async () => {
        try {
          // Step 1: Stats (pure computation)
          const stats = computeStats(trades);
          send('stats', stats);

          // Step 2: Market snapshots + 3 AI calls in parallel; discipline waits for market data
          const snapshotsP = fetchMarketSnapshots(trades);
          const habitsP = analyzeHabits(stats, trades).then(r => { send('habits', r); return r; });
          const moneyP = analyzeMoneyManagement(trades).then(r => { send('moneyManagement', r); return r; });
          const timingP = analyzeTiming(trades).then(r => { send('timing', r); return r; });

          // Discipline starts as soon as market data is ready (don't wait for other AI calls)
          const discP = snapshotsP.then(snapshots => {
            const enrichedTrades = enrichTradesWithMarket(trades, snapshots);
            return analyzeDiscipline(trades, enrichedTrades);
          }).then(r => { send('discipline', r); return r; });

          const [habits, moneyMgmt, timing, discipline] = await Promise.all([
            habitsP, moneyP, timingP, discP,
          ]);

          // Step 3: Synthesis
          const diagnosis = await synthesize(stats, habits, moneyMgmt, timing, discipline);
          send('diagnosis', diagnosis);

          send('done', {});
          controller.close();
        } catch (err: any) {
          send('error', { message: err.message || 'Analysis failed' });
          controller.close();
        }
      })();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
