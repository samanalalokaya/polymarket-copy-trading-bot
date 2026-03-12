import { PolymarketCopyBot } from './bot/index.js';
import { createConsoleDashboard } from './console-dashboard.js';

async function main(): Promise<void> {
  const bot = new PolymarketCopyBot();
  const dashboard = createConsoleDashboard({ bot });

  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    dashboard.destroy();
    bot.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    dashboard.destroy();
    bot.stop();
    process.exit(0);
  });

  try {
    await bot.initialize();
    dashboard.start();
    await bot.start();
  } catch (error) {
    console.error('Fatal error:', error);
    dashboard.destroy();
    process.exit(1);
  }
}

main();
