// =====================================================================
// (home) / Mission - bg-void(和 Manifesto / Process 同底)
// Port 自 legacy components/home/Mission.tsx,加 terminal label。
// 「We don't sell ERP / We grow Mini-AGIs」的 strike→win 視覺
// 復用 globals.css 裡的 .mission-claim / .strike / .win / .mission-prose
// =====================================================================

export default function Mission() {
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
          <span>[ 02 / MISSION ]</span>
        </div>

        <h2 className="mission-claim">
          We don&apos;t <span className="strike">sell ERP.</span>
          <br />
          We <span className="win">grow Mini-AGIs.</span>
        </h2>

        <p className="mission-prose">
          多數軟體告訴工廠該做什麼。ekkoee 打造的是一個會
          <strong>一起思考</strong>的智慧。一座工廠,一套 AI 神經系統 —
          就地生長、從你的地板學、永遠屬於你。沒有 SaaS 綁架、沒有
          矽谷陳腔濫調。只有一個比你 ERP 更了解你機器的 agent。
        </p>
      </div>
    </section>
  );
}
