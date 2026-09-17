import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CurrentAccount } from '@/components/CurrentAccount';
import { ReportIssue } from '@/components/ReportIssue';
import { Sentence } from '@/components/Untranslated';
import {
  alertError,
  alertWarn,
  btnPrimary,
  card,
  h1,
  link,
  mono,
  page,
} from '@/components/ui';
import { getKeys } from '@/lib/accounts';
import { getVestsToSp } from '@/lib/hive';
import { resolveCallback } from '@/lib/hive-uri';
import { reportIntegrationIssue } from '@/lib/integration-signal';
import {
  operationActors,
  operationFields,
  requiredAuthority,
  safeText,
  summarizeOperation,
  type TextPart,
} from '@/lib/operation-summary';
import { parseSignRequest, signRequestProblem } from '@/lib/parse-sign-request';
import { vestsToSpKey } from '@/lib/query-keys';
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
    queryKey: vestsToSpKey(),
    queryFn: getVestsToSp,
    staleTime: 60_000,
  });
  // ready only once a real rate has actually loaded; until then callers must not
  // treat the fallback (1) as a usable HP conversion rate.
  return { rate: data ?? 1, ready: isSuccess };
}

/** This request's own URL, to come back to after import or unlock. */
function here(): string {
  return window.location.pathname + window.location.search;
}

/**
 * A link this app could not turn into a request. Says so, reports it as an
 * integration signal (the operation and the failing field, never a value),
 * and offers the user a report that carries the link itself.
 */
function InvalidSignRequest({
  splat,
  search,
  rate,
}: {
  splat: string;
  search: Record<string, string>;
  rate: number;
}) {
  const { t } = useTranslation();
  const op = splat.split('/')[0]?.split('?')[0] ?? '';
  const reason = signRequestProblem(splat, search, rate);
  useEffect(() => {
    reportIntegrationIssue('sign_request_invalid', { op, reason });
  }, [op, reason]);
  return (
    <section className={page}>
      {/* role="alert": it is the only thing on the page that explains why
          there is nothing to approve, and assistive tech should announce it. */}
      <div role="alert" className={alertError}>
        {t('errors.unknown')}
      </div>
      <ReportIssue kind="sign_request_invalid" reason={reason} tags={{ op }} />
    </section>
  );
}

/**
 * A summary line: the copy may be translated with the page, the request's
 * values never are. The parts of one line are fixed for a request, so React
 * never inserts or removes loose text among them.
 */
function Parts({ parts }: { parts: TextPart[] }) {
  return parts.map((part, i) =>
    typeof part === 'string' ? (
      part
    ) : (
      // biome-ignore lint/suspicious/noArrayIndexKey: the parts of one fixed line
      <span key={i} translate="no" className="[unicode-bidi:isolate]">
        {part.value}
      </span>
    ),
  );
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
      <InvalidSignRequest
        splat={_splat ?? ''}
        search={search}
        rate={vestsToSp.rate}
      />
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

  // Both screens below are a <section>. Keyed apart, React builds the success
  // screen fresh instead of reworking the confirm screen's children into it,
  // which removed text a page translator had already replaced and crashed.
  if (status === 'done' && outcome) {
    return (
      <section key="done" className={page}>
        <h1 className={h1}>
          {request.noBroadcast ? t('sign.sign') : t('sign.success_title')}
        </h1>
        {request.noBroadcast ? (
          <div className={`${card} text-[13px]`}>
            {t('message_signing.signature')}:{' '}
            <code className="break-all text-[11px]" translate="no">
              {outcome.signature}
            </code>
          </div>
        ) : (
          <div className={`${card} text-sm`}>
            {t('sign.transaction_id')}:{' '}
            {/* This is the one thing on the success screen a user wants to act
                on, and with no class it inherited body colour and no underline,
                so it read as plain text. */}
            <a
              href={`https://hivexplorer.com/tx/${outcome.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${link} ${mono}`}
            >
              <span translate="no">{outcome.id.slice(0, 12)}</span>
              <span aria-hidden="true"> &#8599;</span>
            </a>
          </div>
        )}
      </section>
    );
  }

  return (
    <section key="confirm" className={page}>
      <h1 className={h1}>{t('sign.confirm_transaction')}</h1>

      {/* Account names, hosts, amounts and the operation itself are data, so
          a page translator is told to leave them alone (translate="no"): the
          user approves what the request says, not a translation of it. Text
          that can change while this screen is open is the only child of its
          element (see lib/translation-guard.ts). */}
      {host && (
        <div className={alertWarn}>
          <Sentence k="sign.going_redirect_to" values={{ host }} bold />
        </div>
      )}

      {foreignActors.length > 0 && (
        <div role="alert" className={alertWarn}>
          <Sentence
            k="sign.acts_as"
            values={{
              actors: foreignActors.map((a) => `@${a}`).join(', '),
              account: `@${selectedAccount ?? ''}`,
            }}
            bold
          />
        </div>
      )}

      {displayOps.length > 1 && (
        <div className="text-[13px] text-muted">
          <Sentence
            k="sign.contains_operations"
            count={displayOps.length}
            values={{}}
          />
        </div>
      )}

      {displayOps.map((op, i) => {
        const s = summarizeOperation(op);
        const fields = operationFields(op);
        const opAuthority = requiredAuthority([op]);
        return (
          <div key={`${op[0]}-${i}`} className={`${card} flex flex-col gap-2`}>
            <div className="flex flex-wrap items-baseline gap-2">
              <div className="min-w-0 flex-1 break-words text-lg font-bold">
                {displayOps.length > 1 && `${i + 1}. `}
                <Parts parts={s.titleParts} />
              </div>
              {/* Per-op authority, so one active-key op among posting ops shows. */}
              <span
                className={`flex-none rounded-md px-1.5 py-0.5 text-[11px] font-semibold uppercase ${
                  opAuthority === 'posting'
                    ? 'bg-ok-bg text-ok'
                    : 'bg-danger-bg text-danger'
                }`}
              >
                {t(`authority.${opAuthority ?? 'unknown'}`)}
              </span>
            </div>
            {s.detailParts && (
              <div className="break-all text-[13px] text-muted">
                <Parts parts={s.detailParts} />
              </div>
            )}
            {/* Show the material fields inline so nothing dangerous is hidden. */}
            {fields.map((f, fi) => (
              <div
                // Keyed by position: two distinct leaves can share a label.
                key={`${f.label}-${fi}`}
                className="flex gap-1.5 text-[12.5px]"
              >
                {/* A schema label ("Permlink", "posting authority") keeps its
                    shape: break-all on it rendered "P/e/r/m/l/i/n/k" at 320px
                    beside a long value. A label that is a JSON KEY is
                    caller-chosen, so it may be arbitrarily long and must wrap
                    instead of pushing the value off-screen; isolate it too,
                    since it can carry bidi controls. */}
                <span
                  className={`${f.untrusted ? 'break-all' : 'shrink-0 whitespace-nowrap'} text-muted [unicode-bidi:isolate]`}
                  translate={f.untrusted ? 'no' : undefined}
                >
                  {`${f.label}:`}
                </span>
                {/* isolate: a value cannot reorder the text around it. */}
                {f.parts ? (
                  <span className="break-all [unicode-bidi:isolate]">
                    <Parts parts={f.parts} />
                  </span>
                ) : (
                  <span
                    className="break-all [unicode-bidi:isolate]"
                    translate="no"
                  >
                    {f.value}
                  </span>
                )}
              </div>
            ))}
          </div>
        );
      })}

      {req.preservedTx && (
        <div className={`${card} text-[12.5px] break-words text-muted`}>
          <Sentence
            k="sign.own_header"
            values={{
              expiration: safeText(String(req.preservedTx.expiration)),
            }}
            bold
          />
          {Array.isArray(req.preservedTx.signatures) &&
            req.preservedTx.signatures.length > 0 && (
              <>
                {' '}
                <Sentence
                  k="sign.carries_signatures"
                  count={req.preservedTx.signatures.length}
                  values={{}}
                />
              </>
            )}
        </div>
      )}

      <div className={`${card} flex items-center gap-2 text-[13.5px]`}>
        {authority ? (
          <span>{t(`sign.signed_with_${authority}`)}</span>
        ) : (
          <span className="text-warn">{t('sign.mixed_authorities')}</span>
        )}
      </div>

      <details className={`${card} px-3.5 py-3`}>
        <summary className="cursor-pointer text-[13.5px] font-semibold text-muted">
          {t('sign.show_raw', { count: displayOps.length })}
        </summary>
        <pre
          className="mt-3 overflow-x-auto font-mono text-xs text-ink"
          translate="no"
        >
          {/* The resolved ops: exactly the bytes that will be signed. */}
          {JSON.stringify(displayOps, null, 2)}
        </pre>
      </details>

      {status === 'error' && (
        <div role="alert" className={alertError}>
          <div className="font-semibold">{t('sign.failure_title')}</div>
          <div className="mt-1">{`${t('sign.error_message')}: ${errorMsg}`}</div>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {authority && selectedAccount && (
          // Under a signer mismatch the selected account is NOT signing, so
          // the row must not say it is; it names the selection and the warning
          // below names who has to sign.
          <CurrentAccount
            username={selectedAccount}
            label={
              signerMismatch ? t('sign.selected_account') : t('sign.signing_as')
            }
            next={here()}
            busy={status === 'signing'}
          />
        )}
        {!authority ? null : signerMismatch ? (
          <>
            <div className="text-[13px] text-warn">
              <Sentence
                k="sign.must_be_signed_by"
                values={{ account: `@${req.signer}` }}
                bold
              />
            </div>
            <Link
              to="/accounts"
              search={{ next: here() }}
              className={btnPrimary}
            >
              {t('login.switch_an_account')}
            </Link>
          </>
        ) : !selectedAccount ? (
          // `next` carries the request through import and unlock, as the
          // consent screen does. Without it a passcode user arriving from an
          // app deep link unlocked and landed on the account list, request gone.
          <Link to="/import" search={{ next: here() }} className={btnPrimary}>
            {t('common.continue')}
          </Link>
        ) : !isUnlocked ? (
          // Keyed: its children differ from the other links' plain labels, so
          // React builds it fresh rather than reworking their text.
          <Link
            key="unlock"
            to="/accounts"
            search={{ next: here() }}
            className={btnPrimary}
          >
            <Sentence
              k="accounts.unlock_account"
              values={{ account: `@${selectedAccount}` }}
            />
          </Link>
        ) : !signingKey ? (
          <>
            <div className="text-[13px] text-warn">
              <Sentence
                k={`sign.missing_${authority}_key`}
                values={{ account: `@${selectedAccount}` }}
              />
            </div>
            <Link to="/import" search={{ next: here() }} className={btnPrimary}>
              {t('accounts.add_another')}
            </Link>
          </>
        ) : (
          <>
            {rateBlocked && (
              <div className="text-[13px] text-warn">
                {t('sign.loading_rate')}
              </div>
            )}
            <button
              type="button"
              onClick={approve}
              disabled={status === 'signing' || rateBlocked}
              className={btnPrimary}
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
