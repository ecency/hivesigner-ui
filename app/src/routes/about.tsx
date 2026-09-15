import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { card, h1, muted, page } from '@/components/ui';

export const Route = createFileRoute('/about')({
  component: About,
});

function About() {
  const { t } = useTranslation();
  return (
    <section className={page}>
      <h1 className={h1}>{t('about.about')} Hivesigner</h1>
      {/* Capped so the line length stays readable once the shell widens. */}
      <p className={`${muted} m-0 max-w-2xl leading-normal`}>
        {t('index.description')}
      </p>

      {/* Full width on a phone; shrinks to its content and centres from `sm`,
          rather than becoming a mostly empty band on a wide screen. */}
      <div
        className={`${card} mt-1 text-center text-sm text-[#1f2328] sm:w-auto sm:self-center`}
      >
        <div>
          Built with <span className="text-[#E31337]">♥</span> by the{' '}
          <a
            href="https://ecency.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#b90f2e]"
          >
            Ecency
          </a>{' '}
          team
        </div>
      </div>
    </section>
  );
}
