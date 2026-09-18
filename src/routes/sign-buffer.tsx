import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import { CurrentAccount } from '@/components/CurrentAccount';
import { ReportIssue } from '@/components/ReportIssue';
import { UnlockAndContinue } from '@/components/UnlockAndContinue';
import { Sentence } from '@/components/Untranslated';
import {
  alertError,
  alertWarn,
  btnPrimary,
  card,
  mutedXs,
  page,
} from '@/components/ui';
import { getKeys, stillSelected } from '@/lib/accounts';
import {
  hostOf,
  type IntegrationIssue,
  reportIntegrationIssue,
} from '@/lib/integration-signal';
import { takeNamedAccount } from '@/lib/named-account';
import {
  type AppProfile,
  isRegisteredRedirect,
  isValidRedirectUri,
  loadAppProfile,
} from '@/lib/oauth';
import { safeText } from '@/lib/operation-summary';
import { oauthAppProfileKey } from '@/lib/query-keys';
import {
  isTokenBody,
  parseSignBufferRequest,
  signBuffer,
  signBufferRedirect,
  visibleMessage,
} from '@/lib/sign-buffer';
import { useAccounts } from '@/lib/use-accounts';
import { useLeaveLatch } from '@/lib/use-leave-latch';

// An app asks for a message signed with the account's posting or active key
// and gets the signature back on its callback (#84), as with Hive Keychain's
// requestSignBuffer. The callback rules are the consent screen's: with a
// client_id it must be registered to that app, without one it is a site that
// is named by its host and must be https (or http on loopback).
export const Route = createFileRoute('/sign-buffer')({
  component: SignBuffer,
  remountDeps: ({ search }) => search,
  validateSearch: (s: Record<string, unknown>) => s as Record<string, string>,
  // The account the app expects, chosen when it is on this device (#83).
  beforeLoad: ({ search }) => {
    const rest = takeNamedAccount(search);
    if (rest)
      throw redirect({ to: '/sign-buffer', search: rest, replace: true });
  },
});

// A client_id that is not a Hive account name names no app.
const HIVE_NAME = /^[a-z][a-z0-9.-]{2,15}$/;

function SignBuffer() {
  const { t } = useTranslation();
  const req = parseSignBufferRequest(Route.useSearch());
  const { selectedAccount, unlocked } = useAccounts();
  const leave = useLeaveLatch();
  const clientIdValid = !req.clientId || HIVE_NAME.test(req.clientId);
  const { data: profile, isLoading } = useQuery({
    queryKey: oauthAppProfileKey(req.clientId ?? ''),
    queryFn: (): Promise<AppProfile | null> =>
      req.clientId ? loadAppProfile(req.clientId) : Promise.resolve(null),
    enabled: !!req.clientId && clientIdValid,
  });

  const callback = req.redirectUri ?? '';
  const callbackHost = hostOf(callback) ?? null;
  const tokenBody = isTokenBody(req.message);
  // Anything that makes the request unusable, as the integration issue an
  // app author would fix. A client_id's callback must be registered to it;
  // without one, a secure URL is all there is to check.
  const refusal: IntegrationIssue | null =
    !req.message || !req.authority || !callback
      ? 'sign_buffer_invalid'
      : req.clientId && (!clientIdValid || profile === null)
        ? 'app_not_found'
        : req.clientId
          ? profile && !isRegisteredRedirect(profile, callback)
            ? 'redirect_not_registered'
            : null
          : isValidRedirectUri(callback)
            ? null
            : callbackHost
              ? 'callback_insecure'
              : 'callback_invalid';
  useEffect(() => {
    if (refusal)
      reportIntegrationIssue(refusal, {
        app: req.clientId,
        callback_host: callbackHost ?? undefined,
      });
  }, [refusal, req.clientId, callbackHost]);

  if (isLoading) return <section className={page}>…</section>;

  const authority = req.authority;
  const isUnlocked = !!selectedAccount && unlocked.includes(selectedAccount);
  const key =
    selectedAccount && authority ? getKeys(selectedAccount)?.[authority] : null;
  // Attacker-controlled: the app's self-declared name, the client_id from
  // the URL, or the callback host. Control and bidi characters stripped.
  const requester = safeText(
    profile?.name ?? req.clientId ?? callbackHost ?? t('authorize.this_site'),
  );

  function sign() {
    // Read now, not from this render: an unlock in the same click has only
    // just put the keys in memory.
    const wif =
      selectedAccount && authority
        ? getKeys(selectedAccount)?.[authority]
        : undefined;
    if (!selectedAccount || !authority || !wif || refusal || tokenBody) return;
    // Another tab chose someone else meanwhile: the screen now names them.
    if (!stillSelected(selectedAccount)) return;
    const { signature, publicKey } = signBuffer(req.message, wif);
    window.location.assign(
      signBufferRedirect(callback, {
        signature,
        publicKey,
        username: selectedAccount,
        authority,
        state: req.state,
      }),
    );
  }

  if (refusal) {
    return (
      <section className={page}>
        <div role="alert" className={alertError}>
          {t('sign_buffer.refused')}
        </div>
        <ReportIssue
          kind={refusal}
          tags={{
            app: req.clientId,
            callback_host: callbackHost ?? undefined,
          }}
        />
      </section>
    );
  }

  return (
    <section className={page}>
      <div className="flex flex-col gap-2 text-center">
        {req.clientId && (
          <Avatar username={req.clientId} size="lg" className="mx-auto" />
        )}
        <h1 className="m-0 text-[19px] font-bold break-words sm:text-xl">
          <Sentence k="sign_buffer.request" values={{ app: requester }} bold />
        </h1>
        {/* What the answer goes to, which the app cannot rename. */}
        <div className={mutedXs}>
          {req.clientId && (
            <>
              {t('authorize.hive_account')}{' '}
              <b translate="no">{`@${safeText(req.clientId)}`}</b>
              {' · '}
            </>
          )}
          <Sentence
            k="authorize.sends_you_to"
            values={{ host: callbackHost ?? '?' }}
            bold
          />
        </div>
      </div>

      <div className={`${card} flex flex-col gap-1.5`}>
        <div className="text-xs text-muted">
          {t('message_signing.message_label')}
        </div>
        {/* Exactly what is signed. Data, not copy: never translated. */}
        <div
          dir="auto"
          translate="no"
          className="max-h-72 overflow-y-auto font-mono text-[13px] break-words whitespace-pre-wrap"
        >
          {visibleMessage(req.message).map((part, i) =>
            part.escaped ? (
              // biome-ignore lint/suspicious/noArrayIndexKey: parts are fixed
              <mark key={i} className="rounded bg-warn-bg px-0.5 text-warn">
                {part.text}
              </mark>
            ) : (
              // biome-ignore lint/suspicious/noArrayIndexKey: parts are fixed
              <span key={i}>{part.text}</span>
            ),
          )}
        </div>
        <div className={mutedXs}>
          {authority === 'active'
            ? t('sign.signed_with_active')
            : t('sign.signed_with_posting')}
        </div>
      </div>

      {tokenBody ? (
        <div role="alert" className={alertError}>
          {t('sign_buffer.token_refused')}
        </div>
      ) : (
        <div className={alertWarn}>
          <Sentence
            k="sign_buffer.warning"
            values={{ account: `@${selectedAccount ?? '?'}` }}
          />
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {selectedAccount && (
          <CurrentAccount
            username={selectedAccount}
            label={t('sign.signing_as')}
            next={window.location.pathname + window.location.search}
          />
        )}
        {tokenBody ? null : !selectedAccount ? (
          <Link
            to="/import"
            search={{ next: window.location.pathname + window.location.search }}
            className={btnPrimary}
          >
            {t('common.continue')}
          </Link>
        ) : !isUnlocked ? (
          <UnlockAndContinue
            key={`unlock:${selectedAccount}`}
            username={selectedAccount}
            action={t('sign.sign')}
            leave={leave}
            onUnlocked={sign}
          />
        ) : !key ? (
          <p className="m-0 text-[13px] text-warn">
            <Sentence
              k={
                authority === 'active'
                  ? 'sign.missing_active_key'
                  : 'sign.missing_posting_key'
              }
              values={{ account: `@${selectedAccount}` }}
            />
          </p>
        ) : (
          <button type="button" onClick={sign} className={btnPrimary}>
            {t('sign.sign')}
          </button>
        )}
        <Link to="/accounts" className="text-center text-[13px] text-muted">
          {t('common.cancel')}
        </Link>
      </div>
    </section>
  );
}
