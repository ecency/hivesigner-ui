import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { BrandMark } from '@/components/Brand';
import { card, h1, link, muted, page } from '@/components/ui';

export const Route = createFileRoute('/about')({
  component: About,
});

function About() {
  const { t } = useTranslation();
  return (
    <section className={page}>
      <h1 className={`${h1} flex items-center gap-3`}>
        <BrandMark size={32} />
        <span>{t('about.about')} Hivesigner</span>
      </h1>
      {/* Capped so the line length stays readable once the shell widens. */}
      <p className={`${muted} m-0 max-w-2xl leading-normal`}>
        {t('index.description')}
      </p>

      {/* Full width on a phone; shrinks to its content and centres from `sm`,
          rather than becoming a mostly empty band on a wide screen. */}
      <div
        className={`${card} mt-1 text-center text-sm text-ink sm:w-auto sm:self-center`}
      >
        <div>
          Built with <span className="text-brand">♥</span> by the{' '}
          <a
            href="https://ecency.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-ink"
          >
            Ecency
          </a>{' '}
          team
        </div>
      </div>

      {/* The two links the previous About page carried: the logo file itself,
          and where to report a problem. */}
      <div className="flex flex-wrap gap-4 text-sm sm:justify-center">
        <a href="/logo.svg" download="hivesigner-logo.svg" className={link}>
          {t('about.download_logo')}
        </a>
        <a
          href="https://github.com/ecency/hivesigner-ui/issues"
          target="_blank"
          rel="noopener noreferrer"
          className={link}
        >
          {t('about.report_bug')}
        </a>
      </div>
    </section>
  );
}
