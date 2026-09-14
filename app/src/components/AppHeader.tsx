// Brand bar shared by every screen. The persistent domain + lock cue is a
// deliberate anti-phishing affordance (complaint theme: users cannot tell the
// real site from a lookalike), carried over from the approved redesign mockups.
export function AppHeader() {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid #d1d9e0',
        background: '#fff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 2 4 5v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V5l-8-3Z"
            fill="#E31337"
          />
          <path
            d="m9 12 2 2 4-4"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span style={{ fontWeight: 700, fontSize: 16 }}>Hivesigner</span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 12,
          color: '#59636e',
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <rect
            x="5"
            y="11"
            width="14"
            height="9"
            rx="2"
            stroke="#59636e"
            strokeWidth="1.7"
          />
          <path
            d="M8 11V8a4 4 0 0 1 8 0v3"
            stroke="#59636e"
            strokeWidth="1.7"
          />
        </svg>
        <span
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}
        >
          hivesigner.com
        </span>
      </div>
    </header>
  );
}
