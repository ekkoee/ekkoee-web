'use client';

// =====================================================================
// (home) / Process - bg-void
// T7: 從一次訪談,到一座會思考的工廠。
// 三欄 DIAGNOSE / DEPLOY / EVOLVE,hover 編號變 rose。
// whileInView + staggerChildren(0 / 150 / 300ms)進場。
// =====================================================================

import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n/I18nProvider';

// Parent orchestrates stagger; children fade+rise.
const gridVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

export default function Process() {
  const { t } = useI18n();
  const STEPS = t.process.steps;
  return (
    <section
      id="process"
      aria-label="ekkoee process"
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-void px-6 py-20 md:px-10"
    >
      <div className="mx-auto w-full max-w-[1200px]">
        {/* section tag — terminal style */}
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
          <span>{t.process.tag}</span>
        </div>

        {/* headline */}
        <h2
          className="text-bone mb-20 max-w-[22ch]"
          style={{
            fontFamily:
              'var(--font-comfortaa), var(--font-sans), "Noto Sans TC", system-ui, sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(1.75rem, 4.2vw, 3.5rem)',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          {t.process.headline}
        </h2>

        {/* three columns — stagger in on scroll */}
        <motion.div
          variants={gridVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          className="grid grid-cols-1 gap-px bg-bone/10 md:grid-cols-3"
        >
          {STEPS.map((step) => (
            <motion.article
              key={step.num}
              variants={cardVariants}
              className="group relative bg-void"
              style={{
                // 三欄之間那條白線(gap-px bg-bone/10)與文字拉開一點距離,
                // 桌機版水平 64px、垂直 56px,行動版稍收。
                padding: 'clamp(40px, 5vw, 64px) clamp(48px, 5vw, 64px)',
              }}
            >
              {/* number badge */}
              <div
                className="mb-8 text-amber transition-colors duration-300 group-hover:text-rose"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                }}
              >
                {step.label}
              </div>

              {/* title */}
              <h3
                className="text-bone mb-6"
                style={{
                  fontFamily:
                    'var(--font-comfortaa), var(--font-sans), "Noto Sans TC", system-ui, sans-serif',
                  fontWeight: 700,
                  fontSize: 'clamp(1.5rem, 2.2vw, 2rem)',
                  letterSpacing: '-0.005em',
                  lineHeight: 1.2,
                }}
              >
                {step.title}
              </h3>

              {/* body */}
              <p
                className="text-bone-dim"
                style={{
                  fontFamily:
                    'var(--font-sans), "Noto Sans TC", system-ui, sans-serif',
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                {step.body}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
