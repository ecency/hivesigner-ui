import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { call } from '@/lib/hive-rpc';
import { requiredAuthority, summarizeOperation } from '@/lib/operation-summary';
import { parseSignRequest } from '@/lib/parse-sign-request';

// /sign/<op>?params, /sign/op|ops|tx/<b64>. Decode + schema-process + confirm.
// Signing/broadcast/redirect follow with the login/key work; this screen is the
// redesign's human-readable confirm (summary above the collapsed raw op).
export const Route = createFileRoute('/sign/$')({
  component: Sign,
  validateSearch: (search: Record<string, unknown>) =>
    search as Record<string, string>,
});

interface Dgp {
  total_vesting_fund_hive: string;
  total_vesting_shares: string;
}

function useVestsToSp(): number {
  const { data } = useQuery({
    queryKey: ['dgp'],
    queryFn: () => call<Dgp>('condenser_api.get_dynamic_global_properties'),
    staleTime: 60_000,
  });
  if (!data) return 1;
  const sp =
    Number.parseFloat(data.total_vesting_fund_hive) /
    Number.parseFloat(data.total_vesting_shares);
  return Number.isFinite(sp) && sp > 0 ? sp : 1;
}

function callbackHost(callback: string): string | null {
  try {
    return new URL(callback).host;
  } catch {
    return null;
  }
}

const card: CSSProperties = {
  background: '#fff',
  border: '1px solid #d1d9e0',
  borderRadius: 12,
  padding: 16,
};

function Sign() {
  const { t } = useTranslation();
  const { _splat } = Route.useParams();
  const search = Route.useSearch();
  const vestsToSp = useVestsToSp();

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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          type="button"
          disabled
          style={{
            height: 50,
            border: 'none',
            borderRadius: 10,
            background: '#f0a5b3',
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'not-allowed',
          }}
        >
          {request.noBroadcast ? t('sign.sign') : t('sign.approve')}
        </button>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: '#59636e',
            textAlign: 'center',
          }}
        >
          Approving is wired up with the login and key flow (next milestone).
        </p>
      </div>
    </section>
  );
}
