'use client';

// =====================================================================
// ekkoee - HeroCanvas (7c)
// SSR-safe wrapper around EkkoeeHeroV15 (Three.js r170, 4080+ lines).
// Three.js touches window / WebGLRenderingContext on module import,
// so v15 must render client-only. next/dynamic with ssr:false is only
// valid inside a Client Component — hence this file.
//
// Props forwarded to hero:
//   onPortalTrigger(mode): fired once by the animate loop when zoom is
//     pinned at either extreme ('zoomIn' at 58+, 'zoomOut' at ~1.05).
//   portalMode: parent state mirror; when it clears back to null, hero
//     resets portalTriggered + drops zoom target to a playable middle.
// =====================================================================

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

export type PortalMode = 'zoomIn' | 'zoomOut';

export interface HeroCanvasProps {
  onPortalTrigger?: (mode: PortalMode) => void;
  portalMode?: PortalMode | null;
}

const EkkoeeHeroV15 = dynamic<HeroCanvasProps>(
  () =>
    import('./EkkoeeHeroV15').then(
      (m) => m.default as ComponentType<HeroCanvasProps>,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: '#040410',
        }}
      />
    ),
  },
);

export default function HeroCanvas({
  onPortalTrigger,
  portalMode,
}: HeroCanvasProps) {
  return (
    <div className="absolute inset-0 h-full w-full">
      <EkkoeeHeroV15
        onPortalTrigger={onPortalTrigger}
        portalMode={portalMode}
      />
    </div>
  );
}
