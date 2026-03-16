# polymarket-copy-trading-bot

Copies trades from a target Polymarket wallet to your own. Watches the target via REST or WebSocket, then places matching orders (scaled by a multiplier) using the Polymarket CLOB.

## Requirements

- Node.js 18+
- Polygon RPC (e.g. QuickNode). Default fallback: public `https://polygon-rpc.com`
- USDC on Polygon for the bot wallet
- Polymarket API credentials (derived from your wallet at startup; see scripts below)

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` and set at least:

- `TARGET_WALLET` – address to copy
- `WALLET_PRIVATE_KEY` – your wallet private key (bot places trades from this)
- `RPC_URL` – Polygon RPC endpoint

Generate and test API credentials:

```bash
npm run generate-api-creds
npm run test-api-creds
```

## Run

```bash
npm start
```

Or production build:

```bash
npm run build
npm run start:prod
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` / `npm run dev` | Run bot (tsx) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start:prod` | Run compiled `dist/index.js` |
| `npm run generate-api-creds` | Derive Polymarket API creds from `WALLET_PRIVATE_KEY` |
| `npm run test-api-creds` | Test current API credentials |

## Configuration (.env)

**Required**

- `TARGET_WALLET` – wallet to copy
- `WALLET_PRIVATE_KEY` – bot signer
- `RPC_URL` – Polygon RPC URL

**Auth** (default: EOA)

- `SIG_TYPE` – `0` EOA, `1` Poly Proxy, `2` Poly Polymorphic. For 1/2 set `PROXY_WALLET_ADDRESS`.
- `PROXY_WALLET_ADDRESS` – proxy/safe address when using proxy or polymorphic.

**Trading**

- `POSITION_MULTIPLIER` – scale vs target size (e.g. `0.1` = 10%). Default `0.1`
- `MAX_TRADE_SIZE` – cap per order in USDC. Default `100`
- `MIN_TRADE_SIZE` – minimum order size USDC. Default `1`
- `SLIPPAGE_TOLERANCE` – e.g. `0.02` = 2%. Default `0.02`
- `ORDER_TYPE` – `FOK` (default), `LIMIT`, or `FAK`

**Risk** (0 = no cap)

- `MAX_SESSION_NOTIONAL` – max total notional per session (USDC)
- `MAX_PER_MARKET_NOTIONAL` – max notional per market (USDC)

**Monitoring**

- `USE_WEBSOCKET` – `true` (default) or `false` for REST polling
- `USE_USER_CHANNEL` – set `true` to use user channel for activity
- `POLL_INTERVAL` – REST poll interval in ms. Default `2000`
- `WS_ASSET_IDS` – comma-separated asset IDs to subscribe (WebSocket)
- `WS_MARKET_IDS` – comma-separated market IDs to subscribe (WebSocket)

**Optional**

- `POLYMARKET_GEO_TOKEN` – if Polymarket gave you a geo token
- `MIN_PRIORITY_FEE_GWEI` / `MIN_MAX_FEE_GWEI` – gas overrides for Polygon txs

## License

ISC
