import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { type Operation, summarizeOperation } from '@/lib/operation-summary';

// Legacy-style /sign/<op>?params. Full hive-uri decoding (tx / op / ops / msg)
// and transaction processing land with the flow port (#102); this scaffold
// route parses the simple legacy form so the redesigned confirm screen (a
// human summary above the collapsed raw op) can be exercised end to end.
export const Route = createFileRoute('/sign/$')({
  component: Sign,
  validateSearch: (search: Record<string, unknown>) =>
    search as Record<string, string>,
});

function Sign() {
  const { t } = useTranslation();
  const { _splat } = Route.useParams();
  const search = Route.useSearch();

  const opName = (_splat ?? '').split('/')[0] ?? '';
  const op: Operation = [opName, { ...search }];
  const summary = opName ? summarizeOperation(op) : null;

  if (!summary) {
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

  return (
    <section
      style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
        {t('sign.confirm_transaction')}
      </h1>

      <div
        style={{
          background: '#fff',
          border: '1px solid #d1d9e0',
          borderRadius: 12,
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700 }}>{summary.title}</div>
        {summary.detail && (
          <div style={{ fontSize: 13, color: '#59636e' }}>{summary.detail}</div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13.5,
          background: '#fff',
          border: '1px solid #d1d9e0',
          borderRadius: 12,
          padding: '12px 14px',
        }}
      >
        Signed with your <b>{summary.authority}</b> key
      </div>

      <details
        style={{
          background: '#fff',
          border: '1px solid #d1d9e0',
          borderRadius: 12,
          padding: '12px 14px',
        }}
      >
        <summary
          style={{
            cursor: 'pointer',
            fontSize: 13.5,
            fontWeight: 600,
            color: '#59636e',
          }}
        >
          Show raw operation
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
          {JSON.stringify(op, null, 2)}
        </pre>
      </details>

      <p style={{ margin: 0, fontSize: 12, color: '#59636e' }}>
        Signing is not wired up yet in this preview build.
      </p>
    </section>
  );
}
