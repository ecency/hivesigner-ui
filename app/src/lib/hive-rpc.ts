// Minimal, dependency-free Hive JSON-RPC read client.
//
// The scaffold deliberately avoids dhive here: dhive pulls Buffer at module
// scope, which Rsbuild does not provide, and would trip the node-globals guard.
// Signing and key handling (which need real crypto) arrive with the flow port
// (#102) and key migration (#103); this client covers the read calls the shell
// needs today. It dispatches on `method` exactly as the parity harness mock
// expects, so mocked E2E specs work against it unchanged.

export const DEFAULT_NODES = [
  'https://api.hive.blog',
  'https://api.deathwing.me',
] as const;

export interface RpcError {
  code: number;
  message: string;
  data?: unknown;
}

class HiveRpcError extends Error {
  constructor(
    public method: string,
    public rpc: RpcError,
  ) {
    super(`${method}: ${rpc.message}`);
    this.name = 'HiveRpcError';
  }
}

let node: string = DEFAULT_NODES[0];

export function setNode(url: string): void {
  node = url;
}

export function getNode(): string {
  return node;
}

let id = 0;

export async function call<T>(
  method: string,
  params: unknown[] = [],
): Promise<T> {
  const res = await fetch(node, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: ++id, jsonrpc: '2.0', method, params }),
  });
  if (!res.ok) {
    throw new HiveRpcError(method, {
      code: res.status,
      message: `HTTP ${res.status}`,
    });
  }
  const json = (await res.json()) as { result?: T; error?: RpcError };
  if (json.error) {
    throw new HiveRpcError(method, json.error);
  }
  return json.result as T;
}

// A subset of the account shape the auth flows read. Broadened as flows land.
export interface Authority {
  weight_threshold: number;
  account_auths: [string, number][];
  key_auths: [string, number][];
}

export interface Account {
  name: string;
  memo_key: string;
  owner: Authority;
  active: Authority;
  posting: Authority;
  json_metadata: string;
  posting_json_metadata: string;
}

export function getAccounts(names: string[]): Promise<Account[]> {
  return call<Account[]>('condenser_api.get_accounts', [names]);
}

export { HiveRpcError };
