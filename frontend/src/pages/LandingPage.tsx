import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Section } from "../components/ui/Section";
import { useLanguage } from "../i18n/LanguageContext";

export function LandingPage() {
  const { t } = useLanguage();

  return (
    <>
      <style>
        {`
          @keyframes cicd-step-1 {
            0%, 3% {
              opacity: 0;
              transform: translateY(14px) scale(0.98);
              filter: blur(4px);
            }
            7%, 91% {
              opacity: 1;
              transform: translateY(0) scale(1);
              filter: blur(0);
            }
            97%, 100% {
              opacity: 0;
              transform: translateY(-6px) scale(0.99);
              filter: blur(2px);
            }
          }

          @keyframes cicd-step-2 {
            0%, 11% {
              opacity: 0;
              transform: translateY(14px) scale(0.98);
              filter: blur(4px);
            }
            15%, 91% {
              opacity: 1;
              transform: translateY(0) scale(1);
              filter: blur(0);
            }
            97%, 100% {
              opacity: 0;
              transform: translateY(-6px) scale(0.99);
              filter: blur(2px);
            }
          }

          @keyframes cicd-step-3 {
            0%, 19% {
              opacity: 0;
              transform: translateY(14px) scale(0.98);
              filter: blur(4px);
            }
            23%, 91% {
              opacity: 1;
              transform: translateY(0) scale(1);
              filter: blur(0);
            }
            97%, 100% {
              opacity: 0;
              transform: translateY(-6px) scale(0.99);
              filter: blur(2px);
            }
          }

          @keyframes cicd-step-4 {
            0%, 27% {
              opacity: 0;
              transform: translateY(14px) scale(0.98);
              filter: blur(4px);
            }
            31%, 91% {
              opacity: 1;
              transform: translateY(0) scale(1);
              filter: blur(0);
            }
            97%, 100% {
              opacity: 0;
              transform: translateY(-6px) scale(0.99);
              filter: blur(2px);
            }
          }

          @keyframes cicd-step-5 {
            0%, 35% {
              opacity: 0;
              transform: translateY(14px) scale(0.98);
              filter: blur(4px);
            }
            39%, 91% {
              opacity: 1;
              transform: translateY(0) scale(1);
              filter: blur(0);
            }
            97%, 100% {
              opacity: 0;
              transform: translateY(-6px) scale(0.99);
              filter: blur(2px);
            }
          }

          @keyframes cicd-step-6 {
            0%, 43% {
              opacity: 0;
              transform: translateY(14px) scale(0.98);
              filter: blur(4px);
            }
            47%, 91% {
              opacity: 1;
              transform: translateY(0) scale(1);
              filter: blur(0);
            }
            97%, 100% {
              opacity: 0;
              transform: translateY(-6px) scale(0.99);
              filter: blur(2px);
            }
          }

          .cicd-step-card {
            animation-duration: 17.2s;
            animation-timing-function: cubic-bezier(0.2, 0, 0, 1);
            animation-iteration-count: infinite;
            animation-fill-mode: both;
            will-change: transform, opacity, filter;
          }

          .cicd-step-card:nth-child(1) { animation-name: cicd-step-1; }
          .cicd-step-card:nth-child(2) { animation-name: cicd-step-2; }
          .cicd-step-card:nth-child(3) { animation-name: cicd-step-3; }
          .cicd-step-card:nth-child(4) { animation-name: cicd-step-4; }
          .cicd-step-card:nth-child(5) { animation-name: cicd-step-5; }
          .cicd-step-card:nth-child(6) { animation-name: cicd-step-6; }

          @media (prefers-reduced-motion: reduce) {
            .cicd-step-card {
              animation: none;
              opacity: 1;
              transform: none;
              filter: none;
            }
          }
        `}
      </style>

      <Section className="relative overflow-hidden pt-12 sm:pt-16 lg:pt-20">
        <div className="pointer-events-none absolute inset-x-6 top-8 mx-auto h-72 max-w-5xl rounded-[3rem] bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.16),transparent_34%),radial-gradient(circle_at_80%_30%,rgba(16,185,129,0.12),transparent_30%),linear-gradient(180deg,rgba(250,250,250,0.96),rgba(255,255,255,0))]" />
        <div className="pointer-events-none absolute left-1/2 top-24 h-px w-[min(44rem,80vw)] -translate-x-1/2 bg-gradient-to-r from-transparent via-zinc-300/70 to-transparent" />

        <div className="relative mx-auto max-w-4xl text-center">
          <p className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700 shadow-sm">
            {t.landing.eyebrow}
          </p>
          <h1 className="mt-8 text-5xl font-semibold leading-[1.04] tracking-[-0.05em] text-zinc-950 sm:text-6xl lg:text-7xl">
            {t.landing.title}
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-zinc-600 sm:text-xl">
            {t.landing.subtitle}
          </p>
          <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
            <Link to="/demo">
              <Button className="w-full hover:-translate-y-0.5 hover:shadow-md sm:w-auto">{t.landing.openApiDemo}</Button>
            </Link>
            <Link to="/race-condition">
              <Button variant="secondary" className="w-full hover:-translate-y-0.5 hover:shadow-md sm:w-auto">
                {t.landing.viewLockingDemo}
              </Button>
            </Link>
          </div>
        </div>
      </Section>

      <Section className="bg-zinc-50/70">
        <div className="grid items-start gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-blue-600">{t.landing.stackEyebrow}</p>
            <h2 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-5xl">
              {t.landing.stackTitle}
            </h2>
          </div>
          <div className="rounded-[2rem] border border-zinc-200/70 bg-white p-7 shadow-soft sm:p-10">
            <dl className="space-y-0">
              {t.landing.platformRows.map(([label, value]) => (
                <div
                  key={label}
                  className="flex flex-col gap-3 border-b border-zinc-100 py-6 transition-transform transition-colors duration-300 ease-soft first:pt-0 last:border-b-0 last:pb-0 hover:-translate-y-1 hover:translate-x-1 hover:bg-zinc-100/70 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-8"
                >
                  <dt className="text-sm uppercase tracking-[0.34em] text-zinc-400">{label}</dt>
                  <dd className="text-left text-xl font-medium tracking-[-0.03em] text-zinc-950 sm:text-right sm:text-m">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Section>

      <Section className="bg-white">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-blue-600">{t.landing.deliveryEyebrow}</p>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-5xl">
            {t.landing.deliveryTitle}
          </h2>
          <p className="mt-5 text-lg leading-8 text-zinc-600">
            {t.landing.deliveryBody}
          </p>
        </div>

        <div className="relative mt-14">
          <div className="absolute left-5 top-8 hidden h-px w-[calc(100%-2.5rem)] bg-zinc-200 lg:block" />
          <div className="grid gap-4 lg:grid-cols-6">
            {t.landing.cicdSteps.map(([title, detail, badgeClasses], index) => (
            <article
              key={title}
              className="cicd-step-card relative rounded-[1.5rem] border border-zinc-200/70 bg-white p-5 opacity-0 shadow-sm transition-transform duration-300 ease-soft hover:-translate-y-0.5 hover:shadow-soft"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950 text-sm font-semibold tabular-nums text-white shadow-sm">
                  {index + 1}
                </span>
                <span className={["rounded-full px-3 py-1 text-xs font-medium", badgeClasses].join(" ")}>
                  {t.common.step}
                </span>
              </div>
              <h3 className="mt-6 text-xl font-semibold tracking-[-0.03em] text-zinc-950">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-zinc-600">{detail}</p>
            </article>
            ))}
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <a
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors transition-transform duration-300 ease-soft hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 hover:shadow-md active:scale-[0.96]"
            href="https://github.com/kenhm25/web_app_auction/actions/workflows/deploy.yml"
            target="_blank"
            rel="noreferrer"
          >
            {t.landing.viewWorkflow}
          </a>
        </div>
      </Section>
    </>
  );
}
