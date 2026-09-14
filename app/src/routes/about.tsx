import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/about')({
  component: About,
});

function About() {
  const { t } = useTranslation();
  return (
    <section
      style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
        {t('about.about')} Hivesigner
      </h1>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: '#59636e' }}>
        {t('index.description')}
      </p>
      <p style={{ margin: 0, fontSize: 13, color: '#59636e' }}>
        {t('about.maintained')} Ecency
      </p>
    </section>
  );
}
