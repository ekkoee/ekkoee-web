"use client";

import { useState } from "react";

export default function FloatingAgent() {
  const [open, setOpen] = useState(false);

  return (
    <div className={`agent${open ? " open" : ""}`}>
      <div
        className="agent-collapsed"
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span className="agent-dot" />
        <span>agent &middot; online</span>
      </div>
      <div className="agent-open">
        <div className="agent-header">
          <span className="agent-dot" />
          <span>AGENT_01 &middot; ekkoee_intake</span>
          <button
            type="button"
            className="agent-header-close"
            onClick={() => setOpen(false)}
            aria-label="Close agent panel"
          >
            &times;
          </button>
        </div>
        <div className="agent-chat">
          <div className="agent-msg bot">
            <div className="tag">ekkoee</div>
            Hi. I&apos;m the ekkoee intake agent. Ask me about what we do, how
            deployment works, or whether your factory is a fit. I won&apos;t
            pitch you — I&apos;ll just answer.
          </div>
          <div className="agent-msg you">
            <div className="tag">you</div>
            how does data stay safe?
          </div>
          <div className="agent-msg bot">
            <div className="tag">ekkoee</div>
            Three zones. Your formulas and pricing stay on a local GPU in your
            building — air-gapped. Internal docs get masked before any sync.
            Only public/reference data touches the cloud. See section 04.
          </div>
        </div>
        <div className="agent-input">
          <span className="agent-input-caret">&gt;</span>
          <input placeholder="ask anything — phase 1 wires this to the API" />
          <span className="agent-caret">▊</span>
        </div>
      </div>
    </div>
  );
}
