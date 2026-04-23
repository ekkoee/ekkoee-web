'use client';

// =====================================================================
// HomeOrbit — 8 section 環狀狀態機(modular,首尾相連)
// ---------------------------------------------------------------------
// 核心:
//   - progress.current / target 是浮點數,不 clamp,可無限加減
//   - Render 時每個 section 用「最短環距」計算視覺位置,自然首尾相連
//   - Target 永遠是整數(每 wheel tick = target ± 1)
//   - 250ms throttle:連滾多 tick 會連續 +N,但不會一秒 10 格飛過去
//   - RAF LERP 0.1(snappier)把 current 拉到 target,自帶 snap/dwell
//   - Wormhole overlay:opacity = f(|frac|),顏色跟 velocity 方向
//
// 環序(首尾相連,往下 = 前進):
//   0 Hero(奇點) → 1 Manifesto(第一頁) → 2 Mission
//              → 3 Process → 4 Architecture → 5 Trust
//              → 6 Dashboard → 7 CTA → 0 Hero(循環)
// =====================================================================

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import Hero from '@/app/(home)/_sections/Hero';
import Manifesto from '@/app/(home)/_sections/Manifesto';
import Mission from '@/app/(home)/_sections/Mission';
import Process from '@/app/(home)/_sections/Process';
import Architecture from '@/app/(home)/_sections/Architecture';
import Trust from '@/app/(home)/_sections/Trust';
import DashboardPreview from '@/app/(home)/_sections/DashboardPreview';
import CTA from '@/app/(home)/_sections/CTA';
import { type PortalMode } from '@/components/hero/HeroCanvas';

const SECTION_COUNT = 8;
const HERO_IDX = 0;

// Duration-based tween + easeOutCubic(GSAP power3.out 等效)
// 1500ms 動畫:第一下滾輪立刻有大動(easeOut 快起步),之後慢速柔和落地
const TWEEN_DURATION_MS = 1500;
// Throttle 500ms:短到仍能 pipeline 連續滾,但不會滾兩下就衝過兩站
const WHEEL_THROTTLE_MS = 500;
// GSAP power3.out:**快起步** → 慢落地。使用者一滾輪立刻看到大動,
// 感覺跟上滑鼠靈敏度,不是慢一拍。曲線末端緩慢到站避免「啪」一聲。
//   t=0.1 → 0.27 (10% 時已 27% 進度,馬上明顯)
//   t=0.3 → 0.66
//   t=0.5 → 0.87
//   t=1.0 → 1.00
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

// 最短環距:把 diff 收到 [-half, half],例如 8 個 section 時 [-4, 4]
function shortestRingDelta(diff: number, period: number) {
  const half = period / 2;
  let d = ((diff % period) + period) % period;
  if (d > half) d -= period;
  return d;
}

export default function HomeOrbit() {
  const progress = useRef({
    current: 0,
    target: 0,
    lastVel: 1,
    // tween state(每次 wheel/key 觸發時更新):
    //   current 會從 tweenFrom linearly interpolated by easeInOutCubic 到 target
    tweenFrom: 0,
    tweenStart: 0,
    tweenActive: false,
  });
  const lastWheelTs = useRef(0);
  const [heroActive, setHeroActive] = useState(true);
  const [heroPortalSignal, setHeroPortalSignal] = useState<PortalMode | null>(
    null,
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const sectionElsRef = useRef<HTMLDivElement[]>([]);

  // Collect section refs after mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    sectionElsRef.current = Array.from(
      container.querySelectorAll<HTMLDivElement>('[data-section-idx]'),
    );
  }, []);

  // Lock body scroll
  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, []);

  // RAF loop
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const s = progress.current;
      const prev = s.current;

      // Duration-based tween:從 tweenFrom(動畫起點)以 easeInOutCubic
      //   在 TWEEN_DURATION_MS 內推到 target。動畫完成後 current = target,
      //   下一次 wheel 觸發才會重置 tweenStart。
      if (s.tweenActive) {
        const elapsed = performance.now() - s.tweenStart;
        const t = Math.min(1, elapsed / TWEEN_DURATION_MS);
        const eased = easeOutCubic(t);
        s.current = s.tweenFrom + (s.target - s.tweenFrom) * eased;
        if (t >= 1) {
          s.tweenActive = false;
          s.current = s.target;
        }
      }

      const vel = s.current - prev;
      if (Math.abs(vel) > 0.0005) {
        s.lastVel = vel > 0 ? 1 : -1;
      }

      // Depth-scale wormhole:
      //   diff < 0 → 我們已經穿過它,section 在「後方」正在放大遠去
      //   diff = 0 → section 正對著相機,1:1
      //   diff > 0 → section 在「前方」,從小開始長大朝我們而來
      //   scale = 1.55^(-diff),opacity 快速 fall-off,z-index 按 |diff| 排
      const roundedCurrent = Math.round(
        ((s.current % SECTION_COUNT) + SECTION_COUNT) % SECTION_COUNT,
      ) % SECTION_COUNT;
      for (let i = 0; i < SECTION_COUNT; i++) {
        const el = sectionElsRef.current[i];
        if (!el) continue;
        const diff = shortestRingDelta(i - s.current, SECTION_COUNT);
        const absDiff = Math.abs(diff);
        // Signed-diff「飛過奇點」scale:往前滾 current↑,現在的 section
        // diff 變負 → scale > 1 放大飛出(我們飛進它);前方 section
        // diff 從 +1 降到 0 → scale 從小點 0.4 長大到 1(從遠方星系靠近)。
        //
        //   diff=+1   → 0.40  (遠方小星系)
        //   diff=+0.5 → 0.63  (半途靠近)
        //   diff=0    → 1.00  (到站)
        //   diff=-0.5 → 1.58  (飛進中心、放大)
        //   diff=-1   → 2.50  (穿過、淡出)
        const scale = Math.pow(2.5, -diff);

        // Opacity 對稱鈴型:|diff| 大就透明(太遠看不到)
        const opacity = Math.max(0, 1 - absDiff * 1.0);
        el.style.opacity = String(opacity);
        el.style.transform = `translate3d(0, 0, 0) scale(${scale})`;
        el.style.pointerEvents = i === roundedCurrent ? 'auto' : 'none';
        // 越靠近中心,疊在越上層,避免 Z-fighting
        el.style.zIndex = String(100 - Math.round(absDiff * 10));
        el.style.visibility = absDiff < 1.2 ? 'visible' : 'hidden';
      }

      // Hero centerness CSS var — wordmark/hint 在 Hero.tsx 綁這個
      // opacity。離 Hero 越遠數字越小,平方強化讓開始滾就能看到淡出。
      const heroEl = sectionElsRef.current[HERO_IDX];
      if (heroEl) {
        const heroDiffAbs = Math.abs(
          shortestRingDelta(HERO_IDX - s.current, SECTION_COUNT),
        );
        // Linear 快速衰減:|diff| = 0 → 1,0.05 → 0.65,0.14 → 0
        // 一開始滾輪就能看到明顯的淡出,不用等到半個 section。
        const centerness = Math.max(0, Math.min(1, 1 - heroDiffAbs * 2));
        heroEl.style.setProperty('--hero-centerness', String(centerness));
      }

      // No overlay — depth-scale handles the transition feel.

      // Track Hero 是否 active(target 對齊到 HERO_IDX 的模)
      const targetMod = ((s.target % SECTION_COUNT) + SECTION_COUNT) % SECTION_COUNT;
      const currentMod = ((s.current % SECTION_COUNT) + SECTION_COUNT) % SECTION_COUNT;
      const nextHeroActive =
        Math.round(targetMod) === HERO_IDX &&
        Math.abs(currentMod - Math.round(currentMod)) < 0.05 &&
        Math.round(currentMod) === HERO_IDX;
      setHeroActive((prevActive) =>
        prevActive === nextHeroActive ? prevActive : nextHeroActive,
      );
      // 寫 CSS var 給 Hero canvas 的 keydown listener 讀(判斷要不要接箭頭)
      document.documentElement.style.setProperty(
        '--orbit-at-hero',
        nextHeroActive ? '1' : '0',
      );

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Wheel:throttle-based 一 tick 一格(非 Hero)
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const s = progress.current;
      // Hero 是獨立 3D 宇宙。heroActive 時讓 canvas 完全自主處理 wheel
      // (做 orrery 相機 zoom),orbit 完全不介入、不 preventDefault。
      // 只有當 Hero 內部 zoom 撞到邊界,Hero 才會呼叫 onPortalTrigger
      // 讓 orbit 啟動轉場。
      if (
        !s.tweenActive &&
        Math.round(((s.target % SECTION_COUNT) + SECTION_COUNT) % SECTION_COUNT) === HERO_IDX &&
        heroActive
      ) {
        return;
      }
      e.preventDefault();
      const now = performance.now();
      if (now - lastWheelTs.current < WHEEL_THROTTLE_MS) return;
      lastWheelTs.current = now;
      s.tweenFrom = s.current;
      s.target += e.deltaY > 0 ? 1 : -1;
      s.tweenStart = now;
      s.tweenActive = true;
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [heroActive]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = progress.current;
      // Hero active:方向鍵歸 Hero(做相機 zoom),orbit 不介入。
      // PageDown/PageUp/Space 仍會觸發 orbit 轉場當作 escape hatch。
      const atHero =
        !s.tweenActive &&
        Math.round(((s.target % SECTION_COUNT) + SECTION_COUNT) % SECTION_COUNT) === HERO_IDX &&
        heroActive;
      const isArrow = e.key === 'ArrowDown' || e.key === 'ArrowUp' ||
                      e.key === 'ArrowLeft' || e.key === 'ArrowRight';
      if (atHero && isArrow) {
        return; // let Hero canvas handle arrow keys
      }

      const now = performance.now();
      if (now - lastWheelTs.current < WHEEL_THROTTLE_MS) return;
      let dir = 0;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        dir = 1;
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        dir = -1;
      } else {
        return;
      }
      lastWheelTs.current = now;
      s.tweenFrom = s.current;
      s.target = Math.round(s.target) + dir;
      s.tweenStart = now;
      s.tweenActive = true;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Touch swipe
  useEffect(() => {
    let startY: number | null = null;
    const onStart = (e: TouchEvent) => {
      startY = e.touches[0]?.clientY ?? null;
    };
    const onEnd = (e: TouchEvent) => {
      if (startY === null) return;
      const endY = e.changedTouches[0]?.clientY ?? startY;
      const dy = startY - endY;
      const now = performance.now();
      if (Math.abs(dy) > 50 && now - lastWheelTs.current >= WHEEL_THROTTLE_MS) {
        const s = progress.current;
        lastWheelTs.current = now;
        s.tweenFrom = s.current;
        s.target = Math.round(s.target) + (dy > 0 ? 1 : -1);
        s.tweenStart = now;
        s.tweenActive = true;
      }
      startY = null;
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchend', onEnd);
    };
  }, []);

  // Hero breakthrough → orbit navigation
  const handleHeroPortal = useCallback((mode: PortalMode) => {
    const s = progress.current;
    const now = performance.now();
    s.tweenFrom = s.current;
    s.target = Math.round(s.target) + (mode === 'zoomIn' ? 1 : -1);
    s.tweenStart = now;
    s.tweenActive = true;
    lastWheelTs.current = now;
    setHeroPortalSignal(mode);
    window.setTimeout(() => setHeroPortalSignal(null), 1800);
  }, []);

  const handleSkip = useCallback(() => {
    const s = progress.current;
    const now = performance.now();
    s.tweenFrom = s.current;
    s.target = Math.round(s.target) + 1;
    s.tweenStart = now;
    s.tweenActive = true;
    lastWheelTs.current = now;
  }, []);

  return (
    <>
      <div ref={containerRef} className="fixed inset-0 overflow-hidden">
        <div data-section-idx="0" className="absolute inset-0" style={{ willChange: 'transform, opacity' }}>
          <Hero onPortalTrigger={handleHeroPortal} portalMode={heroPortalSignal} onSkip={handleSkip} />
        </div>
        {/* 從 Hero 往下穿越 → 第一頁 → 第二頁 → …(故事順序) */}
        <div data-section-idx="1" className="absolute inset-0" style={{ willChange: 'transform, opacity' }}>
          <Manifesto />
        </div>
        <div data-section-idx="2" className="absolute inset-0" style={{ willChange: 'transform, opacity' }}>
          <Mission />
        </div>
        <div data-section-idx="3" className="absolute inset-0" style={{ willChange: 'transform, opacity' }}>
          <Process />
        </div>
        <div data-section-idx="4" className="absolute inset-0" style={{ willChange: 'transform, opacity' }}>
          <Architecture />
        </div>
        <div data-section-idx="5" className="absolute inset-0" style={{ willChange: 'transform, opacity' }}>
          <Trust />
        </div>
        <div data-section-idx="6" className="absolute inset-0" style={{ willChange: 'transform, opacity' }}>
          <DashboardPreview />
        </div>
        <div data-section-idx="7" className="absolute inset-0" style={{ willChange: 'transform, opacity' }}>
          <CTA />
        </div>
      </div>

      {/* Wormhole overlay removed — transition is done via section
         depth-scale cross-fade, no white flash. */}
    </>
  );
}
