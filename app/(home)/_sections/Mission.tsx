'use client';

// =====================================================================
// (home) / Mission - bg-void(和 Manifesto / Process 同底)
// Port 自 legacy components/home/Mission.tsx,加 terminal label。
// 「We don't sell ERP / We grow Mini-AGIs」的 strike→win 視覺
// 復用 globals.css 裡的 .mission-claim / .strike / .win / .mission-prose
// =====================================================================

import { useI18n } from '@/lib/i18n/I18nProvider';

export default function Mission() {
  const { t } = useI18n();
  return (
    <section
      id="mission"
      aria-label="ekkoee mission"
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-void px-6 py-20 md:px-10"
    >
      <div className="mx-auto w-full max-w-[1200px]">
        <div
          className="text-amber mb-10 flex items-center gap-3"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
          }}
        >
          <span
            aria-hidden
            className="inline-block h-[7px] w-[7px] rounded-full"
            style={{
              background: 'var(--color-terminal, #00ff88)',
              boxShadow: '0 0 10px rgba(0, 255, 136, 0.6)',
              animation: 'cpf-blink 2s ease-in-out infinite',
            }}
          />
          <span>{t.mission.tag}</span>
        </div>

        <h2 className="mission-claim">
          {t.mission.claimDont}
          <span className="strike">{t.mission.claimStrike}</span>
          <br />
          {t.mission.claimWe}
          <span className="win">{t.mission.claimWin}</span>
        </h2>

        <p className="mission-prose">
          {t.mission.prosePre}
          <strong>{t.mission.proseStrong}</strong>
          {t.mission.prosePost}
        </p>
      </div>
    </section>
  );
}
