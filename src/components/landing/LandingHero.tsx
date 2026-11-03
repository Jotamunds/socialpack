import type { CSSProperties } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ArrowRightIcon } from "@/components/icons";
import { t } from "@/i18n";
import styles from "./landing-hero.module.css";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#828fff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090a] rounded-md";

type CardKind = "pizza" | "cafe" | "beauty" | "wire";

const COLUMNS: { kind: CardKind; duration: string; down?: boolean; wide?: boolean }[][] = [
  [
    { kind: "pizza", duration: "34s" },
    { kind: "wire", duration: "34s" },
    { kind: "cafe", duration: "34s" },
    { kind: "beauty", duration: "34s" },
  ],
  [
    { kind: "beauty", duration: "42s", down: true },
    { kind: "pizza", duration: "42s", down: true },
    { kind: "wire", duration: "42s", down: true },
    { kind: "cafe", duration: "42s", down: true },
  ],
  [
    { kind: "cafe", duration: "28s", wide: true },
    { kind: "beauty", duration: "28s", wide: true },
    { kind: "pizza", duration: "28s", wide: true },
    { kind: "wire", duration: "28s", wide: true },
  ],
  [
    { kind: "wire", duration: "38s", down: true, wide: true },
    { kind: "cafe", duration: "38s", down: true, wide: true },
    { kind: "beauty", duration: "38s", down: true, wide: true },
    { kind: "pizza", duration: "38s", down: true, wide: true },
  ],
];

function PostCard({ kind }: { kind: CardKind }) {
  if (kind === "pizza") {
    return (
      <article className={`${styles.card} ${styles.pizza}`}>
        <span className={styles.kicker}>{t("hero.cardPizzeria")}</span>
        <div>
          <p className={styles.headline}>{t("hero.cardPizza")}</p>
          <div className={styles.lines}>
            <span className={styles.line} style={{ width: "78%" }} />
            <span className={styles.line} style={{ width: "52%" }} />
          </div>
        </div>
        <span className={styles.blob} style={{ background: "radial-gradient(circle at 35% 35%, #ffb199, #c2412d 55%, #6b2418)" }} />
      </article>
    );
  }

  if (kind === "cafe") {
    return (
      <article className={`${styles.card} ${styles.cafe}`}>
        <span className={styles.kicker}>{t("hero.cardCafe")}</span>
        <div>
          <p className={styles.headline}>{t("hero.cardCoffee")}</p>
          <div className={styles.lines}>
            <span className={styles.line} style={{ width: "70%" }} />
            <span className={styles.line} style={{ width: "46%" }} />
          </div>
        </div>
        <span className={styles.blob} style={{ background: "radial-gradient(circle at 40% 30%, #f3e6d4, #b08968 60%, #5c4033)", borderRadius: "46% 46% 42% 42%" }} />
      </article>
    );
  }

  if (kind === "beauty") {
    return (
      <article className={`${styles.card} ${styles.beauty}`}>
        <span className={styles.kicker}>{t("hero.cardBeauty")}</span>
        <div>
          <p className={styles.headline}>{t("hero.cardLook")}</p>
          <div className={styles.lines}>
            <span className={styles.line} style={{ width: "74%" }} />
            <span className={styles.line} style={{ width: "40%" }} />
          </div>
        </div>
        <span className={styles.blob} style={{ background: "radial-gradient(circle at 40% 35%, #f7e7ea, #d4a0b0 58%, #7a4e5c)" }} />
      </article>
    );
  }

  return (
    <article className={`${styles.card} ${styles.wire}`}>
      <span className={styles.kicker}>{t("hero.cardDraft")}</span>
      <div className="h-16 rounded-lg border border-dashed border-white/20 bg-white/5" />
      <div className={styles.lines}>
        <span className={styles.line} style={{ width: "88%" }} />
        <span className={styles.line} style={{ width: "64%" }} />
        <span className={styles.line} style={{ width: "42%" }} />
      </div>
    </article>
  );
}

function Column({ cards }: { cards: (typeof COLUMNS)[number] }) {
  const first = cards[0];
  const renderCards = (copy: string) =>
    cards.map((card, index) => <PostCard key={`${copy}-${card.kind}-${index}`} kind={card.kind} />);

  return (
    <div className={`${styles.lane} ${first.wide ? styles.laneWide : ""}`}>
      <div
        className={`${styles.track} ${first.down ? styles.down : ""}`}
        style={{ animationDuration: first.duration }}
      >
        <div className={styles.group}>{renderCards("a")}</div>
        <div className={styles.group}>{renderCards("b")}</div>
      </div>
    </div>
  );
}

function SocialBadge({
  className,
  style,
  label,
  children,
}: {
  className: string;
  style: CSSProperties;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span className={`${styles.badge} ${className}`} style={style} title={label}>
      {children}
    </span>
  );
}

export function LandingHero() {
  return (
    <section className={styles.hero}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.mural} aria-hidden="true">
        <div className={styles.board}>
          {COLUMNS.map((cards, index) => (
            <Column key={index} cards={cards} />
          ))}
        </div>
        <div className={styles.icons}>
          <SocialBadge
            className=""
            label={t("hero.badgeInstagram")}
            style={{ top: "8%", left: "4%", background: "linear-gradient(135deg,#f7ce68,#ee2a7b)", boxShadow: "0 0 22px rgba(238,42,123,0.55)", animationDelay: "0s" }}
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <rect x="4" y="4" width="16" height="16" rx="5" />
              <circle cx="12" cy="12" r="3.2" />
              <circle cx="17" cy="7" r="0.8" fill="currentColor" stroke="none" />
            </svg>
          </SocialBadge>
          <SocialBadge
            className=""
            label={t("hero.badgeYouTube")}
            style={{ top: "18%", right: "6%", background: "#e40014", boxShadow: "0 0 22px rgba(228,0,20,0.5)", animationDelay: "0.8s" }}
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
              <path d="M9.2 8.4v7.2L16 12 9.2 8.4z" />
            </svg>
          </SocialBadge>
          <SocialBadge
            className=""
            label={t("hero.badgeTikTok")}
            style={{ bottom: "22%", right: "2%", background: "#111", boxShadow: "0 0 18px rgba(113,112,255,0.45)", animationDelay: "1.4s" }}
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
              <path d="M14 4v9.2a3.2 3.2 0 1 1-2.2-3V7.6A5.2 5.2 0 0 0 17 9V6.2A4.2 4.2 0 0 1 14 4z" />
            </svg>
          </SocialBadge>
          <SocialBadge
            className=""
            label={t("hero.badgeMessage")}
            style={{ bottom: "18%", left: "8%", background: "#5e6ad2", boxShadow: "0 0 20px rgba(94,106,210,0.55)", animationDelay: "0.4s" }}
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path d="M6 16.5 4 20l4.2-1.4A8 8 0 1 0 6 16.5z" />
            </svg>
          </SocialBadge>
          <SocialBadge
            className={styles.badgeWide}
            label={t("hero.badgeVideo")}
            style={{ top: "46%", left: "6%", background: "#7170ff", boxShadow: "0 0 18px rgba(113,112,255,0.5)", animationDelay: "1.1s" }}
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
              <path d="M8 7v10l9-5-9-5z" />
            </svg>
          </SocialBadge>
        </div>
      </div>

      <div className={`${styles.copy} relative z-10 mx-auto flex w-full max-w-6xl flex-col px-4 pb-10 lg:min-h-[100svh]`}>
        <header className="flex min-h-16 flex-wrap items-center justify-between gap-x-3 gap-y-1 py-1.5 sm:h-16 sm:flex-nowrap sm:py-0">
          <div className={`${styles.brand} shrink-0`}>
            <Logo variant="with-label" href="/" className="h-10 w-auto shrink-0" alt={t("brand.logoFull")} />
          </div>
          <nav aria-label={t("hero.navLabel")} className="ml-auto flex shrink-0 items-center gap-2 sm:gap-6">
            <a href="#funcionalidades" className={`inline-flex min-h-11 items-center text-[12px] sm:text-[13px] font-medium text-[#d0d6e0] hover:text-[#f7f8f8] transition-colors ${focusRing}`}>
              {t("hero.features")}
            </a>
            <Link href="/login" className={`inline-flex min-h-11 items-center text-[12px] sm:text-[13px] font-medium text-[#d0d6e0] hover:text-[#f7f8f8] transition-colors ${focusRing}`}>
              {t("hero.logIn")}
            </Link>
          </nav>
        </header>

        <div className="flex flex-1 items-center">
          <div className="max-w-xl pt-8 text-center lg:pt-0 lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-semibold tracking-[-0.035em] leading-[1.12] text-[#f7f8f8]">
              {t("hero.title")}
            </h1>
            <p className="mt-7 text-base sm:text-lg text-[#d0d6e0] leading-relaxed">
              {t("hero.subtitle")}
            </p>
            <div className="mt-11 flex justify-center lg:justify-start">
              <Link
                href="/cadastro"
                className={`inline-flex h-12 items-center gap-2 rounded-full px-6 text-[14px] font-medium text-white transition-colors hover:bg-[rgba(255,255,255,0.12)] ${focusRing}`}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  backdropFilter: "blur(14px)",
                  boxShadow: "0 0 28px rgba(94,106,210,0.35)",
                }}
              >
                {t("hero.cta")}
                <ArrowRightIcon className="size-4" />
              </Link>
            </div>
            <a
              href="#funcionalidades"
              className={`mt-10 inline-flex items-center gap-2 text-xs text-[#8a8f98] hover:text-[#d0d6e0] transition-colors ${focusRing}`}
            >
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path d="M12 5v14" />
                <path d="m6 13 6 6 6-6" />
              </svg>
              {t("hero.scrollHint")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
