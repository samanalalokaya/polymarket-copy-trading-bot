/**
 * Beautiful console output for the Polymarket Copy Trading Bot.
 * Uses ANSI colors and a single updating status line (no TUI).
 */

import type { PolymarketCopyBot } from './bot/index.js';
import type { BotStats } from './bot/index.js';

const REFRESH_MS = 1000;

const c = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
};

export interface ConsoleDashboardOptions {
  bot: PolymarketCopyBot;
}

export class ConsoleDashboard {
  private bot: PolymarketCopyBot;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(options: ConsoleDashboardOptions) {
    this.bot = options.bot;
  }

  start(): void {
    this.printBanner();
    this.timer = setInterval(() => this.refresh(), REFRESH_MS);
  }

  private printBanner(): void {
    console.log(
      `${c.blue}${c.bold}\n  ◇ POLYMARKET COPY TRADING BOT ◇${c.reset}\n`
    );
  }

  refresh(): void {
    try {
      const running = this.bot.isBotRunning();
      const s: BotStats = this.bot.stats;
      const positions = this.bot.getPositions().getPositions();

      const status = running
        ? `${c.green}● RUNNING${c.reset}`
        : `${c.red}● STOPPED${c.reset}`;

      const statsPart = [
        `${c.cyan}Detected${c.reset} ${s.tradesDetected}`,
        `${c.green}Copied${c.reset} ${s.tradesCopied}`,
        `${c.red}Failed${c.reset} ${s.tradesFailed}`,
        `${c.dim}Vol${c.reset} ${s.totalVolume.toFixed(2)} USDC`,
      ].join('  ');

      const posSummary =
        positions.length === 0
          ? 'No positions'
          : positions
              .slice(0, 3)
              .map(
                (p) =>
                  `${p.outcome || '?'} ${p.notional.toFixed(2)} USDC`
              )
              .join(', ') + (positions.length > 3 ? ` +${positions.length - 3}` : '');

      const line = `${status}  |  ${statsPart}  |  ${c.dim}Positions:${c.reset} ${posSummary}`;
      process.stdout.write(line + ' '.repeat(20) + '\r');
    } catch {
      // bot may be destroyed
    }
  }

  destroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    process.stdout.write('\n');
  }
}

export function createConsoleDashboard(
  options: ConsoleDashboardOptions
): ConsoleDashboard {
  return new ConsoleDashboard(options);
}
