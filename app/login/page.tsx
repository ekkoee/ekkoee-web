// =====================================================================
// /login — 工廠/客戶端入口(cyberpunk 終端風格)
// 目前是 UI-only,表單 submit 不送任何後端,顯示 "connecting..." 然後
// 清除。等後端 auth 上線再接。CyberpunkFrame chrome 仍在。
// =====================================================================

import LoginClient from './LoginClient';
import CyberpunkFrame from '@/components/ui/CyberpunkFrame';

export const metadata = {
  title: 'ekkoee // client login',
  description: 'Factory / client portal login for ekkoee Mini-AGI.',
};

export default function LoginPage() {
  return (
    <>
      <CyberpunkFrame />
      <main
        style={{
          position: 'relative',
          minHeight: '100vh',
          background: 'var(--color-void, #0a0a0c)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px',
        }}
      >
        <LoginClient />
      </main>
    </>
  );
}
