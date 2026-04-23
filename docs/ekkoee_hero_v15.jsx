import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * ekkoee hero v15 — "SACRED ORRERY · DENSER DANCE"
 *
 * A celestial mechanism where every sacred-geometry artifact is a gear,
 * every orbit is a drive shaft, and the whole thing turns together on
 * Fibonacci-ratio rotation speeds. Interconnected, ever-rotating,
 * entropy-drifting, infinitely scrollable (1.2× → 40×).
 *
 * Architecture:
 *   sceneRoot
 *   ├── CentralAxis (vertical spine, ticks, inner beads)
 *   ├── MainRingSystem
 *   │    ├── Ring[0..4]  (5 concentric orbits, alternating spin direction)
 *   │    │    ├── RingGeometry (dashed/solid/beaded)
 *   │    │    ├── OrbitParticles (flow along ring — "time")
 *   │    │    └── Mount[i..]  (artifacts carried by the ring)
 *   │    │         ├── ArtifactGeometry (Sri Yantra, Flower, etc.)
 *   │    │         └── SubMounts (planets, markers)
 *   ├── AxialArtifacts (along spine: Fibonacci spiral, DNA, sunburst)
 *   ├── RadialConnectors (spokes from axis to rings)
 *   ├── InterRingBridges (curved bridges between orbits)
 *   ├── BackgroundCosmos (star sphere + distant arcs)
 *   └── EntropicDrift (slow-drifting particles)
 */

const PHI = 1.6180339887;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const TAU = Math.PI * 2;

// ═══════════════════════════════════════════════════════════════════════
// FIBONACCI ROTATION SPEEDS (each layer is φ× faster than next-outer)
// Scaled down 0.3× from v7 per user feedback — slow & meditative
// ═══════════════════════════════════════════════════════════════════════
const OMEGA = {
  SCENE:    0.0020,   // whole atlas
  RING_10:  0.0006,   // furthest (cosmic web boundary)
  RING_9:  -0.0009,   // 3D megastructures
  RING_8:   0.0015,
  RING_7:  -0.0024,
  RING_6:   0.0039,
  RING_5:  -0.0063,
  RING_4:   0.0102,
  RING_3:  -0.0165,
  RING_2:   0.0267,
  RING_1:  -0.0432,   // innermost (fastest)
  MOUNT:    0.0699,   // per-artifact self-spin (fast)
  SUB:      0.1131,   // sub-artifact spin
};

// ═══════════════════════════════════════════════════════════════════════
// PALETTE — bone white on deep void, sparse accents
// ═══════════════════════════════════════════════════════════════════════
const COL = {
  BG_DARK:     [0.016, 0.018, 0.026],
  BONE:        [0.92, 0.90, 0.84],
  BONE_DIM:    [0.62, 0.60, 0.55],
  BONE_DEEP:   [0.38, 0.37, 0.34],
  BONE_GHOST:  [0.22, 0.22, 0.20],
  ORANGE_DOT:  [1.00, 0.55, 0.28],
  ROSE:        [0.75, 0.31, 0.46],
  GOLD_HINT:   [0.78, 0.60, 0.28],
  COLD_WHITE:  [0.78, 0.84, 0.92],
};

const scaleC = (c, s) => [c[0] * s, c[1] * s, c[2] * s];
const lerpC = (a, b, t) => [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];

const mkRand = (seed) => {
  let s = seed * 9301 + 49297;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
};

// ── Generic helpers for building line geometry ─────────────────────
const emitSeg = (pos, col, p1, p2, c1, c2) => {
  pos.push(p1[0], p1[1], p1[2], p2[0], p2[1], p2[2]);
  col.push(c1[0], c1[1], c1[2], c2[0], c2[1], c2[2]);
};

const circleSegments = ({ cx = 0, cy = 0, cz = 0, r, segs = 64, dashed = false, color = COL.BONE, dashOn = 1, dashOff = 1, phase = 0 }) => {
  const pos = [], col = [];
  for (let i = 0; i < segs; i++) {
    if (dashed && ((i + phase) % (dashOn + dashOff)) >= dashOn) continue;
    const a1 = (i / segs) * TAU;
    const a2 = ((i + 1) / segs) * TAU;
    emitSeg(pos, col,
      [cx + r * Math.cos(a1), cy + r * Math.sin(a1), cz],
      [cx + r * Math.cos(a2), cy + r * Math.sin(a2), cz],
      color, color);
  }
  return { pos, col };
};

const arcSegments = ({ cx = 0, cy = 0, cz = 0, r, a1 = 0, a2 = TAU, segs = 32, color = COL.BONE, dashed = false, dashOn = 1, dashOff = 1 }) => {
  const pos = [], col = [];
  const step = (a2 - a1) / segs;
  for (let i = 0; i < segs; i++) {
    if (dashed && i % (dashOn + dashOff) >= dashOn) continue;
    const ang1 = a1 + i * step;
    const ang2 = a1 + (i + 1) * step;
    emitSeg(pos, col,
      [cx + r * Math.cos(ang1), cy + r * Math.sin(ang1), cz],
      [cx + r * Math.cos(ang2), cy + r * Math.sin(ang2), cz],
      color, color);
  }
  return { pos, col };
};

const mergeInto = (t, ...sources) => { for (const s of sources) { t.pos.push(...s.pos); t.col.push(...s.col); } };
const finalize = (b) => ({ positions: new Float32Array(b.pos), colors: new Float32Array(b.col) });

// ═══════════════════════════════════════════════════════════════════════
// SHADERS
// ═══════════════════════════════════════════════════════════════════════
const LineJitterShader = {
  vertex: /* glsl */ `
    attribute vec3 color;
    uniform float uTime, uJitter;
    varying vec3 vColor;
    varying float vDepth;
    void main() {
      float seed = dot(position, vec3(17.3, 13.1, 7.7));
      vec3 jitter = vec3(
        sin(uTime * 1.2 + seed * 1.7),
        cos(uTime * 1.0 + seed * 2.1),
        sin(uTime * 0.9 + seed * 1.3)
      ) * uJitter;
      vColor = color;
      vec4 mv = modelViewMatrix * vec4(position + jitter, 1.0);
      vDepth = -mv.z;
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragment: /* glsl */ `
    precision mediump float;
    varying vec3 vColor;
    varying float vDepth;
    uniform float uOpacity, uFogNear, uFogFar;
    void main() {
      float fog = 1.0 - smoothstep(uFogNear, uFogFar, vDepth);
      gl_FragColor = vec4(vColor * (0.6 + fog * 0.6), uOpacity * (0.3 + fog * 0.7));
    }
  `,
};

const ChromaticAberrationShader = {
  uniforms: { tDiffuse: { value: null }, uAmount: { value: 0.0022 }, uDistortion: { value: 1.6 } },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uAmount, uDistortion;
    varying vec2 vUv;
    void main() {
      vec2 center = vec2(0.5);
      vec2 dir = vUv - center;
      float dist = length(dir);
      float falloff = pow(dist, uDistortion);
      vec2 offset = normalize(dir + 1e-6) * uAmount * falloff;
      float r = texture2D(tDiffuse, vUv - offset * 1.4).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv + offset * 1.4).b;
      gl_FragColor = vec4(r, g, b, texture2D(tDiffuse, vUv).a);
    }
  `,
};

const GlitchDisplaceShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uIntensity: { value: 0 }, uLineOffset: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime, uIntensity, uLineOffset;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main() {
      vec2 uv = vUv;
      float bandY = floor(uv.y * 42.0);
      float seed = hash(vec2(bandY, floor(uTime * 10.0) + uLineOffset * 97.0));
      float active = step(0.93, seed);
      float dir = seed > 0.97 ? 1.0 : -1.0;
      float amount = (hash(vec2(bandY + 13.0, uLineOffset)) - 0.5) * 0.06 * uIntensity;
      uv.x += active * dir * amount;
      gl_FragColor = texture2D(tDiffuse, uv);
    }
  `,
};

// ═══════════════════════════════════════════════════════════════════════
// SACRED GEOMETRY BUILDERS (compact, share utilities)
// ═══════════════════════════════════════════════════════════════════════

// ─── Fibonacci logarithmic spiral (3D-lifted) ──────────────────────
function buildFibonacciSpiral({ scale = 1, turns = 4.2, pointsPerTurn = 80, zLift = 0, withRects = true } = {}) {
  const b = { pos: [], col: [] };
  const growthB = Math.log(PHI) / (Math.PI / 2);
  const maxR = scale;
  const total = Math.floor(turns * pointsPerTurn);
  for (let i = 0; i < total; i++) {
    const t1 = i / pointsPerTurn, t2 = (i + 1) / pointsPerTurn;
    const th1 = (turns - t1) * TAU, th2 = (turns - t2) * TAU;
    const r1 = maxR * Math.pow(PHI, -t1), r2 = maxR * Math.pow(PHI, -t2);
    const z1 = t1 / turns * zLift - zLift * 0.5;
    const z2 = t2 / turns * zLift - zLift * 0.5;
    const bright = 0.55 + (i / total) * 0.4;
    const c = scaleC(COL.BONE, bright);
    emitSeg(b.pos, b.col,
      [r1 * Math.cos(th1), r1 * Math.sin(th1), z1],
      [r2 * Math.cos(th2), r2 * Math.sin(th2), z2], c, c);
  }
  if (withRects) {
    let rx = -maxR * 0.5, ry = -maxR * 0.5, rw = maxR, rh = maxR;
    const faint = scaleC(COL.BONE_DEEP, 0.8);
    for (let k = 0; k < 5; k++) {
      const corners = [[rx, ry], [rx + rw, ry], [rx + rw, ry + rh], [rx, ry + rh]];
      for (let j = 0; j < 4; j++) {
        emitSeg(b.pos, b.col, [corners[j][0], corners[j][1], 0], [corners[(j+1)%4][0], corners[(j+1)%4][1], 0], faint, faint);
      }
      if (rw > rh) { rx += rh; rw -= rh; } else { ry += rw; rh -= rw; }
    }
  }
  const dots = [];
  for (let i = 0; i < 12; i++) {
    const t = i / 12;
    const th = (turns - t) * TAU;
    const r = maxR * Math.pow(PHI, -t);
    dots.push([r * Math.cos(th), r * Math.sin(th), 0]);
  }
  return { ...finalize(b), dots };
}

// ─── Metatron's Cube (13 circles + connections) ────────────────────
function buildMetatronsCube({ scale = 1.0, circleR = 0.15 } = {}) {
  const b = { pos: [], col: [] };
  const centers = [[0, 0]];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    centers.push([Math.cos(a) * 2 * circleR, Math.sin(a) * 2 * circleR]);
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    centers.push([Math.cos(a) * 4 * circleR, Math.sin(a) * 4 * circleR]);
  }
  for (const [cx, cy] of centers) {
    mergeInto(b, circleSegments({ cx: cx * scale, cy: cy * scale, r: circleR * scale, segs: 24, color: scaleC(COL.BONE, 0.78) }));
  }
  const faintLine = scaleC(COL.BONE_DEEP, 0.9);
  for (let i = 0; i < centers.length; i++) {
    for (let j = i + 1; j < centers.length; j++) {
      const d = Math.hypot(centers[i][0] - centers[j][0], centers[i][1] - centers[j][1]);
      if (d > 4.5 * circleR) continue;
      emitSeg(b.pos, b.col,
        [centers[i][0] * scale, centers[i][1] * scale, 0],
        [centers[j][0] * scale, centers[j][1] * scale, 0], faintLine, faintLine);
    }
  }
  const ht = 4 * circleR * scale;
  const starPts = [
    [[0, ht], [-ht * 0.866, -ht * 0.5], [ht * 0.866, -ht * 0.5]],
    [[0, -ht], [-ht * 0.866, ht * 0.5], [ht * 0.866, ht * 0.5]],
  ];
  const starC = scaleC(COL.BONE, 0.75);
  for (const tri of starPts) {
    for (let k = 0; k < 3; k++) {
      emitSeg(b.pos, b.col,
        [tri[k][0], tri[k][1], 0.01], [tri[(k+1)%3][0], tri[(k+1)%3][1], 0.01], starC, starC);
    }
  }
  return { ...finalize(b), centers: centers.map(c => [c[0] * scale, c[1] * scale, 0]) };
}

// ─── Flower of Life (19 circles, hex tessellation) ─────────────────
function buildFlowerOfLife({ radius = 0.22, rings = 2 } = {}) {
  const b = { pos: [], col: [] };
  const centers = [];
  for (let q = -rings; q <= rings; q++) {
    const rMin = Math.max(-rings, -q - rings);
    const rMax = Math.min(rings, -q + rings);
    for (let rr = rMin; rr <= rMax; rr++) {
      centers.push([radius * (q + rr / 2) * Math.sqrt(3) / Math.sqrt(3), radius * rr * 1.5 / Math.sqrt(3)]);
    }
  }
  for (const [cx, cy] of centers) {
    mergeInto(b, circleSegments({ cx, cy, r: radius, segs: 36, color: scaleC(COL.BONE, 0.75) }));
  }
  const maxDist = Math.max(...centers.map(([x, y]) => Math.hypot(x, y))) + radius;
  mergeInto(b, circleSegments({ r: maxDist, segs: 60, color: scaleC(COL.BONE_DIM, 0.6) }));
  mergeInto(b, circleSegments({ r: maxDist * 1.08, segs: 60, color: scaleC(COL.BONE_DEEP, 1.0) }));
  return finalize(b);
}

// ─── Sri Yantra (9 triangles + lotus + bhupura) ────────────────────
function buildSriYantra({ scale = 1.0 } = {}) {
  const b = { pos: [], col: [] };
  const mainC = scaleC(COL.BONE, 0.88);
  const subC  = scaleC(COL.BONE_DIM, 0.9);
  const deepC = scaleC(COL.BONE_DEEP, 1.0);
  const addTri = (size, oy, up, c) => {
    const h = size * scale * Math.sqrt(3), w = size * scale * 2;
    const pts = up
      ? [[0, oy + h * 0.5], [-w * 0.5, oy - h * 0.5], [w * 0.5, oy - h * 0.5]]
      : [[0, oy - h * 0.5], [-w * 0.5, oy + h * 0.5], [w * 0.5, oy + h * 0.5]];
    for (let k = 0; k < 3; k++) emitSeg(b.pos, b.col, [...pts[k], 0], [...pts[(k+1)%3], 0], c, c);
  };
  // 9 interlocking triangles (4 up, 5 down)
  addTri(0.85, 0.05, true, mainC); addTri(0.68, 0.12, true, subC);
  addTri(0.50, 0.20, true, subC); addTri(0.30, 0.28, true, mainC);
  addTri(0.95, -0.05, false, mainC); addTri(0.78, 0.02, false, subC);
  addTri(0.60, 0.08, false, subC); addTri(0.42, 0.14, false, subC);
  addTri(0.25, 0.20, false, mainC);
  // Rose bindu diamond
  const bs = 0.018 * scale;
  emitSeg(b.pos, b.col, [0, bs, 0.002], [bs, 0, 0.002], COL.ROSE, COL.ROSE);
  emitSeg(b.pos, b.col, [bs, 0, 0.002], [0, -bs, 0.002], COL.ROSE, COL.ROSE);
  emitSeg(b.pos, b.col, [0, -bs, 0.002], [-bs, 0, 0.002], COL.ROSE, COL.ROSE);
  emitSeg(b.pos, b.col, [-bs, 0, 0.002], [0, bs, 0.002], COL.ROSE, COL.ROSE);
  // THREE LOTUS RINGS (8, 16, 24 petals)
  const lotusR1 = 1.08 * scale;
  mergeInto(b, circleSegments({ r: lotusR1, segs: 60, color: deepC }));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    const petalR = 0.11 * scale;
    mergeInto(b, arcSegments({
      cx: Math.cos(a) * (lotusR1 + petalR * 0.85), cy: Math.sin(a) * (lotusR1 + petalR * 0.85),
      r: petalR, a1: a + Math.PI * 0.65, a2: a + Math.PI * 1.35, segs: 14, color: scaleC(COL.BONE_DIM, 0.75),
    }));
  }
  const lotusR2 = 1.28 * scale;
  mergeInto(b, circleSegments({ r: lotusR2, segs: 72, color: scaleC(COL.BONE_DEEP, 0.9) }));
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU + 0.05;
    const petalR = 0.075 * scale;
    mergeInto(b, arcSegments({
      cx: Math.cos(a) * (lotusR2 + petalR * 0.8), cy: Math.sin(a) * (lotusR2 + petalR * 0.8),
      r: petalR, a1: a + Math.PI * 0.7, a2: a + Math.PI * 1.3, segs: 10, color: scaleC(COL.BONE_DIM, 0.6),
    }));
  }
  const lotusR3 = 1.44 * scale;
  mergeInto(b, circleSegments({ r: lotusR3, segs: 96, dashed: true, dashOn: 3, dashOff: 2, color: deepC }));
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TAU;
    const petalR = 0.05 * scale;
    mergeInto(b, arcSegments({
      cx: Math.cos(a) * (lotusR3 + petalR * 0.7), cy: Math.sin(a) * (lotusR3 + petalR * 0.7),
      r: petalR, a1: a + Math.PI * 0.75, a2: a + Math.PI * 1.25, segs: 8, color: scaleC(COL.BONE_DIM, 0.5),
    }));
  }
  // NESTED BHUPURA (3 concentric squares + 4 T-gates)
  for (let k = 0; k < 3; k++) {
    const sq = (1.58 + k * 0.09) * scale;
    const sc2 = [[-sq, -sq], [sq, -sq], [sq, sq], [-sq, sq]];
    const cc = scaleC(COL.BONE_DIM, 0.85 - k * 0.15);
    for (let j = 0; j < 4; j++) emitSeg(b.pos, b.col, [...sc2[j], 0], [...sc2[(j+1)%4], 0], cc, cc);
  }
  // T-gates on 4 cardinal sides
  const tg = 0.12 * scale, sqOut = 1.76 * scale;
  const gates = [
    [[0, sqOut], [0, sqOut + tg], [-tg * 0.5, sqOut + tg], [tg * 0.5, sqOut + tg]],
    [[0, -sqOut], [0, -sqOut - tg], [-tg * 0.5, -sqOut - tg], [tg * 0.5, -sqOut - tg]],
    [[sqOut, 0], [sqOut + tg, 0], [sqOut + tg, -tg * 0.5], [sqOut + tg, tg * 0.5]],
    [[-sqOut, 0], [-sqOut - tg, 0], [-sqOut - tg, -tg * 0.5], [-sqOut - tg, tg * 0.5]],
  ];
  for (const g of gates) {
    emitSeg(b.pos, b.col, [...g[0], 0], [...g[1], 0], subC, subC);
    emitSeg(b.pos, b.col, [...g[2], 0], [...g[3], 0], subC, subC);
  }
  // 60 radiating ticks outside lotus
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * TAU;
    const major = (i % 5 === 0);
    const r1 = lotusR3 + 0.08 * scale, r2 = r1 + (major ? 0.09 : 0.03) * scale;
    emitSeg(b.pos, b.col,
      [Math.cos(a) * r1, Math.sin(a) * r1, 0],
      [Math.cos(a) * r2, Math.sin(a) * r2, 0],
      scaleC(COL.BONE_DEEP, major ? 1.0 : 0.6),
      scaleC(COL.BONE_DEEP, major ? 1.0 : 0.6));
  }
  return finalize(b);
}

// ─── Vesica Piscis ─────────────────────────────────────────────────
function buildVesicaPiscis({ radius = 0.35 } = {}) {
  const b = { pos: [], col: [] };
  const c = scaleC(COL.BONE, 0.82);
  mergeInto(b, circleSegments({ cx: -radius / 2, r: radius, segs: 44, color: c }));
  mergeInto(b, circleSegments({ cx: radius / 2, r: radius, segs: 44, color: c }));
  const ay = radius * Math.sqrt(3) / 2;
  emitSeg(b.pos, b.col, [0, -ay - radius * 0.1, 0], [0, ay + radius * 0.1, 0],
    scaleC(COL.BONE_DIM, 0.6), scaleC(COL.BONE_DIM, 0.6));
  return finalize(b);
}

// ─── Saturn with rings (for an orbiting planet-like piece) ─────────
function buildSaturnRings({ planetR = 0.2, ringInner = 0.3, ringOuter = 0.6, ringCount = 3 } = {}) {
  const b = { pos: [], col: [] };
  mergeInto(b, circleSegments({ r: planetR, segs: 48, color: scaleC(COL.BONE, 0.88) }));
  const rand = mkRand(90);
  for (let i = 0; i < 20; i++) {
    const a = rand() * TAU;
    const r = rand() * planetR * 0.9;
    const px = r * Math.cos(a), py = r * Math.sin(a);
    emitSeg(b.pos, b.col, [px, py, 0.002], [px + 0.003, py, 0.002],
      scaleC(COL.BONE_DIM, 0.6), scaleC(COL.BONE_DIM, 0.6));
  }
  for (let k = 0; k < ringCount; k++) {
    const t = ringCount > 1 ? k / (ringCount - 1) : 0;
    const r = ringInner + (ringOuter - ringInner) * t;
    const dashed = k % 2 === 0;
    mergeInto(b, circleSegments({ r, segs: 72, dashed, color: scaleC(COL.BONE_DIM, 0.75 - t * 0.3) }));
  }
  return finalize(b);
}

// ─── Sunburst ──────────────────────────────────────────────────────
function buildSunburst({ innerR = 0.08, outerR = 0.45, rayCount = 64, seed = 42 } = {}) {
  const rand = mkRand(seed);
  const b = { pos: [], col: [] };
  for (let i = 0; i < rayCount; i++) {
    const a = (i / rayCount) * TAU;
    const len = outerR * (0.65 + rand() * 0.45);
    const r0 = innerR * (1 + rand() * 0.12);
    emitSeg(b.pos, b.col,
      [r0 * Math.cos(a), r0 * Math.sin(a), 0], [len * Math.cos(a), len * Math.sin(a), 0],
      scaleC(COL.BONE, 0.85), scaleC(COL.BONE, 0.12));
  }
  mergeInto(b, circleSegments({ r: innerR, segs: 28, color: scaleC(COL.BONE, 0.9) }));
  return finalize(b);
}

// ─── DNA double helix (3D, oriented vertically on Y) ───────────────
function buildDNA({ height = 2.0, radius = 0.15, turns = 4, segs = 90 } = {}) {
  const b = { pos: [], col: [] };
  const c1 = scaleC(COL.BONE, 0.82);
  const c2 = scaleC(COL.BONE_DIM, 0.85);
  const rungC = scaleC(COL.BONE_DEEP, 1.0);
  for (let i = 0; i < segs; i++) {
    const t1 = i / segs, t2 = (i + 1) / segs;
    const th1 = t1 * turns * TAU, th2 = t2 * turns * TAU;
    const y1 = -height / 2 + t1 * height, y2 = -height / 2 + t2 * height;
    const s1A = [Math.cos(th1) * radius, y1, Math.sin(th1) * radius];
    const s1B = [Math.cos(th2) * radius, y2, Math.sin(th2) * radius];
    emitSeg(b.pos, b.col, s1A, s1B, c1, c1);
    const s2A = [Math.cos(th1 + Math.PI) * radius, y1, Math.sin(th1 + Math.PI) * radius];
    const s2B = [Math.cos(th2 + Math.PI) * radius, y2, Math.sin(th2 + Math.PI) * radius];
    emitSeg(b.pos, b.col, s2A, s2B, c2, c2);
    if (i % 4 === 0) emitSeg(b.pos, b.col, s1A, s2A, rungC, rungC);
  }
  return finalize(b);
}

// ─── Hexagram (Seal of Solomon) ────────────────────────────────────
// [buildHexagram removed — was boring per user feedback]

// ─── Moon (single phase, as a mounted piece) ───────────────────────
function buildMoonPhase({ radius = 0.12, phase = 0.5 } = {}) {
  const b = { pos: [], col: [] };
  mergeInto(b, circleSegments({ r: radius, segs: 36, color: scaleC(COL.BONE, 0.88) }));
  if (phase > 0.02 && phase < 0.98) {
    const shadedC = scaleC(COL.BONE_DIM, 0.6);
    const fillCount = 7;
    const fillW = radius * 2 * phase;
    const startX = -radius + (1 - phase) * radius * 2;
    for (let k = 0; k < fillCount; k++) {
      const x = startX + (k / (fillCount - 1)) * fillW;
      const dx = x;
      if (Math.abs(dx) >= radius) continue;
      const yMax = Math.sqrt(radius * radius - dx * dx) * 0.88;
      emitSeg(b.pos, b.col, [x, -yMax, 0.001], [x, yMax, 0.001], shadedC, shadedC);
    }
  }
  return finalize(b);
}

// ─── Planet ball (solid-looking dot-filled circle) ─────────────────
function buildPlanet({ radius = 0.18, dotCount = 32, seed = 55 } = {}) {
  const b = { pos: [], col: [] };
  const rand = mkRand(seed);
  mergeInto(b, circleSegments({ r: radius, segs: 40, color: scaleC(COL.BONE, 0.9) }));
  // Dot-work interior
  for (let i = 0; i < dotCount; i++) {
    const a = rand() * TAU;
    const r = Math.sqrt(rand()) * radius * 0.85;
    const px = r * Math.cos(a), py = r * Math.sin(a);
    const bright = 0.4 + rand() * 0.4;
    emitSeg(b.pos, b.col,
      [px - 0.003, py, 0.002], [px + 0.003, py, 0.002],
      scaleC(COL.BONE_DIM, bright), scaleC(COL.BONE_DIM, bright));
  }
  // Ring around it
  mergeInto(b, circleSegments({ r: radius * 1.4, segs: 60, dashed: true, color: scaleC(COL.BONE_DEEP, 0.8) }));
  return finalize(b);
}

// ─── Small measurement/tick marker (dangles off a ring) ───────────
function buildTickMarker({ length = 0.12 } = {}) {
  const b = { pos: [], col: [] };
  const c = scaleC(COL.BONE_DIM, 0.8);
  emitSeg(b.pos, b.col, [0, 0, 0], [length, 0, 0], c, c);
  emitSeg(b.pos, b.col, [length, -length * 0.2, 0], [length, length * 0.2, 0], c, c);
  emitSeg(b.pos, b.col, [length * 0.5, -length * 0.08, 0], [length * 0.5, length * 0.08, 0], c, c);
  return finalize(b);
}

// ─── Tiny arrow ────────────────────────────────────────────────────
function buildArrow({ length = 0.1 } = {}) {
  const b = { pos: [], col: [] };
  const c = scaleC(COL.BONE, 0.7);
  const h = length * 0.3;
  emitSeg(b.pos, b.col, [0, 0, 0], [length, 0, 0], c, c);
  emitSeg(b.pos, b.col, [length, 0, 0], [length - h, h * 0.6, 0], c, c);
  emitSeg(b.pos, b.col, [length, 0, 0], [length - h, -h * 0.6, 0], c, c);
  return finalize(b);
}

// ─── Constellation ─────────────────────────────────────────────────
function buildConstellation({ seed = 91, pointCount = 12, extent = 0.8, connectCount = 8 } = {}) {
  const rand = mkRand(seed);
  const points = [];
  for (let i = 0; i < pointCount; i++) {
    points.push([(rand() - 0.5) * extent, (rand() - 0.5) * extent, (rand() - 0.5) * extent * 0.3]);
  }
  const b = { pos: [], col: [] };
  const cLine = scaleC(COL.BONE_DEEP, 0.9);
  for (let i = 0; i < connectCount; i++) {
    const a = points[i];
    let nearest = -1, nearestD = Infinity;
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      const d = Math.hypot(a[0] - points[j][0], a[1] - points[j][1]);
      if (d < nearestD) { nearestD = d; nearest = j; }
    }
    if (nearest >= 0) emitSeg(b.pos, b.col, a, points[nearest], cLine, cLine);
  }
  const pa = new Float32Array(points.length * 3);
  points.forEach((p, i) => { pa[i * 3] = p[0]; pa[i * 3 + 1] = p[1]; pa[i * 3 + 2] = p[2]; });
  return { ...finalize(b), points: pa };
}

// ═══════════════════════════════════════════════════════════════════════
// EXPANDED SACRED GEOMETRY (from v12 atlas)
// ═══════════════════════════════════════════════════════════════════════

// ─── Enneagram (9-pointed star, two patterns) ──────────────────────
function buildEnneagram({ scale = 1.0 } = {}) {
  const b = { pos: [], col: [] };
  const pts = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU - Math.PI / 2;
    pts.push([Math.cos(a) * scale, Math.sin(a) * scale, 0]);
  }
  const c1 = scaleC(COL.BONE, 0.85);
  const c2 = scaleC(COL.BONE_DIM, 0.9);
  // Pattern A: 0→1→2... (outer polygon)
  for (let i = 0; i < 9; i++) emitSeg(b.pos, b.col, pts[i], pts[(i+1)%9], c1, c1);
  // Pattern B: Gurdjieff sequence 1-4-2-8-5-7-1 + triangle 3-6-9
  const seq = [1, 4, 2, 8, 5, 7];
  for (let i = 0; i < seq.length; i++) emitSeg(b.pos, b.col, pts[seq[i]], pts[seq[(i+1)%seq.length]], c2, c2);
  emitSeg(b.pos, b.col, pts[3], pts[6], c2, c2);
  emitSeg(b.pos, b.col, pts[6], pts[0], c2, c2);
  emitSeg(b.pos, b.col, pts[0], pts[3], c2, c2);
  // 3 concentric rings
  mergeInto(b, circleSegments({ r: scale * 0.45, segs: 40, color: scaleC(COL.BONE_DEEP, 0.9) }));
  mergeInto(b, circleSegments({ r: scale * 1.02, segs: 56, color: scaleC(COL.BONE_DIM, 0.8) }));
  mergeInto(b, circleSegments({ r: scale * 1.18, segs: 60, dashed: true, color: scaleC(COL.BONE_DEEP, 0.9) }));
  // 9 outer petals
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU - Math.PI / 2;
    const pr = scale * 0.07;
    mergeInto(b, arcSegments({
      cx: Math.cos(a) * (scale * 1.22 + pr * 0.7), cy: Math.sin(a) * (scale * 1.22 + pr * 0.7),
      r: pr, a1: a + Math.PI * 0.7, a2: a + Math.PI * 1.3, segs: 10, color: scaleC(COL.BONE_DIM, 0.7),
    }));
  }
  // Radial ticks
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * TAU;
    const r1 = scale * 1.32, r2 = scale * (1.36 + (i % 3 === 0 ? 0.04 : 0));
    emitSeg(b.pos, b.col,
      [Math.cos(a) * r1, Math.sin(a) * r1, 0],
      [Math.cos(a) * r2, Math.sin(a) * r2, 0],
      scaleC(COL.BONE_DEEP, 0.9), scaleC(COL.BONE_DEEP, 0.9));
  }
  return finalize(b);
}

// ─── Mandala (n-fold symmetry, multi-layer) ────────────────────────
function buildMandala({ scale = 1.0, symmetry = 12, layers = 5 } = {}) {
  const b = { pos: [], col: [] };
  const rand = mkRand(symmetry * 13);
  // Outer + inner rings
  mergeInto(b, circleSegments({ r: scale * 0.12, segs: 32, color: scaleC(COL.BONE, 0.85) }));
  mergeInto(b, circleSegments({ r: scale, segs: symmetry * 8, color: scaleC(COL.BONE, 0.75) }));
  mergeInto(b, circleSegments({ r: scale * 1.08, segs: symmetry * 8, dashed: true, color: scaleC(COL.BONE_DIM, 0.7) }));
  // Layered petals
  for (let L = 0; L < layers; L++) {
    const lt = L / (layers - 1);
    const rInner = scale * (0.18 + lt * 0.6);
    const petalR = scale * (0.08 + rand() * 0.06);
    const c = scaleC(COL.BONE, 0.55 + lt * 0.3);
    for (let i = 0; i < symmetry; i++) {
      const a = (i / symmetry) * TAU + L * 0.12;
      const cx = Math.cos(a) * rInner, cy = Math.sin(a) * rInner;
      if (L % 2 === 0) {
        // bezier petal (two arcs)
        mergeInto(b, arcSegments({ cx, cy, r: petalR, a1: a + Math.PI * 0.6, a2: a + Math.PI * 1.4, segs: 14, color: c }));
      } else {
        // diamond shape
        const pR = petalR * 1.1;
        const d1 = [cx + Math.cos(a) * pR, cy + Math.sin(a) * pR];
        const d2 = [cx - Math.cos(a) * pR, cy - Math.sin(a) * pR];
        const d3 = [cx + Math.cos(a + Math.PI/2) * pR * 0.6, cy + Math.sin(a + Math.PI/2) * pR * 0.6];
        const d4 = [cx - Math.cos(a + Math.PI/2) * pR * 0.6, cy - Math.sin(a + Math.PI/2) * pR * 0.6];
        emitSeg(b.pos, b.col, [...d1, 0], [...d3, 0], c, c);
        emitSeg(b.pos, b.col, [...d3, 0], [...d2, 0], c, c);
        emitSeg(b.pos, b.col, [...d2, 0], [...d4, 0], c, c);
        emitSeg(b.pos, b.col, [...d4, 0], [...d1, 0], c, c);
      }
    }
    // connector ring at this layer
    if (L > 0) mergeInto(b, circleSegments({ r: rInner, segs: symmetry * 4,
      color: scaleC(COL.BONE_DEEP, 0.8) }));
  }
  // Radial connectors from center
  for (let i = 0; i < symmetry; i++) {
    const a = (i / symmetry) * TAU;
    emitSeg(b.pos, b.col,
      [Math.cos(a) * scale * 0.12, Math.sin(a) * scale * 0.12, 0],
      [Math.cos(a) * scale * 0.98, Math.sin(a) * scale * 0.98, 0],
      scaleC(COL.BONE_DEEP, 0.7), scaleC(COL.BONE_DEEP, 0.7));
  }
  // Outer tick ornaments
  const tCount = symmetry * 4;
  for (let i = 0; i < tCount; i++) {
    const a = (i / tCount) * TAU;
    const r1 = scale * 1.1, r2 = scale * (i % 4 === 0 ? 1.18 : 1.14);
    emitSeg(b.pos, b.col,
      [Math.cos(a) * r1, Math.sin(a) * r1, 0],
      [Math.cos(a) * r2, Math.sin(a) * r2, 0],
      scaleC(COL.BONE_DIM, 0.7), scaleC(COL.BONE_DIM, 0.7));
  }
  return finalize(b);
}

// ─── Merkaba (star tetrahedron — two 3D tetrahedra interlocked) ───
function buildMerkaba({ scale = 1.0 } = {}) {
  const b = { pos: [], col: [] };
  const s = scale;
  // Tetrahedron A (pointing up)
  const tA = [
    [0, s, 0],
    [s * 0.9428, -s * 0.333, -s * 0.5443],
    [-s * 0.4714, -s * 0.333, -s * 0.9428],
    [-s * 0.4714, -s * 0.333, s * 0.9428],
  ];
  // Tetrahedron B (pointing down)
  const tB = [
    [0, -s, 0],
    [-s * 0.9428, s * 0.333, s * 0.5443],
    [s * 0.4714, s * 0.333, s * 0.9428],
    [s * 0.4714, s * 0.333, -s * 0.9428],
  ];
  const cA = scaleC(COL.BONE, 0.9);
  const cB = scaleC(COL.BONE_DIM, 0.85);
  // Draw edges (each tetra has 6 edges)
  const edges = [[0,1],[0,2],[0,3],[1,2],[2,3],[3,1]];
  for (const [i,j] of edges) {
    emitSeg(b.pos, b.col, tA[i], tA[j], cA, cA);
    emitSeg(b.pos, b.col, tB[i], tB[j], cB, cB);
  }
  // Enclosing octahedron (edge midpoints of the two)
  const oct = [
    [s, 0, 0], [-s, 0, 0], [0, s, 0], [0, -s, 0], [0, 0, s], [0, 0, -s],
  ];
  const octEdges = [[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,4],[1,5],[2,4],[2,5],[3,4],[3,5]];
  const cO = scaleC(COL.BONE_DEEP, 0.7);
  for (const [i,j] of octEdges) emitSeg(b.pos, b.col, oct[i], oct[j], cO, cO);
  // 3 great circles
  mergeInto(b, circleSegments({ r: s, segs: 56, color: scaleC(COL.BONE_DEEP, 0.6) }));                        // xy
  // xz circle (manual emit with y=0)
  for (let i = 0; i < 56; i++) {
    const a1 = (i / 56) * TAU, a2 = ((i + 1) / 56) * TAU;
    emitSeg(b.pos, b.col,
      [Math.cos(a1) * s, 0, Math.sin(a1) * s],
      [Math.cos(a2) * s, 0, Math.sin(a2) * s],
      scaleC(COL.BONE_DEEP, 0.6), scaleC(COL.BONE_DEEP, 0.6));
  }
  // yz circle
  for (let i = 0; i < 56; i++) {
    const a1 = (i / 56) * TAU, a2 = ((i + 1) / 56) * TAU;
    emitSeg(b.pos, b.col,
      [0, Math.cos(a1) * s, Math.sin(a1) * s],
      [0, Math.cos(a2) * s, Math.sin(a2) * s],
      scaleC(COL.BONE_DEEP, 0.6), scaleC(COL.BONE_DEEP, 0.6));
  }
  return finalize(b);
}

// ─── Zodiac Wheel ──────────────────────────────────────────────────
function buildZodiacWheel({ scale = 1.0 } = {}) {
  const b = { pos: [], col: [] };
  const s = scale;
  // 5 concentric rings
  [0.4, 0.65, 0.85, 1.0, 1.1].forEach((r, i) => {
    mergeInto(b, circleSegments({ r: s * r, segs: 72,
      color: scaleC(i % 2 === 0 ? COL.BONE : COL.BONE_DIM, 0.8 - i * 0.08) }));
  });
  // 12 dividing spokes (zodiac signs)
  const cSpoke = scaleC(COL.BONE_DIM, 0.8);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    emitSeg(b.pos, b.col,
      [Math.cos(a) * s * 0.4, Math.sin(a) * s * 0.4, 0],
      [Math.cos(a) * s * 1.1, Math.sin(a) * s * 1.1, 0], cSpoke, cSpoke);
  }
  // 12 glyphs — varied archetypal shapes
  for (let i = 0; i < 12; i++) {
    const a = ((i + 0.5) / 12) * TAU;
    const cx = Math.cos(a) * s * 0.75, cy = Math.sin(a) * s * 0.75;
    const gs = s * 0.06;
    const gc = scaleC(COL.BONE, 0.9);
    switch (i % 4) {
      case 0: // cross
        emitSeg(b.pos, b.col, [cx - gs, cy, 0], [cx + gs, cy, 0], gc, gc);
        emitSeg(b.pos, b.col, [cx, cy - gs, 0], [cx, cy + gs, 0], gc, gc);
        break;
      case 1: // triangle
        emitSeg(b.pos, b.col, [cx, cy + gs, 0], [cx - gs, cy - gs, 0], gc, gc);
        emitSeg(b.pos, b.col, [cx - gs, cy - gs, 0], [cx + gs, cy - gs, 0], gc, gc);
        emitSeg(b.pos, b.col, [cx + gs, cy - gs, 0], [cx, cy + gs, 0], gc, gc);
        break;
      case 2: // small circle
        mergeInto(b, circleSegments({ cx, cy, r: gs, segs: 14, color: gc }));
        break;
      case 3: // spiral glyph (3 arc)
        mergeInto(b, arcSegments({ cx, cy, r: gs, a1: 0, a2: TAU * 0.75, segs: 12, color: gc }));
        break;
    }
  }
  // 72 tick marks
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * TAU;
    const major = (i % 6 === 0);
    const r1 = s * 1.1, r2 = s * (major ? 1.22 : 1.14);
    emitSeg(b.pos, b.col,
      [Math.cos(a) * r1, Math.sin(a) * r1, 0],
      [Math.cos(a) * r2, Math.sin(a) * r2, 0],
      scaleC(COL.BONE_DIM, major ? 0.9 : 0.5),
      scaleC(COL.BONE_DIM, major ? 0.9 : 0.5));
  }
  return finalize(b);
}

// ─── Torus (3D wireframe donut) ────────────────────────────────────
function buildTorus({ R = 1.0, r = 0.3, uSegs = 48, vSegs = 20 } = {}) {
  const b = { pos: [], col: [] };
  const c = scaleC(COL.BONE, 0.78);
  const cd = scaleC(COL.BONE_DIM, 0.7);
  const p = (u, v) => {
    const cu = Math.cos(u), su = Math.sin(u);
    const cv = Math.cos(v), sv = Math.sin(v);
    return [(R + r * cv) * cu, r * sv, (R + r * cv) * su];
  };
  // U-loops (large circles)
  for (let j = 0; j < vSegs; j++) {
    const v = (j / vSegs) * TAU;
    for (let i = 0; i < uSegs; i++) {
      const u1 = (i / uSegs) * TAU, u2 = ((i + 1) / uSegs) * TAU;
      emitSeg(b.pos, b.col, p(u1, v), p(u2, v), c, c);
    }
  }
  // V-loops (small circles)
  for (let i = 0; i < uSegs; i++) {
    const u = (i / uSegs) * TAU;
    for (let j = 0; j < vSegs; j++) {
      const v1 = (j / vSegs) * TAU, v2 = ((j + 1) / vSegs) * TAU;
      emitSeg(b.pos, b.col, p(u, v1), p(u, v2), cd, cd);
    }
  }
  return finalize(b);
}

// ─── Vesica Trio (3 vesicas 120°) ──────────────────────────────────
function buildVesicaTrio({ radius = 0.4 } = {}) {
  const b = { pos: [], col: [] };
  const c = scaleC(COL.BONE, 0.82);
  // 3 circles arranged triangularly
  const d = radius * 0.58;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU - Math.PI / 2;
    mergeInto(b, circleSegments({ cx: Math.cos(a) * d, cy: Math.sin(a) * d, r: radius, segs: 48, color: c }));
  }
  // Inner triangle
  const tri = [];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU - Math.PI / 2;
    tri.push([Math.cos(a) * d, Math.sin(a) * d, 0]);
  }
  const tc = scaleC(COL.ROSE, 0.6);
  for (let k = 0; k < 3; k++) emitSeg(b.pos, b.col, tri[k], tri[(k+1)%3], tc, tc);
  // Enclosing circles
  mergeInto(b, circleSegments({ r: radius + d * 0.5, segs: 64, color: scaleC(COL.BONE_DIM, 0.7) }));
  mergeInto(b, circleSegments({ r: (radius + d) * 1.08, segs: 72, dashed: true, color: scaleC(COL.BONE_DEEP, 0.9) }));
  return finalize(b);
}

// ─── Rose Window (Gothic 16-fold) ──────────────────────────────────
function buildRoseWindow({ scale = 1.0 } = {}) {
  const b = { pos: [], col: [] };
  const s = scale;
  // Boss center
  mergeInto(b, circleSegments({ r: s * 0.08, segs: 24, color: scaleC(COL.BONE, 0.9) }));
  mergeInto(b, circleSegments({ r: s * 0.14, segs: 32, color: scaleC(COL.BONE_DIM, 0.8) }));
  // 16 teardrop petals
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU;
    const inner = s * 0.2, outer = s * 0.85;
    const petalW = 0.18;
    const a1 = a - petalW, a2 = a + petalW;
    // teardrop outline
    emitSeg(b.pos, b.col,
      [Math.cos(a1) * inner, Math.sin(a1) * inner, 0],
      [Math.cos(a) * outer, Math.sin(a) * outer, 0],
      scaleC(COL.BONE, 0.8), scaleC(COL.BONE, 0.6));
    emitSeg(b.pos, b.col,
      [Math.cos(a2) * inner, Math.sin(a2) * inner, 0],
      [Math.cos(a) * outer, Math.sin(a) * outer, 0],
      scaleC(COL.BONE, 0.8), scaleC(COL.BONE, 0.6));
    // Mid-rib
    emitSeg(b.pos, b.col,
      [Math.cos(a) * inner, Math.sin(a) * inner, 0],
      [Math.cos(a) * outer * 0.85, Math.sin(a) * outer * 0.85, 0],
      scaleC(COL.BONE_DEEP, 0.9), scaleC(COL.BONE_DEEP, 0.9));
  }
  // 3 tracery rings
  mergeInto(b, circleSegments({ r: s * 0.22, segs: 48, color: scaleC(COL.BONE_DIM, 0.8) }));
  mergeInto(b, circleSegments({ r: s * 0.88, segs: 64, color: scaleC(COL.BONE_DIM, 0.8) }));
  mergeInto(b, circleSegments({ r: s * 1.02, segs: 72, dashed: true, color: scaleC(COL.BONE_DEEP, 0.9) }));
  // 8 quatrefoil decorations
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + Math.PI / 16;
    const cx = Math.cos(a) * s * 0.95, cy = Math.sin(a) * s * 0.95;
    const qs = s * 0.06;
    for (let k = 0; k < 4; k++) {
      const aa = (k / 4) * TAU;
      mergeInto(b, arcSegments({
        cx: cx + Math.cos(aa) * qs * 0.5, cy: cy + Math.sin(aa) * qs * 0.5,
        r: qs * 0.5, segs: 12, a1: aa + Math.PI * 0.8, a2: aa + Math.PI * 1.2,
        color: scaleC(COL.BONE_DIM, 0.7),
      }));
    }
  }
  return finalize(b);
}

// ─── Nested Polygons (3→10) ────────────────────────────────────────
function buildNestedPolygons({ scale = 1.0 } = {}) {
  const b = { pos: [], col: [] };
  for (let sides = 3; sides <= 10; sides++) {
    const r = scale * (0.25 + (sides - 3) * 0.1);
    const c = scaleC(COL.BONE, 0.5 + (sides - 3) * 0.06);
    const pts = [];
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * TAU - Math.PI / 2;
      pts.push([Math.cos(a) * r, Math.sin(a) * r, 0]);
    }
    for (let k = 0; k < sides; k++) emitSeg(b.pos, b.col, pts[k], pts[(k+1)%sides], c, c);
    // Radial connector
    if (sides % 2 === 0) {
      for (let k = 0; k < sides; k += 2) {
        emitSeg(b.pos, b.col, pts[k], pts[(k + sides/2) % sides],
          scaleC(COL.BONE_DEEP, 0.6), scaleC(COL.BONE_DEEP, 0.6));
      }
    }
  }
  return finalize(b);
}

// ─── Astrolabe (multi-layer dial) ──────────────────────────────────
function buildAstrolabe({ scale = 1.0 } = {}) {
  const b = { pos: [], col: [] };
  const s = scale;
  // Main dial rings
  [0.3, 0.55, 0.78, 0.95, 1.05].forEach((r, i) => {
    mergeInto(b, circleSegments({ r: s * r, segs: 80,
      color: scaleC(i === 2 ? COL.BONE : COL.BONE_DIM, 0.7 - i * 0.08) }));
  });
  // 360 tick marks — major at 30°, sub at 10°, fine at 5°
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * TAU;
    const major = (i % 6 === 0);
    const medium = (i % 2 === 0);
    const r1 = s * 0.95, r2 = s * (major ? 1.05 : medium ? 1.01 : 0.98);
    emitSeg(b.pos, b.col,
      [Math.cos(a) * r1, Math.sin(a) * r1, 0],
      [Math.cos(a) * r2, Math.sin(a) * r2, 0],
      scaleC(COL.BONE_DIM, major ? 1.0 : medium ? 0.7 : 0.4),
      scaleC(COL.BONE_DIM, major ? 1.0 : medium ? 0.7 : 0.4));
  }
  // Eccentric ecliptic (offset circle)
  const eccX = s * 0.08;
  mergeInto(b, circleSegments({ cx: eccX, r: s * 0.72, segs: 80, color: scaleC(COL.BONE_DEEP, 0.9) }));
  // 12 spokes
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    emitSeg(b.pos, b.col,
      [Math.cos(a) * s * 0.1, Math.sin(a) * s * 0.1, 0],
      [Math.cos(a) * s * 0.95, Math.sin(a) * s * 0.95, 0],
      scaleC(COL.BONE_DEEP, 0.7), scaleC(COL.BONE_DEEP, 0.7));
  }
  // 3 almucantar arcs (latitude circles)
  mergeInto(b, arcSegments({ cx: 0, cy: s * 0.2, r: s * 0.5, a1: 0.3, a2: TAU - 0.3, segs: 36, color: scaleC(COL.BONE_DIM, 0.7) }));
  mergeInto(b, arcSegments({ cx: 0, cy: s * -0.15, r: s * 0.45, a1: 0.2, a2: TAU - 0.2, segs: 36, color: scaleC(COL.BONE_DIM, 0.6) }));
  mergeInto(b, arcSegments({ cx: s * 0.15, cy: s * 0.05, r: s * 0.4, a1: 0.5, a2: TAU - 0.5, segs: 30, color: scaleC(COL.BONE_DEEP, 0.9) }));
  // Pointer arrow
  const pa = 0.55;
  emitSeg(b.pos, b.col, [0, 0, 0.002], [Math.cos(pa) * s * 0.9, Math.sin(pa) * s * 0.9, 0.002],
    scaleC(COL.ORANGE_DOT, 0.9), scaleC(COL.ORANGE_DOT, 0.3));
  emitSeg(b.pos, b.col, [Math.cos(pa) * s * 0.9, Math.sin(pa) * s * 0.9, 0.002],
    [Math.cos(pa + 0.1) * s * 0.82, Math.sin(pa + 0.1) * s * 0.82, 0.002],
    scaleC(COL.ORANGE_DOT, 0.9), scaleC(COL.ORANGE_DOT, 0.9));
  emitSeg(b.pos, b.col, [Math.cos(pa) * s * 0.9, Math.sin(pa) * s * 0.9, 0.002],
    [Math.cos(pa - 0.1) * s * 0.82, Math.sin(pa - 0.1) * s * 0.82, 0.002],
    scaleC(COL.ORANGE_DOT, 0.9), scaleC(COL.ORANGE_DOT, 0.9));
  return finalize(b);
}

// ─── Atomic Orbital (3 tilted elliptical orbits + nucleus) ────────
function buildAtomicOrbital({ scale = 1.0 } = {}) {
  const b = { pos: [], col: [] };
  // Nucleus
  mergeInto(b, circleSegments({ r: scale * 0.06, segs: 20, color: scaleC(COL.BONE, 0.9) }));
  mergeInto(b, circleSegments({ r: scale * 0.1, segs: 24, color: scaleC(COL.BONE_DIM, 0.7) }));
  // 3 elliptical orbits at different tilts
  const tilts = [0, Math.PI / 3, -Math.PI / 3];
  for (let k = 0; k < 3; k++) {
    const t = tilts[k];
    const cos = Math.cos(t), sin = Math.sin(t);
    const segs = 64;
    const c = scaleC(k === 0 ? COL.BONE : COL.BONE_DIM, 0.75);
    for (let i = 0; i < segs; i++) {
      const a1 = (i / segs) * TAU, a2 = ((i + 1) / segs) * TAU;
      const p1x = Math.cos(a1) * scale, p1y = Math.sin(a1) * scale * 0.4;
      const p2x = Math.cos(a2) * scale, p2y = Math.sin(a2) * scale * 0.4;
      emitSeg(b.pos, b.col,
        [p1x * cos - p1y * sin, p1x * sin + p1y * cos, Math.sin(a1) * scale * 0.15],
        [p2x * cos - p2y * sin, p2x * sin + p2y * cos, Math.sin(a2) * scale * 0.15],
        c, c);
    }
  }
  return finalize(b);
}

// ─── Tree of Life (Kabbalah: 10 sephiroth + 22 paths) ─────────────
function buildTreeOfLife({ scale = 1.0 } = {}) {
  const b = { pos: [], col: [] };
  const s = scale;
  // Positions of 10 sephiroth (classic layout)
  const seph = [
    [0, 1.4],    // 1 Keter
    [-0.45, 1.1],// 2 Chokmah
    [0.45, 1.1], // 3 Binah
    [-0.45, 0.6],// 4 Chesed
    [0.45, 0.6], // 5 Gevurah
    [0, 0.3],    // 6 Tiferet
    [-0.45, -0.2],// 7 Netzach
    [0.45, -0.2], // 8 Hod
    [0, -0.6],   // 9 Yesod
    [0, -1.2],   // 10 Malkuth
  ].map(p => [p[0] * s, p[1] * s, 0]);
  // 22 paths (Hebrew letters)
  const paths = [
    [0,1],[0,2],[0,5],[1,2],[1,3],[1,5],[2,4],[2,5],
    [3,4],[3,5],[3,6],[4,5],[4,7],[5,6],[5,7],[5,8],
    [6,7],[6,8],[6,9],[7,8],[7,9],[8,9]
  ];
  const cPath = scaleC(COL.BONE_DIM, 0.8);
  for (const [i, j] of paths) emitSeg(b.pos, b.col, seph[i], seph[j], cPath, cPath);
  // Circles at each sephira
  for (const p of seph) {
    mergeInto(b, circleSegments({ cx: p[0], cy: p[1], r: s * 0.07, segs: 20, color: scaleC(COL.BONE, 0.88) }));
    mergeInto(b, circleSegments({ cx: p[0], cy: p[1], r: s * 0.12, segs: 24, color: scaleC(COL.BONE_DEEP, 0.6) }));
  }
  // 3 pillars
  const pillar = scaleC(COL.BONE_GHOST, 0.9);
  emitSeg(b.pos, b.col, [0, s * 1.5, 0], [0, s * -1.3, 0], pillar, pillar);
  emitSeg(b.pos, b.col, [-s * 0.45, s * 1.2, 0], [-s * 0.45, s * -0.25, 0], pillar, pillar);
  emitSeg(b.pos, b.col, [s * 0.45, s * 1.2, 0], [s * 0.45, s * -0.25, 0], pillar, pillar);
  return finalize(b);
}

// ─── Seed of Life (7 overlapping circles) ─────────────────────────
function buildSeedOfLife({ radius = 0.3 } = {}) {
  const b = { pos: [], col: [] };
  const c = scaleC(COL.BONE, 0.82);
  // Center circle
  mergeInto(b, circleSegments({ r: radius, segs: 42, color: c }));
  // 6 surrounding circles
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    mergeInto(b, circleSegments({
      cx: Math.cos(a) * radius, cy: Math.sin(a) * radius,
      r: radius, segs: 42, color: c,
    }));
  }
  // Outer boundary
  mergeInto(b, circleSegments({ r: radius * 2.08, segs: 64, color: scaleC(COL.BONE_DEEP, 0.9) }));
  return finalize(b);
}

// ─── Rich Fibonacci (for axial use, upgrade of the centerpiece) ───
function buildFibonacciRich({ scale = 1.0, turns = 4.5, zLift = 0.6 } = {}) {
  const b = { pos: [], col: [] };
  const growthB = Math.log(PHI) / (Math.PI / 2);
  const maxR = scale;
  const pointsPerTurn = 100;
  const total = Math.floor(turns * pointsPerTurn);
  // The spiral itself
  for (let i = 0; i < total; i++) {
    const t1 = i / pointsPerTurn, t2 = (i + 1) / pointsPerTurn;
    const th1 = (turns - t1) * TAU, th2 = (turns - t2) * TAU;
    const r1 = maxR * Math.pow(PHI, -t1), r2 = maxR * Math.pow(PHI, -t2);
    const z1 = t1 / turns * zLift - zLift * 0.5;
    const z2 = t2 / turns * zLift - zLift * 0.5;
    const bright = 0.55 + (i / total) * 0.4;
    const c = scaleC(COL.BONE, bright);
    emitSeg(b.pos, b.col,
      [r1 * Math.cos(th1), r1 * Math.sin(th1), z1],
      [r2 * Math.cos(th2), r2 * Math.sin(th2), z2], c, c);
  }
  // 7 nested golden rectangles
  let rx = -maxR * 0.5, ry = -maxR * 0.5, rw = maxR, rh = maxR;
  const faint = scaleC(COL.BONE_DEEP, 0.85);
  for (let k = 0; k < 7; k++) {
    const corners = [[rx, ry], [rx + rw, ry], [rx + rw, ry + rh], [rx, ry + rh]];
    for (let j = 0; j < 4; j++) {
      emitSeg(b.pos, b.col, [corners[j][0], corners[j][1], 0], [corners[(j+1)%4][0], corners[(j+1)%4][1], 0], faint, faint);
    }
    if (rw > rh) { rx += rh; rw -= rh; } else { ry += rw; rh -= rw; }
  }
  // 3 outer rings (dashed + solid)
  mergeInto(b, circleSegments({ r: scale * 1.12, segs: 96, color: scaleC(COL.BONE_DIM, 0.6) }));
  mergeInto(b, circleSegments({ r: scale * 1.22, segs: 96, dashed: true, dashOn: 3, dashOff: 2, color: scaleC(COL.BONE_DEEP, 0.9) }));
  mergeInto(b, circleSegments({ r: scale * 1.35, segs: 120, dashed: true, dashOn: 1, dashOff: 3, color: scaleC(COL.BONE_DEEP, 0.7) }));
  // 36 radial ticks
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * TAU;
    const major = (i % 3 === 0);
    const r1 = scale * 1.4, r2 = scale * (major ? 1.5 : 1.44);
    emitSeg(b.pos, b.col,
      [Math.cos(a) * r1, Math.sin(a) * r1, 0],
      [Math.cos(a) * r2, Math.sin(a) * r2, 0],
      scaleC(COL.BONE_DEEP, major ? 1.0 : 0.6),
      scaleC(COL.BONE_DEEP, major ? 1.0 : 0.6));
  }
  // Fibonacci spiral marker dots
  const dots = [];
  for (let i = 0; i < 18; i++) {
    const t = i / 18;
    const th = (turns - t) * TAU;
    const r = maxR * Math.pow(PHI, -t);
    const z = t / turns * zLift - zLift * 0.5;
    dots.push([r * Math.cos(th), r * Math.sin(th), z]);
  }
  return { ...finalize(b), dots };
}

// ═══════════════════════════════════════════════════════════════════════
// HIGH-DIMENSIONAL MATH + FRONTIER SCIENCE BUILDERS
// ═══════════════════════════════════════════════════════════════════════

// ─── Lorenz Attractor (chaos theory strange attractor) ────────────
function buildLorenzAttractor({ scale = 0.04, steps = 3500, sigma = 10, rho = 28, beta = 8/3 } = {}) {
  const b = { pos: [], col: [] };
  let x = 0.1, y = 0, z = 0;
  const dt = 0.007;
  let px = x * scale, py = y * scale, pz = z * scale - rho * 0.5 * scale;
  for (let i = 0; i < steps; i++) {
    const dx = sigma * (y - x);
    const dy = x * (rho - z) - y;
    const dz = x * y - beta * z;
    x += dx * dt; y += dy * dt; z += dz * dt;
    const nx = x * scale, ny = y * scale, nz = z * scale - rho * 0.5 * scale;
    const bright = 0.4 + 0.5 * (i / steps);
    const c1 = scaleC(COL.BONE, bright * 0.9);
    const c2 = scaleC(COL.BONE, bright);
    emitSeg(b.pos, b.col, [px, py, pz], [nx, ny, nz], c1, c2);
    px = nx; py = ny; pz = nz;
  }
  return finalize(b);
}

// ─── Icosahedron (Platonic solid, 12 vertices, 30 edges) ──────────
function buildIcosahedron({ scale = 1.0 } = {}) {
  const b = { pos: [], col: [] };
  const t = (1 + Math.sqrt(5)) / 2;
  const norm = Math.sqrt(1 + t * t);
  // 12 vertices = cyclic permutations of (0, ±1, ±φ)
  const v = [
    [0, 1, t], [0, -1, t], [0, 1, -t], [0, -1, -t],
    [1, t, 0], [-1, t, 0], [1, -t, 0], [-1, -t, 0],
    [t, 0, 1], [-t, 0, 1], [t, 0, -1], [-t, 0, -1],
  ].map(p => [p[0] / norm * scale, p[1] / norm * scale, p[2] / norm * scale]);
  // 30 edges
  const edges = [
    [0,1],[0,4],[0,5],[0,8],[0,9],
    [1,6],[1,7],[1,8],[1,9],
    [2,3],[2,4],[2,5],[2,10],[2,11],
    [3,6],[3,7],[3,10],[3,11],
    [4,5],[4,8],[4,10],
    [5,9],[5,11],
    [6,7],[6,8],[6,10],
    [7,9],[7,11],
    [8,10],[9,11],
  ];
  const c = scaleC(COL.BONE, 0.85);
  for (const [i, j] of edges) emitSeg(b.pos, b.col, v[i], v[j], c, c);
  // Bounding sphere
  mergeInto(b, circleSegments({ r: scale * 1.05, segs: 48, color: scaleC(COL.BONE_DEEP, 0.7) }));
  return finalize(b);
}

// ─── Dodecahedron (Platonic solid, 20 vertices, 30 edges) ─────────
function buildDodecahedron({ scale = 1.0 } = {}) {
  const b = { pos: [], col: [] };
  const phi = (1 + Math.sqrt(5)) / 2;
  const inv = 1 / phi;
  const norm = Math.sqrt(3);
  // 20 vertices
  const v = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) v.push([sx, sy, sz]);
  for (const sy of [-1, 1]) for (const sz of [-1, 1]) v.push([0, sy * inv, sz * phi]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.push([sx * inv, sz * phi, 0]);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) v.push([sx * phi, 0, sy * inv]);
  const vs = v.map(p => [p[0] / norm * scale, p[1] / norm * scale, p[2] / norm * scale]);
  // Compute edges by nearest-neighbor connection (edge length ~2/phi)
  const edgeLen = (2 / phi) / norm * scale * 1.05;
  const c = scaleC(COL.BONE_DIM, 0.85);
  for (let i = 0; i < vs.length; i++) {
    for (let j = i + 1; j < vs.length; j++) {
      const d = Math.hypot(vs[i][0] - vs[j][0], vs[i][1] - vs[j][1], vs[i][2] - vs[j][2]);
      if (d < edgeLen) emitSeg(b.pos, b.col, vs[i], vs[j], c, c);
    }
  }
  return finalize(b);
}

// ─── Tesseract (4D hypercube projected to 3D) ─────────────────────
function buildTesseract({ scale = 0.6, w = 0.45 } = {}) {
  const b = { pos: [], col: [] };
  // 16 vertices (4D cube)
  const v4 = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) for (const wax of [-1, 1]) {
    v4.push([x, y, z, wax]);
  }
  // Project with perspective from W-axis
  const proj = v4.map(([x, y, z, wax]) => {
    const ww = 1 + w * wax * 0.8;
    return [x * scale * ww, y * scale * ww, z * scale * ww];
  });
  // Edges: two vertices differ in exactly one coord
  const cOuter = scaleC(COL.BONE, 0.88);
  const cInner = scaleC(COL.BONE_DIM, 0.75);
  for (let i = 0; i < 16; i++) {
    for (let j = i + 1; j < 16; j++) {
      let diff = 0;
      for (let k = 0; k < 4; k++) if (v4[i][k] !== v4[j][k]) diff++;
      if (diff === 1) {
        const isConnector = v4[i][3] !== v4[j][3];
        emitSeg(b.pos, b.col, proj[i], proj[j],
          isConnector ? cInner : cOuter, isConnector ? cInner : cOuter);
      }
    }
  }
  return finalize(b);
}

// ─── Torus Knot (p,q) ─────────────────────────────────────────────
function buildTorusKnot({ scale = 0.5, p = 3, q = 2, R = 0.6, r = 0.22, segs = 240 } = {}) {
  const b = { pos: [], col: [] };
  const coord = (t) => {
    const phi = t * TAU;
    const cosQ = Math.cos(q * phi), sinQ = Math.sin(q * phi);
    const cosP = Math.cos(p * phi), sinP = Math.sin(p * phi);
    return [
      (R + r * cosQ) * cosP * scale,
      (R + r * cosQ) * sinP * scale,
      r * sinQ * scale,
    ];
  };
  for (let i = 0; i < segs; i++) {
    const t1 = i / segs, t2 = (i + 1) / segs;
    const bright = 0.6 + 0.3 * Math.sin(t1 * TAU * p);
    const c = scaleC(COL.BONE, bright);
    emitSeg(b.pos, b.col, coord(t1), coord(t2), c, c);
  }
  return finalize(b);
}

// ─── Möbius Strip (non-orientable surface, wireframe) ─────────────
function buildMobiusStrip({ scale = 0.6, uSegs = 48, vSegs = 8 } = {}) {
  const b = { pos: [], col: [] };
  const p = (u, v) => {
    const tu = u * TAU;
    const hu = tu / 2;
    const R = 1 + v * Math.cos(hu);
    return [R * Math.cos(tu) * scale, v * Math.sin(hu) * scale * 0.8, R * Math.sin(tu) * scale];
  };
  const c = scaleC(COL.BONE, 0.8);
  const cd = scaleC(COL.BONE_DIM, 0.65);
  // Longitudinal lines (v const)
  for (let j = 0; j <= vSegs; j++) {
    const v = -0.4 + (j / vSegs) * 0.8;
    for (let i = 0; i < uSegs; i++) {
      const u1 = i / uSegs, u2 = (i + 1) / uSegs;
      emitSeg(b.pos, b.col, p(u1, v), p(u2, v), c, c);
    }
  }
  // Latitudinal lines (u const)
  for (let i = 0; i < uSegs; i++) {
    const u = i / uSegs;
    emitSeg(b.pos, b.col, p(u, -0.4), p(u, 0.4), cd, cd);
  }
  return finalize(b);
}

// ─── Borromean Rings (3 interlocking circles) ─────────────────────
function buildBorromeanRings({ scale = 0.6 } = {}) {
  const b = { pos: [], col: [] };
  const r = scale, d = scale * 0.5;
  const segs = 64;
  // Ring 1 on XY plane
  for (let i = 0; i < segs; i++) {
    const a1 = (i / segs) * TAU, a2 = ((i + 1) / segs) * TAU;
    emitSeg(b.pos, b.col,
      [Math.cos(a1) * r + d, Math.sin(a1) * r, 0],
      [Math.cos(a2) * r + d, Math.sin(a2) * r, 0],
      scaleC(COL.BONE, 0.85), scaleC(COL.BONE, 0.85));
  }
  // Ring 2 on YZ plane (tilted)
  const off2 = [-d * 0.5, 0, d * 0.86];
  for (let i = 0; i < segs; i++) {
    const a1 = (i / segs) * TAU, a2 = ((i + 1) / segs) * TAU;
    emitSeg(b.pos, b.col,
      [off2[0], Math.cos(a1) * r + off2[1], Math.sin(a1) * r + off2[2]],
      [off2[0], Math.cos(a2) * r + off2[1], Math.sin(a2) * r + off2[2]],
      scaleC(COL.BONE_DIM, 0.9), scaleC(COL.BONE_DIM, 0.9));
  }
  // Ring 3 on XZ plane
  const off3 = [-d * 0.5, 0, -d * 0.86];
  for (let i = 0; i < segs; i++) {
    const a1 = (i / segs) * TAU, a2 = ((i + 1) / segs) * TAU;
    emitSeg(b.pos, b.col,
      [Math.cos(a1) * r + off3[0], off3[1], Math.sin(a1) * r + off3[2]],
      [Math.cos(a2) * r + off3[0], off3[1], Math.sin(a2) * r + off3[2]],
      scaleC(COL.BONE_DEEP, 1.0), scaleC(COL.BONE_DEEP, 1.0));
  }
  return finalize(b);
}

// ─── Phyllotaxis 3D (golden angle sphere, 300 seeds) ──────────────
function buildPhyllotaxis3D({ scale = 0.8, count = 300 } = {}) {
  const b = { pos: [], col: [] };
  const dotsPos = [];
  // Sphere Fibonacci lattice
  for (let i = 0; i < count; i++) {
    const phi = Math.acos(1 - 2 * (i + 0.5) / count);
    const theta = GOLDEN_ANGLE * i;
    const x = Math.sin(phi) * Math.cos(theta) * scale;
    const y = Math.cos(phi) * scale;
    const z = Math.sin(phi) * Math.sin(theta) * scale;
    dotsPos.push(x, y, z);
  }
  // Connect each to nearest 2 neighbors for mesh effect
  const pts = [];
  for (let i = 0; i < count; i++) pts.push([dotsPos[i * 3], dotsPos[i * 3 + 1], dotsPos[i * 3 + 2]]);
  for (let i = 0; i < count; i++) {
    // Find 2 nearest neighbors by sampling
    let bestD1 = Infinity, bestD2 = Infinity, b1 = -1, b2 = -1;
    for (let j = 0; j < count; j++) {
      if (j === i) continue;
      const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1], pts[i][2] - pts[j][2]);
      if (d < bestD1) { bestD2 = bestD1; b2 = b1; bestD1 = d; b1 = j; }
      else if (d < bestD2) { bestD2 = d; b2 = j; }
    }
    if (b1 >= 0) emitSeg(b.pos, b.col, pts[i], pts[b1], scaleC(COL.BONE_DIM, 0.4), scaleC(COL.BONE_DIM, 0.4));
    if (b2 >= 0 && i % 3 === 0) emitSeg(b.pos, b.col, pts[i], pts[b2], scaleC(COL.BONE_DEEP, 0.6), scaleC(COL.BONE_DEEP, 0.6));
  }
  return { ...finalize(b), dots: new Float32Array(dotsPos) };
}

// ─── Rose Curve (k-petal polar rose) ──────────────────────────────
function buildRoseCurve({ scale = 0.5, k = 7, segs = 360 } = {}) {
  const b = { pos: [], col: [] };
  const c = scaleC(COL.BONE, 0.85);
  for (let i = 0; i < segs; i++) {
    const t1 = (i / segs) * TAU * 2, t2 = ((i + 1) / segs) * TAU * 2;
    const r1 = Math.cos(k * t1) * scale, r2 = Math.cos(k * t2) * scale;
    emitSeg(b.pos, b.col,
      [r1 * Math.cos(t1), r1 * Math.sin(t1), 0],
      [r2 * Math.cos(t2), r2 * Math.sin(t2), 0],
      c, c);
  }
  mergeInto(b, circleSegments({ r: scale * 1.05, segs: 64, dashed: true, color: scaleC(COL.BONE_DEEP, 0.8) }));
  return finalize(b);
}

// ─── Lissajous (3D parametric figure) ─────────────────────────────
function buildLissajous({ scale = 0.5, a = 3, b = 2, c = 5, dphi = 0.5, segs = 300 } = {}) {
  const buf = { pos: [], col: [] };
  const col = scaleC(COL.BONE, 0.85);
  for (let i = 0; i < segs; i++) {
    const t1 = (i / segs) * TAU, t2 = ((i + 1) / segs) * TAU;
    emitSeg(buf.pos, buf.col,
      [Math.sin(a * t1 + dphi) * scale, Math.sin(b * t1) * scale, Math.sin(c * t1) * scale * 0.5],
      [Math.sin(a * t2 + dphi) * scale, Math.sin(b * t2) * scale, Math.sin(c * t2) * scale * 0.5],
      col, col);
  }
  return finalize(buf);
}

// ─── Koch Snowflake (recursive fractal) ───────────────────────────
function buildKochSnowflake({ scale = 1.0, iters = 4 } = {}) {
  const b = { pos: [], col: [] };
  // Start with equilateral triangle
  const s = scale;
  let edges = [
    [[0, s * 1.15, 0], [s, -s * 0.577, 0]],
    [[s, -s * 0.577, 0], [-s, -s * 0.577, 0]],
    [[-s, -s * 0.577, 0], [0, s * 1.15, 0]],
  ];
  for (let it = 0; it < iters; it++) {
    const newEdges = [];
    for (const [p1, p2] of edges) {
      const dx = (p2[0] - p1[0]) / 3, dy = (p2[1] - p1[1]) / 3;
      const a = [p1[0] + dx, p1[1] + dy, 0];
      const bp = [p1[0] + 2 * dx, p1[1] + 2 * dy, 0];
      // Peak point — rotate (dx, dy) by -60° and add to a
      const rx = dx * Math.cos(-Math.PI / 3) - dy * Math.sin(-Math.PI / 3);
      const ry = dx * Math.sin(-Math.PI / 3) + dy * Math.cos(-Math.PI / 3);
      const peak = [a[0] + rx, a[1] + ry, 0];
      newEdges.push([p1, a], [a, peak], [peak, bp], [bp, p2]);
    }
    edges = newEdges;
  }
  const c = scaleC(COL.BONE, 0.85);
  for (const [p1, p2] of edges) emitSeg(b.pos, b.col, p1, p2, c, c);
  return finalize(b);
}

// ─── Apollonian Gasket (recursive nested circles) ─────────────────
function buildApollonianGasket({ scale = 0.5, depth = 4 } = {}) {
  const b = { pos: [], col: [] };
  // Start with 3 mutually tangent circles inside a larger
  const outerR = scale;
  mergeInto(b, circleSegments({ r: outerR, segs: 72, color: scaleC(COL.BONE, 0.9) }));
  // 3 inner circles (each radius = outerR/3 in simple arrangement)
  const cs = [];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU - Math.PI / 2;
    cs.push({ x: Math.cos(a) * outerR * (2/3), y: Math.sin(a) * outerR * (2/3), r: outerR / 3 });
  }
  const draw = (list, level) => {
    for (const c of list) {
      mergeInto(b, circleSegments({ cx: c.x, cy: c.y, r: c.r, segs: 36,
        color: scaleC(COL.BONE_DIM, 0.85 - level * 0.15) }));
    }
    if (level >= depth) return;
    // Create sub-circles in gaps
    const next = [];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i], bb = list[j];
        const midX = (a.x + bb.x) / 2, midY = (a.y + bb.y) / 2;
        const nr = Math.min(a.r, bb.r) * 0.35;
        next.push({ x: midX, y: midY, r: nr });
      }
    }
    if (next.length > 0) draw(next, level + 1);
  };
  draw(cs, 0);
  return finalize(b);
}

// ─── Hopf Fibration (interlocking fiber circles) ──────────────────
function buildHopfFibration({ scale = 0.7, fiberCount = 12 } = {}) {
  const b = { pos: [], col: [] };
  // Each fiber is a circle in S^3 that projects to an interlocking circle in R^3
  for (let k = 0; k < fiberCount; k++) {
    const eta = (k / fiberCount) * Math.PI * 0.9 + 0.05;
    const segs = 60;
    const bright = 0.5 + (k / fiberCount) * 0.4;
    const c = scaleC(k % 2 === 0 ? COL.BONE : COL.BONE_DIM, bright);
    const prev = [];
    for (let i = 0; i <= segs; i++) {
      const t = (i / segs) * TAU;
      // Simplified projection: parametrize a circle that winds differently
      const ce = Math.cos(eta), se = Math.sin(eta);
      const x = Math.cos(t) * ce;
      const y = Math.sin(t) * ce;
      const z = Math.cos(t + eta * 2) * se;
      const pw = 1 + Math.sin(t + eta * 2) * se * 0.5;
      const p = [x / pw * scale, y / pw * scale, z / pw * scale];
      if (i > 0) emitSeg(b.pos, b.col, prev[0], p, c, c);
      prev[0] = p;
    }
  }
  return finalize(b);
}

// ─── C60 / Truncated Icosahedron (Buckyball / fullerene) ──────────
function buildBuckyball({ scale = 1.0 } = {}) {
  const b = { pos: [], col: [] };
  // 60 vertices of truncated icosahedron (soccer ball)
  const phi = (1 + Math.sqrt(5)) / 2;
  const norm = Math.sqrt(9 * phi * phi + 1);
  const v = [];
  const perms = (p) => {
    // All cyclic perms and sign combos
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
      v.push([p[0] * sx, p[1] * sy, p[2] * sz]);
      if (p[0] !== p[1] || p[1] !== p[2]) {
        v.push([p[1] * sx, p[2] * sy, p[0] * sz]);
        v.push([p[2] * sx, p[0] * sy, p[1] * sz]);
      }
    }
  };
  // C60 vertices: cyclic perms of (0, ±1, ±3φ), (±1, ±(2+φ), ±2φ), (±φ, ±2, ±(2φ+1))
  const addVertexGroup = (a, bb, cc) => {
    const triples = [[a, bb, cc], [bb, cc, a], [cc, a, bb]];
    for (const [x, y, z] of triples) {
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
        if (x === 0 && sx === -1) continue;
        if (y === 0 && sy === -1) continue;
        if (z === 0 && sz === -1) continue;
        v.push([x * sx, y * sy, z * sz]);
      }
    }
  };
  addVertexGroup(0, 1, 3 * phi);
  addVertexGroup(1, 2 + phi, 2 * phi);
  addVertexGroup(phi, 2, 2 * phi + 1);
  // Dedup
  const uniq = [];
  for (const p of v) {
    let dup = false;
    for (const q of uniq) {
      if (Math.abs(p[0]-q[0]) < 0.001 && Math.abs(p[1]-q[1]) < 0.001 && Math.abs(p[2]-q[2]) < 0.001) { dup = true; break; }
    }
    if (!dup) uniq.push(p);
  }
  const vs = uniq.map(p => [p[0] / norm * scale, p[1] / norm * scale, p[2] / norm * scale]);
  // Draw edges: connect vertices whose distance ≈ 2/norm (edge length)
  const edgeTarget = 2 / norm * scale;
  const c = scaleC(COL.BONE_DIM, 0.8);
  for (let i = 0; i < vs.length; i++) {
    for (let j = i + 1; j < vs.length; j++) {
      const d = Math.hypot(vs[i][0] - vs[j][0], vs[i][1] - vs[j][1], vs[i][2] - vs[j][2]);
      if (Math.abs(d - edgeTarget) < edgeTarget * 0.08) emitSeg(b.pos, b.col, vs[i], vs[j], c, c);
    }
  }
  return finalize(b);
}

// ─── Penrose Tiling (5-fold aperiodic) ────────────────────────────
function buildPenroseTiling({ scale = 1.0, rings = 3 } = {}) {
  const b = { pos: [], col: [] };
  // Simplified: fan of 10 kites/darts around center with golden-ratio subdivision
  const c = scaleC(COL.BONE, 0.78);
  const cd = scaleC(COL.BONE_DIM, 0.75);
  for (let layer = 0; layer < rings; layer++) {
    const r = scale * (0.3 + layer * 0.35);
    const kiteCount = 10 * (layer + 1);
    for (let i = 0; i < kiteCount; i++) {
      const a1 = (i / kiteCount) * TAU;
      const a2 = ((i + 1) / kiteCount) * TAU;
      const amid = (a1 + a2) / 2;
      const rInner = r;
      const rOuter = r + scale * 0.3;
      // Kite: center-innerLeft-outerMid-innerRight
      const p0 = [Math.cos(amid) * rInner * 0.4, Math.sin(amid) * rInner * 0.4, 0];
      const p1 = [Math.cos(a1) * rInner, Math.sin(a1) * rInner, 0];
      const p2 = [Math.cos(amid) * rOuter, Math.sin(amid) * rOuter, 0];
      const p3 = [Math.cos(a2) * rInner, Math.sin(a2) * rInner, 0];
      const col = (i + layer) % 2 === 0 ? c : cd;
      emitSeg(b.pos, b.col, p0, p1, col, col);
      emitSeg(b.pos, b.col, p1, p2, col, col);
      emitSeg(b.pos, b.col, p2, p3, col, col);
      emitSeg(b.pos, b.col, p3, p0, col, col);
    }
  }
  return finalize(b);
}

// ─── E8 Root System Projection (240 roots in Coxeter plane) ───────
function buildE8Projection({ scale = 1.0 } = {}) {
  const b = { pos: [], col: [] };
  // Approximation: 240 points on 8 concentric circles of 30 points each
  const dots = [];
  for (let ring = 0; ring < 8; ring++) {
    const r = scale * (0.15 + ring * 0.12);
    const count = 30;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TAU + ring * (TAU / 60);
      dots.push(Math.cos(a) * r, Math.sin(a) * r, 0);
    }
    mergeInto(b, circleSegments({ r, segs: 60, color: scaleC(COL.BONE_DEEP, 0.7 - ring * 0.05) }));
  }
  // Sparse edges between close pairs on adjacent rings
  const c = scaleC(COL.BONE_DIM, 0.5);
  for (let i = 0; i < dots.length; i += 3) {
    for (let j = i + 3; j < dots.length; j += 3) {
      const d = Math.hypot(dots[i] - dots[j], dots[i+1] - dots[j+1]);
      if (d < scale * 0.22 && Math.random() < 0.1) {
        emitSeg(b.pos, b.col,
          [dots[i], dots[i+1], 0], [dots[j], dots[j+1], 0], c, c);
      }
    }
  }
  return { ...finalize(b), dots: new Float32Array(dots) };
}

// ─── Calabi-Yau slice (stylized 2D projection) ────────────────────
function buildCalabiYauSlice({ scale = 0.6, n = 5 } = {}) {
  const b = { pos: [], col: [] };
  // Stylized visualization: intersection curves on torus
  const uSegs = 40, vSegs = 40;
  const p = (u, v) => {
    const x = Math.cos(u) * Math.cos(n * v) * scale;
    const y = Math.sin(u) * Math.cos(n * v) * scale;
    const z = Math.sin(n * v) * scale * 0.6;
    return [x, y, z];
  };
  const c = scaleC(COL.BONE, 0.7);
  for (let i = 0; i < uSegs; i++) {
    const u = (i / uSegs) * TAU;
    for (let j = 0; j < vSegs; j++) {
      const v1 = (j / vSegs) * TAU / n, v2 = ((j + 1) / vSegs) * TAU / n;
      emitSeg(b.pos, b.col, p(u, v1), p(u, v2), c, c);
    }
  }
  for (let j = 0; j < vSegs; j += 4) {
    const v = (j / vSegs) * TAU / n;
    for (let i = 0; i < uSegs; i++) {
      const u1 = (i / uSegs) * TAU, u2 = ((i + 1) / uSegs) * TAU;
      emitSeg(b.pos, b.col, p(u1, v), p(u2, v), scaleC(COL.BONE_DEEP, 0.7), scaleC(COL.BONE_DEEP, 0.7));
    }
  }
  return finalize(b);
}

// ─── Quantum p-orbital (dual lobes) ───────────────────────────────
function buildQuantumOrbital({ scale = 0.5, lobes = 4 } = {}) {
  const b = { pos: [], col: [] };
  // Represent a d-orbital (clover leaf) as 4 ellipses
  for (let k = 0; k < lobes; k++) {
    const ang = (k / lobes) * TAU;
    const cos = Math.cos(ang), sin = Math.sin(ang);
    const segs = 48;
    const c = scaleC(COL.BONE, 0.78);
    const offR = scale * 0.5;
    for (let i = 0; i < segs; i++) {
      const a1 = (i / segs) * TAU, a2 = ((i + 1) / segs) * TAU;
      const p1x = Math.cos(a1) * scale * 0.55, p1y = Math.sin(a1) * scale * 0.25;
      const p2x = Math.cos(a2) * scale * 0.55, p2y = Math.sin(a2) * scale * 0.25;
      const r1 = [p1x * cos - p1y * sin + cos * offR, p1x * sin + p1y * cos + sin * offR, 0];
      const r2 = [p2x * cos - p2y * sin + cos * offR, p2x * sin + p2y * cos + sin * offR, 0];
      emitSeg(b.pos, b.col, r1, r2, c, c);
    }
  }
  // Nucleus
  mergeInto(b, circleSegments({ r: scale * 0.05, segs: 16, color: scaleC(COL.ORANGE_DOT, 0.9) }));
  return finalize(b);
}

// ─── Cayley graph / Lie algebra sketch ────────────────────────────
function buildCayleyGraph({ scale = 0.7, nodes = 24 } = {}) {
  const b = { pos: [], col: [] };
  const pts = [];
  for (let i = 0; i < nodes; i++) {
    const a = (i / nodes) * TAU;
    const layer = Math.floor(i / 8);
    const r = scale * (0.4 + layer * 0.25);
    pts.push([Math.cos(a + layer * 0.3) * r, Math.sin(a + layer * 0.3) * r, 0]);
  }
  const c = scaleC(COL.BONE_DIM, 0.7);
  // Connect each to 2 specific others (simulating generators)
  for (let i = 0; i < nodes; i++) {
    emitSeg(b.pos, b.col, pts[i], pts[(i + 1) % nodes], c, c);
    emitSeg(b.pos, b.col, pts[i], pts[(i + 5) % nodes], scaleC(COL.BONE_DEEP, 0.7), scaleC(COL.BONE_DEEP, 0.7));
  }
  const dots = new Float32Array(pts.length * 3);
  pts.forEach((p, i) => { dots[i*3] = p[0]; dots[i*3+1] = p[1]; dots[i*3+2] = p[2]; });
  return { ...finalize(b), dots };
}

// ─── Small solid 3D sphere (as dense dotted planetoid) ────────────
function buildStippledSphere({ radius = 0.22, count = 120, seed = 7 } = {}) {
  const b = { pos: [], col: [] };
  const rand = mkRand(seed);
  // Wireframe outline (great circle)
  mergeInto(b, circleSegments({ r: radius, segs: 48, color: scaleC(COL.BONE, 0.88) }));
  // Dot stipple
  for (let i = 0; i < count; i++) {
    const u = rand() * 2 - 1;
    const theta = rand() * TAU;
    const phi = Math.sqrt(1 - u * u);
    const x = radius * 0.98 * Math.cos(theta) * phi;
    const y = radius * 0.98 * u;
    const z = radius * 0.98 * Math.sin(theta) * phi;
    emitSeg(b.pos, b.col, [x - 0.003, y, z], [x + 0.003, y, z],
      scaleC(COL.BONE_DIM, 0.5 + rand() * 0.4),
      scaleC(COL.BONE_DIM, 0.5 + rand() * 0.4));
  }
  return finalize(b);
}

// ─── Distant cosmic mandala (huge, for background layer) ──────────
function buildCosmicMandala({ scale = 1.0, symmetry = 24 } = {}) {
  const b = { pos: [], col: [] };
  // Huge faint mandala for the edge of the universe
  mergeInto(b, circleSegments({ r: scale, segs: symmetry * 4, dashed: true, dashOn: 3, dashOff: 5, color: scaleC(COL.BONE_GHOST, 1.0) }));
  mergeInto(b, circleSegments({ r: scale * 0.82, segs: symmetry * 3, color: scaleC(COL.BONE_GHOST, 0.9) }));
  mergeInto(b, circleSegments({ r: scale * 0.95, segs: symmetry * 3, dashed: true, color: scaleC(COL.BONE_GHOST, 0.7) }));
  // Radial spokes
  for (let i = 0; i < symmetry; i++) {
    const a = (i / symmetry) * TAU;
    emitSeg(b.pos, b.col,
      [Math.cos(a) * scale * 0.82, Math.sin(a) * scale * 0.82, 0],
      [Math.cos(a) * scale, Math.sin(a) * scale, 0],
      scaleC(COL.BONE_GHOST, 0.8), scaleC(COL.BONE_GHOST, 0.8));
  }
  // Ornaments
  for (let i = 0; i < symmetry; i++) {
    const a = (i / symmetry) * TAU + Math.PI / symmetry;
    const cx = Math.cos(a) * scale * 0.9, cy = Math.sin(a) * scale * 0.9;
    mergeInto(b, circleSegments({ cx, cy, r: scale * 0.03, segs: 12, color: scaleC(COL.BONE_GHOST, 0.9) }));
  }
  return finalize(b);
}

// ─── Tiny cross glyph (for far ring markers) ───────────────────────
function buildCrossGlyph({ size = 0.05 } = {}) {
  const b = { pos: [], col: [] };
  const c = scaleC(COL.BONE_DIM, 0.7);
  emitSeg(b.pos, b.col, [-size, 0, 0], [size, 0, 0], c, c);
  emitSeg(b.pos, b.col, [0, -size, 0], [0, size, 0], c, c);
  return finalize(b);
}

// ─── Diamond glyph ─────────────────────────────────────────────────
function buildDiamondGlyph({ size = 0.06 } = {}) {
  const b = { pos: [], col: [] };
  const c = scaleC(COL.BONE, 0.75);
  const pts = [[0, size, 0], [size, 0, 0], [0, -size, 0], [-size, 0, 0]];
  for (let k = 0; k < 4; k++) emitSeg(b.pos, b.col, pts[k], pts[(k+1)%4], c, c);
  return finalize(b);
}

// ═══════════════════════════════════════════════════════════════════════
// V15 NEW BUILDERS — 10 frontier cosmos / math models
// Kepler Mysterium · Gyroid · Menger · Spherical Harmonics · Chladni
// Ulam Spiral · Cosmic Web · Black Hole · Klein Bottle · Turing Patterns
// ═══════════════════════════════════════════════════════════════════════

// ─── Kepler's Mysterium Cosmographicum (1596) ────────────────────────
// 5 Platonic solids nested inside each other with inscribed spheres.
// The original orrery-cosmological model — perfect for this scene.
function buildKeplerMysterium({ scale = 1.0 } = {}) {
  const b = { pos: [], col: [] };
  const c = scaleC(COL.BONE, 0.75);
  const dim = scaleC(COL.BONE_DIM, 0.55);
  const orange = scaleC(COL.ORANGE_DOT, 0.6);

  // Outer: CUBE (circumscribes sphere r=1.0)
  {
    const r = 1.0 * scale;
    const h = r / Math.sqrt(3);
    const v = [];
    for (const sx of [-1,1]) for (const sy of [-1,1]) for (const sz of [-1,1]) v.push([sx*h, sy*h, sz*h]);
    const E = [[0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],[4,5],[4,6],[5,7],[6,7]];
    for (const [i,j] of E) emitSeg(b.pos, b.col, v[i], v[j], c, c);
    mergeInto(b, circleSegments({ r, segs: 88, color: dim }));
  }

  // TETRAHEDRON
  {
    const r = 0.62 * scale;
    const h = r / Math.sqrt(3);
    const v = [[h,h,h],[h,-h,-h],[-h,h,-h],[-h,-h,h]];
    const E = [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];
    for (const [i,j] of E) emitSeg(b.pos, b.col, v[i], v[j], c, c);
    mergeInto(b, circleSegments({ r, segs: 72, color: dim }));
  }

  // DODECAHEDRON
  {
    const r = 0.44 * scale;
    const phi = 1.6180339887;
    const a = r * 0.794;
    const v = [];
    for (const s1 of [-1,1]) for (const s2 of [-1,1]) for (const s3 of [-1,1]) v.push([s1*a, s2*a, s3*a]);
    for (const s1 of [-1,1]) for (const s2 of [-1,1]) v.push([0, s1*a/phi, s2*a*phi]);
    for (const s1 of [-1,1]) for (const s2 of [-1,1]) v.push([s1*a/phi, s2*a*phi, 0]);
    for (const s1 of [-1,1]) for (const s2 of [-1,1]) v.push([s1*a*phi, 0, s2*a/phi]);
    const target = 2 * a / phi;
    for (let i = 0; i < v.length; i++) {
      for (let j = i+1; j < v.length; j++) {
        const d = Math.hypot(v[i][0]-v[j][0], v[i][1]-v[j][1], v[i][2]-v[j][2]);
        if (Math.abs(d - target) < 0.03 * a) emitSeg(b.pos, b.col, v[i], v[j], c, c);
      }
    }
    mergeInto(b, circleSegments({ r, segs: 64, color: dim }));
  }

  // ICOSAHEDRON
  {
    const r = 0.30 * scale;
    const phi = 1.6180339887;
    const a = r * 0.805;
    const v = [
      [0, a, a*phi], [0, -a, a*phi], [0, a, -a*phi], [0, -a, -a*phi],
      [a, a*phi, 0], [-a, a*phi, 0], [a, -a*phi, 0], [-a, -a*phi, 0],
      [a*phi, 0, a], [-a*phi, 0, a], [a*phi, 0, -a], [-a*phi, 0, -a],
    ];
    const target = 2 * a;
    for (let i = 0; i < v.length; i++) {
      for (let j = i+1; j < v.length; j++) {
        const d = Math.hypot(v[i][0]-v[j][0], v[i][1]-v[j][1], v[i][2]-v[j][2]);
        if (Math.abs(d - target) < 0.03 * a) emitSeg(b.pos, b.col, v[i], v[j], c, c);
      }
    }
    mergeInto(b, circleSegments({ r, segs: 56, color: dim }));
  }

  // OCTAHEDRON (innermost — Mercury)
  {
    const r = 0.20 * scale;
    const v = [[r,0,0],[-r,0,0],[0,r,0],[0,-r,0],[0,0,r],[0,0,-r]];
    const E = [[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,4],[1,5],[2,4],[2,5],[3,4],[3,5]];
    for (const [i,j] of E) emitSeg(b.pos, b.col, v[i], v[j], scaleC(COL.BONE, 0.92), scaleC(COL.BONE, 0.92));
    mergeInto(b, circleSegments({ r: r * 0.55, segs: 40, color: orange }));
  }

  return finalize(b);
}

// ─── Gyroid — triply periodic minimal surface ────────────────────────
// sin(x)cos(y) + sin(y)cos(z) + sin(z)cos(x) = 0
function buildGyroid({ scale = 1.0, size = 1.4, resolution = 32, tolerance = 0.14 } = {}) {
  const b = { pos: [], col: [] };
  const c = scaleC(COL.BONE, 0.55);
  const step = (Math.PI * 2) / resolution;
  const H = size * scale;
  const g = (x,y,z) => Math.sin(x)*Math.cos(y) + Math.sin(y)*Math.cos(z) + Math.sin(z)*Math.cos(x);
  const toP = (x,y,z) => [((x/(Math.PI*2))-0.5)*H, ((y/(Math.PI*2))-0.5)*H, ((z/(Math.PI*2))-0.5)*H];

  for (let jj = 0; jj <= resolution; jj += 2) {
    const y = jj * step;
    for (let kk = 0; kk <= resolution; kk += 2) {
      const z = kk * step;
      let prev = null;
      for (let ii = 0; ii <= resolution; ii++) {
        const x = ii * step;
        if (Math.abs(g(x, y, z)) < tolerance) {
          const p = toP(x, y, z);
          if (prev) emitSeg(b.pos, b.col, prev, p, c, c);
          prev = p;
        } else prev = null;
      }
    }
  }
  for (let ii = 0; ii <= resolution; ii += 2) {
    const x = ii * step;
    for (let kk = 0; kk <= resolution; kk += 2) {
      const z = kk * step;
      let prev = null;
      for (let jj = 0; jj <= resolution; jj++) {
        const y = jj * step;
        if (Math.abs(g(x, y, z)) < tolerance) {
          const p = toP(x, y, z);
          if (prev) emitSeg(b.pos, b.col, prev, p, c, c);
          prev = p;
        } else prev = null;
      }
    }
  }
  for (let ii = 0; ii <= resolution; ii += 2) {
    const x = ii * step;
    for (let jj = 0; jj <= resolution; jj += 2) {
      const y = jj * step;
      let prev = null;
      for (let kk = 0; kk <= resolution; kk++) {
        const z = kk * step;
        if (Math.abs(g(x, y, z)) < tolerance) {
          const p = toP(x, y, z);
          if (prev) emitSeg(b.pos, b.col, prev, p, c, c);
          prev = p;
        } else prev = null;
      }
    }
  }

  return finalize(b);
}

// ─── Menger Sponge (3D fractal cube, iteration 2 = 400 subcubes) ─────
function buildMengerSponge({ scale = 1.0, iterations = 2 } = {}) {
  const b = { pos: [], col: [] };
  const c = scaleC(COL.BONE, 0.62);
  const dim = scaleC(COL.BONE_DIM, 0.55);

  const survives = [];
  for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) for (let z = 0; z < 3; z++) {
    const centers = (x===1?1:0) + (y===1?1:0) + (z===1?1:0);
    if (centers >= 2) continue;
    survives.push([x,y,z]);
  }

  let cubes = [[0,0,0]];
  let cubeSize = scale;
  for (let iter = 0; iter < iterations; iter++) {
    cubeSize /= 3;
    const next = [];
    for (const [cx,cy,cz] of cubes)
      for (const [dx,dy,dz] of survives)
        next.push([cx + dx*cubeSize, cy + dy*cubeSize, cz + dz*cubeSize]);
    cubes = next;
  }

  const off = -scale / 2;
  for (const [cx,cy,cz] of cubes) {
    const x0 = cx + off, y0 = cy + off, z0 = cz + off;
    const x1 = x0 + cubeSize, y1 = y0 + cubeSize, z1 = z0 + cubeSize;
    const v = [
      [x0,y0,z0],[x1,y0,z0],[x0,y1,z0],[x1,y1,z0],
      [x0,y0,z1],[x1,y0,z1],[x0,y1,z1],[x1,y1,z1]
    ];
    const E = [[0,1],[2,3],[0,2],[1,3],[4,5],[6,7],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]];
    for (const [i,j] of E) emitSeg(b.pos, b.col, v[i], v[j], c, c);
  }
  const h = scale / 2;
  const V = [[-h,-h,-h],[h,-h,-h],[-h,h,-h],[h,h,-h],[-h,-h,h],[h,-h,h],[-h,h,h],[h,h,h]];
  const EE = [[0,1],[2,3],[0,2],[1,3],[4,5],[6,7],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]];
  for (const [i,j] of EE) emitSeg(b.pos, b.col, V[i], V[j], dim, dim);

  return finalize(b);
}

// ─── Spherical Harmonics Y_lm (quantum orbital multi-lobe) ───────────
function buildSphericalHarmonics({ scale = 0.5, l = 3, m = 2, uSegs = 36, vSegs = 20 } = {}) {
  const b = { pos: [], col: [] };
  const c = scaleC(COL.BONE, 0.62);
  const dim = scaleC(COL.BONE_DIM, 0.4);

  const Ylm = (theta, phi) => {
    const s = Math.sin(theta), cv = Math.cos(theta);
    if (l === 3 && m === 2) return s*s * cv * Math.cos(m*phi);
    if (l === 4 && m === 3) return s*s*s * cv * Math.cos(m*phi);
    if (l === 2 && m === 1) return s * cv * Math.cos(phi);
    return Math.pow(s, l) * Math.cos(m*phi);
  };

  const grid = [];
  for (let i = 0; i <= vSegs; i++) {
    const theta = (i / vSegs) * Math.PI;
    const row = [];
    for (let j = 0; j <= uSegs; j++) {
      const phi = (j / uSegs) * TAU;
      const r = Math.abs(Ylm(theta, phi)) * scale * 2.8;
      row.push([
        r * Math.sin(theta) * Math.cos(phi),
        r * Math.cos(theta),
        r * Math.sin(theta) * Math.sin(phi),
      ]);
    }
    grid.push(row);
  }
  for (let i = 0; i <= vSegs; i++) {
    for (let j = 0; j < uSegs; j++) emitSeg(b.pos, b.col, grid[i][j], grid[i][j+1], c, c);
  }
  for (let j = 0; j <= uSegs; j += 2) {
    for (let i = 0; i < vSegs; i++) emitSeg(b.pos, b.col, grid[i][j], grid[i+1][j], dim, dim);
  }

  return finalize(b);
}

// ─── Chladni Figures — standing wave nodal patterns on a plate ───────
function buildChladniFigures({ scale = 0.8, m = 3, n = 5, resolution = 72 } = {}) {
  const b = { pos: [], col: [] };
  const c = scaleC(COL.BONE, 0.7);
  const dim = scaleC(COL.BONE_DIM, 0.45);

  const u = (x, y) => Math.cos(m*Math.PI*x)*Math.cos(n*Math.PI*y) - Math.cos(n*Math.PI*x)*Math.cos(m*Math.PI*y);
  const s = scale;

  const fr = scaleC(COL.BONE_DIM, 0.6);
  emitSeg(b.pos, b.col, [-s, -s, 0], [ s, -s, 0], fr, fr);
  emitSeg(b.pos, b.col, [ s, -s, 0], [ s,  s, 0], fr, fr);
  emitSeg(b.pos, b.col, [ s,  s, 0], [-s,  s, 0], fr, fr);
  emitSeg(b.pos, b.col, [-s,  s, 0], [-s, -s, 0], fr, fr);
  for (const [sx, sy] of [[-1,-1],[1,-1],[1,1],[-1,1]]) {
    const cx = sx*s*0.92, cy = sy*s*0.92, hh = 0.04*scale;
    emitSeg(b.pos, b.col, [cx-hh, cy, 0], [cx+hh, cy, 0], dim, dim);
    emitSeg(b.pos, b.col, [cx, cy-hh, 0], [cx, cy+hh, 0], dim, dim);
  }

  const interp = (v0, v1, a, bb) => {
    const t = a / (a - bb);
    return [v0[0] + t*(v1[0]-v0[0]), v0[1] + t*(v1[1]-v0[1]), 0];
  };
  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const x0 = -1 + (i/resolution)*2, x1 = -1 + ((i+1)/resolution)*2;
      const y0 = -1 + (j/resolution)*2, y1 = -1 + ((j+1)/resolution)*2;
      const a = u(x0, y0), bV = u(x1, y0), cV = u(x1, y1), dV = u(x0, y1);
      const idx = (a > 0 ? 1 : 0) | (bV > 0 ? 2 : 0) | (cV > 0 ? 4 : 0) | (dV > 0 ? 8 : 0);
      if (idx === 0 || idx === 15) continue;
      const p = [[x0*s,y0*s,0], [x1*s,y0*s,0], [x1*s,y1*s,0], [x0*s,y1*s,0]];
      const vs = [a, bV, cV, dV];
      const edges = [];
      if (((idx)&1) !== ((idx>>1)&1)) edges.push(interp(p[0], p[1], vs[0], vs[1]));
      if (((idx>>1)&1) !== ((idx>>2)&1)) edges.push(interp(p[1], p[2], vs[1], vs[2]));
      if (((idx>>2)&1) !== ((idx>>3)&1)) edges.push(interp(p[2], p[3], vs[2], vs[3]));
      if (((idx>>3)&1) !== ((idx)&1)) edges.push(interp(p[3], p[0], vs[3], vs[0]));
      if (edges.length >= 2) emitSeg(b.pos, b.col, edges[0], edges[1], c, c);
      if (edges.length >= 4) emitSeg(b.pos, b.col, edges[2], edges[3], c, c);
    }
  }
  return finalize(b);
}

// ─── Ulam Spiral — prime number square spiral ────────────────────────
function buildUlamSpiral({ scale = 0.5, maxN = 400, cellStep = 0.055 } = {}) {
  const b = { pos: [], col: [] };
  const c = scaleC(COL.BONE, 0.78);
  const dim = scaleC(COL.BONE_DEEP, 0.8);
  const orange = scaleC(COL.ORANGE_DOT, 0.75);

  const sieve = new Uint8Array(maxN + 1);
  sieve[0] = sieve[1] = 1;
  for (let i = 2; i * i <= maxN; i++) {
    if (!sieve[i]) for (let j = i*i; j <= maxN; j += i) sieve[j] = 1;
  }

  let x = 0, y = 0, dx = 1, dy = 0;
  let stepsInDir = 1, stepCount = 0, dirChanges = 0;
  const pts = [];
  for (let n = 1; n <= maxN; n++) {
    pts.push({ x: x * cellStep * scale, y: y * cellStep * scale, prime: !sieve[n] && n > 1, isOne: n === 1 });
    x += dx; y += dy;
    if (++stepCount === stepsInDir) {
      stepCount = 0;
      const ndx = -dy, ndy = dx;
      dx = ndx; dy = ndy;
      if (++dirChanges === 2) { stepsInDir++; dirChanges = 0; }
    }
  }

  for (let i = 0; i < pts.length - 1; i++) {
    emitSeg(b.pos, b.col, [pts[i].x, pts[i].y, 0], [pts[i+1].x, pts[i+1].y, 0], dim, dim);
  }
  const h = cellStep * scale * 0.36;
  for (const p of pts) {
    if (p.prime) {
      emitSeg(b.pos, b.col, [p.x - h, p.y, 0], [p.x + h, p.y, 0], c, c);
      emitSeg(b.pos, b.col, [p.x, p.y - h, 0], [p.x, p.y + h, 0], c, c);
    }
    if (p.isOne) {
      emitSeg(b.pos, b.col, [p.x - h*1.8, p.y, 0], [p.x + h*1.8, p.y, 0], orange, orange);
      emitSeg(b.pos, b.col, [p.x, p.y - h*1.8, 0], [p.x, p.y + h*1.8, 0], orange, orange);
    }
  }
  return finalize(b);
}

// ─── Cosmic Web — large-scale filamentary structure of the universe ──
function buildCosmicWeb({ scale = 1.0, nodeCount = 40, seed = 33 } = {}) {
  const b = { pos: [], col: [] };
  const c = scaleC(COL.BONE_DIM, 0.6);
  const dim = scaleC(COL.BONE_DEEP, 0.9);
  const rand = mkRand(seed);

  const nodes = [];
  for (let i = 0; i < nodeCount; i++) {
    const u = rand() * 2 - 1;
    const theta = rand() * TAU;
    const rr = scale * (0.75 + rand() * 0.25);
    const ph = Math.sqrt(1 - u*u);
    nodes.push([rr * Math.cos(theta) * ph, rr * u, rr * Math.sin(theta) * ph]);
  }

  for (let i = 0; i < nodes.length; i++) {
    const ds = nodes.map((n, j) => ({ j, d: Math.hypot(nodes[i][0]-n[0], nodes[i][1]-n[1], nodes[i][2]-n[2]) }))
      .filter(x => x.j !== i).sort((a,bb) => a.d - bb.d);
    const conns = Math.min(3, ds.length);
    for (let k = 0; k < conns; k++) {
      const j = ds[k].j;
      if (j < i) continue;
      const p1 = nodes[i], p2 = nodes[j];
      const mid = [(p1[0]+p2[0])*0.42, (p1[1]+p2[1])*0.42, (p1[2]+p2[2])*0.42];
      const segs = 12;
      let prev = p1;
      for (let s = 1; s <= segs; s++) {
        const t = s / segs, uu = 1 - t;
        const cur = [
          uu*uu*p1[0] + 2*uu*t*mid[0] + t*t*p2[0],
          uu*uu*p1[1] + 2*uu*t*mid[1] + t*t*p2[1],
          uu*uu*p1[2] + 2*uu*t*mid[2] + t*t*p2[2],
        ];
        emitSeg(b.pos, b.col, prev, cur, c, c);
        prev = cur;
      }
    }
    const hh = 0.035 * scale;
    const n = nodes[i];
    emitSeg(b.pos, b.col, [n[0]-hh, n[1], n[2]], [n[0]+hh, n[1], n[2]], dim, dim);
    emitSeg(b.pos, b.col, [n[0], n[1]-hh, n[2]], [n[0], n[1]+hh, n[2]], dim, dim);
    emitSeg(b.pos, b.col, [n[0], n[1], n[2]-hh], [n[0], n[1], n[2]+hh], dim, dim);
  }
  return finalize(b);
}

// ─── Black Hole with Accretion Disk + Relativistic Jets ──────────────
function buildBlackHoleAccretion({ scale = 0.6 } = {}) {
  const b = { pos: [], col: [] };
  const c = scaleC(COL.BONE, 0.9);
  const orange = scaleC(COL.ORANGE_DOT, 0.78);
  const rose = scaleC(COL.ROSE, 0.7);
  const dim = scaleC(COL.BONE_DEEP, 0.95);

  mergeInto(b, circleSegments({ r: 0.35 * scale, segs: 96, color: c }));
  mergeInto(b, circleSegments({ r: 0.525 * scale, segs: 96, color: scaleC(c, 0.55), dashed: true, dashOn: 2, dashOff: 3 }));
  mergeInto(b, circleSegments({ r: 1.05 * scale, segs: 120, color: orange }));
  for (let i = 0; i < 6; i++) {
    const rr = scale * (1.20 + i * 0.18);
    const col = i === 0 ? orange : (i < 3 ? scaleC(orange, 0.65) : dim);
    mergeInto(b, circleSegments({ r: rr, segs: 160, color: col, dashed: (i > 0), dashOn: 2 + i, dashOff: 2 }));
  }
  for (let s = 0; s < 10; s++) {
    const phase = (s / 10) * TAU;
    const segs = 220;
    const rStart = scale * 2.2, rEnd = scale * 0.38;
    let prev = null;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const rr = rStart * Math.pow(rEnd / rStart, t);
      const a = phase + t * Math.PI * 4.2;
      const p = [rr * Math.cos(a), rr * Math.sin(a), 0];
      const col = lerpC(dim, orange, t);
      if (prev) emitSeg(b.pos, b.col, prev, p, col, col);
      prev = p;
    }
  }
  for (const sign of [-1, 1]) {
    const segs = 40;
    const h = scale * 3.0;
    let prev = [0, 0, 0];
    for (let i = 1; i <= segs; i++) {
      const t = i / segs;
      const y = sign * t * h;
      const rad = 0.14 * scale * (1 - t * 0.75);
      const a = t * Math.PI * 2.2 + (sign > 0 ? 0 : Math.PI);
      const p = [rad * Math.cos(a), y, rad * Math.sin(a)];
      const col = lerpC(c, dim, t);
      emitSeg(b.pos, b.col, prev, p, col, col);
      prev = p;
      if (i % 8 === 0) {
        mergeInto(b, circleSegments({ cx: 0, cy: y, cz: 0, r: rad, segs: 24, color: scaleC(dim, 0.7) }));
      }
    }
  }
  const hh = 0.022 * scale;
  emitSeg(b.pos, b.col, [-hh, 0, 0], [hh, 0, 0], rose, rose);
  emitSeg(b.pos, b.col, [0, -hh, 0], [0, hh, 0], rose, rose);
  emitSeg(b.pos, b.col, [0, 0, -hh], [0, 0, hh], rose, rose);
  return finalize(b);
}

// ─── Klein Bottle (4D non-orientable surface in 3D immersion) ────────
function buildKleinBottle({ scale = 0.4, uSegs = 54, vSegs = 14 } = {}) {
  const b = { pos: [], col: [] };
  const c = scaleC(COL.BONE, 0.7);
  const dim = scaleC(COL.BONE_DIM, 0.45);

  const klein = (u, v) => {
    const cu = Math.cos(u), su = Math.sin(u);
    const cv = Math.cos(v), sv = Math.sin(v);
    const r = 4 * (1 - cu / 2);
    let x, y, z;
    if (u < Math.PI) {
      x = 6 * cu * (1 + su) + r * cu * cv;
      z = -16 * su - r * su * cv;
    } else {
      x = 6 * cu * (1 + su) + r * Math.cos(v + Math.PI);
      z = -16 * su;
    }
    y = r * sv;
    return [x * 0.042 * scale, y * 0.042 * scale, z * 0.042 * scale];
  };

  const grid = [];
  for (let i = 0; i <= uSegs; i++) {
    const u = (i / uSegs) * TAU;
    const row = [];
    for (let j = 0; j <= vSegs; j++) {
      const v = (j / vSegs) * TAU;
      row.push(klein(u, v));
    }
    grid.push(row);
  }
  for (let j = 0; j <= vSegs; j += 2) {
    for (let i = 0; i < uSegs; i++) emitSeg(b.pos, b.col, grid[i][j], grid[i+1][j], c, c);
  }
  for (let i = 0; i <= uSegs; i += 3) {
    for (let j = 0; j < vSegs; j++) emitSeg(b.pos, b.col, grid[i][j], grid[i][j+1], dim, dim);
  }
  return finalize(b);
}

// ─── Turing Patterns — reaction-diffusion labyrinth ──────────────────
function buildTuringPatterns({ scale = 0.8, resolution = 88 } = {}) {
  const b = { pos: [], col: [] };
  const c = scaleC(COL.BONE, 0.62);
  const dim = scaleC(COL.BONE_DIM, 0.35);

  const field = (x, y) => {
    const a = Math.sin(x * 8.5 + Math.cos(y * 6.3) * 2.1);
    const bb = Math.cos(y * 7.7 + Math.sin(x * 5.1) * 2.3);
    return a + bb * 0.85 + Math.sin((x*1.3 + y*0.9) * 4.1) * 0.4;
  };
  const s = scale;

  mergeInto(b, circleSegments({ r: s * 1.02, segs: 96, color: dim }));

  const interp = (v0, v1, a, bb) => {
    const t = a / (a - bb);
    return [v0[0] + t*(v1[0]-v0[0]), v0[1] + t*(v1[1]-v0[1]), 0];
  };
  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const x0 = -1 + (i/resolution)*2, x1 = -1 + ((i+1)/resolution)*2;
      const y0 = -1 + (j/resolution)*2, y1 = -1 + ((j+1)/resolution)*2;
      if (x0*x0 + y0*y0 > 1.02) continue;
      const a = field(x0, y0), bV = field(x1, y0), cV = field(x1, y1), dV = field(x0, y1);
      const idx = (a > 0 ? 1 : 0) | (bV > 0 ? 2 : 0) | (cV > 0 ? 4 : 0) | (dV > 0 ? 8 : 0);
      if (idx === 0 || idx === 15) continue;
      const p = [[x0*s,y0*s,0], [x1*s,y0*s,0], [x1*s,y1*s,0], [x0*s,y1*s,0]];
      const vs = [a, bV, cV, dV];
      const edges = [];
      if (((idx)&1) !== ((idx>>1)&1)) edges.push(interp(p[0], p[1], vs[0], vs[1]));
      if (((idx>>1)&1) !== ((idx>>2)&1)) edges.push(interp(p[1], p[2], vs[1], vs[2]));
      if (((idx>>2)&1) !== ((idx>>3)&1)) edges.push(interp(p[2], p[3], vs[2], vs[3]));
      if (((idx>>3)&1) !== ((idx)&1)) edges.push(interp(p[3], p[0], vs[3], vs[0]));
      if (edges.length >= 2) emitSeg(b.pos, b.col, edges[0], edges[1], c, c);
      if (edges.length >= 4) emitSeg(b.pos, b.col, edges[2], edges[3], c, c);
    }
  }
  return finalize(b);
}

// ═══════════════════════════════════════════════════════════════════════
// V15.1 NEW BUILDERS — 8 more: Voronoi, Poincaré, Galaxy, Ford, Epicycloid,
//                      24-cell, Bloch, Log-Spiral
// ═══════════════════════════════════════════════════════════════════════

// ─── Voronoi Tessellation — space partitioning ───────────────────────
function buildVoronoiTessellation({ scale = 0.5, cellCount = 24, seed = 7 } = {}) {
  const b = { pos: [], col: [] };
  const c = scaleC(COL.BONE, 0.7);
  const dim = scaleC(COL.BONE_DIM, 0.45);
  const rand = mkRand(seed);

  // Random seed points in unit disk
  const sites = [];
  for (let i = 0; i < cellCount; i++) {
    const r = Math.sqrt(rand()) * 0.95;
    const a = rand() * TAU;
    sites.push([r * Math.cos(a), r * Math.sin(a)]);
  }

  // Approximate Voronoi by sampling a grid + drawing cell boundaries
  const res = 120;
  const owner = new Int16Array(res * res);
  for (let i = 0; i < res; i++) {
    for (let j = 0; j < res; j++) {
      const x = (i / (res - 1)) * 2 - 1;
      const y = (j / (res - 1)) * 2 - 1;
      let best = 0, bestD = Infinity;
      for (let k = 0; k < sites.length; k++) {
        const dx = x - sites[k][0], dy = y - sites[k][1];
        const d = dx*dx + dy*dy;
        if (d < bestD) { bestD = d; best = k; }
      }
      owner[i * res + j] = best;
    }
  }
  // Draw boundaries (pixels where neighbor is different)
  const s = scale;
  for (let i = 0; i < res - 1; i++) {
    for (let j = 0; j < res - 1; j++) {
      const o = owner[i * res + j];
      const oR = owner[(i + 1) * res + j];
      const oU = owner[i * res + (j + 1)];
      const x = ((i + 0.5) / (res - 1)) * 2 - 1;
      const y = ((j + 0.5) / (res - 1)) * 2 - 1;
      if (x*x + y*y > 1) continue;
      if (o !== oR) {
        const px = ((i + 1) / (res - 1)) * 2 - 1;
        emitSeg(b.pos, b.col, [px*s, (j/(res-1))*2*s - s, 0], [px*s, ((j+1)/(res-1))*2*s - s, 0], c, c);
      }
      if (o !== oU) {
        const py = ((j + 1) / (res - 1)) * 2 - 1;
        emitSeg(b.pos, b.col, [(i/(res-1))*2*s - s, py*s, 0], [((i+1)/(res-1))*2*s - s, py*s, 0], c, c);
      }
    }
  }
  // Site markers
  for (const [x, y] of sites) {
    const h = 0.025 * scale;
    emitSeg(b.pos, b.col, [x*s - h, y*s, 0], [x*s + h, y*s, 0], dim, dim);
    emitSeg(b.pos, b.col, [x*s, y*s - h, 0], [x*s, y*s + h, 0], dim, dim);
  }
  // Bounding circle
  mergeInto(b, circleSegments({ r: s, segs: 96, color: dim }));
  return finalize(b);
}

// ─── Poincaré Disk Hyperbolic Tiling {7,3} ───────────────────────────
function buildPoincareDisk({ scale = 0.5, generations = 3 } = {}) {
  const b = { pos: [], col: [] };
  const c = scaleC(COL.BONE, 0.68);
  const dim = scaleC(COL.BONE_DIM, 0.4);

  // Simplified: draw concentric hyperbolic arcs evocative of {7,3} tiling
  // Unit disk boundary
  mergeInto(b, circleSegments({ r: scale, segs: 128, color: c }));

  // Radial chords + perpendicular circles
  const primary = 7;
  for (let i = 0; i < primary; i++) {
    const a = (i / primary) * TAU;
    // Inside the disk, draw chord from edge to edge
    emitSeg(b.pos, b.col,
      [Math.cos(a) * scale, Math.sin(a) * scale, 0],
      [Math.cos(a + Math.PI) * scale, Math.sin(a + Math.PI) * scale, 0],
      dim, dim);
  }

  // Smaller tile circles inscribed
  for (let g = 1; g <= generations; g++) {
    const count = primary * g;
    const r = scale * (0.85 - g * 0.2);
    if (r <= 0) break;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TAU + (g * 0.15);
      const cx = Math.cos(a) * (scale - r) * 0.88;
      const cy = Math.sin(a) * (scale - r) * 0.88;
      mergeInto(b, circleSegments({ cx, cy, r: r * 0.45, segs: 36, color: scaleC(COL.BONE, 0.55 - g * 0.08) }));
    }
  }

  // Central 7-gon
  const innerR = scale * 0.18;
  const pts = [];
  for (let i = 0; i < primary; i++) {
    const a = (i / primary) * TAU + Math.PI / primary;
    pts.push([innerR * Math.cos(a), innerR * Math.sin(a), 0]);
  }
  for (let i = 0; i < primary; i++) emitSeg(b.pos, b.col, pts[i], pts[(i+1) % primary], c, c);
  return finalize(b);
}

// ─── Spiral Galaxy — log-spiral arms + scattered stars ───────────────
function buildSpiralGalaxy({ scale = 1.0, arms = 4, starsPerArm = 70, armTurns = 1.4, seed = 42 } = {}) {
  const b = { pos: [], col: [] };
  const c = scaleC(COL.BONE, 0.6);
  const dim = scaleC(COL.BONE_DIM, 0.5);
  const orange = scaleC(COL.ORANGE_DOT, 0.55);
  const rand = mkRand(seed);

  // Central bulge — small dense circle
  mergeInto(b, circleSegments({ r: scale * 0.12, segs: 48, color: c }));
  mergeInto(b, circleSegments({ r: scale * 0.08, segs: 36, color: orange }));

  // Log spiral arms
  for (let a = 0; a < arms; a++) {
    const phaseOff = (a / arms) * TAU;
    const segs = 120;
    let prev = null;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const theta = phaseOff + t * armTurns * TAU;
      const r = scale * (0.08 + t * 0.9) * Math.exp(t * 0.3);
      const p = [r * Math.cos(theta), r * Math.sin(theta), 0];
      if (prev) emitSeg(b.pos, b.col, prev, p, c, c);
      prev = p;
    }
    // Scattered stars along arm (with jitter)
    for (let k = 0; k < starsPerArm; k++) {
      const t = rand();
      const theta = phaseOff + t * armTurns * TAU + (rand() - 0.5) * 0.25;
      const r = scale * (0.08 + t * 0.9) * Math.exp(t * 0.3) + (rand() - 0.5) * 0.06 * scale;
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      const h = 0.015 * scale;
      emitSeg(b.pos, b.col, [x - h, y, 0], [x + h, y, 0], dim, dim);
      emitSeg(b.pos, b.col, [x, y - h, 0], [x, y + h, 0], dim, dim);
    }
  }
  // Faint galactic disk outline
  mergeInto(b, circleSegments({ r: scale * 1.05, segs: 96, color: scaleC(COL.BONE_DEEP, 0.9), dashed: true, dashOn: 1, dashOff: 3 }));
  return finalize(b);
}

// ─── Ford Circles — tangent circles indexed by rationals p/q ─────────
function buildFordCircles({ scale = 0.5, qMax = 12 } = {}) {
  const b = { pos: [], col: [] };
  const c = scaleC(COL.BONE, 0.72);
  const dim = scaleC(COL.BONE_DIM, 0.5);

  // Baseline
  emitSeg(b.pos, b.col, [-scale, 0, 0], [scale, 0, 0], dim, dim);

  // Ford circles: for reduced p/q, circle at (p/q, 1/(2q²)) with radius 1/(2q²)
  const gcd = (a, bv) => bv ? gcd(bv, a % bv) : a;
  for (let q = 1; q <= qMax; q++) {
    for (let p = 0; p <= q; p++) {
      if (gcd(p, q) !== 1 && !(p === 0 && q === 1)) continue;
      const cx = (p / q * 2 - 1) * scale;
      const r = (1 / (2 * q * q)) * scale;
      const cy = r;
      mergeInto(b, circleSegments({ cx, cy, r, segs: Math.max(20, Math.floor(56 / q)), color: c }));
    }
  }
  // Mirror below baseline for symmetry
  for (let q = 1; q <= qMax; q++) {
    for (let p = 0; p <= q; p++) {
      if (gcd(p, q) !== 1 && !(p === 0 && q === 1)) continue;
      const cx = (p / q * 2 - 1) * scale;
      const r = (1 / (2 * q * q)) * scale;
      const cy = -r;
      mergeInto(b, circleSegments({ cx, cy, r, segs: Math.max(20, Math.floor(56 / q)), color: scaleC(c, 0.6) }));
    }
  }
  return finalize(b);
}

// ─── Epicycloid — curve traced by point on rolling circle ────────────
function buildEpicycloid({ scale = 0.5, cusps = 7, segs = 540 } = {}) {
  const b = { pos: [], col: [] };
  const c = scaleC(COL.BONE, 0.75);
  const dim = scaleC(COL.BONE_DIM, 0.5);

  // Parametric: R = k+1 (outer), r = 1 (rolling)
  const k = cusps;
  let prev = null;
  for (let i = 0; i <= segs; i++) {
    const t = (i / segs) * TAU;
    const x = scale * ((k + 1) * Math.cos(t) - Math.cos((k + 1) * t)) / (k + 2);
    const y = scale * ((k + 1) * Math.sin(t) - Math.sin((k + 1) * t)) / (k + 2);
    const p = [x, y, 0];
    if (prev) emitSeg(b.pos, b.col, prev, p, c, c);
    prev = p;
  }
  // Reference circles
  mergeInto(b, circleSegments({ r: scale * 0.25, segs: 48, color: dim }));
  mergeInto(b, circleSegments({ r: scale * 0.95, segs: 96, color: scaleC(dim, 0.6), dashed: true, dashOn: 1, dashOff: 3 }));
  return finalize(b);
}

// ─── 24-cell — unique 4D polytope with no 3D analog ──────────────────
function buildTwentyFourCell({ scale = 0.6, w = 0.4 } = {}) {
  const b = { pos: [], col: [] };
  const c = scaleC(COL.BONE, 0.7);
  const dim = scaleC(COL.BONE_DIM, 0.5);

  // 24 vertices of 24-cell: all permutations of (±1, ±1, 0, 0)
  const verts4 = [];
  const posits = [[1, 1, 0, 0], [1, -1, 0, 0], [-1, 1, 0, 0], [-1, -1, 0, 0]];
  const indices = [
    [0, 1, 2, 3], [0, 1, 3, 2], [0, 2, 1, 3], [0, 2, 3, 1], [0, 3, 1, 2], [0, 3, 2, 1],
  ];
  // Simpler: generate all permutations of ±1,±1,0,0 over 4 coords
  const coords = [0, 1, 2, 3];
  const gen = (arr) => {
    const set = new Set();
    for (const [i, j] of [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]]) {
      for (const si of [-1, 1]) for (const sj of [-1, 1]) {
        const v = [0, 0, 0, 0];
        v[i] = si; v[j] = sj;
        set.add(v.join(','));
      }
    }
    return Array.from(set).map(s => s.split(',').map(Number));
  };
  const vs4 = gen();

  // 4D → 3D projection using w-axis: p3 = p[0..2] * (1 / (w - p[3]))
  const project = (v) => {
    const wf = 1 / (w + v[3] * 0.5);
    return [v[0] * scale * wf, v[1] * scale * wf, v[2] * scale * wf];
  };
  const verts3 = vs4.map(project);

  // Edges: connect vertices at minimum squared distance
  const sqDists = [];
  for (let i = 0; i < vs4.length; i++) {
    for (let j = i + 1; j < vs4.length; j++) {
      const d = vs4[i].reduce((acc, v, k) => acc + (v - vs4[j][k]) ** 2, 0);
      sqDists.push({ i, j, d });
    }
  }
  sqDists.sort((a, bb) => a.d - bb.d);
  const minD = sqDists[0].d;
  for (const e of sqDists) {
    if (Math.abs(e.d - minD) > 0.01) break;
    emitSeg(b.pos, b.col, verts3[e.i], verts3[e.j], c, c);
  }
  // Draw 3 orthogonal equatorial circles
  mergeInto(b, circleSegments({ cx: 0, cy: 0, cz: 0, r: scale * 0.45, segs: 64, color: dim }));
  return finalize(b);
}

// ─── Bloch Sphere — quantum bit state representation ─────────────────
function buildBlochSphere({ scale = 0.4, latCount = 6, lonCount = 8 } = {}) {
  const b = { pos: [], col: [] };
  const c = scaleC(COL.BONE, 0.7);
  const dim = scaleC(COL.BONE_DIM, 0.45);
  const orange = scaleC(COL.ORANGE_DOT, 0.75);

  // Great circles
  // Equator
  mergeInto(b, circleSegments({ r: scale, segs: 96, color: c }));
  // Prime meridian (XY → XZ by rotating)
  {
    const segs = 96;
    for (let i = 0; i < segs; i++) {
      const a1 = (i / segs) * TAU, a2 = ((i + 1) / segs) * TAU;
      emitSeg(b.pos, b.col,
        [scale * Math.cos(a1), 0, scale * Math.sin(a1)],
        [scale * Math.cos(a2), 0, scale * Math.sin(a2)], c, c);
      emitSeg(b.pos, b.col,
        [0, scale * Math.cos(a1), scale * Math.sin(a1)],
        [0, scale * Math.cos(a2), scale * Math.sin(a2)], c, c);
    }
  }

  // Latitudes (faint)
  for (let i = 1; i < latCount; i++) {
    const phi = (i / latCount) * Math.PI - Math.PI / 2;
    if (Math.abs(phi) < 0.01) continue;
    const r = scale * Math.cos(phi);
    const y = scale * Math.sin(phi);
    mergeInto(b, circleSegments({ cx: 0, cy: y, cz: 0, r, segs: 56, color: dim, dashed: true, dashOn: 1, dashOff: 2 }));
  }

  // |0⟩ axis (Z+) and |1⟩ axis (Z-)
  emitSeg(b.pos, b.col, [0, scale * 1.25, 0], [0, -scale * 1.25, 0], orange, orange);
  // |+⟩, |-⟩ axes (X)
  emitSeg(b.pos, b.col, [-scale * 1.2, 0, 0], [scale * 1.2, 0, 0], scaleC(c, 0.7), scaleC(c, 0.7));
  emitSeg(b.pos, b.col, [0, 0, -scale * 1.2], [0, 0, scale * 1.2], scaleC(c, 0.7), scaleC(c, 0.7));

  // A sample state vector (Bloch vector)
  const theta = 1.05, phi = 1.4;
  const stateV = [scale * 0.92 * Math.sin(theta) * Math.cos(phi),
                  scale * 0.92 * Math.cos(theta),
                  scale * 0.92 * Math.sin(theta) * Math.sin(phi)];
  emitSeg(b.pos, b.col, [0, 0, 0], stateV, orange, orange);
  // Tip arrow
  const tipR = 0.04 * scale;
  mergeInto(b, circleSegments({ cx: stateV[0], cy: stateV[1], cz: stateV[2], r: tipR, segs: 12, color: orange }));
  return finalize(b);
}

// ─── Logarithmic Spiral — different from Fibonacci (equiangular) ────
function buildLogarithmicSpiral({ scale = 0.5, turns = 3.5, a = 0.14, b_ = 0.21, segs = 360 } = {}) {
  const bld = { pos: [], col: [] };
  const c = scaleC(COL.BONE, 0.75);
  const dim = scaleC(COL.BONE_DIM, 0.5);

  let prev = null;
  for (let i = 0; i <= segs; i++) {
    const t = (i / segs) * turns * TAU;
    const r = a * Math.exp(b_ * t) * scale;
    const p = [r * Math.cos(t), r * Math.sin(t), 0];
    if (prev) emitSeg(bld.pos, bld.col, prev, p, c, c);
    prev = p;
  }
  // Perpendicular tangent markers at each quarter turn
  for (let k = 1; k <= Math.floor(turns * 4); k++) {
    const t = (k / 4) * TAU;
    const r = a * Math.exp(b_ * t) * scale;
    const x = r * Math.cos(t), y = r * Math.sin(t);
    const tx = -Math.sin(t), ty = Math.cos(t);
    const h = 0.03 * scale;
    emitSeg(bld.pos, bld.col, [x - tx * h, y - ty * h, 0], [x + tx * h, y + ty * h, 0], dim, dim);
  }
  // Central dot
  const h = 0.015 * scale;
  const orange = scaleC(COL.ORANGE_DOT, 0.7);
  emitSeg(bld.pos, bld.col, [-h, 0, 0], [h, 0, 0], orange, orange);
  emitSeg(bld.pos, bld.col, [0, -h, 0], [0, h, 0], orange, orange);
  return finalize(bld);
}

// ═══════════════════════════════════════════════════════════════════════
// ORRERY-SPECIFIC BUILDERS — rings, connectors, axial shaft
// ═══════════════════════════════════════════════════════════════════════

// ─── Central vertical axis ─────────────────────────────────────────
function buildCentralAxis({ height = 12, tickCount = 40, beadCount = 24 } = {}) {
  const b = { pos: [], col: [] };
  // Main vertical line
  emitSeg(b.pos, b.col, [0, -height / 2, 0], [0, height / 2, 0],
    scaleC(COL.BONE_DIM, 0.5), scaleC(COL.BONE_DIM, 0.5));
  // Ticks
  for (let i = 0; i < tickCount; i++) {
    const y = -height / 2 + (i / (tickCount - 1)) * height;
    const tl = (i % 5 === 0) ? 0.06 : 0.02;
    emitSeg(b.pos, b.col, [-tl, y, 0], [tl, y, 0],
      scaleC(COL.BONE_DEEP, 0.9), scaleC(COL.BONE_DEEP, 0.9));
  }
  // Beads along axis (for THREE.Points sprite rendering — return separate arr)
  const beads = new Float32Array(beadCount * 3);
  for (let i = 0; i < beadCount; i++) {
    const t = i / (beadCount - 1);
    beads[i * 3] = 0;
    beads[i * 3 + 1] = -height / 2 + t * height;
    beads[i * 3 + 2] = 0;
  }
  return { ...finalize(b), beads };
}

// ─── Rich ring — main + dashed halo + ticks — for an orbit ───────
function buildOrreryRing({
  radius, segs = 220, tickCount = 36,
  mainColor = COL.BONE, haloColor = COL.BONE_DEEP,
  style = 'solid',        // 'solid'|'shortDash'|'longDash'|'dotted'|'sparseDot'|'double'|'triple'|'irregular'|'ghost'
  haloStyle = 'dashed',   // 'dashed'|'dotted'|'none'
  tickStyle = 'default',  // 'default'|'major-only'|'random'|'none'
  seed = 17,
} = {}) {
  const b = { pos: [], col: [] };
  const mainC = scaleC(mainColor, 0.68);

  // MAIN LINE with varied style
  if (style === 'solid') {
    mergeInto(b, circleSegments({ r: radius, segs, color: mainC }));
  } else if (style === 'shortDash') {
    mergeInto(b, circleSegments({ r: radius, segs, color: mainC, dashed: true, dashOn: 2, dashOff: 1 }));
  } else if (style === 'longDash') {
    mergeInto(b, circleSegments({ r: radius, segs, color: mainC, dashed: true, dashOn: 4, dashOff: 3 }));
  } else if (style === 'dotted') {
    mergeInto(b, circleSegments({ r: radius, segs: Math.floor(segs * 1.3), color: mainC, dashed: true, dashOn: 1, dashOff: 2 }));
  } else if (style === 'sparseDot') {
    mergeInto(b, circleSegments({ r: radius, segs: Math.floor(segs * 1.4), color: mainC, dashed: true, dashOn: 1, dashOff: 4 }));
  } else if (style === 'double') {
    mergeInto(b, circleSegments({ r: radius - 0.035, segs, color: scaleC(mainColor, 0.52) }));
    mergeInto(b, circleSegments({ r: radius + 0.035, segs, color: scaleC(mainColor, 0.52) }));
  } else if (style === 'triple') {
    mergeInto(b, circleSegments({ r: radius - 0.06, segs: Math.floor(segs * 0.9), color: scaleC(mainColor, 0.42) }));
    mergeInto(b, circleSegments({ r: radius,         segs, color: scaleC(mainColor, 0.58) }));
    mergeInto(b, circleSegments({ r: radius + 0.06, segs: Math.floor(segs * 0.9), color: scaleC(mainColor, 0.42) }));
  } else if (style === 'irregular') {
    const rand = mkRand(seed + Math.floor(radius * 31));
    for (let i = 0; i < segs; i++) {
      if (rand() < 0.32) continue;  // skip ~32% randomly
      const a1 = (i / segs) * TAU;
      const a2 = ((i + 1) / segs) * TAU;
      const brightness = 0.45 + rand() * 0.4;
      const col = scaleC(mainColor, brightness);
      emitSeg(b.pos, b.col,
        [Math.cos(a1) * radius, Math.sin(a1) * radius, 0],
        [Math.cos(a2) * radius, Math.sin(a2) * radius, 0], col, col);
    }
  } else if (style === 'ghost') {
    mergeInto(b, circleSegments({ r: radius, segs, color: scaleC(mainColor, 0.22) }));
  }

  // HALO
  if (haloStyle === 'dashed') {
    mergeInto(b, circleSegments({
      r: radius * 1.035, segs: Math.floor(segs * 1.05),
      dashed: true, dashOn: 2, dashOff: 3,
      color: scaleC(haloColor, 1.0),
    }));
    mergeInto(b, circleSegments({
      r: radius * 0.965, segs: Math.floor(segs * 1.05),
      dashed: true, dashOn: 1, dashOff: 2,
      color: scaleC(haloColor, 0.6),
    }));
  } else if (haloStyle === 'dotted') {
    mergeInto(b, circleSegments({
      r: radius * 1.045, segs: Math.floor(segs * 1.15),
      dashed: true, dashOn: 1, dashOff: 3,
      color: scaleC(haloColor, 0.85),
    }));
  }

  // RADIAL TICKS
  if (tickStyle !== 'none') {
    for (let i = 0; i < tickCount; i++) {
      const a = (i / tickCount) * TAU;
      const major = (i % 9 === 0);
      if (tickStyle === 'major-only' && !major) continue;
      if (tickStyle === 'random' && ((i * 17 + Math.floor(radius * 7)) % 13) < 5) continue;
      const tl = major ? 0.11 : 0.04;
      const r1 = radius - tl * 0.5, r2 = radius + tl * 0.5;
      emitSeg(b.pos, b.col,
        [Math.cos(a) * r1, Math.sin(a) * r1, 0],
        [Math.cos(a) * r2, Math.sin(a) * r2, 0],
        scaleC(COL.BONE_DIM, major ? 0.9 : 0.5),
        scaleC(COL.BONE_DIM, major ? 0.9 : 0.5));
    }
  }
  return finalize(b);
}

// ─── Dense orbital particles along a ring ─────────────────────────
function buildOrbitParticles({ radius, count = 140 } = {}) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TAU;
    positions[i * 3] = Math.cos(a) * radius;
    positions[i * 3 + 1] = Math.sin(a) * radius;
    positions[i * 3 + 2] = 0;
  }
  return positions;
}

// ─── Radial connectors: axis → ring at N spokes ──────────────────
function buildRadialSpokes({ innerR = 0, outerR = 2, count = 6, color = COL.BONE_GHOST } = {}) {
  const b = { pos: [], col: [] };
  const c = scaleC(color, 0.9);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TAU;
    emitSeg(b.pos, b.col,
      [Math.cos(a) * innerR, Math.sin(a) * innerR, 0],
      [Math.cos(a) * outerR, Math.sin(a) * outerR, 0], c, c);
  }
  return finalize(b);
}

// ─── Inter-ring bezier bridges ─────────────────────────────────────
function buildInterRingBridges({
  pairs = [], segs = 24, color = COL.BONE_GHOST,
} = {}) {
  const b = { pos: [], col: [] };
  const c = scaleC(color, 0.8);
  for (const [p1, p2] of pairs) {
    // Quadratic bezier with control point pulled toward axis
    const cp = [(p1[0] + p2[0]) * 0.3, (p1[1] + p2[1]) * 0.5, (p1[2] + p2[2]) * 0.3 + 0.2];
    let prev = p1;
    for (let s = 1; s <= segs; s++) {
      const t = s / segs;
      const u = 1 - t;
      const cur = [
        u * u * p1[0] + 2 * u * t * cp[0] + t * t * p2[0],
        u * u * p1[1] + 2 * u * t * cp[1] + t * t * p2[1],
        u * u * p1[2] + 2 * u * t * cp[2] + t * t * p2[2],
      ];
      emitSeg(b.pos, b.col, prev, cur, c, c);
      prev = cur;
    }
  }
  return finalize(b);
}

// ─── Background star-sphere ────────────────────────────────────────
function buildStarSphere({ seed = 81, count = 1500, radius = 14 } = {}) {
  const rand = mkRand(seed);
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Uniform sphere distribution
    const u = rand() * 2 - 1;
    const theta = rand() * TAU;
    const r = radius * (0.85 + rand() * 0.15);
    const phi = Math.sqrt(1 - u * u);
    positions[i * 3] = r * Math.cos(theta) * phi;
    positions[i * 3 + 1] = r * u;
    positions[i * 3 + 2] = r * Math.sin(theta) * phi;
  }
  return positions;
}

// ─── Entropic particles — drift slowly through space ──────────────
function buildEntropicParticles({ seed = 101, count = 800, region = [14, 9, 8] } = {}) {
  const rand = mkRand(seed);
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const origins = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const x = (rand() - 0.5) * region[0];
    const y = (rand() - 0.5) * region[1];
    const z = (rand() - 0.5) * region[2];
    positions[i * 3] = x; positions[i * 3 + 1] = y; positions[i * 3 + 2] = z;
    origins[i * 3] = x; origins[i * 3 + 1] = y; origins[i * 3 + 2] = z;
    velocities[i * 3]     = (rand() - 0.5) * 0.004;
    velocities[i * 3 + 1] = (rand() - 0.5) * 0.004;
    velocities[i * 3 + 2] = (rand() - 0.5) * 0.004;
  }
  return { positions, velocities, origins };
}

// ─── Sprite factories ─────────────────────────────────────────────
let _glowSprite = null;
const getGlowSprite = () => {
  if (_glowSprite) return _glowSprite;
  const s = 64, c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  const rg = g.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
  rg.addColorStop(0, 'rgba(255,255,255,1)');
  rg.addColorStop(0.3, 'rgba(255,255,255,0.7)');
  rg.addColorStop(0.6, 'rgba(255,255,255,0.12)');
  rg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rg; g.fillRect(0, 0, s, s);
  _glowSprite = new THREE.CanvasTexture(c);
  _glowSprite.magFilter = THREE.LinearFilter;
  return _glowSprite;
};
let _sharpDotSprite = null;
const getSharpDotSprite = () => {
  if (_sharpDotSprite) return _sharpDotSprite;
  const s = 32, c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  g.beginPath(); g.arc(s/2, s/2, s/2.4, 0, TAU);
  g.fillStyle = 'rgba(240, 236, 226, 1)'; g.fill();
  _sharpDotSprite = new THREE.CanvasTexture(c);
  _sharpDotSprite.magFilter = THREE.LinearFilter;
  return _sharpDotSprite;
};
let _orangeSprite = null;
const getOrangeSprite = () => {
  if (_orangeSprite) return _orangeSprite;
  const s = 64, c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  const rg = g.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
  rg.addColorStop(0, 'rgba(255,130,60,1)');
  rg.addColorStop(0.5, 'rgba(255,100,45,1)');
  rg.addColorStop(0.85, 'rgba(220,70,30,0.6)');
  rg.addColorStop(1, 'rgba(220,70,30,0)');
  g.fillStyle = rg; g.fillRect(0, 0, s, s);
  _orangeSprite = new THREE.CanvasTexture(c);
  _orangeSprite.magFilter = THREE.LinearFilter;
  return _orangeSprite;
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════
export default function EkkoeeHeroV14() {
  const wrapRef = useRef(null);
  const mountRef = useRef(null);
  const clockRef = useRef(null);
  const fpsRef = useRef(null);
  const zoomRef = useRef(null);
  const coordXRef = useRef(null);
  const coordYRef = useRef(null);
  const rotXRef = useRef(null);
  const rotYRef = useRef(null);
  const layerRef = useRef(null);
  const signalRef = useRef(null);
  const entropyRef = useRef(null);

  const mouse = useRef({ x: -9999, y: -9999, lastMove: 0, entered: false });
  const drag = useRef({ active: false, lastX: 0, lastY: 0, velX: 0, velY: 0 });
  const rot = useRef({ current: { x: 0.04, y: -0.1 }, target: { x: 0.04, y: -0.1 } });
  const zoom = useRef({ current: 12, target: 12 });
  const glitch = useRef({ intensity: 0, target: 0, nextSpike: 0, offsetSeed: 0 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const tick = () => {
      if (!clockRef.current) return;
      const n = new Date();
      const p = (v, w = 2) => String(v).padStart(w, '0');
      clockRef.current.textContent =
        `${n.getFullYear()}·${p(n.getMonth() + 1)}·${p(n.getDate())}  ${p(n.getHours())}:${p(n.getMinutes())}:${p(n.getSeconds())}.${p(Math.floor(n.getMilliseconds() / 10))}`;
    };
    tick();
    const t = setInterval(tick, 40);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let mounted = true;
    const W0 = mount.clientWidth, H0 = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040410, 0.022);

    const camera = new THREE.PerspectiveCamera(42, W0 / H0, 0.05, 200);
    camera.position.set(0, 0, zoom.current.current);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true, alpha: false, powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(W0, H0);
    renderer.setClearColor(0x030310, 1);
    mount.appendChild(renderer.domElement);

    const onCtxLost = (e) => { e.preventDefault(); };
    renderer.domElement.addEventListener('webglcontextlost', onCtxLost);

    const geometries = [];
    const materials = [];
    const jitterMats = [];

    const mkJitterMat = ({ opacity = 0.8, jitter = 0.0014, fogNear = 3, fogFar = 45 } = {}) => {
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 }, uJitter: { value: jitter },
          uOpacity: { value: 0 },
          uFogNear: { value: fogNear }, uFogFar: { value: fogFar },
        },
        vertexShader: LineJitterShader.vertex,
        fragmentShader: LineJitterShader.fragment,
        transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      mat.userData = { targetOpacity: opacity, jitterMat: true };
      jitterMats.push(mat);
      materials.push(mat);
      return mat;
    };
    const mkPointsMat = ({ color, opacity, size, map, blending = THREE.AdditiveBlending }) => {
      const m = new THREE.PointsMaterial({
        color, opacity: 0, transparent: true, size,
        sizeAttenuation: true, depthWrite: false, blending, map,
      });
      m.userData = { targetOpacity: opacity };
      materials.push(m);
      return m;
    };
    const makeLines = ({ positions, colors }, material) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      if (colors) geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometries.push(geo);
      return new THREE.LineSegments(geo, material);
    };
    const makePoints = (posArr, material) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
      geometries.push(geo);
      return new THREE.Points(geo, material);
    };

    const sceneRoot = new THREE.Group();
    scene.add(sceneRoot);

    // ════════════════════════════════════════════════════════════════
    // BUILD THE ORRERY
    // ════════════════════════════════════════════════════════════════
    // Rotator registry — each layer drives children at own speed
    const rotators = [];   // { group, speed, axis }

    // ── CENTRAL AXIS (doesn't spin — the reference) ────────────────
    {
      const axisGroup = new THREE.Group();
      const axisData = buildCentralAxis({ height: 13, tickCount: 46, beadCount: 30 });
      axisGroup.add(makeLines(axisData, mkJitterMat({ opacity: 0.7, jitter: 0.0008, fogNear: 2, fogFar: 30 })));
      axisGroup.add(makePoints(axisData.beads, mkPointsMat({
        color: 0xf0ecdf, opacity: 0.8, size: 0.028, map: getSharpDotSprite(),
        blending: THREE.NormalBlending,
      })));
      sceneRoot.add(axisGroup);
    }

    // ── 8 CONCENTRIC ORBITS — Fibonacci-spaced, alternating direction ──
    // Each ring is a group that rotates on its own axis.
    // Each ring has: orbit ring geometry, flowing particles, mounted artifacts.
    // v15.1: DENSER 10 rings + EXTREME tilts → rings physically slice through each other
    const ringRadii =  [1.20, 1.75, 2.40, 3.20, 4.15, 5.25, 6.50, 7.95, 9.60, 11.50];
    const ringOmegas = [
      OMEGA.RING_1, OMEGA.RING_2, OMEGA.RING_3, OMEGA.RING_4,
      OMEGA.RING_5, OMEGA.RING_6, OMEGA.RING_7, OMEGA.RING_8,
      OMEGA.RING_9, OMEGA.RING_10,
    ];
    const ringAxes = [
      new THREE.Vector3(0,     1,  0.10).normalize(),  // Ring 0
      new THREE.Vector3(0.28,  1, -0.18).normalize(),  // Ring 1
      new THREE.Vector3(-0.20, 1,  0.32).normalize(),  // Ring 2
      new THREE.Vector3(0.38,  1, -0.24).normalize(),  // Ring 3
      new THREE.Vector3(-0.22, 1,  0.14).normalize(),  // Ring 4
      new THREE.Vector3(-0.32, 1, -0.26).normalize(),  // Ring 5
      new THREE.Vector3(0.24,  1,  0.18).normalize(),  // Ring 6
      new THREE.Vector3(-0.18, 1,  0.10).normalize(),  // Ring 7
      new THREE.Vector3(0.30,  1, -0.14).normalize(),  // Ring 8
      new THREE.Vector3(-0.08, 1,  0.04).normalize(),  // Ring 9
    ];
    // EXTREME tilts — rings physically slice through each other
    const ringTilts = [
      [ 0.18,  0.00,  0.06],   // Ring 0: gentle 10°
      [ 0.82, -0.26, -0.15],   // Ring 1: +47°X  — slams through Ring 0 & 2
      [-0.58,  0.52,  0.10],   // Ring 2: -33°X  +30°Y
      [ 0.95, -0.42,  0.18],   // Ring 3: +54°X  — slams through Ring 2 & 4
      [-0.70, -0.60,  0.14],   // Ring 4: -40°X  -34°Y
      [ 1.05,  0.38, -0.26],   // Ring 5: +60°X  — biggest, slams 4 & 6
      [-0.62,  0.78,  0.18],   // Ring 6: -36°X  +45°Y
      [ 0.88, -0.48, -0.20],   // Ring 7: +50°X
      [-0.98,  0.68,  0.24],   // Ring 8: -56°X  +39°Y (mega-tilt)
      [ 0.55, -0.42,  0.12],   // Ring 9: +31°X
    ];
    // Line-style per ring — each orbit has its own visual voice
    const ringStyles = [
      { ring: 'solid',     halo: 'dashed', ticks: 'default',    jitter: 0.0012, opac: 0.78, beadCount: 0 },
      { ring: 'shortDash', halo: 'dotted', ticks: 'default',    jitter: 0.0014, opac: 0.72, beadCount: 0 },
      { ring: 'dotted',    halo: 'none',   ticks: 'major-only', jitter: 0.0015, opac: 0.66, beadCount: 0 },
      { ring: 'ghost',     halo: 'dashed', ticks: 'none',       jitter: 0.0010, opac: 0.22, beadCount: 72 }, // BEADED
      { ring: 'double',    halo: 'dashed', ticks: 'random',     jitter: 0.0011, opac: 0.60, beadCount: 0 },
      { ring: 'longDash',  halo: 'none',   ticks: 'random',     jitter: 0.0014, opac: 0.54, beadCount: 0 },
      { ring: 'irregular', halo: 'dotted', ticks: 'major-only', jitter: 0.0017, opac: 0.48, beadCount: 0 },
      { ring: 'triple',    halo: 'dashed', ticks: 'default',    jitter: 0.0009, opac: 0.42, beadCount: 0 },
      { ring: 'sparseDot', halo: 'none',   ticks: 'major-only', jitter: 0.0010, opac: 0.36, beadCount: 0 },
      { ring: 'ghost',     halo: 'none',   ticks: 'none',       jitter: 0.0007, opac: 0.20, beadCount: 0 },
    ];
    const ringGroups = [];

    for (let ri = 0; ri < ringRadii.length; ri++) {
      const R = ringRadii[ri];
      const st = ringStyles[ri];
      const ringG = new THREE.Group();
      ringG.rotation.set(ringTilts[ri][0], ringTilts[ri][1], ringTilts[ri][2]);

      // Ring geometry with distinct style per ring
      const ringData = buildOrreryRing({
        radius: R, segs: 180 + ri * 24,
        tickCount: 24 + ri * 6,
        style: st.ring, haloStyle: st.halo, tickStyle: st.ticks,
        seed: 23 + ri * 7,
      });
      ringG.add(makeLines(ringData, mkJitterMat({
        opacity: st.opac, jitter: st.jitter,
        fogNear: 2, fogFar: 60,
      })));

      // BEADED ring (e.g. Ring 3): overlay big pearl points along circumference
      if (st.beadCount > 0) {
        const beads = new Float32Array(st.beadCount * 3);
        for (let k = 0; k < st.beadCount; k++) {
          const a = (k / st.beadCount) * TAU;
          beads[k * 3]     = Math.cos(a) * R;
          beads[k * 3 + 1] = Math.sin(a) * R;
          beads[k * 3 + 2] = 0;
        }
        ringG.add(makePoints(beads, mkPointsMat({
          color: 0xf0ecdf, opacity: 0.82, size: 0.055,
          map: getGlowSprite(), blending: THREE.NormalBlending,
        })));
      }

      // Flowing orbit particles
      {
        const arr = buildOrbitParticles({ radius: R, count: 80 + ri * 24 });
        ringG.add(makePoints(arr, mkPointsMat({
          color: 0xe6e2d3,
          opacity: Math.max(0.2, 0.55 - ri * 0.04),
          size: Math.max(0.012, 0.022 - ri * 0.0015),
          map: getSharpDotSprite(), blending: THREE.NormalBlending,
        })));
      }

      // A few bright "timekeeper" dots on the ring — more on inner, fewer on outer
      {
        const tkCount = Math.max(4, 8 - ri);
        const arr = new Float32Array(tkCount * 3);
        for (let k = 0; k < tkCount; k++) {
          const a = (k / tkCount) * TAU + ri * 0.3;
          arr[k * 3] = Math.cos(a) * R;
          arr[k * 3 + 1] = Math.sin(a) * R;
          arr[k * 3 + 2] = 0;
        }
        ringG.add(makePoints(arr, mkPointsMat({
          color: 0xf5f0e0,
          opacity: Math.max(0.4, 0.95 - ri * 0.07),
          size: Math.max(0.028, 0.062 - ri * 0.005),
          map: getGlowSprite(),
        })));
      }

      sceneRoot.add(ringG);
      rotators.push({ group: ringG, speed: ringOmegas[ri], axis: ringAxes[ri] });
      ringGroups.push(ringG);
    }

    // ════════════════════════════════════════════════════════════════
    // MOUNT ARTIFACTS ON RINGS
    // Each ring carries 3-6 sacred geometry artifacts at angular positions.
    // Each artifact is a child group that spins on its own axis.
    // ════════════════════════════════════════════════════════════════
    const mountOnRing = (ringIdx, thetaOffset, artifactGroup, { mountSpinSpeed = OMEGA.MOUNT, mountAxis = new THREE.Vector3(0, 1, 0).normalize() } = {}) => {
      const R = ringRadii[ringIdx];
      const mount = new THREE.Group();
      mount.position.set(R * Math.cos(thetaOffset), R * Math.sin(thetaOffset), 0);
      mount.add(artifactGroup);
      ringGroups[ringIdx].add(mount);
      rotators.push({ group: artifactGroup, speed: mountSpinSpeed, axis: mountAxis });
      return mount;
    };

    // ════════════════════════════════════════════════════════════════
    // RING 0 (R=1.35, innermost) — 6 DENSE CORE ARTIFACTS
    //   most intricate sacred geometry, visible when zoomed in close
    // ════════════════════════════════════════════════════════════════
    {
      const r0Items = [
        { b: () => buildSriYantra({ scale: 0.30 }),           spin: OMEGA.MOUNT * 0.9, axis: [0.30, 1, 0.20] },
        { b: () => buildEnneagram({ scale: 0.28 }),           spin: -OMEGA.MOUNT * 0.8, axis: [-0.2, 1, 0.15] },
        { b: () => buildMandala({ scale: 0.30, symmetry: 8, layers: 4 }),   spin: OMEGA.MOUNT * 1.1, axis: [0.1, 1, -0.3] },
        { b: () => buildMerkaba({ scale: 0.24 }),             spin: -OMEGA.MOUNT * 1.2, axis: [0.7, 0.5, 0.2] },
        { b: () => buildVesicaTrio({ radius: 0.17 }),         spin: OMEGA.MOUNT * 0.7, axis: [0, 1, 0.4] },
        { b: () => buildSaturnRings({ planetR: 0.09, ringInner: 0.14, ringOuter: 0.28, ringCount: 3 }), spin: OMEGA.MOUNT * 1.4, axis: [0.6, 0.5, 0] },
      ];
      r0Items.forEach((item, i) => {
        const theta = (i / r0Items.length) * TAU;
        const g = new THREE.Group();
        g.add(makeLines(item.b(), mkJitterMat({ opacity: 0.88, jitter: 0.0015, fogNear: 2, fogFar: 25 })));
        mountOnRing(0, theta, g, {
          mountSpinSpeed: item.spin,
          mountAxis: new THREE.Vector3(item.axis[0], item.axis[1], item.axis[2]).normalize(),
        });
      });
    }

    // ════════════════════════════════════════════════════════════════
    // RING 1 (R=2.15) — 7 RICH ARTIFACTS — Sacred + Platonic mix
    // ════════════════════════════════════════════════════════════════
    {
      const r1Items = [
        { b: () => buildMetatronsCube({ scale: 0.40, circleR: 0.075 }),     spin: -OMEGA.MOUNT * 0.7, axis: [0, 1, 0.2] },
        { b: () => buildFibonacciRich({ scale: 0.38, turns: 3.5, zLift: 0.25 }), spin: OMEGA.MOUNT * 0.9, axis: [0.2, 1, 0] },
        { b: () => buildFlowerOfLife({ radius: 0.095, rings: 2 }),          spin: -OMEGA.MOUNT, axis: [-0.3, 1, 0.1] },
        { b: () => buildIcosahedron({ scale: 0.32 }),                       spin: OMEGA.MOUNT * 1.3, axis: [0.5, 0.7, 0.3] },
        { b: () => buildSeedOfLife({ radius: 0.17 }),                       spin: -OMEGA.MOUNT * 0.6, axis: [0, 1, 0] },
        { b: () => buildAtomicOrbital({ scale: 0.30 }),                     spin: OMEGA.MOUNT * 1.7, axis: [1, 0.2, 0.3] },
        { b: () => buildMandala({ scale: 0.32, symmetry: 12, layers: 3 }),  spin: -OMEGA.MOUNT * 0.5, axis: [0.1, 1, 0.1] },
        { b: () => buildKeplerMysterium({ scale: 0.40 }),                   spin: OMEGA.MOUNT * 0.6, axis: [0.3, 0.8, 0.4] },
        { b: () => buildSphericalHarmonics({ scale: 0.32, l: 3, m: 2 }),    spin: -OMEGA.MOUNT * 1.1, axis: [0.5, 0.6, 0.5] },
        { b: () => buildLogarithmicSpiral({ scale: 0.34, turns: 3.2, a: 0.14, b_: 0.22 }), spin: OMEGA.MOUNT * 0.95, axis: [0, 0, 1] },
      ];
      r1Items.forEach((item, i) => {
        const theta = (i / r1Items.length) * TAU + 0.3;
        const g = new THREE.Group();
        g.add(makeLines(item.b(), mkJitterMat({ opacity: 0.84, jitter: 0.0015, fogNear: 2, fogFar: 28 })));
        mountOnRing(1, theta, g, {
          mountSpinSpeed: item.spin,
          mountAxis: new THREE.Vector3(item.axis[0], item.axis[1], item.axis[2]).normalize(),
        });
      });
    }

    // ════════════════════════════════════════════════════════════════
    // RING 2 (R=3.10) — 10 PLANETS + KNOTS + ADVANCED MATH
    // ════════════════════════════════════════════════════════════════
    {
      const r2Items = [
        { b: () => buildStippledSphere({ radius: 0.22, count: 140, seed: 11 }), spin: OMEGA.MOUNT * 0.5 },
        { b: () => buildTorusKnot({ scale: 0.26, p: 3, q: 2, R: 0.55, r: 0.2 }), spin: OMEGA.MOUNT * 0.8 },
        { b: () => buildMoonPhase({ radius: 0.19, phase: 0.4 }),              spin: OMEGA.MOUNT * 0.3 },
        { b: () => buildSaturnRings({ planetR: 0.15, ringInner: 0.25, ringOuter: 0.5, ringCount: 4 }), spin: -OMEGA.MOUNT * 0.7 },
        { b: () => buildTesseract({ scale: 0.30, w: 0.45 }),                  spin: OMEGA.MOUNT * 1.2 },
        { b: () => buildStippledSphere({ radius: 0.18, count: 100, seed: 37 }), spin: -OMEGA.MOUNT * 0.6 },
        { b: () => buildDodecahedron({ scale: 0.26 }),                        spin: OMEGA.MOUNT * 0.9 },
        { b: () => buildMoonPhase({ radius: 0.16, phase: 0.75 }),             spin: OMEGA.MOUNT * 0.4 },
        { b: () => buildTorusKnot({ scale: 0.24, p: 5, q: 2, R: 0.55, r: 0.18 }), spin: -OMEGA.MOUNT * 1.0 },
        { b: () => buildPlanet({ radius: 0.17, dotCount: 42, seed: 71 }),     spin: OMEGA.MOUNT * 0.55 },
        { b: () => buildSphericalHarmonics({ scale: 0.28, l: 4, m: 3 }),      spin: -OMEGA.MOUNT * 0.9 },
        { b: () => buildKleinBottle({ scale: 0.30 }),                         spin: OMEGA.MOUNT * 0.75 },
        { b: () => buildEpicycloid({ scale: 0.28, cusps: 7 }),                 spin: -OMEGA.MOUNT * 0.85 },
        { b: () => buildBlochSphere({ scale: 0.26 }),                          spin: OMEGA.MOUNT * 1.1 },
        { b: () => buildEpicycloid({ scale: 0.26, cusps: 5 }),                 spin: -OMEGA.MOUNT * 0.65 },
      ];
      r2Items.forEach((item, i) => {
        const theta = (i / r2Items.length) * TAU + 0.2;
        const g = new THREE.Group();
        g.add(makeLines(item.b(), mkJitterMat({ opacity: 0.82, jitter: 0.0012, fogNear: 2, fogFar: 32 })));
        mountOnRing(2, theta, g, {
          mountSpinSpeed: item.spin * (i % 2 === 0 ? 1 : -1),
          mountAxis: new THREE.Vector3(Math.sin(i * 1.37), 1, Math.cos(i * 1.9)).normalize(),
        });
      });
    }

    // ════════════════════════════════════════════════════════════════
    // RING 3 (R=4.30) — 12 FRONTIER SCIENCE/MATH + CONSTELLATIONS
    // ════════════════════════════════════════════════════════════════
    {
      const r3Items = [
        { b: () => buildLorenzAttractor({ scale: 0.025, steps: 2200 }),       opac: 0.76 },
        { b: () => buildMobiusStrip({ scale: 0.38 }),                          opac: 0.7 },
        { b: () => buildBorromeanRings({ scale: 0.32 }),                       opac: 0.78 },
        { b: () => buildHopfFibration({ scale: 0.35, fiberCount: 10 }),        opac: 0.65 },
        { b: () => buildRoseCurve({ scale: 0.3, k: 7 }),                       opac: 0.78 },
        { b: () => buildPenroseTiling({ scale: 0.35, rings: 2 }),              opac: 0.7 },
        { b: () => buildKochSnowflake({ scale: 0.26, iters: 3 }),              opac: 0.72 },
        { b: () => buildQuantumOrbital({ scale: 0.28, lobes: 4 }),             opac: 0.74 },
        { b: () => buildApollonianGasket({ scale: 0.28, depth: 3 }),           opac: 0.72 },
        { b: () => buildLissajous({ scale: 0.3, a: 3, b: 5, c: 7 }),           opac: 0.76 },
        { b: () => buildCalabiYauSlice({ scale: 0.35, n: 5 }),                 opac: 0.65 },
        { b: () => buildCayleyGraph({ scale: 0.34, nodes: 20 }),               opac: 0.7 },
        { b: () => buildChladniFigures({ scale: 0.36, m: 3, n: 5 }),           opac: 0.74 },
        { b: () => buildTuringPatterns({ scale: 0.36 }),                       opac: 0.68 },
        { b: () => buildUlamSpiral({ scale: 0.32 }),                           opac: 0.8 },
        { b: () => buildFordCircles({ scale: 0.30, qMax: 10 }),                opac: 0.76 },
      ];
      r3Items.forEach((item, i) => {
        const theta = (i / r3Items.length) * TAU + 0.15;
        const g = new THREE.Group();
        g.add(makeLines(item.b(), mkJitterMat({ opacity: item.opac, jitter: 0.001, fogNear: 2, fogFar: 38 })));
        mountOnRing(3, theta, g, {
          mountSpinSpeed: OMEGA.MOUNT * (0.3 + (i % 5) * 0.15) * (i % 2 === 0 ? 1 : -1),
          mountAxis: new THREE.Vector3(Math.sin(i * 2.1), 1, Math.cos(i * 1.3)).normalize(),
        });
      });
    }

    // ════════════════════════════════════════════════════════════════
    // RING 4 (R=5.70) — 14 MIDRANGE: Rose/Astrolabe/Zodiac + markers
    // ════════════════════════════════════════════════════════════════
    {
      // 4 big anchors
      const r4Anchors = [
        { b: () => buildRoseWindow({ scale: 0.55 }),        thetaFactor: 0 },
        { b: () => buildZodiacWheel({ scale: 0.52 }),       thetaFactor: 0.25 },
        { b: () => buildAstrolabe({ scale: 0.55 }),         thetaFactor: 0.5 },
        { b: () => buildTorus({ R: 0.42, r: 0.15 }),        thetaFactor: 0.75 },
        { b: () => buildUlamSpiral({ scale: 0.60 }),       thetaFactor: 0.125 },
        { b: () => buildChladniFigures({ scale: 0.55, m: 4, n: 6 }), thetaFactor: 0.625 },
        { b: () => buildVoronoiTessellation({ scale: 0.58, cellCount: 28, seed: 47 }), thetaFactor: 0.375 },
        { b: () => buildEpicycloid({ scale: 0.50, cusps: 9 }),      thetaFactor: 0.875 },
      ];
      r4Anchors.forEach((item, i) => {
        const theta = item.thetaFactor * TAU;
        const g = new THREE.Group();
        g.add(makeLines(item.b(), mkJitterMat({ opacity: 0.72, jitter: 0.0012, fogNear: 2, fogFar: 45 })));
        mountOnRing(4, theta, g, {
          mountSpinSpeed: OMEGA.MOUNT * (0.2 + i * 0.1) * (i % 2 === 0 ? 1 : -1),
          mountAxis: new THREE.Vector3(Math.sin(i * 1.5), 1, Math.cos(i * 1.5)).normalize(),
        });
      });
      // 10 mix of markers + small constellations
      for (let i = 0; i < 10; i++) {
        const theta = (i / 10) * TAU + TAU / 20;  // offset from anchors
        const g = new THREE.Group();
        if (i % 3 === 0) {
          g.add(makeLines(buildTickMarker({ length: 0.28 }),
            mkJitterMat({ opacity: 0.6, jitter: 0.0008, fogNear: 2, fogFar: 42 })));
          g.rotation.z = theta - Math.PI / 2;
          mountOnRing(4, theta, g, { mountSpinSpeed: 0, mountAxis: new THREE.Vector3(0, 1, 0) });
        } else if (i % 3 === 1) {
          const cData = buildConstellation({ seed: 200 + i * 7, pointCount: 9, extent: 0.35, connectCount: 6 });
          g.add(makeLines(cData, mkJitterMat({ opacity: 0.55, jitter: 0.001, fogNear: 2, fogFar: 45 })));
          g.add(makePoints(cData.points, mkPointsMat({
            color: 0xe6e2d3, opacity: 0.7, size: 0.025, map: getSharpDotSprite(),
            blending: THREE.NormalBlending,
          })));
          mountOnRing(4, theta, g, {
            mountSpinSpeed: OMEGA.MOUNT * 0.2,
            mountAxis: new THREE.Vector3(Math.sin(i), 1, Math.cos(i)).normalize(),
          });
        } else {
          g.add(makeLines(buildArrow({ length: 0.22 }),
            mkJitterMat({ opacity: 0.65, jitter: 0.0008, fogNear: 2, fogFar: 42 })));
          g.rotation.z = theta - Math.PI / 2;
          mountOnRing(4, theta, g, { mountSpinSpeed: 0, mountAxis: new THREE.Vector3(0, 1, 0) });
        }
      }
    }

    // ════════════════════════════════════════════════════════════════
    // RING 5 (R=7.40) — 16 BIG OUTER: Tree of Life + Big Mandalas + Mandelbrot
    // ════════════════════════════════════════════════════════════════
    {
      // 3 big anchors
      const r5Anchors = [
        { b: () => buildTreeOfLife({ scale: 0.8 }),                      thetaFactor: 0 },
        { b: () => buildMandala({ scale: 0.85, symmetry: 16, layers: 5 }), thetaFactor: 0.333 },
        { b: () => buildMandala({ scale: 0.8, symmetry: 24, layers: 4 }),  thetaFactor: 0.666 },
        { b: () => buildTuringPatterns({ scale: 0.80 }),                   thetaFactor: 0.166 },
        { b: () => buildKeplerMysterium({ scale: 0.75 }),                  thetaFactor: 0.500 },
        { b: () => buildPoincareDisk({ scale: 0.80, generations: 3 }),      thetaFactor: 0.833 },
        { b: () => buildVoronoiTessellation({ scale: 0.75, cellCount: 36, seed: 91 }), thetaFactor: 0.333 },
      ];
      r5Anchors.forEach((item, i) => {
        const theta = item.thetaFactor * TAU;
        const g = new THREE.Group();
        g.add(makeLines(item.b(), mkJitterMat({ opacity: 0.58, jitter: 0.001, fogNear: 3, fogFar: 55 })));
        mountOnRing(5, theta, g, {
          mountSpinSpeed: OMEGA.MOUNT * 0.3 * (i % 2 === 0 ? 1 : -1),
          mountAxis: new THREE.Vector3(0, 1, Math.sin(i) * 0.15).normalize(),
        });
      });
      // 13 smaller glyphs & markers between anchors
      for (let i = 0; i < 13; i++) {
        const theta = (i / 13) * TAU + TAU / 26;
        const g = new THREE.Group();
        if (i % 4 === 0) {
          g.add(makeLines(buildDiamondGlyph({ size: 0.1 }),
            mkJitterMat({ opacity: 0.55, jitter: 0.0008, fogNear: 3, fogFar: 50 })));
        } else if (i % 4 === 1) {
          g.add(makeLines(buildCrossGlyph({ size: 0.08 }),
            mkJitterMat({ opacity: 0.5, jitter: 0.0008, fogNear: 3, fogFar: 50 })));
        } else if (i % 4 === 2) {
          g.add(makeLines(buildTickMarker({ length: 0.18 }),
            mkJitterMat({ opacity: 0.55, jitter: 0.0008, fogNear: 3, fogFar: 50 })));
          g.rotation.z = theta - Math.PI / 2;
        } else {
          g.add(makeLines(buildArrow({ length: 0.14 }),
            mkJitterMat({ opacity: 0.55, jitter: 0.0008, fogNear: 3, fogFar: 50 })));
          g.rotation.z = theta - Math.PI / 2;
        }
        mountOnRing(5, theta, g, {
          mountSpinSpeed: (i % 4 < 2) ? OMEGA.MOUNT * 0.3 * (i % 2 === 0 ? 1 : -1) : 0,
          mountAxis: new THREE.Vector3(0, 1, 0),
        });
      }
    }

    // ════════════════════════════════════════════════════════════════
    // RING 6 (R=9.50) — 22 FAINT MARKERS + 2 FAR MANDALAS + E8
    // ════════════════════════════════════════════════════════════════
    {
      // 3 far big mega-structures
      const r6Anchors = [
        { b: () => buildE8Projection({ scale: 0.9 }),                    thetaFactor: 0, opac: 0.42 },
        { b: () => buildMandala({ scale: 1.0, symmetry: 32, layers: 4 }), thetaFactor: 0.5, opac: 0.38 },
        { b: () => buildPhyllotaxis3D({ scale: 0.7, count: 220 }),       thetaFactor: 0.75, opac: 0.35 },
      ];
      r6Anchors.forEach((item, i) => {
        const theta = item.thetaFactor * TAU;
        const g = new THREE.Group();
        const data = item.b();
        g.add(makeLines(data, mkJitterMat({ opacity: item.opac, jitter: 0.0008, fogNear: 4, fogFar: 62 })));
        if (data.dots) {
          g.add(makePoints(data.dots, mkPointsMat({
            color: 0xe6e2d3, opacity: 0.55, size: 0.03, map: getSharpDotSprite(),
            blending: THREE.NormalBlending,
          })));
        }
        mountOnRing(6, theta, g, {
          mountSpinSpeed: OMEGA.MOUNT * 0.15 * (i % 2 === 0 ? 1 : -1),
          mountAxis: new THREE.Vector3(0, 1, 0),
        });
      });
      // 22 tiny scattered glyphs
      for (let i = 0; i < 22; i++) {
        const theta = (i / 22) * TAU + (i % 3) * 0.05;
        const g = new THREE.Group();
        const pick = i % 5;
        if (pick === 0)      g.add(makeLines(buildCrossGlyph({ size: 0.06 }), mkJitterMat({ opacity: 0.4, jitter: 0.0006, fogNear: 4, fogFar: 65 })));
        else if (pick === 1) g.add(makeLines(buildDiamondGlyph({ size: 0.07 }), mkJitterMat({ opacity: 0.42, jitter: 0.0006, fogNear: 4, fogFar: 65 })));
        else if (pick === 2) { g.add(makeLines(buildTickMarker({ length: 0.15 }), mkJitterMat({ opacity: 0.42, jitter: 0.0006, fogNear: 4, fogFar: 65 }))); g.rotation.z = theta - Math.PI / 2; }
        else if (pick === 3) { g.add(makeLines(buildArrow({ length: 0.12 }), mkJitterMat({ opacity: 0.4, jitter: 0.0006, fogNear: 4, fogFar: 65 }))); g.rotation.z = theta - Math.PI / 2; }
        else {
          const tinyCircle = { pos: [], col: [] };
          mergeInto(tinyCircle, circleSegments({ r: 0.06, segs: 16, color: COL.BONE_DIM }));
          g.add(makeLines(finalize(tinyCircle), mkJitterMat({ opacity: 0.38, jitter: 0.0006, fogNear: 4, fogFar: 65 })));
        }
        mountOnRing(6, theta, g, { mountSpinSpeed: 0, mountAxis: new THREE.Vector3(0, 1, 0) });
      }
    }

    // ════════════════════════════════════════════════════════════════
    // RING 7 (R=12.30, outermost, cosmic boundary) — 28 TINY GLYPHS
    // ════════════════════════════════════════════════════════════════
    {
      // 2 huge cosmic mega-mandalas at extreme radius
      const r7Anchors = [
        { b: () => buildCosmicMandala({ scale: 1.3, symmetry: 36 }),  thetaFactor: 0.25 },
        { b: () => buildBuckyball({ scale: 1.0 }),                     thetaFactor: 0.75 },
      ];
      r7Anchors.forEach((item, i) => {
        const theta = item.thetaFactor * TAU;
        const g = new THREE.Group();
        g.add(makeLines(item.b(), mkJitterMat({ opacity: 0.28, jitter: 0.0005, fogNear: 5, fogFar: 80 })));
        mountOnRing(7, theta, g, {
          mountSpinSpeed: OMEGA.MOUNT * 0.08 * (i % 2 === 0 ? 1 : -1),
          mountAxis: new THREE.Vector3(0, 1, 0),
        });
      });
      // 28 tiny crosses — cosmic tick marks
      for (let i = 0; i < 28; i++) {
        const theta = (i / 28) * TAU;
        const g = new THREE.Group();
        g.add(makeLines(buildCrossGlyph({ size: 0.08 }),
          mkJitterMat({ opacity: 0.28, jitter: 0.0005, fogNear: 5, fogFar: 80 })));
        mountOnRing(7, theta, g, { mountSpinSpeed: 0, mountAxis: new THREE.Vector3(0, 1, 0) });
      }
    }

    // ════════════════════════════════════════════════════════════════
    // RING 8 (R=15.50, NEW) — 10 GIANT 3D MEGA-STRUCTURES
    //   The wide outer ring of physical megastructures: 3D fractals,
    //   periodic minimal surfaces, 4D polytopes, molecular cages.
    // ════════════════════════════════════════════════════════════════
    {
      const r8Items = [
        { b: () => buildMengerSponge({ scale: 0.95, iterations: 2 }),       spin: OMEGA.MOUNT * 0.14, axis: [0.6, 0.8, 0.3] },
        { b: () => buildGyroid({ scale: 1.05 }),                            spin: -OMEGA.MOUNT * 0.11, axis: [0.4, 0.7, 0.6] },
        { b: () => buildKeplerMysterium({ scale: 0.78 }),                   spin: OMEGA.MOUNT * 0.16, axis: [0.3, 0.9, 0.2] },
        { b: () => buildTesseract({ scale: 0.75, w: 0.7 }),                 spin: -OMEGA.MOUNT * 0.18, axis: [0.5, 0.6, 0.6] },
        { b: () => buildBuckyball({ scale: 0.85 }),                         spin: OMEGA.MOUNT * 0.10, axis: [0.2, 1.0, 0.1] },
        { b: () => buildE8Projection({ scale: 0.92 }),                      spin: -OMEGA.MOUNT * 0.08, axis: [0, 0, 1] },
        { b: () => buildKleinBottle({ scale: 0.58 }),                       spin: OMEGA.MOUNT * 0.15, axis: [0.7, 0.5, 0.3] },
        { b: () => buildTorus({ R: 0.72, r: 0.20, uSegs: 64, vSegs: 22 }),  spin: -OMEGA.MOUNT * 0.12, axis: [0.4, 0.8, 0.4] },
        { b: () => buildCosmicMandala({ scale: 0.95, symmetry: 48 }),       spin: OMEGA.MOUNT * 0.07, axis: [0, 1, 0] },
        { b: () => buildSphericalHarmonics({ scale: 0.62, l: 4, m: 3 }),    spin: -OMEGA.MOUNT * 0.17, axis: [0.5, 0.7, 0.5] },
        { b: () => buildTwentyFourCell({ scale: 0.85, w: 0.5 }),            spin: OMEGA.MOUNT * 0.13, axis: [0.6, 0.7, 0.4] },
        { b: () => buildPoincareDisk({ scale: 0.80, generations: 3 }),      spin: -OMEGA.MOUNT * 0.09, axis: [0, 1, 0] },
      ];
      r8Items.forEach((item, i) => {
        const theta = (i / r8Items.length) * TAU + 0.12;
        const g = new THREE.Group();
        g.add(makeLines(item.b(), mkJitterMat({ opacity: 0.38, jitter: 0.0006, fogNear: 6, fogFar: 95 })));
        mountOnRing(8, theta, g, {
          mountSpinSpeed: item.spin,
          mountAxis: new THREE.Vector3(...item.axis).normalize(),
        });
      });
      // Dense marker halo on Ring 8
      for (let i = 0; i < 32; i++) {
        const theta = (i / 32) * TAU + 0.04;
        const g = new THREE.Group();
        const pick = i % 4;
        let glyph;
        if (pick === 0) glyph = buildCrossGlyph({ size: 0.11 });
        else if (pick === 1) glyph = buildDiamondGlyph({ size: 0.12 });
        else if (pick === 2) glyph = buildTickMarker({ length: 0.18 });
        else glyph = buildArrow({ length: 0.15 });
        g.add(makeLines(glyph, mkJitterMat({ opacity: 0.24, jitter: 0.0005, fogNear: 6, fogFar: 90 })));
        mountOnRing(8, theta, g, { mountSpinSpeed: 0, mountAxis: new THREE.Vector3(0, 1, 0) });
      }
    }

    // ════════════════════════════════════════════════════════════════
    // RING 9 (R=19.00, NEW, furthest) — COSMIC WEB BOUNDARY
    //   Large-scale filamentary structure of the universe + cosmic mandalas
    // ════════════════════════════════════════════════════════════════
    {
      // 4 huge Cosmic Web structures at quadrants
      const r9Webs = [
        { b: () => buildCosmicWeb({ scale: 1.15, nodeCount: 46, seed: 11 }), thetaFactor: 0.05 },
        { b: () => buildCosmicWeb({ scale: 1.05, nodeCount: 40, seed: 29 }), thetaFactor: 0.28 },
        { b: () => buildCosmicWeb({ scale: 1.10, nodeCount: 44, seed: 53 }), thetaFactor: 0.51 },
        { b: () => buildCosmicWeb({ scale: 1.15, nodeCount: 42, seed: 83 }), thetaFactor: 0.74 },
        { b: () => buildSpiralGalaxy({ scale: 1.35, arms: 4, starsPerArm: 80, seed: 19 }), thetaFactor: 0.17 },
        { b: () => buildSpiralGalaxy({ scale: 1.20, arms: 5, starsPerArm: 60, seed: 127 }), thetaFactor: 0.62 },
      ];
      r9Webs.forEach((item, i) => {
        const theta = item.thetaFactor * TAU;
        const g = new THREE.Group();
        g.add(makeLines(item.b(), mkJitterMat({ opacity: 0.28, jitter: 0.0004, fogNear: 8, fogFar: 110 })));
        mountOnRing(9, theta, g, {
          mountSpinSpeed: OMEGA.MOUNT * 0.04 * (i % 2 === 0 ? 1 : -1),
          mountAxis: new THREE.Vector3(0.3, 1, 0.3).normalize(),
        });
      });
      // 2 gigantic outer cosmic mandalas between Web nodes
      const r9Mandalas = [
        { b: () => buildCosmicMandala({ scale: 1.20, symmetry: 60 }), thetaFactor: 0.40 },
        { b: () => buildCosmicMandala({ scale: 1.15, symmetry: 72 }), thetaFactor: 0.88 },
      ];
      r9Mandalas.forEach((item, i) => {
        const theta = item.thetaFactor * TAU;
        const g = new THREE.Group();
        g.add(makeLines(item.b(), mkJitterMat({ opacity: 0.22, jitter: 0.0004, fogNear: 10, fogFar: 120 })));
        mountOnRing(9, theta, g, {
          mountSpinSpeed: OMEGA.MOUNT * 0.03 * (i === 0 ? 1 : -1),
          mountAxis: new THREE.Vector3(0, 1, 0),
        });
      });
      // 40 ultra-faint cosmic tick glyphs along the edge
      for (let i = 0; i < 40; i++) {
        const theta = (i / 40) * TAU + 0.02;
        const g = new THREE.Group();
        const pick = i % 3;
        let glyph;
        if (pick === 0) glyph = buildCrossGlyph({ size: 0.14 });
        else if (pick === 1) glyph = buildDiamondGlyph({ size: 0.15 });
        else glyph = buildTickMarker({ length: 0.22 });
        g.add(makeLines(glyph, mkJitterMat({ opacity: 0.18, jitter: 0.0004, fogNear: 10, fogFar: 120 })));
        mountOnRing(9, theta, g, { mountSpinSpeed: 0, mountAxis: new THREE.Vector3(0, 1, 0) });
      }
    }

    // ════════════════════════════════════════════════════════════════
    // AXIAL ARTIFACTS — along the central spine
    // ════════════════════════════════════════════════════════════════
    // ★ HEART: Black Hole with Accretion Disk + Relativistic Jets
    //   sits at exact center, the gravitational singularity of the cosmos
    {
      const g = new THREE.Group();
      g.position.set(0, 0, 0);
      // Accretion disk tilts ~6° so jets aren't pure-vertical, adding depth
      g.rotation.set(0.10, 0, 0.04);
      g.add(makeLines(buildBlackHoleAccretion({ scale: 0.72 }),
        mkJitterMat({ opacity: 0.88, jitter: 0.0014, fogNear: 1, fogFar: 22 })));
      sceneRoot.add(g);
      // Disk rotates around vertical axis (jets stay pointing up/down)
      rotators.push({ group: g, speed: OMEGA.RING_1 * 0.35, axis: new THREE.Vector3(0, 1, 0) });
    }
    // ★ Secondary accretion disk counter-rotating — creates a double-disk effect
    {
      const g = new THREE.Group();
      g.position.set(0, 0, 0);
      g.rotation.set(-0.22, 0, -0.08);
      g.add(makeLines(buildBlackHoleAccretion({ scale: 0.55 }),
        mkJitterMat({ opacity: 0.46, jitter: 0.0020, fogNear: 1, fogFar: 20 })));
      sceneRoot.add(g);
      rotators.push({ group: g, speed: -OMEGA.RING_2 * 0.55, axis: new THREE.Vector3(0, 1, 0) });
    }
    // Top: sunburst
    {
      const g = new THREE.Group();
      g.position.set(0, 4.5, 0);
      g.add(makeLines(buildSunburst({ innerR: 0.12, outerR: 0.85, rayCount: 96 }),
        mkJitterMat({ opacity: 0.82, jitter: 0.0012, fogNear: 2, fogFar: 30 })));
      sceneRoot.add(g);
      rotators.push({ group: g, speed: OMEGA.MOUNT * 0.5, axis: new THREE.Vector3(0, 0, 1) });
    }
    // Upper-center: big fibonacci spiral RICH (main centerpiece, with Z-lift + nested rectangles + rings)
    {
      const g = new THREE.Group();
      g.position.set(0, 0.4, 0.8);
      const data = buildFibonacciRich({ scale: 1.4, turns: 4.5, zLift: 0.6 });
      g.add(makeLines(data, mkJitterMat({ opacity: 0.92, jitter: 0.0018, fogNear: 1, fogFar: 22 })));
      const dotsArr = new Float32Array(data.dots.length * 3);
      data.dots.forEach((d, i) => { dotsArr[i * 3] = d[0]; dotsArr[i * 3 + 1] = d[1]; dotsArr[i * 3 + 2] = d[2]; });
      g.add(makePoints(dotsArr, mkPointsMat({
        color: 0xf0ecdf, opacity: 0.95, size: 0.05, map: getSharpDotSprite(),
        blending: THREE.NormalBlending,
      })));
      sceneRoot.add(g);
      rotators.push({ group: g, speed: OMEGA.RING_3 * 0.6, axis: new THREE.Vector3(0, 0, 1) });
    }
    // Mid: DNA helix (vertical)
    {
      const g = new THREE.Group();
      g.position.set(0, -0.5, -0.4);
      g.add(makeLines(buildDNA({ height: 3.2, radius: 0.28, turns: 6, segs: 160 }),
        mkJitterMat({ opacity: 0.78, jitter: 0.0018, fogNear: 2, fogFar: 24 })));
      sceneRoot.add(g);
      rotators.push({ group: g, speed: OMEGA.RING_2 * -0.9, axis: new THREE.Vector3(0, 1, 0) });
    }
    // Bottom: lower sunburst
    {
      const g = new THREE.Group();
      g.position.set(0, -4.5, 0);
      g.add(makeLines(buildSunburst({ innerR: 0.1, outerR: 0.7, rayCount: 72 }),
        mkJitterMat({ opacity: 0.7, jitter: 0.0012, fogNear: 2, fogFar: 30 })));
      sceneRoot.add(g);
      rotators.push({ group: g, speed: -OMEGA.MOUNT * 0.4, axis: new THREE.Vector3(0, 0, 1) });
    }

    // ════════════════════════════════════════════════════════════════
    // RADIAL SPOKES — axis → each ring (interlocking visual)
    // ════════════════════════════════════════════════════════════════
    {
      const spokeGroup = new THREE.Group();
      const spokeAdd = (inner, outer, count, opacity) => {
        spokeGroup.add(makeLines(
          buildRadialSpokes({ innerR: inner, outerR: outer, count, color: COL.BONE_GHOST }),
          mkJitterMat({ opacity, jitter: 0.0008, fogNear: 2, fogFar: 50 }),
        ));
      };
      spokeAdd(0.2, ringRadii[0] - 0.05, 6, 0.38);
      spokeAdd(ringRadii[1] + 0.05, ringRadii[2] - 0.05, 8, 0.32);
      spokeAdd(ringRadii[3] + 0.05, ringRadii[4] - 0.05, 12, 0.28);
      spokeAdd(ringRadii[5] + 0.05, ringRadii[6] - 0.05, 18, 0.20);
      spokeAdd(ringRadii[6] + 0.05, ringRadii[7] - 0.05, 24, 0.14);
      sceneRoot.add(spokeGroup);
      rotators.push({ group: spokeGroup, speed: -OMEGA.SCENE * 2, axis: new THREE.Vector3(0, 1, 0) });
    }

    // ════════════════════════════════════════════════════════════════
    // INTER-RING BRIDGES (curved connectors — the mechanical "links")
    // ════════════════════════════════════════════════════════════════
    {
      const pairs = [];
      // Bridges from ring 0 → ring 1 at 4 angles
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU + 0.7;
        pairs.push([
          [Math.cos(a) * ringRadii[0], Math.sin(a) * ringRadii[0], 0],
          [Math.cos(a + 0.5) * ringRadii[1], Math.sin(a + 0.5) * ringRadii[1], 0],
        ]);
      }
      // Bridges ring 2 → ring 3
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU + 0.3;
        pairs.push([
          [Math.cos(a) * ringRadii[2], Math.sin(a) * ringRadii[2], 0],
          [Math.cos(a + 0.4) * ringRadii[3], Math.sin(a + 0.4) * ringRadii[3], 0],
        ]);
      }
      // Bridges ring 4 → ring 5
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + 0.15;
        pairs.push([
          [Math.cos(a) * ringRadii[4], Math.sin(a) * ringRadii[4], 0],
          [Math.cos(a + 0.3) * ringRadii[5], Math.sin(a + 0.3) * ringRadii[5], 0],
        ]);
      }
      // Bridges ring 5 → ring 6
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        pairs.push([
          [Math.cos(a) * ringRadii[5], Math.sin(a) * ringRadii[5], 0],
          [Math.cos(a + 0.25) * ringRadii[6], Math.sin(a + 0.25) * ringRadii[6], 0],
        ]);
      }
      // Bridges ring 6 → ring 7
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU;
        pairs.push([
          [Math.cos(a) * ringRadii[6], Math.sin(a) * ringRadii[6], 0],
          [Math.cos(a + 0.2) * ringRadii[7], Math.sin(a + 0.2) * ringRadii[7], 0],
        ]);
      }
      const bridges = new THREE.Group();
      bridges.add(makeLines(buildInterRingBridges({ pairs, segs: 20, color: COL.BONE_GHOST }),
        mkJitterMat({ opacity: 0.35, jitter: 0.0012, fogNear: 2, fogFar: 55 })));
      sceneRoot.add(bridges);
      rotators.push({ group: bridges, speed: OMEGA.SCENE, axis: new THREE.Vector3(0, 1, 0.1).normalize() });
    }

    // ════════════════════════════════════════════════════════════════
    // BACKGROUND COSMOS — huge expanded universe
    // ════════════════════════════════════════════════════════════════
    {
      const cosmos = new THREE.Group();
      // Main star sphere
      const stars = buildStarSphere({ seed: 81, count: 3200, radius: 20 });
      cosmos.add(makePoints(stars, mkPointsMat({
        color: 0xd8d4c8, opacity: 0.52, size: 0.03, map: getGlowSprite(),
      })));
      // Sharp brighter stars
      const brightStars = buildStarSphere({ seed: 82, count: 300, radius: 18 });
      cosmos.add(makePoints(brightStars, mkPointsMat({
        color: 0xf0ecdf, opacity: 0.78, size: 0.04, map: getSharpDotSprite(),
        blending: THREE.NormalBlending,
      })));
      // Deep outer stars (even further)
      const outerStars = buildStarSphere({ seed: 83, count: 1800, radius: 28 });
      cosmos.add(makePoints(outerStars, mkPointsMat({
        color: 0xc8c4b8, opacity: 0.38, size: 0.022, map: getGlowSprite(),
      })));
      // Huge distant cosmic arcs & structures
      {
        const bundle = { pos: [], col: [] };
        mergeInto(bundle, arcSegments({ r: 14, a1: 0.3, a2: 2.2, segs: 100,
          color: scaleC(COL.BONE_GHOST, 1.0) }));
        mergeInto(bundle, arcSegments({ r: 15, a1: 3.5, a2: 5.1, segs: 100,
          color: scaleC(COL.BONE_GHOST, 1.0), dashed: true, dashOn: 2, dashOff: 4 }));
        mergeInto(bundle, arcSegments({ r: 16.5, a1: 1.1, a2: 4.0, segs: 120,
          color: scaleC(COL.BONE_GHOST, 0.8) }));
        mergeInto(bundle, arcSegments({ r: 19, a1: 0, a2: 3.8, segs: 140,
          color: scaleC(COL.BONE_GHOST, 0.75), dashed: true, dashOn: 3, dashOff: 6 }));
        mergeInto(bundle, arcSegments({ r: 22, a1: 2.0, a2: 5.5, segs: 160,
          color: scaleC(COL.BONE_GHOST, 0.65) }));
        mergeInto(bundle, arcSegments({ r: 25, a1: 0.5, a2: 5.0, segs: 200,
          color: scaleC(COL.BONE_GHOST, 0.5), dashed: true, dashOn: 1, dashOff: 5 }));
        cosmos.add(makeLines(finalize(bundle),
          mkJitterMat({ opacity: 0.32, jitter: 0.0004, fogNear: 5, fogFar: 80 })));
      }
      // 3 huge distant cosmic mandalas (faint, rotation-visible on far zoom)
      for (let i = 0; i < 3; i++) {
        const theta = (i / 3) * TAU + 0.3;
        const dist = 17 + i * 2.5;
        const cm = new THREE.Group();
        cm.add(makeLines(buildCosmicMandala({ scale: 1.5 + i * 0.4, symmetry: 24 + i * 6 }),
          mkJitterMat({ opacity: 0.22 - i * 0.04, jitter: 0.0003, fogNear: 8, fogFar: 90 })));
        cm.position.set(Math.cos(theta) * dist, Math.sin(theta) * dist * 0.4, -dist * 0.3);
        cm.rotation.set(Math.sin(i) * 0.3, Math.cos(i) * 0.3, 0);
        cosmos.add(cm);
        rotators.push({ group: cm, speed: OMEGA.SCENE * 0.15 * (i % 2 === 0 ? 1 : -1), axis: new THREE.Vector3(0, 0, 1) });
      }
      sceneRoot.add(cosmos);
      rotators.push({ group: cosmos, speed: OMEGA.SCENE * 0.3, axis: new THREE.Vector3(0.1, 1, 0).normalize() });
    }

    // ════════════════════════════════════════════════════════════════
    // ENTROPIC DRIFT PARTICLES — slow wander through space (time!)
    // ════════════════════════════════════════════════════════════════
    const entropyData = buildEntropicParticles({ seed: 101, count: 1800, region: [18, 11, 10] });
    let entropyPointsGeo = null;
    {
      const mat = mkPointsMat({
        color: 0xc8c4b8, opacity: 0.3, size: 0.018,
        map: getGlowSprite(),
      });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(entropyData.positions, 3));
      geometries.push(geo);
      sceneRoot.add(new THREE.Points(geo, mat));
      entropyPointsGeo = geo;
    }

    // Orange accent dots
    {
      const rand = mkRand(55);
      const arr = new Float32Array(40 * 3);
      for (let i = 0; i < 40; i++) {
        arr[i * 3] = (rand() - 0.5) * 16;
        arr[i * 3 + 1] = (rand() - 0.4) * 9;
        arr[i * 3 + 2] = (rand() - 0.5) * 6;
      }
      sceneRoot.add(makePoints(arr, mkPointsMat({
        color: 0xff6a2a, opacity: 0.85, size: 0.08, map: getOrangeSprite(),
        blending: THREE.NormalBlending,
      })));
      // A few prominent orange dots at key locations
      const bigArr = new Float32Array([
        1.0, 0.3, 0.4,
        -1.8, -0.3, 0.6,
        2.4, 1.8, -0.2,
        -3.2, 2.4, 0.3,
        0.5, -2.6, 0.2,
      ]);
      sceneRoot.add(makePoints(bigArr, mkPointsMat({
        color: 0xff7a3a, opacity: 0.92, size: 0.16, map: getOrangeSprite(),
        blending: THREE.NormalBlending,
      })));
    }

    sceneRoot.rotation.x = rot.current.current.x;
    sceneRoot.rotation.y = rot.current.current.y;

    // ════════════════════════════════════════════════════════════════
    // POST-PROCESSING
    // ════════════════════════════════════════════════════════════════
    let composer = null, chromaticPass = null, glitchPass = null;
    (async () => {
      try {
        const [composerMod, renderPassMod, bloomMod, shaderPassMod] = await Promise.all([
          import('three/examples/jsm/postprocessing/EffectComposer.js'),
          import('three/examples/jsm/postprocessing/RenderPass.js'),
          import('three/examples/jsm/postprocessing/UnrealBloomPass.js'),
          import('three/examples/jsm/postprocessing/ShaderPass.js'),
        ]);
        if (!mounted) return;
        const c = new composerMod.EffectComposer(renderer);
        c.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        c.setSize(W0, H0);
        c.addPass(new renderPassMod.RenderPass(scene, camera));
        const bloom = new bloomMod.UnrealBloomPass(
          new THREE.Vector2(Math.floor(W0 / 2), Math.floor(H0 / 2)),
          0.55, 0.62, 0.18,
        );
        c.addPass(bloom);
        chromaticPass = new shaderPassMod.ShaderPass(ChromaticAberrationShader);
        c.addPass(chromaticPass);
        glitchPass = new shaderPassMod.ShaderPass(GlitchDisplaceShader);
        glitchPass.renderToScreen = true;
        c.addPass(glitchPass);
        composer = c;
      } catch (e) {}
    })();

    // ════════════════════════════════════════════════════════════════
    // INTERACTION
    // ════════════════════════════════════════════════════════════════
    const canvas = renderer.domElement;
    canvas.style.touchAction = 'none';
    const onPointerDown = (e) => {
      drag.current.active = true;
      drag.current.lastX = e.clientX; drag.current.lastY = e.clientY;
      drag.current.velX = 0; drag.current.velY = 0;
      setIsDragging(true);
      canvas.setPointerCapture?.(e.pointerId);
    };
    const onPointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = e.clientX - rect.left;
      mouse.current.y = e.clientY - rect.top;
      mouse.current.lastMove = Date.now();
      mouse.current.entered = true;
      if (drag.current.active) {
        const dx = e.clientX - drag.current.lastX;
        const dy = e.clientY - drag.current.lastY;
        drag.current.lastX = e.clientX; drag.current.lastY = e.clientY;
        rot.current.target.y += dx * 0.0065;
        rot.current.target.x += dy * 0.0065;
        drag.current.velX = dy * 0.0065;
        drag.current.velY = dx * 0.0065;
      }
    };
    const onPointerUp = (e) => {
      drag.current.active = false;
      setIsDragging(false);
      canvas.releasePointerCapture?.(e.pointerId);
    };
    const onPointerLeave = () => {
      mouse.current.entered = false;
      drag.current.active = false;
      setIsDragging(false);
    };
    const onWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY * 0.0022;
      zoom.current.target = Math.max(1.05, Math.min(60, zoom.current.target * (1 + delta)));
      glitch.current.target = Math.min(1, glitch.current.target + 0.06);
    };
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    // ════════════════════════════════════════════════════════════════
    // ANIMATION LOOP
    // ════════════════════════════════════════════════════════════════
    const clock = new THREE.Clock();
    let rafId = 0;
    let lastFrame = performance.now();
    let fpsAcc = 0, fpsCount = 0, fps = 60;
    let lastMX = 0, lastMY = 0;
    let entropyAccum = 0;
    const SIGNAL_STATES = ['OBSERVE', 'ALIGN', 'ORBIT', 'MEASURE', 'RESONATE', 'DRIFT'];
    let signalIdx = 0, signalNext = 0;

    const getLayerLabel = (z) => {
      if (z < 2)    return 'CORE / BINDU';
      if (z < 4)    return 'INNER / MACHINE';
      if (z < 7)    return 'MID / ORRERY';
      if (z < 11)   return 'PLANETS / KNOTS';
      if (z < 16)   return 'WIDE / COSMOS';
      if (z < 22)   return 'DEEP / MEGA';
      if (z < 32)   return 'FAR / WEB';
      if (z < 45)   return 'EDGE / VOID';
      return 'ATLAS / OMEGA';
    };

    const animate = () => {
      if (!mounted) return;
      rafId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;
      fpsAcc += 1 / Math.max(dt, 1e-4);
      fpsCount++;
      if (fpsCount >= 30) { fps = fpsAcc / fpsCount; fpsAcc = 0; fpsCount = 0; }
      const t = clock.getElapsedTime();

      // Intro fade
      const introT = Math.min(1, t / 3);
      materials.forEach((mat, i) => {
        const delay = (i / Math.max(1, materials.length)) * 0.5;
        const local = Math.max(0, Math.min(1, (introT - delay) / Math.max(0.001, 1 - delay)));
        const tgt = mat.userData?.targetOpacity ?? 0.5;
        if (mat.userData?.jitterMat) mat.uniforms.uOpacity.value = tgt * local;
        else mat.opacity = tgt * local;
      });
      jitterMats.forEach(m => { m.uniforms.uTime.value = t; });

      // Zoom smoothing
      zoom.current.current += (zoom.current.target - zoom.current.current) * 0.1;
      camera.position.z = zoom.current.current;

      // Drag inertia
      if (!drag.current.active) {
        rot.current.target.x += drag.current.velX;
        rot.current.target.y += drag.current.velY;
        drag.current.velX *= 0.94;
        drag.current.velY *= 0.94;
        if (Math.abs(drag.current.velX) < 1e-4) drag.current.velX = 0;
        if (Math.abs(drag.current.velY) < 1e-4) drag.current.velY = 0;
      }
      rot.current.target.x = Math.max(-1.3, Math.min(1.3, rot.current.target.x));
      rot.current.current.x += (rot.current.target.x - rot.current.current.x) * 0.12;
      rot.current.current.y += (rot.current.target.y - rot.current.current.y) * 0.12;
      sceneRoot.rotation.x = rot.current.current.x;
      sceneRoot.rotation.y = rot.current.current.y;
      // Whole scene drifts very slowly around Y
      sceneRoot.rotation.y += dt * OMEGA.SCENE;

      // Each rotator turns on its own axis
      for (const r of rotators) {
        r.group.rotateOnAxis(r.axis, r.speed * dt);
      }

      // Entropic drift — update particle positions
      if (entropyPointsGeo) {
        entropyAccum += dt;
        const posAttr = entropyPointsGeo.attributes.position;
        const arr = posAttr.array;
        for (let i = 0; i < entropyData.positions.length / 3; i++) {
          const i3 = i * 3;
          // Position += velocity * dt
          arr[i3]     += entropyData.velocities[i3]     * dt;
          arr[i3 + 1] += entropyData.velocities[i3 + 1] * dt;
          arr[i3 + 2] += entropyData.velocities[i3 + 2] * dt;
          // Soft boundary: if far from origin, pull back gently
          const dx = arr[i3] - entropyData.origins[i3];
          const dy = arr[i3 + 1] - entropyData.origins[i3 + 1];
          const dz = arr[i3 + 2] - entropyData.origins[i3 + 2];
          const distSq = dx * dx + dy * dy + dz * dz;
          if (distSq > 2.0) {
            // Gentle spring back
            arr[i3]     -= dx * 0.002;
            arr[i3 + 1] -= dy * 0.002;
            arr[i3 + 2] -= dz * 0.002;
            // Add small turbulence
            entropyData.velocities[i3]     += (Math.random() - 0.5) * 0.002;
            entropyData.velocities[i3 + 1] += (Math.random() - 0.5) * 0.002;
            entropyData.velocities[i3 + 2] += (Math.random() - 0.5) * 0.002;
          }
        }
        posAttr.needsUpdate = true;
      }

      // Glitch
      const mvdx = mouse.current.x - lastMX, mvdy = mouse.current.y - lastMY;
      const mVel = Math.hypot(mvdx, mvdy);
      lastMX = mouse.current.x; lastMY = mouse.current.y;
      if (t > glitch.current.nextSpike) {
        glitch.current.target = 0.35 + Math.random() * 0.4;
        glitch.current.nextSpike = t + 6 + Math.random() * 9;
        glitch.current.offsetSeed = Math.random();
      }
      if (mVel > 8 && mouse.current.entered) {
        glitch.current.target = Math.min(0.8, glitch.current.target + mVel * 0.002);
      }
      const baseline = 0.04 + Math.sin(t * 0.4) * 0.02;
      glitch.current.target = Math.max(glitch.current.target, baseline);
      glitch.current.intensity += (glitch.current.target - glitch.current.intensity) * 0.1;
      glitch.current.target *= 0.95;

      if (t > signalNext) {
        signalIdx = (signalIdx + 1) % SIGNAL_STATES.length;
        signalNext = t + 2.5 + Math.random() * 2;
        if (signalRef.current) signalRef.current.textContent = SIGNAL_STATES[signalIdx];
      }

      if (chromaticPass) chromaticPass.uniforms.uAmount.value = 0.0022 + glitch.current.intensity * 0.004;
      if (glitchPass) {
        glitchPass.uniforms.uTime.value = t;
        glitchPass.uniforms.uIntensity.value = glitch.current.intensity;
        glitchPass.uniforms.uLineOffset.value = glitch.current.offsetSeed;
      }

      // HUD
      if (coordXRef.current) coordXRef.current.textContent = `x:${String(Math.round(mouse.current.x)).padStart(4, '0')}`;
      if (coordYRef.current) coordYRef.current.textContent = `y:${String(Math.round(mouse.current.y)).padStart(4, '0')}`;
      if (fpsRef.current) fpsRef.current.textContent = `${String(Math.round(fps)).padStart(3, '0')}fps`;
      if (zoomRef.current) zoomRef.current.textContent = `z×${zoom.current.current.toFixed(2)}`;
      if (rotXRef.current) rotXRef.current.textContent = `θx:${(rot.current.current.x * 57.2958).toFixed(1).padStart(5, '0')}°`;
      if (rotYRef.current) rotYRef.current.textContent = `θy:${(rot.current.current.y * 57.2958).toFixed(1).padStart(5, '0')}°`;
      if (layerRef.current) layerRef.current.textContent = getLayerLabel(zoom.current.current);
      if (entropyRef.current) entropyRef.current.textContent = `S+${(entropyAccum * 1.618).toFixed(2).padStart(6, '0')}`;

      if (composer) composer.render();
      else renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const W = mount.clientWidth, H = mount.clientHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
      if (composer) composer.setSize(W, H);
    };
    window.addEventListener('resize', onResize);

    return () => {
      mounted = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('webglcontextlost', onCtxLost);
      geometries.forEach(g => g.dispose());
      materials.forEach(m => m.dispose());
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  // ════════════════════════════════════════════════════════════════════
  // JSX
  // ════════════════════════════════════════════════════════════════════
  return (
    <div
      ref={wrapRef}
      className="relative w-full h-screen overflow-hidden select-none"
      style={{
        background: 'radial-gradient(ellipse at 50% 50%, #0c0c18 0%, #060610 55%, #020208 100%)',
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      }}
    >
      <style>{`
        @keyframes blink { 0%,60% { opacity: 1; } 70%,100% { opacity: 0.18; } }
        @keyframes rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes wordmark-flicker {
          0%, 94%, 100% { opacity: 1; transform: translateX(0); }
          95% { opacity: 0.85; transform: translateX(-0.8px); text-shadow: 1px 0 0 rgba(230,226,211,0.35), -1px 0 0 rgba(191,78,107,0.35); }
          97% { opacity: 1; transform: translateX(0.3px); }
        }
        .rise-a { animation: rise 1.0s 0.3s cubic-bezier(.2,.8,.2,1) both; }
        .rise-b { animation: rise 1.0s 0.7s cubic-bezier(.2,.8,.2,1) both; }
        .rise-c { animation: rise 1.0s 1.1s cubic-bezier(.2,.8,.2,1) both; }
        .wordmark-glitch { animation: wordmark-flicker 9s infinite steps(1, end); display: inline-block; }
        .vignette-overlay {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse at 50% 50%, transparent 42%, rgba(0,0,0,0.6) 100%);
        }
        .corner-reg {
          position: absolute; width: 22px; height: 22px;
          border-color: rgba(230, 226, 211, 0.32);
          border-style: solid; border-width: 0;
        }
      `}</style>

      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="grainFilter-v15">
            <feTurbulence type="fractalNoise" baseFrequency="2.0" numOctaves="2" />
            <feColorMatrix values="0 0 0 0 0.85  0 0 0 0 0.88  0 0 0 0 0.92  0 0 0 0.035 0" />
          </filter>
        </defs>
      </svg>

      <div className="absolute inset-0" style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
        <div ref={mountRef} className="absolute inset-0" />
      </div>

      <div className="absolute inset-0 pointer-events-none opacity-30" style={{ filter: 'url(#grainFilter-v15)' }} />
      <div className="absolute inset-0 pointer-events-none vignette-overlay" />

      <div className="corner-reg" style={{ top: 20, left: 20, borderTopWidth: 1, borderLeftWidth: 1 }} />
      <div className="corner-reg" style={{ top: 20, right: 20, borderTopWidth: 1, borderRightWidth: 1 }} />
      <div className="corner-reg" style={{ bottom: 20, left: 20, borderBottomWidth: 1, borderLeftWidth: 1 }} />
      <div className="corner-reg" style={{ bottom: 20, right: 20, borderBottomWidth: 1, borderRightWidth: 1 }} />

      {/* Top-left */}
      <div className="absolute top-0 left-0 p-8 z-10 rise-a pointer-events-none">
        <div className="flex items-baseline gap-3">
          <span className="wordmark-glitch" style={{
            fontFamily: "'Comfortaa', sans-serif", fontWeight: 700, color: '#BF4E6B',
            fontSize: '24px', letterSpacing: '-0.01em',
          }}>ekkoee</span>
          <span className="text-[10px] tracking-[0.22em]" style={{ color: 'rgba(230, 226, 211, 0.55)' }}>
            V0.15.1_DANCING
          </span>
        </div>
        <div className="text-[9px] font-light tracking-[0.25em] mt-1" style={{ color: 'rgba(230, 226, 211, 0.48)' }}>
          SACRED ORRERY · <span ref={layerRef}>—</span>
        </div>
        <div className="text-[8px] font-light tracking-[0.2em] mt-0.5" style={{ color: 'rgba(230, 226, 211, 0.32)' }}>
          10 rings · 190+ mounts · 74 builders · φ-geared · entropy +<span ref={entropyRef}>000.00</span>
        </div>
      </div>

      {/* Top-right */}
      <div className="absolute top-0 right-0 p-8 z-10 text-right rise-a pointer-events-none">
        <div ref={clockRef} className="text-[11px] font-light tracking-[0.08em]" style={{ color: 'rgba(230, 226, 211, 0.75)' }}>
          2026·04·22  00:00:00.00
        </div>
        <div className="flex gap-3 justify-end text-[9px] mt-1 tracking-[0.1em]" style={{ color: 'rgba(230, 226, 211, 0.7)' }}>
          <span ref={rotXRef}>θx:000.0°</span>
          <span ref={rotYRef}>θy:000.0°</span>
        </div>
        <div className="flex gap-3 justify-end text-[9px] mt-0.5 tracking-[0.1em]" style={{ color: 'rgba(255, 106, 42, 0.65)' }}>
          <span ref={zoomRef}>z×12.00</span>
          <span ref={fpsRef}>060fps</span>
        </div>
        <div className="text-[8px] mt-1.5 tracking-[0.28em]" style={{ color: 'rgba(191, 78, 107, 0.65)' }}>
          SIGNAL · <span ref={signalRef}>OBSERVE</span> · <span style={{ animation: 'blink 1.2s infinite' }}>●</span>
        </div>
      </div>

      {/* Bottom-left */}
      <div className="absolute bottom-0 left-0 p-8 z-10 rise-b text-[10px] font-light pointer-events-none">
        <div className="tracking-[0.3em] mb-2" style={{ color: 'rgba(230, 226, 211, 0.55)' }}>POINTER ::</div>
        <div className="flex gap-3" style={{ color: 'rgba(230, 226, 211, 0.75)' }}>
          <span ref={coordXRef}>x:0000</span>
          <span ref={coordYRef}>y:0000</span>
        </div>
        <div className="mt-3 max-w-xs leading-relaxed tracking-wide" style={{ color: 'rgba(230, 226, 211, 0.42)' }}>
          <span style={{ color: 'rgba(230, 226, 211, 0.85)' }}>drag</span> — orbit the mechanism<br />
          <span style={{ color: 'rgba(255, 106, 42, 0.9)' }}>scroll</span> — traverse scale <span style={{ opacity: 0.55 }}>(1.05× → 60×)</span><br />
          each ring turns at <span style={{ color: '#BF4E6B' }}>φⁿ</span> · artifacts self-spin
        </div>
      </div>

      {/* Bottom-center */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 rise-c text-center pointer-events-none">
        {isDragging ? (
          <div className="text-[11px] tracking-[0.5em]" style={{ color: 'rgba(230, 226, 211, 0.85)' }}>
            ROTATING · SACRED ORRERY
          </div>
        ) : (
          <>
            <div className="text-[10px] tracking-[0.55em] mb-1" style={{ color: 'rgba(230, 226, 211, 0.5)' }}>
              ─── MINI-AGI FOR MANUFACTURING ───
            </div>
            <div className="text-[9px] tracking-[0.4em]" style={{ color: 'rgba(230, 226, 211, 0.32)' }}>
              OBSERVE · CALIBRATE · EVOLVE
            </div>
          </>
        )}
      </div>

      {/* Bottom-right — orrery status */}
      <div className="absolute bottom-0 right-0 p-8 z-10 rise-b text-right text-[10px] font-light pointer-events-none">
        <div className="tracking-[0.3em] mb-2" style={{ color: 'rgba(230, 226, 211, 0.55)' }}>ORRERY ::</div>
        <div className="space-y-0.5" style={{ color: 'rgba(230, 226, 211, 0.7)' }}>
          <div><span style={{ color: 'rgba(230, 226, 211, 0.4)' }}>ring  </span>ω₁ <span style={{color:'#BF4E6B'}}>−φ¹⁰</span></div>
          <div><span style={{ color: 'rgba(230, 226, 211, 0.4)' }}>ring  </span>ω₂ <span style={{color:'#f0ecdf'}}>+φ⁹</span></div>
          <div><span style={{ color: 'rgba(230, 226, 211, 0.4)' }}>ring  </span>ω₃ <span style={{color:'#BF4E6B'}}>−φ⁸</span></div>
          <div><span style={{ color: 'rgba(230, 226, 211, 0.4)' }}>ring  </span>ω₄ <span style={{color:'#f0ecdf'}}>+φ⁷</span></div>
          <div><span style={{ color: 'rgba(230, 226, 211, 0.4)' }}>ring  </span>ω₅ <span style={{color:'#BF4E6B'}}>−φ⁶</span></div>
          <div><span style={{ color: 'rgba(230, 226, 211, 0.4)' }}>ring  </span>ω₆ <span style={{color:'#f0ecdf'}}>+φ⁵</span></div>
          <div><span style={{ color: 'rgba(230, 226, 211, 0.4)' }}>ring  </span>ω₇ <span style={{color:'#BF4E6B'}}>−φ⁴</span></div>
          <div><span style={{ color: 'rgba(230, 226, 211, 0.4)' }}>ring  </span>ω₈ <span style={{color:'#f0ecdf'}}>+φ³</span></div>
          <div><span style={{ color: 'rgba(230, 226, 211, 0.4)' }}>ring  </span>ω₉ <span style={{color:'#BF4E6B'}}>−φ²</span></div>
          <div><span style={{ color: 'rgba(230, 226, 211, 0.4)' }}>ring  </span>ω₁₀ <span style={{color:'#f0ecdf'}}>+φ¹</span></div>
          <div><span style={{ color: 'rgba(230, 226, 211, 0.4)' }}>core  </span>BH <span style={{color:'rgba(255,106,42,0.9)'}}>accreting</span></div>
          <div className="mt-1 italic" style={{ color: 'rgba(230, 226, 211, 0.3)' }}>
            <span style={{ animation: 'blink 0.8s infinite' }}>_</span>
          </div>
        </div>
      </div>
    </div>
  );
}
