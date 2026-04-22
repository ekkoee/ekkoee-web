"use client";

import { useEffect, useState } from "react";
import GearLogo from "@/components/ui/GearLogo";

const INTRO_TEXT =
  "hello. I'm ekkoee. factories plant me, I grow into their AI nervous system. no SaaS, no silicon valley bullshit — just one brain, per floor, learning your machines.";

export default function Hero() {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let i = 0;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const type = () => {
      if (i <= INTRO_TEXT.length) {
        setTyped(INTRO_TEXT.slice(0, i));
        i++;
        timeoutId = setTimeout(type, 28 + Math.random() * 40);
      }
    };

    const startId = setTimeout(type, 800);

    return () => {
      clearTimeout(startId);
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <section id="hero">
      <div
        className="sec-label"
        style={{ position: "absolute", top: "100px", left: "40px", margin: 0 }}
      >
        [01/07] INITIALIZE
      </div>
      <GearLogo />
      <h1 className="brand-word">ekkoee</h1>
      <div className="hero-prompt">
        <span>{typed}</span>
      </div>
      <div className="scroll-hint">▼ SCROLL TO INITIALIZE</div>
    </section>
  );
}
