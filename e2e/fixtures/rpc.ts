import type { Page, Route } from '@playwright/test'

// Hive JSON-RPC mock. dhive POSTs {id, jsonrpc, method, params} to whatever node URL the app
// holds; we dispatch on `method` and never touch the real chain. Any method without a handler
// returns a JSON-RPC error so a missing mock fails loudly instead of hanging.
//
// A handler receives the params array and returns the `result` (or throws to produce an error).
export type RpcHandlers = Record<string, (params: any[]) => unknown>

export async function mockHiveRpc(page: Page, handlers: RpcHandlers) {
  await page.route('**/*', async (route: Route) => {
    const req = route.request()
    if (req.method() !== 'POST') return route.continue()
    let body: any
    try {
      body = JSON.parse(req.postData() || '')
    } catch {
      return route.continue()
    }
    if (!body || body.jsonrpc !== '2.0' || typeof body.method !== 'string') {
      return route.continue()
    }
    const handler = handlers[body.method]
    const headers = { 'content-type': 'application/json', 'access-control-allow-origin': '*' }
    if (!handler) {
      return route.fulfill({
        status: 200,
        headers,
        body: JSON.stringify({
          id: body.id,
          jsonrpc: '2.0',
          error: { code: -32601, message: `no mock for ${body.method}` },
        }),
      })
    }
    try {
      const result = handler(body.params || [])
      return route.fulfill({
        status: 200,
        headers,
        body: JSON.stringify({ id: body.id, jsonrpc: '2.0', result }),
      })
    } catch (e: any) {
      return route.fulfill({
        status: 200,
        headers,
        body: JSON.stringify({
          id: body.id,
          jsonrpc: '2.0',
          error: { code: 1, message: String(e?.message || e) },
        }),
      })
    }
  })

  // Avatars are decorative and would otherwise hit the production image host
  // (i.ecency.com today; images.ecency.com was the older host).
  await page.route('https://i.ecency.com/**', (route) => route.abort())
  await page.route('https://images.ecency.com/**', (route) => route.abort())
}

// Minimal, chain-shaped fixtures ------------------------------------------------

export const CHAIN_ID = 'beeab0de00000000000000000000000000000000000000000000000000000000'

export function getConfig() {
  return { HIVE_CHAIN_ID: CHAIN_ID, HIVE_ADDRESS_PREFIX: 'STM' }
}

export function dynamicGlobalProps() {
  return {
    time: new Date().toISOString().slice(0, -5),
    head_block_number: 90_000_000,
    // 20-byte block id; bytes 4..8 seed ref_block_prefix
    head_block_id: '05f5e100' + '11223344' + '0'.repeat(24),
    total_vesting_fund_hive: '190000000.000 HIVE',
    total_vesting_shares: '380000000000.000000 VESTS',
  }
}

// An app account whose posting_json_metadata registers a redirect_uri.
export function appAccount(name: string, redirectUris: string[]) {
  return {
    name,
    memo_key: 'STM8888888888888888888888888888888888888888888888888',
    posting: { weight_threshold: 1, account_auths: [], key_auths: [] },
    active: { weight_threshold: 1, account_auths: [], key_auths: [] },
    owner: { weight_threshold: 1, account_auths: [], key_auths: [] },
    json_metadata: '',
    posting_json_metadata: JSON.stringify({
      profile: { name, redirect_uris: redirectUris },
    }),
  }
}
