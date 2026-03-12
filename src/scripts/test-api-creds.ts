import * as dotenv from 'dotenv';
import { Wallet } from 'ethers';
import { ClobClient } from '@polymarket/clob-client';
import { config } from '../config/index.js';

dotenv.config();

const HOST = 'https://clob.polymarket.com';
const CHAIN_ID = 137;

function isApiError(resp: any): boolean {
  return resp && typeof resp === 'object' && 'error' in resp;
}

async function main(): Promise<void> {
  const privateKey = process.env.WALLET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('Missing WALLET_PRIVATE_KEY in .env');
  }

  const signer = new Wallet(privateKey);
  const funder = config.auth.funderAddress || signer.address;

  const client = new ClobClient(
    HOST,
    CHAIN_ID,
    signer,
    undefined,
    config.auth.sigType,
    funder,
    process.env.POLYMARKET_GEO_TOKEN || undefined
  );

  console.log('Generating API credentials from WALLET_PRIVATE_KEY...');
  let creds = await client.deriveApiKey().catch(() => null);
  if (!creds || isApiError(creds)) {
    creds = await client.createApiKey();
  }

  const apiKey = (creds as any)?.apiKey ?? (creds as any)?.key;
  const secret = (creds as any)?.secret;
  const passphrase = (creds as any)?.passphrase;

  if (isApiError(creds) || !apiKey || !secret || !passphrase) {
    const err = (creds as any)?.error ?? 'Could not derive or create API key';
    throw new Error(String(err));
  }

  const clientWithCreds = new ClobClient(
    HOST,
    CHAIN_ID,
    signer,
    { key: apiKey, secret, passphrase },
    config.auth.sigType,
    funder,
    process.env.POLYMARKET_GEO_TOKEN || undefined
  );

  const result: any = await clientWithCreds.getApiKeys();
  if (result?.error || result?.status >= 400) {
    throw new Error(result?.error ?? `API returned status ${result?.status}`);
  }

  console.log('✅ API credentials generated and validated for this signer');
  console.log(`   Sig type: ${config.auth.sigType}, Funder: ${funder}`);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error('❌ API credential test failed:', error.message ?? error);
  process.exit(1);
});
