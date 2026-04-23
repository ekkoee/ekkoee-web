'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';

export default function LoginClient() {
  const [factoryId, setFactoryId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'error'>('idle');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!factoryId || !passcode) return;
    setState('sending');
    // 後端尚未上線,模擬 1.5s 後 error(明示告知使用者)
    window.setTimeout(() => setState('error'), 1500);
  };

  return (
    <div
      className="w-full max-w-[440px]"
      style={{
        border: '1px solid rgba(235, 230, 215, 0.1)',
        background: 'rgba(17, 17, 20, 0.8)',
        padding: '48px 36px',
      }}
    >
      {/* terminal header */}
      <div
        className="mb-8 flex items-center gap-3"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'var(--color-amber, #FFB938)',
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
        <span>[ CLIENT PORTAL ]</span>
      </div>

      <h1
        className="text-bone mb-2"
        style={{
          fontFamily: 'var(--font-comfortaa)',
          fontWeight: 700,
          fontSize: 'clamp(1.75rem, 3.2vw, 2.25rem)',
          letterSpacing: '-0.01em',
          lineHeight: 1.1,
        }}
      >
        authenticate.
      </h1>
      <p
        className="mb-8 text-bone-dim"
        style={{
          fontFamily: 'var(--font-sans), "Noto Sans TC", sans-serif',
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        以工廠識別碼 + 當期一次性 passcode 登入。未申請存取者請使用
        首頁 <Link href="/" style={{ color: '#FFB938', textDecoration: 'underline', textDecorationStyle: 'dashed', textUnderlineOffset: 3 }}>CONTACT</Link> 聯繫。
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block">
          <span
            className="mb-2 block"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'rgba(235, 230, 215, 0.55)',
            }}
          >
            FACTORY ID
          </span>
          <input
            type="text"
            value={factoryId}
            onChange={(e) => setFactoryId(e.target.value)}
            placeholder="e.g. CAMPTEC-TW-01"
            disabled={state === 'sending'}
            style={{
              width: '100%',
              background: 'transparent',
              border: '1px solid rgba(235, 230, 215, 0.15)',
              padding: '12px 14px',
              color: 'var(--color-bone, #EBE6D7)',
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              letterSpacing: '0.05em',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 255, 136, 0.5)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(235, 230, 215, 0.15)';
            }}
          />
        </label>

        <label className="block">
          <span
            className="mb-2 block"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'rgba(235, 230, 215, 0.55)',
            }}
          >
            PASSCODE
          </span>
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="••••••••"
            disabled={state === 'sending'}
            style={{
              width: '100%',
              background: 'transparent',
              border: '1px solid rgba(235, 230, 215, 0.15)',
              padding: '12px 14px',
              color: 'var(--color-bone, #EBE6D7)',
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              letterSpacing: '0.15em',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 255, 136, 0.5)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(235, 230, 215, 0.15)';
            }}
          />
        </label>

        <button
          type="submit"
          disabled={state === 'sending' || !factoryId || !passcode}
          style={{
            width: '100%',
            padding: '14px 0',
            border: '1px solid rgba(0, 255, 136, 0.6)',
            background:
              state === 'sending'
                ? 'rgba(0, 255, 136, 0.08)'
                : 'transparent',
            color: 'var(--color-terminal, #00ff88)',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            cursor: state === 'sending' || !factoryId || !passcode
              ? 'not-allowed'
              : 'pointer',
            transition: 'all 0.2s',
            opacity: (!factoryId || !passcode) && state !== 'sending' ? 0.4 : 1,
          }}
          onMouseEnter={(e) => {
            if (state === 'sending') return;
            e.currentTarget.style.background = 'rgba(0, 255, 136, 0.12)';
            e.currentTarget.style.boxShadow = '0 0 32px rgba(0, 255, 136, 0.25)';
          }}
          onMouseLeave={(e) => {
            if (state === 'sending') return;
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {state === 'sending' ? '⟳ connecting...' : '▸ enter system'}
        </button>

        {state === 'error' && (
          <div
            role="alert"
            style={{
              marginTop: 8,
              padding: '10px 12px',
              border: '1px solid rgba(255, 59, 92, 0.4)',
              background: 'rgba(255, 59, 92, 0.06)',
              color: '#FF3B5C',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.1em',
              lineHeight: 1.5,
            }}
          >
            [ ERR 503 ] auth service not yet deployed. 本入口預設為客戶端
            使用,目前請寄 <a href="mailto:hello@ekkoee.com" style={{ color: '#FF3B5C', textDecoration: 'underline' }}>hello@ekkoee.com</a> 要求存取。
          </div>
        )}
      </form>

      <Link
        href="/"
        className="mt-8 block text-center transition-colors hover:text-rose"
        style={{
          color: 'rgba(235, 230, 215, 0.4)',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.3em',
          textDecoration: 'none',
        }}
      >
        ← BACK TO EKKOEE.COM
      </Link>
    </div>
  );
}
