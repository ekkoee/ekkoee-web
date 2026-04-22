"use client";

import { useEffect, useState } from "react";

export default function HudTop() {
  const [clock, setClock] = useState("--:--:--");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const ss = String(d.getSeconds()).padStart(2, "0");
      setClock(`${hh}:${mm}:${ss}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="hud-top">
      <div>
        <span className="hud-dot" />
        <span className="hud-grn">EKKOEE_TERMINAL</span>
        <span className="hud-sep">//</span>
        <span>v0.1.0-alpha</span>
        <span className="hud-sep desk-only">//</span>
        <span className="desk-only">PROTOTYPE</span>
      </div>
      <div>
        <span className="desk-only">NET: </span>
        <span className="hud-grn">SECURE</span>
        <span className="hud-sep">//</span>
        <span className="desk-only">LAT: </span>
        <span className="hud-acc">12ms</span>
        <span className="hud-sep">//</span>
        <span>{clock}</span>
      </div>
    </header>
  );
}
