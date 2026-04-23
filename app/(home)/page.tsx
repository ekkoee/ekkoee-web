// =====================================================================
// (home) / page — ekkoee homepage (環狀 orbit 模式)
// 所有 section 由 HomeOrbit client 元件管。body scroll 禁用,
// 每一次滾輪、方向鍵、觸控 swipe 都是一次傳送門轉場。
//
// Route group `(home)` 被省略 → 服務於 `/`。
// =====================================================================

import CyberpunkFrame from '@/components/ui/CyberpunkFrame';
import HomeOrbit from '@/components/home/HomeOrbit';

export default function HomePage() {
  return (
    <>
      <CyberpunkFrame />
      <HomeOrbit />
    </>
  );
}
