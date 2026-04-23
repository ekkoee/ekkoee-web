'use client';

// =====================================================================
// (home) / Hero - orrery + glitch wordmark
// wordmark "ekkoee" 有 RGB split glitch(rose + terminal-green 兩層
// 偏移 animate),opacity 綁 CSS 變數 --hero-centerness(orbit 每幀寫入):
//   1 = 完全在 Hero,0 = 完全離開。平方強化衰減(離開更快淡)。
// 滑鼠滾輪往前探索 → HomeOrbit 把 --hero-centerness 拉低 → wordmark 淡出。
// =====================================================================

import { useEffect, useState } from 'react';
import HeroCanvas, { type PortalMode } from '@/components/hero/HeroCanvas';
import { useI18n } from '@/lib/i18n/I18nProvider';

interface HeroProps {
  onPortalTrigger?: (mode: PortalMode) => void;
  portalMode?: PortalMode | null;
  onSkip?: () => void;
}

export default function Hero({ onPortalTrigger, portalMode, onSkip }: HeroProps) {
  const { t } = useI18n();
  const [hasShownHint, setHasShownHint] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const hasCoarse = window.matchMedia('(pointer: coarse)').matches;
      const hasNoHover = window.matchMedia('(hover: none)').matches;
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // 低階裝置偵測:CPU 核心 ≤ 4 或 RAM ≤ 4GB,或超窄螢幕
      // 這些裝置跑 Three.js 會卡到爆,直接落 fallback
      const nav = navigator as Navigator & { deviceMemory?: number };
      const lowCpu = (nav.hardwareConcurrency ?? 8) <= 4;
      const lowMem = (nav.deviceMemory ?? 8) <= 4;
      const narrowScreen = window.innerWidth < 768;

      setIsMobile(
        (hasCoarse && hasNoHover) ||
          prefersReduced ||
          (lowCpu && lowMem) ||
          narrowScreen,
      );
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setHasShownHint(true), 2000);
    return () => clearTimeout(t);
  }, []);

  if (isMobile) {
    return (
      <section
        id="hero"
        aria-label="ekkoee hero"
        className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-ink px-6"
      >
        <GlitchWordmark />
        <p
          className="mt-6 text-bone/60"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
          }}
        >
          {t.hero.subtitle}
        </p>
        <button
          type="button"
          onClick={onSkip}
          className="mt-12 border border-bone/30 px-6 py-3 text-bone/80 transition hover:bg-bone/10"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            letterSpacing: '0.3em',
          }}
        >
          {t.hero.enter}
        </button>
      </section>
    );
  }

  return (
    <section
      id="hero"
      aria-label="ekkoee hero - sacred orrery"
      className="relative h-full w-full overflow-hidden bg-ink"
    >
      <HeroCanvas
        onPortalTrigger={onPortalTrigger}
        portalMode={portalMode}
      />

      {/* Glitch wordmark — opacity 綁 orbit 寫的 CSS var */}
      <div
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        style={{
          // 雙重 centerness:orbit section 距離 × hero orrery zoom 距離
          // 任一變動都會讓 wordmark 開始淡出。一滾 wheel 就看到消失。
          opacity:
            'calc(var(--hero-centerness, 1) * var(--hero-zoom-centerness, 1))',
          willChange: 'opacity',
        }}
      >
        <GlitchWordmark />
        <div
          className="mt-6"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'rgba(235, 230, 215, 0.55)',
            fontSize: 11,
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
          }}
        >
          {t.hero.subtitle}
        </div>
      </div>

      {/* Hint — 2s 後浮現,scroll 離開後淡出 */}
      {hasShownHint && !portalMode && (
        <div
          className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 text-center"
          style={{
            opacity:
              'calc(var(--hero-centerness, 1) * var(--hero-zoom-centerness, 1))',
            willChange: 'opacity',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'rgba(235, 230, 215, 0.70)',
              fontSize: 12,
              letterSpacing: '0.3em',
              lineHeight: 1.6,
            }}
          >
            {t.hero.scrollHint}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'rgba(235, 230, 215, 0.40)',
              fontSize: 10,
              letterSpacing: '0.25em',
              marginTop: 6,
            }}
          >
            {t.hero.scrollHintSub}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onSkip}
        className="absolute bottom-12 right-6 z-10 text-bone/40 transition-colors hover:text-rose focus:text-rose focus:outline-none"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.3em',
        }}
      >
        {t.hero.skipIntro}
      </button>
    </section>
  );
}

// -----------------------------------------------------------------
// GlitchWordmark — 3 疊字,R/G 兩層偏移 animate,中間層保底。
// 不用 data-attr + CSS before/after 的老招,直接三個 <span> 方便 RSC。
// -----------------------------------------------------------------
function GlitchWordmark() {
  const baseStyle: React.CSSProperties = {
    fontFamily: 'var(--font-comfortaa)',
    fontWeight: 700,
    fontSize: 'clamp(4.5rem, 13vw, 9rem)',
    letterSpacing: '-0.04em',
    lineHeight: 1,
  };
  return (
    <div className="relative" style={{ position: 'relative' }}>
      {/* 下層 rose,往左下偏移 */}
      <span
        aria-hidden
        style={{
          ...baseStyle,
          position: 'absolute',
          inset: 0,
          color: '#BF4E6B',
          mixBlendMode: 'screen',
          animation: 'ekkoee-glitch-r 2.8s steps(10) infinite',
          textShadow: '0 0 32px rgba(191, 78, 107, 0.35)',
        }}
      >
        ekkoee
      </span>
      {/* 下層 terminal green,往右上偏移(錯相 1.4s) */}
      <span
        aria-hidden
        style={{
          ...baseStyle,
          position: 'absolute',
          inset: 0,
          color: '#00FF88',
          mixBlendMode: 'screen',
          animation: 'ekkoee-glitch-g 2.8s steps(10) -1.4s infinite',
          textShadow: '0 0 32px rgba(0, 255, 136, 0.3)',
        }}
      >
        ekkoee
      </span>
      {/* 主層 bone */}
      <span
        style={{
          ...baseStyle,
          position: 'relative',
          color: '#EBE6D7',
          zIndex: 2,
          textShadow: '0 0 48px rgba(4, 4, 16, 0.6)',
        }}
      >
        ekkoee
      </span>
    </div>
  );
}
