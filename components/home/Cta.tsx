"use client";

export default function Cta() {
  return (
    <section id="cta">
      <div className="sec-label">[07/07] HANDSHAKE</div>
      <h2 className="cta-prompt">
        Let&apos;s <span className="emph">diagnose</span> your factory.
      </h2>
      <p className="cta-sub">
        Two-week, on-site AI enterprise health check. We leave with a map of
        where AI pays — you decide what happens next. No lock-in, no
        &quot;pilot to purgatory.&quot; Just a clear answer.
      </p>
      <button
        type="button"
        className="cta-btn"
        onClick={() => alert("Prototype — real form coming in Phase 1.")}
      >
        REQUEST HEALTH CHECK
      </button>
      <div className="cta-contact">
        direct &middot; <a href="mailto:hello@ekkoee.com">hello@ekkoee.com</a>
      </div>
    </section>
  );
}
