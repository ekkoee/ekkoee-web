'use client';

// =====================================================================
// (home) / CTA - bg-warm-gray
// ---------------------------------------------------------------------
// 預設只有 rose 按鈕,點擊展開 4 路聯繫清單;LINE 那列再點才展 QR。
// 乾淨的 reveal-on-demand,收起時畫面極簡。
// ---------------------------------------------------------------------
//   [headline]
//   [body]
//   [ROSE BUTTON  ▼]     ← 點擊切換 showContacts
//
//   (showContacts = true 時)
//   ▸ LINE · @ekkoee          ← 點擊再切 showQR,下方展 QR
//      ┌──QR──┐
//   ✈ Telegram · @ekkoee
//   ✉ hello@ekkoee.com
//   ✉ ekkoee@protonmail.com
// =====================================================================

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';

const LINE_URL = 'https://line.me/ti/p/UdLYJmJVsu';
const TELEGRAM_URL = 'https://t.me/ekkoee';
const EMAIL_HELLO = 'hello@ekkoee.com';
const EMAIL_PROTON = 'ekkoee@protonmail.com';

// -------------------------------------------------------------
// Inline SVG icons(零依賴)
// -------------------------------------------------------------
function IconLine({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 5.73 2 10.3c0 4.1 3.55 7.54 8.34 8.18.32.07.76.21.87.48.1.25.07.63.03.88l-.14.84c-.04.25-.2.98.86.53 1.06-.44 5.72-3.37 7.8-5.77h-.01C21.3 14.28 22 12.4 22 10.3 22 5.73 17.52 2 12 2zm-4.1 10.54H6.08a.42.42 0 0 1-.42-.42V8.65a.42.42 0 1 1 .84 0v3.05h1.4a.42.42 0 1 1 0 .84zm1.66-.42a.42.42 0 1 1-.84 0V8.65a.42.42 0 1 1 .84 0zm4.36 0a.42.42 0 0 1-.34.41.44.44 0 0 1-.43-.17l-1.76-2.4v2.16a.42.42 0 1 1-.84 0V8.65a.42.42 0 0 1 .76-.25l1.77 2.41V8.65a.42.42 0 1 1 .84 0zm3.1-1.74a.42.42 0 1 1 0 .84h-1.4v.9h1.4a.42.42 0 1 1 0 .84h-1.82a.42.42 0 0 1-.42-.42V8.65a.42.42 0 0 1 .42-.42h1.82a.42.42 0 1 1 0 .84h-1.4v.9h1.4z" />
    </svg>
  );
}

function IconTelegram({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.2 3.3 2.4 10.8c-1 .4-1 1 .2 1.4l4.8 1.5 1.8 5.8c.2.6.1.8.7.8.4 0 .6-.2.9-.5l2.3-2.3 4.8 3.6c.9.5 1.5.2 1.7-.8l3.1-14.7c.3-1.3-.5-1.9-1.5-1.3zM8.8 14.9l10-6.3c.5-.3 1-.1.6.2l-8.1 7.4-.3 3.3z" />
    </svg>
  );
}

function IconMail({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

// -------------------------------------------------------------
// 共用 contact row 樣式(LINE / Telegram / Mail 用的細列)
// -------------------------------------------------------------
type RowProps = {
  icon: React.ReactNode;
  label: string;
  hint: string;
  accent: string;
  rightAdornment?: React.ReactNode;
};

function RowInner({ icon, label, hint, accent, rightAdornment }: RowProps) {
  return (
    <>
      <span className="shrink-0" style={{ color: accent }}>{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col text-left">
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: '#EBE6D7',
            letterSpacing: '0.06em',
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: 'rgba(162, 156, 135, 0.7)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            marginTop: 3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {hint}
        </span>
      </span>
      <span
        aria-hidden
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'rgba(235, 230, 215, 0.35)',
        }}
      >
        {rightAdornment}
      </span>
    </>
  );
}

function rowStyleBase(): React.CSSProperties {
  return {
    borderLeft: '2px solid rgba(235, 230, 215, 0.12)',
    background: 'rgba(235, 230, 215, 0.02)',
    textDecoration: 'none',
    padding: '12px 16px',
  };
}
function rowStyleHover(accent: string): React.CSSProperties {
  return {
    borderLeft: `2px solid ${accent}`,
    background: 'rgba(235, 230, 215, 0.06)',
    textDecoration: 'none',
    padding: '12px 16px',
    transform: 'translateX(4px)',
  };
}

export default function CTA() {
  const { t } = useI18n();
  const FULL = t.cta.typedFull;
  const [typed, setTyped] = useState('');
  const [showContacts, setShowContacts] = useState(false);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i <= FULL.length) {
        setTyped(FULL.slice(0, i));
        i++;
      } else {
        i = 0;
      }
    }, 200);
    return () => clearInterval(timer);
  }, [FULL]);

  return (
    <section
      id="cta"
      aria-label="ekkoee contact"
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-warm-gray px-6 py-16 text-center"
    >
      {/* rose radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: 0.12,
          background:
            'radial-gradient(circle at 50% 50%, #BF4E6B, transparent 60%)',
        }}
      />

      <div className="relative z-[1] mx-auto flex w-full max-w-[640px] flex-col items-center">
        {/* terminal label */}
        <div
          className="mb-6 flex items-center justify-center gap-3"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: '#BF4E6B',
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
          <span>{t.cta.tag}</span>
        </div>

        {/* headline */}
        <h2
          className="text-bone mb-6 text-center"
          style={{
            fontFamily:
              'var(--font-comfortaa), var(--font-sans), "Noto Sans TC", system-ui, sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(2rem, 5vw, 4.25rem)',
            lineHeight: 1.02,
            letterSpacing: '-0.02em',
          }}
        >
          {t.cta.headlineA}
          <br />
          <span style={{ color: '#BF4E6B', textShadow: '0 0 28px rgba(191, 78, 107, 0.45)' }}>
            {t.cta.headlineB}
          </span>
        </h2>

        {/* supporting copy */}
        <p
          className="text-bone-dim mx-auto mb-8 max-w-[560px] text-center"
          style={{
            fontFamily:
              'var(--font-sans), "Noto Sans TC", system-ui, sans-serif',
            fontSize: 14,
            lineHeight: 1.7,
          }}
        >
          {t.cta.body}
        </p>

        {/* rose 按鈕 — 點擊展開聯繫清單 */}
        <button
          type="button"
          aria-expanded={showContacts}
          aria-controls="cta-contacts"
          onClick={() => setShowContacts((v) => !v)}
          className="inline-flex items-center gap-3 transition-all"
          style={{
            border: '1px solid #BF4E6B',
            padding: '18px 44px',
            color: '#EBE6D7',
            background: '#BF4E6B',
            fontFamily: 'var(--font-mono)',
            fontSize: 15,
            letterSpacing: '0.1em',
            boxShadow: '0 0 0 rgba(191, 78, 107, 0)',
            minWidth: 320,
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 48px rgba(191, 78, 107, 0.55)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 0 rgba(191, 78, 107, 0)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <span className="flex-1 text-left">
            $ {typed}
            <span
              style={{
                marginLeft: 2,
                animation: 'cpf-blink 0.8s step-end infinite',
              }}
            >
              █
            </span>
          </span>
          <span
            aria-hidden
            style={{
              fontSize: 12,
              transition: 'transform 0.3s',
              transform: showContacts ? 'rotate(180deg)' : 'rotate(0deg)',
              opacity: 0.85,
            }}
          >
            ▼
          </span>
        </button>

        {/* 聯繫清單 — 收摺狀態 */}
        <AnimatePresence initial={false}>
          {showContacts && (
            <motion.div
              id="cta-contacts"
              key="contacts"
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{ overflow: 'hidden', width: '100%', maxWidth: 420 }}
            >
              <div className="flex flex-col gap-2">
                {/* LINE — 點擊切換 QR */}
                <button
                  type="button"
                  aria-expanded={showQr}
                  aria-controls="cta-line-qr"
                  onClick={() => setShowQr((v) => !v)}
                  className="flex w-full items-center gap-3 transition-all"
                  style={rowStyleBase()}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, rowStyleHover('#06C755'))}
                  onMouseLeave={(e) => Object.assign(e.currentTarget.style, rowStyleBase())}
                >
                  <RowInner
                    icon={<IconLine size={15} />}
                    label={t.cta.lineLabel}
                    hint={t.cta.lineHint}
                    accent="#06C755"
                    rightAdornment={
                      <span
                        style={{
                          display: 'inline-block',
                          transition: 'transform 0.25s',
                          transform: showQr ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      >
                        ▼
                      </span>
                    }
                  />
                </button>

                {/* LINE QR — 點 LINE 才展開 */}
                <AnimatePresence initial={false}>
                  {showQr && (
                    <motion.div
                      id="cta-line-qr"
                      key="line-qr"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <a
                        href={LINE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-2 p-4 transition-all"
                        style={{
                          border: '1px solid rgba(6, 199, 85, 0.3)',
                          background: 'rgba(6, 199, 85, 0.04)',
                          textDecoration: 'none',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#06C755';
                          e.currentTarget.style.boxShadow = '0 0 24px rgba(6, 199, 85, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(6, 199, 85, 0.3)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div
                          style={{
                            width: 160,
                            height: 160,
                            background: '#EBE6D7',
                            padding: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Image
                            src="/line-qr.png"
                            alt="LINE @ekkoee QR code"
                            width={144}
                            height={144}
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                            unoptimized
                          />
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 9,
                            color: 'rgba(162, 156, 135, 0.7)',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            marginTop: 2,
                          }}
                        >
                          {t.cta.lineHint}
                        </div>
                      </a>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Telegram */}
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 transition-all"
                  style={rowStyleBase()}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, rowStyleHover('#29A9EA'))}
                  onMouseLeave={(e) => Object.assign(e.currentTarget.style, rowStyleBase())}
                >
                  <RowInner
                    icon={<IconTelegram size={15} />}
                    label={t.cta.telegramLabel}
                    hint={t.cta.telegramHint}
                    accent="#29A9EA"
                    rightAdornment={<span>→</span>}
                  />
                </a>

                {/* hello@ */}
                <a
                  href={`mailto:${EMAIL_HELLO}`}
                  className="flex items-center gap-3 transition-all"
                  style={rowStyleBase()}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, rowStyleHover('#FFB938'))}
                  onMouseLeave={(e) => Object.assign(e.currentTarget.style, rowStyleBase())}
                >
                  <RowInner
                    icon={<IconMail size={15} />}
                    label={t.cta.emailHello}
                    hint={t.cta.emailHelloNote}
                    accent="#FFB938"
                    rightAdornment={<span>→</span>}
                  />
                </a>

                {/* protonmail */}
                <a
                  href={`mailto:${EMAIL_PROTON}`}
                  className="flex items-center gap-3 transition-all"
                  style={rowStyleBase()}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, rowStyleHover('#A29C87'))}
                  onMouseLeave={(e) => Object.assign(e.currentTarget.style, rowStyleBase())}
                >
                  <RowInner
                    icon={<IconMail size={15} />}
                    label={t.cta.emailProton}
                    hint={t.cta.emailProtonNote}
                    accent="#A29C87"
                    rightAdornment={<span>→</span>}
                  />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
