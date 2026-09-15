import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { type CSSProperties, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getKeys } from '@/lib/accounts';
import { getVestsToSp } from '@/lib/hive';
import { resolveCallback } from '@/lib/hive-uri';
import {
  operationActors,
  operationFields,
  requiredAuthority,
  safeText,
  summarizeOperation,
} from '@/lib/operation-summary';
import { parseSignRequest } from '@/lib/parse-sign-request';
import {
  type BroadcastOutcome,
  broadcastOperations,
  resolveSigner,
  signOperations,
} from '@/lib/sign-tx';
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

function useVestsToSp(): { rate: number; ready: boolean } {
  const { data, isSuccess } = useQuery({
    queryKey: ['vests-to-sp'],
    queryFn: getVestsToSp,
    staleTime: 60_000,
  });
  // ready only once a real rate has actually loaded; until then callers must not
  // treat the fallback (1) as a usable HP conversion rate.
  return { rate: data ?? 1, ready: isSuccess };
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
    sig: outcome.signature,
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

  const request = parseSignRequest(_splat ?? '', search, vestsToSp.rate);

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

  // Non-null after the guard above; capture it so the async closure narrows too.
  const req = request;
  const authority = requiredAuthority(req.operations);
  const host = req.callback ? callbackHost(req.callback) : null;
  const isUnlocked = !!selectedAccount && unlocked.includes(selectedAccount);
  const keys = selectedAccount ? getKeys(selectedAccount) : null;
  const signingKey = authority && keys ? keys[authority] : undefined;
  // An HP amount needs the live SP-per-VEST rate; block approval until it loads
  // so a fallback rate never signs the wrong VESTS amount.
  const rateBlocked = req.hpDependent && !vestsToSp.ready;
  // The `s` param names the account the request must be signed by. Refuse to
  // sign it from a different selected account (the old app threw here).
  const signerMismatch =
    !!req.signer && !!selectedAccount && req.signer !== selectedAccount;

  // Resolve `__signer` ONCE, with the SAME resolver the signer uses, and render
  // from the result. Resolving per-row instead let the placeholder leak into the
  // summary line and risked display and signing applying different rules - the
  // one divergence that would let a user sign something they did not read.
  const displaySigner = selectedAccount ?? req.signer ?? '';
  const displayOps = displaySigner
    ? resolveSigner(req.operations, displaySigner)
    : req.operations;
  // An operation may act AS an account other than the one signing (a treasury
  // the user co-manages). The rows name it; warn about it up front too.
  const foreignActors = selectedAccount
    ? [
        ...new Set(
          displayOps
            .flatMap(operationActors)
            .filter((a) => a !== selectedAccount),
        ),
      ]
    : [];

  async function approve() {
    if (!selectedAccount || !signingKey || rateBlocked || signerMismatch)
      return;
    setStatus('signing');
    try {
      // A no_broadcast request only wants a signature; never broadcast it.
      // preservedTx keeps a pre-built /sign/tx transaction's ref-block fields and
      // expiration intact so the signature matches the caller's exact tx id.
      // displayOps is the exact array the cards above rendered, already resolved
      // with the same resolver the signer uses (resolving again is a no-op), so
      // what is signed is literally what was shown.
      const result = req.noBroadcast
        ? await signOperations(
            displayOps,
            signingKey,
            selectedAccount,
            req.preservedTx,
          )
        : await broadcastOperations(
            displayOps,
            signingKey,
            selectedAccount,
            req.preservedTx,
          );
      setOutcome(result);
      setStatus('done');
      if (req.callback) redirectToCallback(req.callback, result);
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
          {request.noBroadcast ? t('sign.sign') : t('sign.success_title')}
        </h1>
        {request.noBroadcast ? (
          <div style={{ ...card, fontSize: 13 }}>
            {t('message_signing.signature')}:{' '}
            <code style={{ wordBreak: 'break-all', fontSize: 11 }}>
              {outcome.signature}
            </code>
          </div>
        ) : (
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
        )}
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

      {foreignActors.length > 0 && (
        <div
          role="alert"
          style={{
            ...card,
            background: '#fff8e6',
            border: '1px solid #f0d38a',
            color: '#7a5300',
            fontSize: 13,
          }}
        >
          This acts as{' '}
          {foreignActors.map((a) => (
            <b key={a}>@{a} </b>
          ))}
          , not @{selectedAccount}. Only continue if you manage that account.
        </div>
      )}

      {displayOps.length > 1 && (
        <div style={{ fontSize: 13, color: '#59636e' }}>
          This request contains <b>{displayOps.length} operations</b>. Review
          every one before approving.
        </div>
      )}

      {displayOps.map((op, i) => {
        const s = summarizeOperation(op);
        const fields = operationFields(op);
        const opAuthority = requiredAuthority([op]);
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
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 700, flex: 1 }}>
                {displayOps.length > 1 ? `${i + 1}. ` : ''}
                {s.title}
              </div>
              {/* Per-op authority, so one active-key op among posting ops shows. */}
              <span
                style={{
                  flex: 'none',
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  padding: '2px 6px',
                  borderRadius: 6,
                  background: opAuthority === 'posting' ? '#eaf5ea' : '#ffebe9',
                  color: opAuthority === 'posting' ? '#1a7f37' : '#cf222e',
                }}
              >
                {opAuthority ?? 'unknown'}
              </span>
            </div>
            {s.detail && (
              <div style={{ fontSize: 13, color: '#59636e' }}>{s.detail}</div>
            )}
            {/* Show the material fields inline so nothing dangerous is hidden. */}
            {fields.map((f, fi) => (
              <div
                // Keyed by position: two distinct leaves can share a label.
                key={`${f.label}-${fi}`}
                style={{ fontSize: 12.5, display: 'flex', gap: 6 }}
              >
                <span style={{ color: '#59636e', flex: 'none' }}>
                  {f.label}:
                </span>
                {/* isolate: a value cannot reorder the text around it. */}
                <span
                  style={{ wordBreak: 'break-all', unicodeBidi: 'isolate' }}
                >
                  {f.value}
                </span>
              </div>
            ))}
          </div>
        );
      })}

      {req.preservedTx && (
        <div style={{ ...card, fontSize: 12.5, color: '#59636e' }}>
          This request supplied its own transaction header. Expires:{' '}
          <b>{safeText(String(req.preservedTx.expiration))}</b>
          {Array.isArray(req.preservedTx.signatures) &&
            req.preservedTx.signatures.length > 0 && (
              <>
                {' '}
                and it already carries{' '}
                <b>{req.preservedTx.signatures.length}</b> signature(s).
              </>
            )}
        </div>
      )}

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
          Show raw operation{displayOps.length > 1 ? 's' : ''}
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
          {/* The resolved ops: exactly the bytes that will be signed. */}
          {JSON.stringify(displayOps, null, 2)}
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
        {!authority ? null : signerMismatch ? (
          <>
            <div style={{ fontSize: 13, color: '#7a5300' }}>
              This request must be signed by <b>@{req.signer}</b>. Switch to
              that account.
            </div>
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
              {t('login.switch_an_account')}
            </Link>
          </>
        ) : !selectedAccount ? (
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
          <>
            {rateBlocked && (
              <div style={{ fontSize: 13, color: '#7a5300' }}>
                Loading the current HIVE Power rate…
              </div>
            )}
            <button
              type="button"
              onClick={approve}
              disabled={status === 'signing' || rateBlocked}
              style={primaryBtn(status !== 'signing' && !rateBlocked)}
            >
              {status === 'signing'
                ? '…'
                : request.noBroadcast
                  ? t('sign.sign')
                  : t('sign.approve')}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
