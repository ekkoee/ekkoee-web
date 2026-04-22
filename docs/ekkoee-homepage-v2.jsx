import { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';

// =====================================================================
// ekkoee homepage v2 — "the one that breathes"
// HERMES cyberpunk terminal aesthetic, next-level
// Colors locked: #0A0A0C bg / #00FF88 green / #FFB938 amber
//                #BF4E6B rose / #A29C87 olive / #E6E2D3 cream
// =====================================================================

const C = {
  bg: '#0A0A0C',
  bgSoft: '#111114',
  bgCard: '#15151A',
  line: '#222228',
  lineHot: '#2d2d35',
  green: '#00FF88',
  amber: '#FFB938',
  rose: '#BF4E6B',
  olive: '#A29C87',
  cream: '#E6E2D3',
  dim: '#5A5A64',
  text: '#D4D4D8',
};

// --------------------------------------------------------------------
// Font loader + global styles
// --------------------------------------------------------------------
function GlobalStyles() {
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;700&family=JetBrains+Mono:wght@300;400;500;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.textContent = `
      .ekkoee-root * { box-sizing: border-box; }
      .ekkoee-root { font-family: 'JetBrains Mono', monospace; color: ${C.text}; background: ${C.bg}; }
      .ekkoee-brand { font-family: 'Comfortaa', sans-serif; font-weight: 700; letter-spacing: -0.02em; }
      .ekkoee-mono { font-family: 'JetBrains Mono', monospace; }

      /* CRT scanlines */
      .ekkoee-scanlines {
        position: fixed; inset: 0; pointer-events: none; z-index: 60;
        background: repeating-linear-gradient(
          0deg,
          rgba(0,255,136,0.02) 0px,
          rgba(0,255,136,0.02) 1px,
          transparent 1px,
          transparent 3px
        );
        mix-blend-mode: overlay;
      }

      /* Subtle grain */
      .ekkoee-grain {
        position: fixed; inset: 0; pointer-events: none; z-index: 59; opacity: 0.04;
        background-image: url("data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
      }

      /* Vignette */
      .ekkoee-vignette {
        position: fixed; inset: 0; pointer-events: none; z-index: 58;
        background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%);
      }

      /* Cursor */
      .ekkoee-root, .ekkoee-root * {
        cursor: crosshair;
      }
      .ekkoee-root a, .ekkoee-root button, .ekkoee-root [role="button"] {
        cursor: pointer;
      }

      /* Blinking caret */
      @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
      .ekkoee-caret { animation: blink 1s step-end infinite; }

      /* Scan sweep */
      @keyframes sweep {
        0% { transform: translateY(-100%); }
        100% { transform: translateY(100vh); }
      }
      .ekkoee-sweep {
        position: fixed; left: 0; right: 0; height: 120px; z-index: 55;
        background: linear-gradient(180deg, transparent, rgba(0,255,136,0.05) 50%, transparent);
        pointer-events: none;
        animation: sweep 8s linear infinite;
      }

      /* Glitch */
      @keyframes glitchShift {
        0%, 100% { transform: translate(0); }
        20% { transform: translate(-1px, 1px); }
        40% { transform: translate(1px, -1px); }
        60% { transform: translate(-1px, -1px); }
        80% { transform: translate(1px, 1px); }
      }
      .ekkoee-glitch:hover { animation: glitchShift 0.3s linear infinite; }

      /* Fade up on reveal */
      .ekkoee-reveal {
        opacity: 0; transform: translateY(24px);
        transition: opacity 0.9s cubic-bezier(0.2,0.8,0.2,1), transform 0.9s cubic-bezier(0.2,0.8,0.2,1);
      }
      .ekkoee-reveal.visible { opacity: 1; transform: translateY(0); }

      /* Data pulse */
      @keyframes datapulse {
        0% { opacity: 0.2; }
        50% { opacity: 1; }
        100% { opacity: 0.2; }
      }
      .ekkoee-pulse { animation: datapulse 2s ease-in-out infinite; }

      /* Ticker marquee */
      @keyframes marquee {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }

      /* Boot fade */
      @keyframes bootFadeOut {
        0% { opacity: 1; }
        100% { opacity: 0; pointer-events: none; }
      }

      /* Selection */
      .ekkoee-root ::selection { background: ${C.green}; color: ${C.bg}; }

      /* Scrollbar */
      .ekkoee-root ::-webkit-scrollbar { width: 6px; }
      .ekkoee-root ::-webkit-scrollbar-track { background: ${C.bg}; }
      .ekkoee-root ::-webkit-scrollbar-thumb { background: ${C.green}; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(link); document.head.removeChild(style); };
  }, []);
  return null;
}

// --------------------------------------------------------------------
// Boot sequence
// --------------------------------------------------------------------
function BootSequence({ onDone }) {
  const lines = useMemo(() => [
    '$ ekkoee --boot --target=camptec',
    '[ OK ] initializing kernel v4.7.2-ekko',
    '[ OK ] loading edge telemetry daemon',
    '[ OK ] establishing RAG knowledge graph',
    '[ OK ] mounting /factory/red /factory/yellow /factory/green',
    '[ OK ] binding agent.vision agent.scheduling agent.alert',
    '[ OK ] connecting supabase realtime channel ...',
    '[ OK ] handshake with edge.camptec-01 complete',
    '[ ✓  ] system online. 4 agents running.',
  ], []);
  const [shown, setShown] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (shown >= lines.length) {
      const t = setTimeout(() => setFading(true), 500);
      const t2 = setTimeout(onDone, 1200);
      return () => { clearTimeout(t); clearTimeout(t2); };
    }
    const delay = shown === 0 ? 300 : 140 + Math.random() * 80;
    const t = setTimeout(() => setShown(s => s + 1), delay);
    return () => clearTimeout(t);
  }, [shown, lines.length, onDone]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: C.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: fading ? 'bootFadeOut 0.7s forwards' : 'none',
      }}
    >
      <div style={{ width: 'min(560px, 90vw)', fontSize: 13, lineHeight: 1.7 }}>
        {lines.slice(0, shown).map((l, i) => {
          const isOk = l.includes('[ OK ]') || l.includes('[ ✓');
          const isCmd = l.startsWith('$');
          return (
            <div key={i} style={{
              color: isCmd ? C.amber : isOk ? C.green : C.text,
              whiteSpace: 'pre', fontFamily: 'JetBrains Mono, monospace',
            }}>
              {l}
            </div>
          );
        })}
        {shown < lines.length && (
          <span className="ekkoee-caret" style={{ color: C.green }}>█</span>
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------
// 3D gear-molecule hero (Three.js)
// --------------------------------------------------------------------
function ThreeHero() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth, h = mount.clientHeight;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0c, 0.035);

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.set(0, 0, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // --- gear group ---
    const gearGroup = new THREE.Group();
    scene.add(gearGroup);

    const roseColor = new THREE.Color(0xBF4E6B);
    const greenColor = new THREE.Color(0x00FF88);
    const amberColor = new THREE.Color(0xFFB938);

    // central gear (torus + teeth)
    const gear = new THREE.Group();
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(1.8, 0.35, 16, 48),
      new THREE.MeshStandardMaterial({ color: roseColor, metalness: 0.6, roughness: 0.3, emissive: roseColor, emissiveIntensity: 0.15 })
    );
    gear.add(torus);
    // teeth
    const teethCount = 10;
    for (let i = 0; i < teethCount; i++) {
      const angle = (i / teethCount) * Math.PI * 2;
      const tooth = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.5, 0.35),
        new THREE.MeshStandardMaterial({ color: roseColor, metalness: 0.6, roughness: 0.3, emissive: roseColor, emissiveIntensity: 0.15 })
      );
      tooth.position.x = Math.cos(angle) * 1.95;
      tooth.position.y = Math.sin(angle) * 1.95;
      tooth.rotation.z = angle;
      gear.add(tooth);
    }
    // inner ring
    const innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.9, 0.08, 8, 32),
      new THREE.MeshStandardMaterial({ color: roseColor, emissive: roseColor, emissiveIntensity: 0.4 })
    );
    gear.add(innerRing);
    // core dot
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 16, 16),
      new THREE.MeshStandardMaterial({ color: greenColor, emissive: greenColor, emissiveIntensity: 1.5 })
    );
    gear.add(core);
    gearGroup.add(gear);

    // satellite nodes
    const satellites = [
      { radius: 3.6, angle: 0, speed: 0.4, size: 0.45, color: roseColor },
      { radius: 3.2, angle: Math.PI * 0.7, speed: -0.3, size: 0.35, color: roseColor },
      { radius: 3.8, angle: Math.PI * 1.3, speed: 0.35, size: 0.4, color: roseColor },
    ];
    const satelliteMeshes = satellites.map(s => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(s.size, 16, 16),
        new THREE.MeshStandardMaterial({
          color: s.color, metalness: 0.6, roughness: 0.3,
          emissive: s.color, emissiveIntensity: 0.25,
        })
      );
      gearGroup.add(mesh);
      return { mesh, cfg: s };
    });

    // connection lines (dynamic) + data packets
    const packetMaterial = new THREE.MeshBasicMaterial({ color: greenColor });
    const packets = [];
    for (let i = 0; i < 12; i++) {
      const packet = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), packetMaterial);
      packet.userData = {
        satIdx: i % 3,
        progress: Math.random(),
        speed: 0.3 + Math.random() * 0.5,
      };
      gearGroup.add(packet);
      packets.push(packet);
    }

    // connection line material
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xBF4E6B, transparent: true, opacity: 0.35 });
    const lineGroup = new THREE.Group();
    gearGroup.add(lineGroup);

    // particle field
    const particleCount = 800;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const r = 6 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi) - 2;
      const pick = Math.random();
      const col = pick < 0.6 ? greenColor : pick < 0.85 ? amberColor : roseColor;
      colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const particles = new THREE.Points(particleGeo, new THREE.PointsMaterial({
      size: 0.04, vertexColors: true, transparent: true, opacity: 0.7,
    }));
    scene.add(particles);

    // lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(5, 5, 5);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x00FF88, 0.5);
    rimLight.position.set(-5, -2, -3);
    scene.add(rimLight);

    // mouse parallax
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMouse = (e) => {
      const rect = mount.getBoundingClientRect();
      mouse.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 0.4;
      mouse.ty = ((e.clientY - rect.top) / rect.height - 0.5) * 0.4;
    };
    window.addEventListener('mousemove', onMouse);

    // resize
    const onResize = () => {
      const nw = mount.clientWidth, nh = mount.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    // animate
    let raf;
    const clock = new THREE.Clock();
    const animate = () => {
      const dt = clock.getDelta();
      const t = clock.getElapsedTime();

      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;

      gearGroup.rotation.y = t * 0.15 + mouse.x;
      gearGroup.rotation.x = Math.sin(t * 0.2) * 0.1 + mouse.y * 0.5;
      gear.rotation.z = t * 0.35;
      innerRing.rotation.x = t * 0.8;
      innerRing.rotation.y = t * 0.6;

      // pulse core
      const pulseS = 1 + Math.sin(t * 3) * 0.15;
      core.scale.set(pulseS, pulseS, pulseS);

      // update satellites
      const satPositions = satelliteMeshes.map(({ mesh, cfg }) => {
        cfg.angle += cfg.speed * dt;
        const x = Math.cos(cfg.angle) * cfg.radius;
        const z = Math.sin(cfg.angle) * cfg.radius;
        const y = Math.sin(cfg.angle * 2) * 0.3;
        mesh.position.set(x, y, z);
        return mesh.position.clone();
      });

      // redraw lines
      while (lineGroup.children.length) lineGroup.remove(lineGroup.children[0]);
      satPositions.forEach(p => {
        const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), p]);
        lineGroup.add(new THREE.Line(geo, lineMaterial));
      });

      // update packets flowing along lines
      packets.forEach(p => {
        p.userData.progress += p.userData.speed * dt;
        if (p.userData.progress > 1) {
          p.userData.progress = 0;
          p.userData.satIdx = Math.floor(Math.random() * 3);
        }
        const target = satPositions[p.userData.satIdx];
        p.position.lerpVectors(new THREE.Vector3(0, 0, 0), target, p.userData.progress);
      });

      // particles slow rotation
      particles.rotation.y = t * 0.02;
      particles.rotation.x = t * 0.01;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', onResize);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
      scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    };
  }, []);

  return <div ref={mountRef} style={{ position: 'absolute', inset: 0, zIndex: 1 }} />;
}

// --------------------------------------------------------------------
// Coordinate HUD (top fixed bar)
// --------------------------------------------------------------------
function CoordinateHUD() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const stamp = time.toISOString().replace('T', ' ').slice(0, 19);
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      padding: '10px 20px', fontSize: 11, letterSpacing: '0.08em',
      background: `linear-gradient(180deg, ${C.bg} 0%, transparent 100%)`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      color: C.dim, pointerEvents: 'none',
    }}>
      <div style={{ display: 'flex', gap: 20 }}>
        <span style={{ color: C.green }}>● ekkoee.sys</span>
        <span>v4.7.2</span>
        <span>node: edge.camptec-01</span>
      </div>
      <div style={{ display: 'flex', gap: 20 }}>
        <span>{stamp} UTC</span>
        <span style={{ color: C.amber }}>UPTIME 99.97%</span>
        <span style={{ color: C.green }}>● LIVE</span>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------
// Progress rail (right side)
// --------------------------------------------------------------------
function ProgressRail({ sections, active }) {
  return (
    <div style={{
      position: 'fixed', right: 20, top: '50%', transform: 'translateY(-50%)',
      zIndex: 50, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end',
    }}>
      {sections.map((s, i) => (
        <a key={s.id} href={`#${s.id}`} style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 10, color: active === i ? C.green : C.dim,
              fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em',
              opacity: active === i ? 1 : 0.5,
              transition: 'all 0.3s',
            }}>
              {String(i).padStart(2, '0')} {s.label}
            </span>
            <span style={{
              width: active === i ? 32 : 16, height: 1,
              background: active === i ? C.green : C.dim,
              transition: 'all 0.3s',
            }} />
          </div>
        </a>
      ))}
    </div>
  );
}

// --------------------------------------------------------------------
// Hero section
// --------------------------------------------------------------------
function Hero() {
  return (
    <section id="hero" style={{
      position: 'relative', height: '100vh', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <ThreeHero />

      <div style={{
        position: 'relative', zIndex: 2, textAlign: 'center',
        padding: 20, mixBlendMode: 'normal',
      }}>
        <div style={{
          fontSize: 11, color: C.amber, letterSpacing: '0.4em',
          marginBottom: 24, opacity: 0.9,
        }}>
          [ MINI-AGI FOR MANUFACTURING ]
        </div>

        <h1 className="ekkoee-brand" style={{
          fontSize: 'clamp(64px, 14vw, 200px)', margin: 0, lineHeight: 0.9,
          color: C.cream, textShadow: '0 0 40px rgba(191,78,107,0.3)',
        }}>
          ekkoee
        </h1>

        <div style={{
          marginTop: 28, fontSize: 14, color: C.olive, letterSpacing: '0.08em',
          maxWidth: 640, marginLeft: 'auto', marginRight: 'auto',
        }}>
          we don't sell you software.
          <br/>
          <span style={{ color: C.green }}>we install intelligence into your factory.</span>
        </div>

        <div style={{ marginTop: 60, fontSize: 10, color: C.dim, letterSpacing: '0.3em' }}>
          ↓ SCROLL TO ENTER
        </div>
      </div>

      {/* corner brackets */}
      {[
        { top: 80, left: 30 }, { top: 80, right: 30 },
        { bottom: 30, left: 30 }, { bottom: 30, right: 30 },
      ].map((pos, i) => (
        <div key={i} style={{
          position: 'absolute', ...pos, width: 24, height: 24,
          borderColor: C.green, zIndex: 3,
          borderStyle: 'solid', borderWidth: 0,
          ...(pos.top ? { borderTopWidth: 1 } : { borderBottomWidth: 1 }),
          ...(pos.left ? { borderLeftWidth: 1 } : { borderRightWidth: 1 }),
        }} />
      ))}

      {/* status ticker */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 32,
        background: C.bgCard, borderTop: `1px solid ${C.line}`, overflow: 'hidden',
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{
          display: 'flex', gap: 50, whiteSpace: 'nowrap', fontSize: 11,
          animation: 'marquee 40s linear infinite', color: C.olive,
        }}>
          {Array(2).fill(null).map((_, copy) => (
            <div key={copy} style={{ display: 'flex', gap: 50 }}>
              <span>▸ <span style={{ color: C.green }}>CAMPTEC.01</span> vision_agent · pass_rate 98.7%</span>
              <span>▸ scheduling_agent · 142 jobs queued</span>
              <span>▸ <span style={{ color: C.amber }}>ALERT</span> Line A temp 78°C → nominal</span>
              <span>▸ knowledge graph updated · 14 new embeddings</span>
              <span>▸ edge.camptec-01 heartbeat <span style={{ color: C.green }}>OK</span></span>
              <span>▸ daily rollup complete · 8,432 detections</span>
              <span>▸ <span style={{ color: C.rose }}>agent.maintenance</span> scheduled 03:00</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --------------------------------------------------------------------
// Manifesto section
// --------------------------------------------------------------------
function Manifesto() {
  return (
    <section id="manifesto" style={{
      padding: '160px 40px', position: 'relative', borderTop: `1px solid ${C.line}`,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontSize: 11, color: C.green, letterSpacing: '0.3em', marginBottom: 40 }}>
          // 00_MANIFESTO
        </div>

        <div className="ekkoee-reveal" style={{
          fontSize: 'clamp(32px, 5vw, 64px)', lineHeight: 1.2, color: C.cream,
          fontWeight: 300, letterSpacing: '-0.02em', maxWidth: 1000,
        }}>
          every factory already has<br/>
          a <span style={{ color: C.dim, textDecoration: 'line-through' }}>mind</span> a nervous system.
          <br/>
          <span style={{ color: C.green }}>we build it a brain.</span>
        </div>

        <div style={{ marginTop: 80, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
          {[
            { n: '01', t: 'not an ERP', d: 'ERP systems report what happened. we predict what\'s about to, and act on it first.' },
            { n: '02', t: 'air-gapped by default', d: 'local GPU in your factory. your data never leaves the building unless you say so.' },
            { n: '03', t: 'RAG, not fine-tuning', d: 'your knowledge stays yours. the model reads it, it doesn\'t swallow it.' },
          ].map(b => (
            <div key={b.n} style={{
              border: `1px solid ${C.line}`, padding: 24,
              background: C.bgSoft, position: 'relative',
            }}>
              <div style={{ fontSize: 11, color: C.amber, letterSpacing: '0.2em', marginBottom: 12 }}>{b.n}</div>
              <div className="ekkoee-brand" style={{ fontSize: 22, color: C.cream, marginBottom: 12 }}>{b.t}</div>
              <div style={{ fontSize: 13, color: C.olive, lineHeight: 1.6 }}>{b.d}</div>
              <div style={{
                position: 'absolute', top: 0, right: 0, width: 8, height: 8,
                background: C.green, boxShadow: `0 0 8px ${C.green}`,
              }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --------------------------------------------------------------------
// Live system section (mock factory dashboard)
// --------------------------------------------------------------------
function LiveSystem() {
  const [kpis, setKpis] = useState({ pass: 98.7, throughput: 1420, alerts: 2, uptime: 99.97 });
  const [sparks, setSparks] = useState(Array(40).fill(0).map(() => 60 + Math.random() * 40));
  const [logs, setLogs] = useState([]);
  const logId = useRef(0);

  useEffect(() => {
    const t1 = setInterval(() => {
      setKpis(k => ({
        pass: Math.max(96, Math.min(99.9, k.pass + (Math.random() - 0.5) * 0.2)),
        throughput: Math.max(1200, Math.min(1600, k.throughput + Math.round((Math.random() - 0.5) * 40))),
        alerts: Math.max(0, k.alerts + (Math.random() > 0.92 ? 1 : Math.random() < 0.05 ? -1 : 0)),
        uptime: k.uptime,
      }));
      setSparks(s => [...s.slice(1), 60 + Math.random() * 40]);
    }, 800);

    const templates = [
      { c: C.green, t: 'vision_agent', m: 'batch completed · pass_rate 98.9%' },
      { c: C.green, t: 'vision_agent', m: 'detection batch B20260422-' },
      { c: C.amber, t: 'scheduling', m: 'rescheduling queue · 3 jobs shifted' },
      { c: C.green, t: 'alert_agent', m: 'Line B temperature normalized' },
      { c: C.rose, t: 'maintenance', m: 'predictive flag · motor.04 bearings' },
      { c: C.green, t: 'rag_engine', m: '14 new embeddings indexed' },
      { c: C.amber, t: 'alert_agent', m: 'Line A vibration above threshold' },
      { c: C.green, t: 'edge_server', m: 'heartbeat · gpu 67% · mem 12.4GB' },
    ];
    const t2 = setInterval(() => {
      const tmpl = templates[Math.floor(Math.random() * templates.length)];
      setLogs(L => {
        const next = [...L, {
          id: logId.current++,
          time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          ...tmpl,
          m: tmpl.m + (tmpl.m.endsWith('-') ? String(Math.floor(Math.random() * 999)).padStart(3, '0') : ''),
        }];
        return next.slice(-12);
      });
    }, 1400);

    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  const maxS = Math.max(...sparks);
  const minS = Math.min(...sparks);
  const sparkPath = sparks.map((v, i) => {
    const x = (i / (sparks.length - 1)) * 100;
    const y = 100 - ((v - minS) / (maxS - minS || 1)) * 100;
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');

  return (
    <section id="live" style={{
      padding: '120px 40px', position: 'relative', borderTop: `1px solid ${C.line}`,
      background: `linear-gradient(180deg, ${C.bg}, ${C.bgSoft})`,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontSize: 11, color: C.green, letterSpacing: '0.3em', marginBottom: 16 }}>
          // 01_LIVE_SYSTEM
        </div>
        <div className="ekkoee-brand" style={{ fontSize: 'clamp(32px, 4vw, 48px)', color: C.cream, marginBottom: 8 }}>
          this is real. <span style={{ color: C.green }}>right now.</span>
        </div>
        <div style={{ fontSize: 14, color: C.olive, marginBottom: 40, maxWidth: 600 }}>
          below is a live simulation of camptec's production floor running on ekkoee.
          data streams in every few seconds. no screenshots. no mockups.
        </div>

        {/* Terminal window */}
        <div style={{
          border: `1px solid ${C.line}`, background: C.bg,
          boxShadow: `0 0 60px rgba(0,255,136,0.05)`,
        }}>
          {/* window chrome */}
          <div style={{
            padding: '10px 16px', borderBottom: `1px solid ${C.line}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: 11, color: C.dim, background: C.bgSoft,
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
              <span style={{ marginLeft: 16 }}>portal.ekkoee.com/camptec/overview</span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ color: C.green }}>● LIVE</span>
              <span>camptec · 大昌帆布</span>
            </div>
          </div>

          {/* body */}
          <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
            {/* Left: KPIs + spark */}
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {[
                  { l: 'PASS RATE', v: kpis.pass.toFixed(2) + '%', c: C.green },
                  { l: 'THROUGHPUT / HR', v: kpis.throughput.toLocaleString(), c: C.amber },
                  { l: 'ACTIVE ALERTS', v: kpis.alerts, c: kpis.alerts > 3 ? C.rose : C.green },
                  { l: 'SYSTEM UPTIME', v: kpis.uptime.toFixed(2) + '%', c: C.green },
                ].map(k => (
                  <div key={k.l} style={{ border: `1px solid ${C.line}`, padding: 16, background: C.bgSoft }}>
                    <div style={{ fontSize: 10, color: C.dim, letterSpacing: '0.2em' }}>{k.l}</div>
                    <div className="ekkoee-brand" style={{ fontSize: 28, color: k.c, marginTop: 8, fontFamily: 'JetBrains Mono' }}>
                      {k.v}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16, border: `1px solid ${C.line}`, padding: 16, background: C.bgSoft }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 10, color: C.dim, letterSpacing: '0.2em' }}>THROUGHPUT · LAST 40s</span>
                  <span style={{ fontSize: 10, color: C.green }}>● streaming</span>
                </div>
                <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ width: '100%', height: 80 }}>
                  <path d={sparkPath} stroke={C.green} strokeWidth={0.5} fill="none"
                    transform="scale(1, 0.4)"
                  />
                  <path d={sparkPath + ' L100,40 L0,40 Z'} fill={C.green} opacity={0.15}
                    transform="scale(1, 0.4)"
                  />
                </svg>
              </div>
            </div>

            {/* Right: log feed */}
            <div style={{ border: `1px solid ${C.line}`, background: C.bgSoft, display: 'flex', flexDirection: 'column' }}>
              <div style={{
                padding: '10px 14px', borderBottom: `1px solid ${C.line}`,
                fontSize: 10, color: C.dim, letterSpacing: '0.2em',
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span>LIVE AGENT FEED</span>
                <span className="ekkoee-pulse" style={{ color: C.green }}>●</span>
              </div>
              <div style={{ padding: 10, fontSize: 11, lineHeight: 1.7, height: 320, overflow: 'hidden' }}>
                {logs.map(l => (
                  <div key={l.id} style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
                    <span style={{ color: C.dim, flexShrink: 0, width: 62 }}>{l.time}</span>
                    <span style={{ color: l.c, flexShrink: 0, width: 96 }}>{l.t}</span>
                    <span style={{ color: C.text }}>{l.m}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// --------------------------------------------------------------------
// Architecture section (interactive diagram)
// --------------------------------------------------------------------
function Architecture() {
  const [hovered, setHovered] = useState(null);

  const nodes = [
    { id: 'factory', label: 'YOUR FACTORY', sub: 'air-gapped · local GPU', x: 15, y: 70, color: C.rose, zone: 'red' },
    { id: 'edge', label: 'EDGE.AGENT', sub: 'vision · scheduling · alert', x: 40, y: 70, color: C.amber, zone: 'yellow' },
    { id: 'gateway', label: 'SECURE GATEWAY', sub: 'HTTPS · API key · masked', x: 60, y: 40, color: C.olive, zone: 'yellow' },
    { id: 'cloud', label: 'EKKOEE.CLOUD', sub: 'portal · realtime · admin', x: 85, y: 40, color: C.green, zone: 'green' },
  ];

  const edges = [
    { from: 'factory', to: 'edge' },
    { from: 'edge', to: 'gateway' },
    { from: 'gateway', to: 'cloud' },
  ];

  const getNode = id => nodes.find(n => n.id === id);

  return (
    <section id="architecture" style={{
      padding: '120px 40px', borderTop: `1px solid ${C.line}`,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontSize: 11, color: C.green, letterSpacing: '0.3em', marginBottom: 16 }}>
          // 02_ARCHITECTURE
        </div>
        <div className="ekkoee-brand" style={{ fontSize: 'clamp(32px, 4vw, 48px)', color: C.cream, marginBottom: 40 }}>
          hybrid. <span style={{ color: C.green }}>trust-first.</span>
        </div>

        <div style={{
          position: 'relative', height: 460, border: `1px solid ${C.line}`,
          background: `
            linear-gradient(90deg, ${C.line} 1px, transparent 1px) 0 0 / 40px 40px,
            linear-gradient(0deg, ${C.line} 1px, transparent 1px) 0 0 / 40px 40px,
            ${C.bgSoft}`,
        }}>
          {/* zone bands */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%', background: 'rgba(191,78,107,0.04)', borderRight: `1px dashed ${C.line}` }}>
            <div style={{ padding: 12, fontSize: 10, color: C.rose, letterSpacing: '0.2em' }}>🔴 RED ZONE</div>
          </div>
          <div style={{ position: 'absolute', left: '30%', top: 0, bottom: 0, width: '40%', background: 'rgba(255,185,56,0.04)', borderRight: `1px dashed ${C.line}` }}>
            <div style={{ padding: 12, fontSize: 10, color: C.amber, letterSpacing: '0.2em' }}>🟡 YELLOW ZONE</div>
          </div>
          <div style={{ position: 'absolute', left: '70%', top: 0, bottom: 0, width: '30%', background: 'rgba(0,255,136,0.04)' }}>
            <div style={{ padding: 12, fontSize: 10, color: C.green, letterSpacing: '0.2em' }}>🟢 GREEN ZONE</div>
          </div>

          {/* connections */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            {edges.map((e, i) => {
              const a = getNode(e.from), b = getNode(e.to);
              const isHot = hovered === e.from || hovered === e.to;
              return (
                <g key={i}>
                  <line
                    x1={`${a.x}%`} y1={`${a.y}%`}
                    x2={`${b.x}%`} y2={`${b.y}%`}
                    stroke={isHot ? C.green : C.dim}
                    strokeWidth={isHot ? 2 : 1}
                    strokeDasharray={isHot ? '0' : '4 4'}
                    style={{ transition: 'all 0.3s' }}
                  />
                  {/* moving packet */}
                  <circle r={4} fill={C.green}>
                    <animateMotion
                      dur={isHot ? '1s' : '3s'}
                      repeatCount="indefinite"
                      path={`M ${a.x * 12} ${a.y * 4.6} L ${b.x * 12} ${b.y * 4.6}`}
                    />
                  </circle>
                </g>
              );
            })}
          </svg>

          {/* nodes */}
          {nodes.map(n => (
            <div key={n.id}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: 'absolute',
                left: `${n.x}%`, top: `${n.y}%`, transform: 'translate(-50%, -50%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: hovered === n.id ? 64 : 54, height: hovered === n.id ? 64 : 54,
                border: `2px solid ${n.color}`,
                background: hovered === n.id ? n.color : `${C.bg}`,
                boxShadow: hovered === n.id ? `0 0 40px ${n.color}` : 'none',
                transition: 'all 0.3s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 20, height: 20, background: hovered === n.id ? C.bg : n.color,
                  transition: 'all 0.3s',
                }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: C.cream, letterSpacing: '0.1em' }}>{n.label}</div>
                <div style={{ fontSize: 9, color: C.dim, marginTop: 2 }}>{n.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 24, fontSize: 12, color: C.olive, textAlign: 'center',
        }}>
          hover any node to see the data flow accelerate →
        </div>
      </div>
    </section>
  );
}

// --------------------------------------------------------------------
// Process section
// --------------------------------------------------------------------
function Process() {
  const steps = [
    {
      n: '01', t: 'DIAGNOSE', zh: '企業健檢',
      d: 'we spend a week walking your floor. we interview your foreman. we map every data source, every friction point, every tribal knowledge island.',
    },
    {
      n: '02', t: 'DEPLOY', zh: '地端部署',
      d: 'local GPU server in your factory. custom agents trained on your data, never leaving your premises. dashboard at ekkoee.com/[your-company].',
    },
    {
      n: '03', t: 'EVOLVE', zh: '持續進化',
      d: 'every new batch makes it smarter. every alert makes it sharper. your factory\'s intelligence compounds, not depreciates.',
    },
  ];
  return (
    <section id="process" style={{
      padding: '120px 40px', borderTop: `1px solid ${C.line}`,
      background: `linear-gradient(180deg, ${C.bgSoft}, ${C.bg})`,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontSize: 11, color: C.green, letterSpacing: '0.3em', marginBottom: 16 }}>
          // 03_PROCESS
        </div>
        <div className="ekkoee-brand" style={{ fontSize: 'clamp(32px, 4vw, 48px)', color: C.cream, marginBottom: 60 }}>
          three steps. <span style={{ color: C.amber }}>no fluff.</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2, background: C.line }}>
          {steps.map((s, i) => (
            <div key={s.n} style={{
              background: C.bg, padding: 40, minHeight: 320,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              position: 'relative', overflow: 'hidden',
            }}>
              <div>
                <div style={{
                  fontSize: 80, color: C.lineHot, fontFamily: 'JetBrains Mono',
                  fontWeight: 700, lineHeight: 1, letterSpacing: '-0.05em',
                  position: 'absolute', top: 20, right: 20,
                }}>
                  {s.n}
                </div>
                <div style={{ fontSize: 10, color: C.green, letterSpacing: '0.3em', marginBottom: 8 }}>
                  STEP {s.n}
                </div>
                <div className="ekkoee-brand" style={{ fontSize: 32, color: C.cream, marginBottom: 4 }}>{s.t}</div>
                <div style={{ fontSize: 14, color: C.rose, marginBottom: 20 }}>{s.zh}</div>
                <div style={{ fontSize: 13, color: C.olive, lineHeight: 1.7 }}>{s.d}</div>
              </div>
              <div style={{
                marginTop: 24, fontSize: 11, color: C.dim, letterSpacing: '0.2em',
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span>~ {['1 week', '4-6 weeks', 'ongoing'][i]}</span>
                <span style={{ color: C.green }}>→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --------------------------------------------------------------------
// CTA section
// --------------------------------------------------------------------
function CTA() {
  const [typed, setTyped] = useState('');
  const full = 'initiate consultation_';
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      if (i <= full.length) {
        setTyped(full.slice(0, i));
        i++;
      } else {
        i = 0;
      }
    }, 200);
    return () => clearInterval(t);
  }, []);

  return (
    <section id="cta" style={{
      padding: '180px 40px', borderTop: `1px solid ${C.line}`, textAlign: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        background: `radial-gradient(circle at 50% 50%, ${C.green}, transparent 60%)`,
      }} />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ fontSize: 11, color: C.amber, letterSpacing: '0.3em', marginBottom: 24 }}>
          [ READY WHEN YOU ARE ]
        </div>
        <div className="ekkoee-brand" style={{
          fontSize: 'clamp(40px, 7vw, 80px)', color: C.cream, lineHeight: 1,
          marginBottom: 32, letterSpacing: '-0.02em',
        }}>
          stop reporting.<br/>
          <span style={{ color: C.green }}>start predicting.</span>
        </div>
        <div style={{ fontSize: 15, color: C.olive, marginBottom: 48, lineHeight: 1.7 }}>
          first consultation is free. we'll visit your factory, map your operations,
          <br/>and show you exactly what intelligence would look like in your context.
        </div>

        <a href="mailto:hello@ekkoee.com" style={{
          display: 'inline-block', textDecoration: 'none',
          border: `1px solid ${C.green}`, padding: '18px 40px',
          color: C.green, fontSize: 16, fontFamily: 'JetBrains Mono',
          letterSpacing: '0.1em', transition: 'all 0.2s',
          background: 'transparent',
        }}
          onMouseEnter={e => {
            e.currentTarget.style.background = C.green;
            e.currentTarget.style.color = C.bg;
            e.currentTarget.style.boxShadow = `0 0 40px ${C.green}`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = C.green;
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          $ {typed}<span className="ekkoee-caret">█</span>
        </a>

        <div style={{ marginTop: 32, fontSize: 11, color: C.dim }}>
          or email <span style={{ color: C.olive }}>hello@ekkoee.com</span> directly
        </div>
      </div>
    </section>
  );
}

// --------------------------------------------------------------------
// Footer
// --------------------------------------------------------------------
function Footer() {
  return (
    <footer style={{
      borderTop: `1px solid ${C.line}`, padding: '40px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      fontSize: 11, color: C.dim, flexWrap: 'wrap', gap: 20,
    }}>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        <span className="ekkoee-brand" style={{ color: C.rose, fontSize: 16 }}>ekkoee</span>
        <span>© 2026</span>
        <span>taipei · 台北</span>
      </div>
      <div style={{ display: 'flex', gap: 20 }}>
        <span style={{ color: C.green }}>● all systems nominal</span>
        <span>v4.7.2</span>
      </div>
    </footer>
  );
}

// --------------------------------------------------------------------
// Main
// --------------------------------------------------------------------
export default function EkkoeeHomepage() {
  const [booted, setBooted] = useState(false);
  const [active, setActive] = useState(0);

  const sections = [
    { id: 'hero', label: 'SYSTEM' },
    { id: 'manifesto', label: 'MANIFESTO' },
    { id: 'live', label: 'LIVE' },
    { id: 'architecture', label: 'ARCH' },
    { id: 'process', label: 'PROCESS' },
    { id: 'cta', label: 'CONNECT' },
  ];

  useEffect(() => {
    if (!booted) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const idx = sections.findIndex(s => s.id === e.target.id);
          if (idx !== -1) setActive(idx);
          e.target.classList.add('visible');
        }
      });
    }, { threshold: 0.3 });
    sections.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    document.querySelectorAll('.ekkoee-reveal').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [booted]);

  return (
    <div className="ekkoee-root" style={{ minHeight: '100vh' }}>
      <GlobalStyles />
      {!booted && <BootSequence onDone={() => setBooted(true)} />}
      <div className="ekkoee-scanlines" />
      <div className="ekkoee-grain" />
      <div className="ekkoee-vignette" />
      <div className="ekkoee-sweep" />
      <CoordinateHUD />
      <ProgressRail sections={sections} active={active} />

      <main>
        <Hero />
        <Manifesto />
        <LiveSystem />
        <Architecture />
        <Process />
        <CTA />
      </main>

      <Footer />
    </div>
  );
}
