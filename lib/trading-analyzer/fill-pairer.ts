import type { Trade } from './types';

export interface RawFill {
  id: string;
  symbol: string;
  side: string;
  price: number;
  amount: number;
  cost: number;
  fee: { cost: number; currency: string } | undefined;
  timestamp: number;
  order: string;
  info: any;
}

interface GroupedPosition {
  symbol: string;
  side: 'long' | 'short';
  openFills: RawFill[];
  closeFills: RawFill[];
  totalOpenQty: number;
  totalCloseQty: number;
  entryPrice: number;
  exitPrice: number;
  openTime: number;
  closeTime: number;
  fees: number;
  orderIds: string[];
  pnl: number;
}

export function pairFillsIntoPositions(fills: RawFill[]): GroupedPosition[] {
  fills.sort((a, b) => a.timestamp - b.timestamp);

  const bySymbol = new Map<string, RawFill[]>();
  for (const f of fills) {
    const arr = bySymbol.get(f.symbol) || [];
    arr.push(f);
    bySymbol.set(f.symbol, arr);
  }

  const positions: GroupedPosition[] = [];

  for (const [symbol, symbolFills] of bySymbol) {
    let openFills: RawFill[] = [];
    let closeFills: RawFill[] = [];
    let orderIds = new Set<string>();
    let currentSide: 'long' | 'short' | null = null;
    let realizedPnlSum = 0;

    for (const fill of symbolFills) {
      const pnl = fill.info?.realizedPnl !== undefined
        ? parseFloat(fill.info.realizedPnl)
        : 0;
      const isOpenFill = pnl === 0;

      orderIds.add(fill.order);

      if (isOpenFill) {
        if (currentSide && closeFills.length > 0) {
          positions.push(buildPosition(symbol, currentSide, openFills, closeFills, orderIds, realizedPnlSum));
          openFills = [];
          closeFills = [];
          orderIds = new Set();
          realizedPnlSum = 0;
          currentSide = null;
        }

        if (currentSide === null) {
          currentSide = fill.side === 'buy' ? 'long' : 'short';
        }
        openFills.push(fill);
      } else {
        closeFills.push(fill);
        realizedPnlSum += pnl;
      }
    }

    if (currentSide && openFills.length > 0) {
      if (closeFills.length > 0) {
        positions.push(buildPosition(symbol, currentSide, openFills, closeFills, orderIds, realizedPnlSum));
      } else {
        const totalOpenQty = openFills.reduce((s, f) => s + f.amount, 0);
        const entryPrice = openFills.reduce((s, f) => s + f.price * f.amount, 0) / totalOpenQty;
        positions.push({
          symbol, side: currentSide,
          openFills, closeFills: [],
          totalOpenQty, totalCloseQty: 0,
          entryPrice, exitPrice: 0,
          openTime: openFills[0].timestamp, closeTime: 0,
          fees: openFills.reduce((s, f) => s + (f.fee?.cost ?? 0), 0),
          orderIds: Array.from(orderIds),
          pnl: 0,
        });
      }
    }
  }

  return positions;
}

function buildPosition(
  symbol: string,
  side: 'long' | 'short',
  openFills: RawFill[],
  closeFills: RawFill[],
  orderIds: Set<string>,
  realizedPnlSum: number,
): GroupedPosition {
  const totalOpenQty = openFills.reduce((s, f) => s + f.amount, 0);
  const totalCloseQty = closeFills.reduce((s, f) => s + f.amount, 0);
  const entryPrice = openFills.reduce((s, f) => s + f.price * f.amount, 0) / totalOpenQty;
  const exitPrice = closeFills.reduce((s, f) => s + f.price * f.amount, 0) / totalCloseQty;
  const fees = [...openFills, ...closeFills].reduce((s, f) => s + (f.fee?.cost ?? 0), 0);

  return {
    symbol, side,
    openFills: [...openFills], closeFills: [...closeFills],
    totalOpenQty, totalCloseQty,
    entryPrice, exitPrice,
    openTime: openFills[0].timestamp,
    closeTime: closeFills[closeFills.length - 1].timestamp,
    fees,
    orderIds: Array.from(orderIds),
    pnl: realizedPnlSum - fees,
  };
}

export function positionsToTrades(positions: GroupedPosition[]): Trade[] {
  return positions.map(pos => {
    const holdDuration = pos.closeTime ? Math.round((pos.closeTime - pos.openTime) / 1000) : null;
    const notional = pos.entryPrice * pos.totalOpenQty;
    const pnlPercent = notional > 0 ? (pos.pnl / notional) * 100 : 0;

    return {
      id: `${pos.symbol}-${pos.openTime}`,
      exchange: 'binance' as const,
      symbol: pos.symbol,
      side: pos.side,
      open_time: pos.openTime,
      close_time: pos.closeTime || null,
      hold_duration: holdDuration,
      entry_price: pos.entryPrice,
      exit_price: pos.exitPrice || null,
      quantity: pos.totalOpenQty,
      leverage: null,
      notional_value: notional,
      realized_pnl: pos.pnl,
      pnl_percent: pnlPercent,
      fee: pos.fees,
      has_stop_loss: 0,
      has_take_profit: 0,
      raw_order_ids: JSON.stringify(pos.orderIds),
    };
  });
}
