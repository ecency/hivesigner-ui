// Browser-native port of the parts of `hive-uri` (0.2.8) this app uses.
//
// The npm package is dependency-free but reaches for `require('url')` and
// `new Buffer` behind `typeof` guards, which are dead in a browser yet trip up
// Rspack's static analysis and the node-globals guard. Porting the ~40 lines we
// need keeps the dependency surface minimal (this is a key-handling app) and
// pins the UTF-8-safe base64url from 0.2.8 — the fix for the #96 blank-page bug
// on sign links containing an em dash or emoji.

export type Operation = [string, Record<string, unknown>];

export interface UnresolvedTx {
  ref_block_num: number | string;
  ref_block_prefix: number | string;
  expiration: string;
  extensions: unknown[];
  operations: Operation[];
}

export interface DecodeParams {
  callback?: string;
  no_broadcast?: boolean;
  signer?: string;
}

export interface DecodeResult {
  tx: UnresolvedTx;
  params: DecodeParams;
}

const B64U: Record<string, string> = {
  '/': '_',
  _: '/',
  '+': '-',
  '-': '+',
  '=': '.',
  '.': '=',
};

/** URL-safe, UTF-8-safe base64 encode (0.2.8 semantics). */
export function b64uEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/[+/=]/g, (m) => B64U[m]);
}

/** URL-safe, UTF-8-safe base64 decode (0.2.8 semantics). */
export function b64uDecode(str: string): string {
  const binary = atob(str.replace(/[-_.]/g, (m) => B64U[m]));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/** Parse a `hive://sign/...` link into a transaction skeleton plus params. */
export function decode(hiveUrl: string): DecodeResult {
  if (hiveUrl.slice(0, 5) !== 'hive:') {
    throw new Error(
      `Invalid protocol, expected 'hive:' got '${hiveUrl.slice(0, 5)}'`,
    );
  }
  // Chrome does not parse custom protocols, so swap to http: for URL().
  const url = new URL(hiveUrl.replace(/^hive:/, 'http:'));
  if (url.host !== 'sign') {
    throw new Error(`Invalid action, expected 'sign' got '${url.host}'`);
  }
  const [type, rawPayload] = url.pathname.split('/').slice(1);
  let payload: unknown;
  try {
    payload = JSON.parse(b64uDecode(rawPayload));
  } catch (error) {
    throw new Error(`Invalid payload: ${(error as Error).message}`);
  }

  let tx: UnresolvedTx;
  switch (type) {
    case 'tx':
      tx = payload as UnresolvedTx;
      break;
    case 'op':
    case 'ops': {
      const operations = (type === 'ops' ? payload : [payload]) as Operation[];
      tx = {
        ref_block_num: '__ref_block_num',
        ref_block_prefix: '__ref_block_prefix',
        expiration: '__expiration',
        extensions: [],
        operations,
      };
      break;
    }
    default:
      throw new Error(`Invalid signing action '${type}'`);
  }

  const params: DecodeParams = {};
  const cb = url.searchParams.get('cb');
  if (cb !== null) params.callback = b64uDecode(cb);
  if (url.searchParams.has('nb')) params.no_broadcast = true;
  const s = url.searchParams.get('s');
  if (s !== null) params.signer = s;

  return { tx, params };
}

function encodeParameters(params: DecodeParams): string {
  const out = new URLSearchParams();
  if (params.no_broadcast === true) out.set('nb', '');
  if (params.signer) out.set('s', params.signer);
  if (params.callback) out.set('cb', b64uEncode(params.callback));
  const qs = out.toString();
  return qs.length > 0 ? `?${qs}` : '';
}

function encodeJson(data: unknown): string {
  return b64uEncode(JSON.stringify(data));
}

export function encodeTx(tx: unknown, params: DecodeParams = {}): string {
  return `hive://sign/tx/${encodeJson(tx)}${encodeParameters(params)}`;
}

export function encodeOp(op: Operation, params: DecodeParams = {}): string {
  return `hive://sign/op/${encodeJson(op)}${encodeParameters(params)}`;
}

export function encodeOps(ops: Operation[], params: DecodeParams = {}): string {
  return `hive://sign/ops/${encodeJson(ops)}${encodeParameters(params)}`;
}

const RESOLVE_PATTERN = /(__(ref_block_(num|prefix)|expiration|signer))/g;

export interface ResolveOptions {
  ref_block_num: number;
  ref_block_prefix: number;
  expiration: string;
  signers: string[];
  preferred_signer: string;
}

/**
 * Replace the __ref_block_num / __expiration / __signer placeholders. Used at
 * signing time (a follow-up wires the signer); kept here because it is pure.
 */
export function resolveTransaction(
  utx: UnresolvedTx,
  params: DecodeParams,
  options: ResolveOptions,
): { signer: string; tx: UnresolvedTx } {
  const signer = params.signer || options.preferred_signer;
  if (!options.signers.includes(signer)) {
    throw new Error(`Signer '${signer}' not available`);
  }
  const ctx: Record<string, string | number> = {
    __ref_block_num: options.ref_block_num,
    __ref_block_prefix: options.ref_block_prefix,
    __expiration: options.expiration,
    __signer: signer,
  };
  const walk = (val: unknown): unknown => {
    if (Array.isArray(val)) return val.map(walk);
    if (val === null) return val;
    if (typeof val === 'object') {
      const rv: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(val)) rv[k] = walk(v);
      return rv;
    }
    if (typeof val === 'string')
      return val.replace(RESOLVE_PATTERN, (m) => String(ctx[m]));
    return val;
  };
  return { signer, tx: walk(utx) as UnresolvedTx };
}

const CALLBACK_RESOLVE_PATTERN = /({{(sig|id|block|txn|data)}})/g;

/** Fill {{sig}}/{{id}}/{{block}}/{{txn}}/{{data}} in a callback url. */
export function resolveCallback(
  url: string,
  ctx: Record<string, string | undefined>,
): string {
  return url.replace(
    CALLBACK_RESOLVE_PATTERN,
    (_full, _outer, key: string) => ctx[key] || '',
  );
}
