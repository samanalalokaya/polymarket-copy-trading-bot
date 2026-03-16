import type { Trade } from '../types/index.js';
import * as Big from 'big-numerator';

export interface PositionState {
  tokenId: string;
  market: string;
  outcome: string;
  shares: number;
  notional: number;
  avgPrice: number;
  lastUpdated: number;
}

export class PositionTracker {
  private positions = new Map<string, PositionState>();

  loadFromClobPositions(positions: any[]): { loaded: number; skipped: number } {
    let loaded = 0;
    let skipped = 0;

    for (const pos of positions || []) {
      const tokenId =
        pos?.asset_id ||
        pos?.asset ||
        pos?.token_id ||
        pos?.tokenId ||
        pos?.assetId;

      if (!tokenId) {
        skipped++;
        continue;
      }

      const market =
        pos?.condition_id ||
        pos?.conditionId ||
        pos?.market ||
        pos?.market_id ||
        '';

      const outcome = pos?.outcome || pos?.side || 'YES';

      const shares = this.parseNumber(pos?.size ?? pos?.quantity ?? pos?.shares ?? pos?.balance ?? pos?.position);
      const notional = this.parseNumber(pos?.currentValue ?? pos?.initialValue ?? pos?.usdcValue ?? pos?.notional ?? pos?.usdc ?? pos?.value ?? pos?.collateral);
      const avgPrice =
        this.parseNumber(pos?.avgPrice ?? pos?.averagePrice ?? pos?.entryPrice ?? pos?.price) ||
        (shares > 0 ? Big(notional).div(shares).abs().toNumber() : 0);

      const state: PositionState = {
        tokenId,
        market,
        outcome,
        shares: Math.max(0, shares),
        notional: Math.max(0, notional),
        avgPrice,
        lastUpdated: Date.now(),
      };

      this.positions.set(tokenId, state);
      loaded++;
    }

    return { loaded, skipped };
  }

  recordFill(params: {
    trade: Trade;
    notional: number;
    shares: number;
    price: number;
    side: 'BUY' | 'SELL';
  }): void {
    const { trade, notional, shares, price, side } = params;
    const key = trade.tokenId;
    const existing = this.positions.get(key);

    const sign = side === 'BUY' ? 1 : -1;
    const deltaShares = shares * sign;
    const deltaNotional = notional * sign;

    const nextShares = (existing?.shares || 0) + deltaShares;
    const nextNotional = (existing?.notional || 0) + deltaNotional;
    const avgPrice = nextShares !== 0 ? Big(nextNotional).div(nextShares).abs().toNumber() : 0;

    const updated: PositionState = {
      tokenId: trade.tokenId,
      market: trade.market,
      outcome: trade.outcome,
      shares: Math.max(0, nextShares),
      notional: Math.max(0, nextNotional),
      avgPrice: nextShares !== 0 ? avgPrice : 0,
      lastUpdated: Date.now(),
    };

    this.positions.set(key, updated);
  }

  getPosition(tokenId: string): PositionState | undefined {
    return this.positions.get(tokenId);
  }

  getPositions(): PositionState[] {
    return Array.from(this.positions.values());
  }

  getNotional(tokenId: string): number {
    return this.positions.get(tokenId)?.notional || 0;
  }

  getTotalNotional(): number {
    let total = Big(0);
    for (const pos of this.positions.values()) {
      total = total.add(pos.notional);
    }
    return total.toNumber();
  }

  private parseNumber(value: any): number {
    const n = typeof value === 'string' ? parseFloat(value) : Number(value);
    return Number.isFinite(n) ? n : 0;
  }
}
