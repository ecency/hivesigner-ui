import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { type CSSProperties, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getKeys } from '@/lib/accounts';
import { getVestsToSp } from '@/lib/hive';
import { resolveCallback } from '@/lib/hive-uri';
import { requiredAuthority, summarizeOperation } from '@/lib/operation-summary';
import { parseSignRequest } from '@/lib/parse-sign-request';
import { type BroadcastOutcome, broadcastOperations } from '@/lib/sign-tx';
import { useAccounts } from '@/lib/use-accounts';

// /sign/<op>?params, /sign/op|ops|tx/<b64>. Decode, schema-process, confirm,
// and (when the selected account holds the required key) sign and broadcast
// through the SDK. The summary above the collapsed raw op is the redesign's
// answer to the raw-JSON complaint.
export const Route = createFileRoute('/sign/$')({
  component: Sign,
  validateSearch: (search: Record<string, unknown>) =>
    search as Record<string, string>,
});

function useVestsToSp(): number {
  const { data } = useQuery({
    queryKey: ['vests-to-sp'],
    queryFn: getVestsToSp,
    staleTime: 60_000,
  });
  return data ?? 1;
}

function callbackHost(callback: string): string | null {
  try {
    return new URL(callback).host;
  } catch {
    return null;
  }
}

/** Fill the callback templates (or append ?id=) and send the browser there. */
function redirectToCallback(callback: string, outcome: BroadcastOutcome): void {
  let url = resolveCallback(callback, {
    id: outcome.id,
    block: outcome.blockNum?.toString(),
    txn: outcome.trxNum?.toString(),
  });
  if (url === callback) {
    // No template in the callback: append the tx id as a query param.
    url += `${callback.includes('?') ? '&' : '?'}id=${encodeURIComponent(outcome.id)}`;
  }
  window.location.assign(url);
}

const card: CSSProperties = {
  background: '#fff',
  border: '1px solid #d1d9e0',
  borderRadius: 12,
  padding: 16,
};
const primaryBtn = (enabled: boolean): CSSProperties => ({
  height: 50,
  border: 'none',
  borderRadius: 10,
  background: enabled ? '#E31337' : '#f0a5b3',
  color: '#fff',
  fontSize: 16,
  fontWeight: 600,
  cursor: enabled ? 'pointer' : 'not-allowed',
});

function Sign() {
  const { t } = useTranslation();
  const { _splat } = Route.useParams();
  const search = Route.useSearch();
  const vestsToSp = useVestsToSp();
  const { selectedAccount, unlocked } = useAccounts();

  const [status, setStatus] = useState<'idle' | 'signing' | 'done' | 'error'>(
    'idle',
  );
  const [outcome, setOutcome] = useState<BroadcastOutcome | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const request = parseSignRequest(_splat ?? '', search, vestsToSp);

  if (!request) {
    return (
      <section style={{ padding: 20 }}>
        <div
          style={{
            padding: 16,
            borderRadius: 10,
            background: '#ffebe9',
            border: '1px solid #f0b3b3',
            color: '#cf222e',
            fontSize: 14,
          }}
        >
          {t('errors.unknown')}
        </div>
      </section>
    );
  }

  const authority = requiredAuthority(request.operations);
  const host = request.callback ? callbackHost(request.callback) : null;
  const isUnlocked = !!selectedAccount && unlocked.includes(selectedAccount);
  const keys = selectedAccount ? getKeys(selectedAccount) : null;
  const signingKey = authority && keys ? keys[authority] : undefined;

  async function approve() {
    if (!selectedAccount || !signingKey) return;
    setStatus('signing');
    try {
      const result = await broadcastOperations(
        request!.operations,
        signingKey,
        selectedAccount,
      );
      setOutcome(result);
      setStatus('done');
      if (request!.callback) redirectToCallback(request!.callback, result);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  }

  if (status === 'done' && outcome) {
    return (
      <section
        style={{
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
          {t('sign.success_title')}
        </h1>
        <div style={{ ...card, fontSize: 14 }}>
          {t('sign.transaction_id')}:{' '}
          <a
            href={`https://hivexplorer.com/tx/${outcome.id}`}
            target="_blank"
            rel="noopener"
          >
            {outcome.id.slice(0, 12)}
          </a>
        </div>
      </section>
    );
  }

  return (
    <section
      style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
        {t('sign.confirm_transaction')}
      </h1>

      {host && (
        <div
          style={{
            ...card,
            background: '#fff8e6',
            border: '1px solid #f0d38a',
            color: '#7a5300',
            fontSize: 13,
          }}
        >
          {t('sign.going_redirect_to')} <b>{host}</b>.
        </div>
      )}

      {request.operations.map((op, i) => {
        const s = summarizeOperation(op);
        return (
          <div
            key={`${op[0]}-${i}`}
            style={{
              ...card,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700 }}>{s.title}</div>
            {s.detail && (
              <div style={{ fontSize: 13, color: '#59636e' }}>{s.detail}</div>
            )}
          </div>
        );
      })}

      <div
        style={{
          ...card,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13.5,
        }}
      >
        {authority ? (
          <span>
            Signed with your <b>{authority}</b> key
          </span>
        ) : (
          <span style={{ color: '#7a5300' }}>
            This transaction needs more than one authority and cannot be signed
            with a single key.
          </span>
        )}
      </div>

      <details style={{ ...card, padding: '12px 14px' }}>
        <summary
          style={{
            cursor: 'pointer',
            fontSize: 13.5,
            fontWeight: 600,
            color: '#59636e',
          }}
        >
          Show raw operation{request.operations.length > 1 ? 's' : ''}
        </summary>
        <pre
          style={{
            marginTop: 12,
            overflowX: 'auto',
            fontSize: 12,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            color: '#1f2328',
          }}
        >
          {JSON.stringify(request.operations, null, 2)}
        </pre>
      </details>

      {status === 'error' && (
        <div
          role="alert"
          style={{
            ...card,
            background: '#ffebe9',
            border: '1px solid #f0b3b3',
            color: '#cf222e',
            fontSize: 13,
          }}
        >
          <div style={{ fontWeight: 600 }}>{t('sign.failure_title')}</div>
          <div style={{ marginTop: 4 }}>
            {t('sign.error_message')}: {errorMsg}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!authority ? null : !selectedAccount ? (
          <Link
            to="/import"
            style={{
              ...primaryBtn(true),
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
            }}
          >
            {t('common.continue')}
          </Link>
        ) : !isUnlocked ? (
          <Link
            to="/accounts"
            style={{
              ...primaryBtn(true),
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
            }}
          >
            {t('accounts.unlock')} @{selectedAccount}
          </Link>
        ) : !signingKey ? (
          <>
            <div style={{ fontSize: 13, color: '#7a5300' }}>
              This needs your <b>{authority}</b> key, which @{selectedAccount}{' '}
              does not have here.
            </div>
            <Link
              to="/import"
              style={{
                ...primaryBtn(true),
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              {t('accounts.add_another')}
            </Link>
          </>
        ) : (
          <button
            type="button"
            onClick={approve}
            disabled={status === 'signing'}
            style={primaryBtn(status !== 'signing')}
          >
            {status === 'signing'
              ? '…'
              : request.noBroadcast
                ? t('sign.sign')
                : t('sign.approve')}
          </button>
        )}
      </div>
    </section>
  );
}
