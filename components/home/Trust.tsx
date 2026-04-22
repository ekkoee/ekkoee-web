function LockSvg() {
  return (
    <svg className="lock-svg" viewBox="0 0 60 70" aria-hidden="true">
      <path
        className="lock-shackle"
        d="M 15 32 L 15 22 Q 15 10 30 10 Q 45 10 45 22 L 45 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <rect x="10" y="30" width="40" height="32" rx="3" fill="currentColor" opacity="0.95" />
      <circle cx="30" cy="44" r="3" fill="#0A0A0C" />
      <rect x="28.5" y="44" width="3" height="8" fill="#0A0A0C" />
    </svg>
  );
}

export default function Trust() {
  return (
    <section id="trust">
      <div className="sec-label">[05/07] TRUST LAYER</div>
      <div className="trust-grid">
        <div className="zone red">
          <div className="zone-tag">
            <span className="zone-tag-dot" />
            RED ZONE
          </div>
          <div className="lock-viz">
            <LockSvg />
          </div>
          <div className="zone-body">
            <strong>Formulas. Pricing. Financials.</strong> The data that
            defines your moat. It never touches the cloud — it never even
            touches the internet. Processed only by the local GPU sitting on
            your floor.
          </div>
          <div className="zone-promise">// never leaves premises</div>
        </div>

        <div className="zone amb">
          <div className="zone-tag">
            <span className="zone-tag-dot" />
            YELLOW ZONE
          </div>
          <div className="lock-viz">
            <LockSvg />
          </div>
          <div className="zone-body">
            <strong>SOPs. Draft contracts. Internal flows.</strong> Sensitive
            but not existential. Stays local by default; when it needs to
            sync, it&apos;s anonymized, masked, and every action has an audit
            trail.
          </div>
          <div className="zone-promise">// anonymized before upload</div>
        </div>

        <div className="zone grn">
          <div className="zone-tag">
            <span className="zone-tag-dot" />
            GREEN ZONE
          </div>
          <div className="lock-viz">
            <LockSvg />
          </div>
          <div className="zone-body">
            <strong>Manuals. Regulations. Public data.</strong> Freely
            cloud-processable. Big-model power with none of the risk. This is
            where Claude, GPT, and the frontier work for you — and only here.
          </div>
          <div className="zone-promise">// cloud-processable</div>
        </div>
      </div>
    </section>
  );
}
