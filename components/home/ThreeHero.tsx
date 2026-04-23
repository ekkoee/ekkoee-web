'use client';

// =====================================================================
// ekkoee homepage v2 — ThreeHero (Three.js r170)
// Rose gear-molecule orbited by 3 satellites, streamed packets, and
// an ambient colored particle field, with mouse parallax.
//
// Verified against the prototype in docs/ekkoee-homepage-v2.jsx.
// API differences vs r128 we rely on:
//  - MeshStandardMaterial works the same, but color management is sRGB
//    by default from r152+; our hex values render identically.
//  - BufferGeometry.setFromPoints / setAttribute unchanged.
//  - Color, Vector3, Clock unchanged.
//
// Cleanup (per brief): cancelAnimationFrame + renderer.dispose() +
// geometry/material.dispose() for every disposable Object3D in the
// scene, plus removal of window listeners and the canvas element.
// =====================================================================

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface SatConfig {
  radius: number;
  angle: number;
  speed: number;
  size: number;
  color: THREE.Color;
}

interface PacketUserData {
  satIdx: number;
  progress: number;
  speed: number;
}

export default function ThreeHero() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth;
    const h = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0c, 0.035);

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.set(0, 0, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // --- gear group -------------------------------------------------
    const gearGroup = new THREE.Group();
    scene.add(gearGroup);

    const roseColor = new THREE.Color(0xbf4e6b);
    const greenColor = new THREE.Color(0x00ff88);
    const amberColor = new THREE.Color(0xffb938);

    const gear = new THREE.Group();

    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(1.8, 0.35, 16, 48),
      new THREE.MeshStandardMaterial({
        color: roseColor,
        metalness: 0.6,
        roughness: 0.3,
        emissive: roseColor,
        emissiveIntensity: 0.15,
      }),
    );
    gear.add(torus);

    const teethCount = 10;
    for (let i = 0; i < teethCount; i++) {
      const angle = (i / teethCount) * Math.PI * 2;
      const tooth = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.5, 0.35),
        new THREE.MeshStandardMaterial({
          color: roseColor,
          metalness: 0.6,
          roughness: 0.3,
          emissive: roseColor,
          emissiveIntensity: 0.15,
        }),
      );
      tooth.position.x = Math.cos(angle) * 1.95;
      tooth.position.y = Math.sin(angle) * 1.95;
      tooth.rotation.z = angle;
      gear.add(tooth);
    }

    const innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.9, 0.08, 8, 32),
      new THREE.MeshStandardMaterial({
        color: roseColor,
        emissive: roseColor,
        emissiveIntensity: 0.4,
      }),
    );
    gear.add(innerRing);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 16, 16),
      new THREE.MeshStandardMaterial({
        color: greenColor,
        emissive: greenColor,
        emissiveIntensity: 1.5,
      }),
    );
    gear.add(core);

    gearGroup.add(gear);

    // --- satellites -------------------------------------------------
    const satellites: SatConfig[] = [
      { radius: 3.6, angle: 0, speed: 0.4, size: 0.45, color: roseColor },
      { radius: 3.2, angle: Math.PI * 0.7, speed: -0.3, size: 0.35, color: roseColor },
      { radius: 3.8, angle: Math.PI * 1.3, speed: 0.35, size: 0.4, color: roseColor },
    ];
    const satelliteMeshes: { mesh: THREE.Mesh; cfg: SatConfig }[] =
      satellites.map((s) => {
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(s.size, 16, 16),
          new THREE.MeshStandardMaterial({
            color: s.color,
            metalness: 0.6,
            roughness: 0.3,
            emissive: s.color,
            emissiveIntensity: 0.25,
          }),
        );
        gearGroup.add(mesh);
        return { mesh, cfg: s };
      });

    // --- packets flowing along lines -------------------------------
    const packetMaterial = new THREE.MeshBasicMaterial({ color: greenColor });
    const packetGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const packets: THREE.Mesh[] = [];
    for (let i = 0; i < 12; i++) {
      const packet = new THREE.Mesh(packetGeometry, packetMaterial);
      const userData: PacketUserData = {
        satIdx: i % 3,
        progress: Math.random(),
        speed: 0.3 + Math.random() * 0.5,
      };
      packet.userData = userData;
      gearGroup.add(packet);
      packets.push(packet);
    }

    // --- dynamic connection lines ----------------------------------
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xbf4e6b,
      transparent: true,
      opacity: 0.35,
    });
    const lineGroup = new THREE.Group();
    gearGroup.add(lineGroup);

    // --- particle field --------------------------------------------
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
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // --- lighting ---------------------------------------------------
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(5, 5, 5);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x00ff88, 0.5);
    rimLight.position.set(-5, -2, -3);
    scene.add(rimLight);

    // --- mouse parallax --------------------------------------------
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMouse = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      mouse.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 0.4;
      mouse.ty = ((e.clientY - rect.top) / rect.height - 0.5) * 0.4;
    };
    window.addEventListener('mousemove', onMouse);

    // --- resize -----------------------------------------------------
    const onResize = () => {
      const nw = mount.clientWidth;
      const nh = mount.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    // --- animate ----------------------------------------------------
    let raf = 0;
    const clock = new THREE.Clock();
    const zeroVec = new THREE.Vector3(0, 0, 0);

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

      // redraw lines (dispose previous geometries to avoid per-frame leak)
      while (lineGroup.children.length) {
        const child = lineGroup.children[0];
        if (child instanceof THREE.Line) {
          child.geometry.dispose();
        }
        lineGroup.remove(child);
      }
      satPositions.forEach((p) => {
        const geo = new THREE.BufferGeometry().setFromPoints([zeroVec, p]);
        lineGroup.add(new THREE.Line(geo, lineMaterial));
      });

      // update packets flowing along lines
      packets.forEach((p) => {
        const ud = p.userData as PacketUserData;
        ud.progress += ud.speed * dt;
        if (ud.progress > 1) {
          ud.progress = 0;
          ud.satIdx = Math.floor(Math.random() * 3);
        }
        const target = satPositions[ud.satIdx];
        p.position.lerpVectors(zeroVec, target, ud.progress);
      });

      // particles slow rotation
      particles.rotation.y = t * 0.02;
      particles.rotation.x = t * 0.01;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    // --- cleanup ----------------------------------------------------
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', onResize);

      // drain any pending line geometries
      while (lineGroup.children.length) {
        const child = lineGroup.children[0];
        if (child instanceof THREE.Line) {
          child.geometry.dispose();
        }
        lineGroup.remove(child);
      }

      // dispose every geometry + material reachable from the scene
      scene.traverse((obj) => {
        if (
          obj instanceof THREE.Mesh ||
          obj instanceof THREE.Line ||
          obj instanceof THREE.Points
        ) {
          obj.geometry.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) {
            mat.forEach((m) => m.dispose());
          } else {
            mat.dispose();
          }
        }
      });

      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ position: 'absolute', inset: 0, zIndex: 1 }}
    />
  );
}
