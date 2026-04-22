export default function Architecture() {
  return (
    <section id="architecture">
      <div className="sec-label">[04/07] TOPOLOGY</div>
      <div className="arch-wrap">
        <div className="arch-head">
          <span className="arch-head-label">SYSTEM // CLOUD_EDGE_HYBRID</span>
          <span className="arch-head-live">◉ LIVE</span>
        </div>

        <svg
          className="arch-svg"
          viewBox="0 0 800 340"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <path id="p-down-1" d="M 200 90 L 200 240" />
            <path id="p-down-2" d="M 400 90 L 400 240" />
            <path id="p-up-3" d="M 600 260 L 600 110" />
          </defs>

          {/* CLOUD region */}
          <rect
            x="40"
            y="20"
            width="720"
            height="90"
            fill="rgba(0,255,136,0.03)"
            stroke="rgba(0,255,136,0.3)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <text
            x="56"
            y="44"
            fill="#00FF88"
            fontFamily="JetBrains Mono"
            fontSize="10"
            letterSpacing="2"
          >
            CLOUD · ekkoee.com
          </text>

          <rect x="140" y="54" width="140" height="36" fill="#121216" stroke="#00FF88" strokeWidth="1" />
          <text x="210" y="76" textAnchor="middle" fill="#D4D4D4" fontFamily="JetBrains Mono" fontSize="11">
            DASHBOARD
          </text>

          <rect x="340" y="54" width="140" height="36" fill="#121216" stroke="#00FF88" strokeWidth="1" />
          <text x="410" y="76" textAnchor="middle" fill="#D4D4D4" fontFamily="JetBrains Mono" fontSize="11">
            CONFIG + OPS
          </text>

          <rect x="540" y="54" width="140" height="36" fill="#121216" stroke="#00FF88" strokeWidth="1" />
          <text x="610" y="76" textAnchor="middle" fill="#D4D4D4" fontFamily="JetBrains Mono" fontSize="11">
            UPDATES
          </text>

          {/* BOUNDARY */}
          <line
            x1="40"
            y1="170"
            x2="760"
            y2="170"
            stroke="#FFB938"
            strokeWidth="1"
            strokeDasharray="2 6"
            opacity="0.8"
          />
          <rect x="320" y="162" width="160" height="16" fill="#0A0A0C" stroke="#FFB938" strokeWidth="1" />
          <text
            x="400"
            y="173"
            textAnchor="middle"
            fill="#FFB938"
            fontFamily="JetBrains Mono"
            fontSize="9"
            letterSpacing="3"
          >
            DATA BOUNDARY
          </text>

          {/* FACTORY region */}
          <rect
            x="40"
            y="230"
            width="720"
            height="90"
            fill="rgba(191,78,107,0.05)"
            stroke="rgba(191,78,107,0.4)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <text
            x="56"
            y="254"
            fill="#BF4E6B"
            fontFamily="JetBrains Mono"
            fontSize="10"
            letterSpacing="2"
          >
            FACTORY · your premises
          </text>

          <rect x="140" y="264" width="140" height="36" fill="#121216" stroke="#BF4E6B" strokeWidth="1" />
          <text x="210" y="286" textAnchor="middle" fill="#D4D4D4" fontFamily="JetBrains Mono" fontSize="11">
            EDGE GPU
          </text>

          <rect x="340" y="264" width="140" height="36" fill="#121216" stroke="#BF4E6B" strokeWidth="1" />
          <text x="410" y="286" textAnchor="middle" fill="#D4D4D4" fontFamily="JetBrains Mono" fontSize="11">
            LOCAL LLM + RAG
          </text>

          <rect x="540" y="264" width="140" height="36" fill="#121216" stroke="#BF4E6B" strokeWidth="1" />
          <text x="610" y="286" textAnchor="middle" fill="#D4D4D4" fontFamily="JetBrains Mono" fontSize="11">
            YOUR DATA
          </text>

          {/* connecting lines */}
          <line x1="210" y1="90" x2="210" y2="264" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="410" y1="90" x2="410" y2="264" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="610" y1="90" x2="610" y2="264" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />

          {/* packets traveling down (green = stats, safe) */}
          <circle r="3" fill="#00FF88">
            <animateMotion dur="3s" repeatCount="indefinite">
              <mpath href="#p-down-1" />
            </animateMotion>
          </circle>
          <circle r="3" fill="#00FF88">
            <animateMotion dur="3s" begin="1s" repeatCount="indefinite">
              <mpath href="#p-down-1" />
            </animateMotion>
          </circle>

          {/* packets going up (green = stats going back to cloud) */}
          <circle r="3" fill="#00FF88">
            <animateMotion
              dur="3s"
              begin="0.5s"
              repeatCount="indefinite"
              keyPoints="1;0"
              keyTimes="0;1"
              calcMode="linear"
            >
              <mpath href="#p-down-2" />
            </animateMotion>
          </circle>
          <circle r="3" fill="#00FF88">
            <animateMotion
              dur="3s"
              begin="2s"
              repeatCount="indefinite"
              keyPoints="1;0"
              keyTimes="0;1"
              calcMode="linear"
            >
              <mpath href="#p-down-2" />
            </animateMotion>
          </circle>

          {/* red packets trying to cross — they stop at boundary */}
          <circle r="3" fill="#FF3B5C">
            <animate attributeName="cx" values="610;610" dur="3s" repeatCount="indefinite" />
            <animate
              attributeName="cy"
              values="264;175;175;264"
              keyTimes="0;0.35;0.6;1"
              dur="3s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="1;1;0.2;0"
              keyTimes="0;0.35;0.55;1"
              dur="3s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>

        <div className="arch-legend">
          <span className="leg-item">
            <span className="leg-dot grn" />
            stats &middot; aggregated &middot; safe to sync
          </span>
          <span className="leg-item">
            <span className="leg-dot amb" />
            boundary &middot; masking layer
          </span>
          <span className="leg-item">
            <span className="leg-dot red" />
            red-zone data &middot; never crosses
          </span>
        </div>
      </div>
    </section>
  );
}
