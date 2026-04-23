# ekkoee hero v15.1 — 交接文件

複製整份貼給下一個 Claude/Cowork 當開場,他就有完整 context。

---

## 檔案
- **主檔**:`ekkoee_hero_v15.jsx`（4040 行,177KB,單檔 JSX + Three.js inline import）
- 驗證方式:`cat ekkoee_hero_v15.jsx | npx esbuild --loader=jsx`(必須 exit 0)
- 編譯過就能直接丟進 React 專案當 hero 元件使用

---

## 目前狀態 v15.1「SACRED ORRERY · DENSER DANCE」

**10 個同心軌道(radii 從 1.20 → 11.50,超密)+ 8 環齒輪反向 Fibonacci 比率**

- 軌道傾斜 ±47° ~ ±60°,環之間肉眼可見直接切穿
- 74 個 builder 函數,約 190+ 個 mount(部件)
- 1800 顆 entropy 粒子 + 3200 星 + 3 層宇宙背景
- 滾輪範圍 1.05× → 60×(9 層 zoom 標籤)
- 中軸:Black Hole + 吸積盤 + 噴流 + 第二反轉盤(取代 v14 的純 DNA 軸)

**每環獨特線條風格**

| Ring | R | Style | 內容 |
|------|------|-----------|------|
| 0 | 1.20 | solid | Sri Yantra 完整版 + Enneagram + Mandala(8) + Merkaba + Vesica + Saturn |
| 1 | 1.75 | shortDash | Metatron + Fibonacci Rich + Flower + Icosahedron + Seed + Atomic Orbital + Mandala(12) + Kepler Mysterium + Sphere Harmonics + LogSpiral |
| 2 | 2.40 | dotted | Stippled ×2 + TorusKnot ×2 + Tesseract + Dodecahedron + Saturn + Moon ×2 + Planet + Sphere Harmonics + Klein + Epicycloid ×2 + Bloch |
| 3 | 3.20 | **BEADED**(72 顆珍珠) | Lorenz + Möbius + Borromean + Hopf + Rose Curve + Penrose + Koch + Quantum + Apollonian + Lissajous + CalabiYau + Cayley + Chladni + Turing + Ulam + FordCircles |
| 4 | 4.15 | double(雙平行線) | RoseWindow + Zodiac + Astrolabe + Torus + Ulam + Chladni + Voronoi + Epicycloid + 10 小 marker |
| 5 | 5.25 | longDash | TreeOfLife + Mandala(16) + Mandala(24) + Turing + Kepler + Poincaré + Voronoi + 13 小 glyph |
| 6 | 6.50 | irregular(隨機抽段) | E8 + Mandala(32) + Phyllotaxis + 22 小 glyph |
| 7 | 7.95 | triple(三同心) | CosmicMandala(36) + Buckyball + 28 cross |
| 8 | 9.60 | sparseDot | Menger + Gyroid + Kepler + Tesseract + Buckyball + E8 + Klein + Torus + CosmicMandala(48) + SphereHarmonics + 24-cell + Poincaré + 32 marker |
| 9 | 11.50 | ghost | 4× CosmicWeb + 2× SpiralGalaxy + 2× CosmicMandala(60/72) + 40 tick |

---

## 使用者的絕對美學守則(違反一定被罵)

1. **色系**:深黑底 `#040410` + 骨白線條 `#ebe6d7` + 極少橘 `#ff6a2a` + 玫瑰紅 `#BF4E6B`(只給 Sri Yantra bindu)。不要珊瑚、藍圖藍、粉彩、任何其他顏色
2. **風格**:Hermès 印象主義 + 終端機 CRT + 精密鐘錶 orrery。sacred geometry 刺青 + 古董星盤的氣質
3. **禁放**:
   - 六芒星 + 圓 + 正方形(任何組合都無聊)
   - 光禿螺旋(未包黃金矩形網格的 Fibonacci)
   - 金字塔 / 2D Sierpinski 三角
   - Tidy gallery(整齊方塊堆疊的 demo 感)
   - 藍圖科技風
4. **運動**:齒輪咬合、Fibonacci 比率、反向旋轉、黃金角隨機軸自轉、線條微微抖動(jitter 0.0005-0.0018)
5. **溝通**:繁體中文,直接,不要客套,不要過度道歉,不要問太多「要不要這樣」,做完再看

---

## 技術約束

- 單一 `.jsx` 檔,Three.js `import * as THREE from 'three'`
- 所有 builder 統一回傳 `{ positions, colors }`(Float32Array)
- 內部用:`emitSeg` / `mergeInto` / `circleSegments` / `arcSegments` / `finalize(b)`
- 顏色只能用 `COL.BONE / BONE_DIM / BONE_DEEP / BONE_GHOST / ROSE / ORANGE_DOT` + `scaleC(col, factor)` + `lerpC(a, b, t)`
- 材質套 `mkJitterMat({ opacity, jitter, fogNear, fogFar })` 給線,`mkPointsMat({ color, opacity, size, map })` 給點
- 改完必跑:`cat ekkoee_hero_v15.jsx | npx esbuild --loader=jsx` → 確認沒錯
- 插新 builder 位置:在 `// ORRERY-SPECIFIC BUILDERS — rings, connectors, axial shaft` 這行之前

---

## 進版歷史

- **v14**:56 builders / 8 環 / 120 mount / Top-down tilt 小(±10-16°)
- **v15**:66 builders / 10 環(R=1.35-19.00)/ Black Hole 進中軸 / tilt ±15-33° / 新增 10 個(Kepler, Gyroid, Menger, SphereHarmonics, Chladni, Ulam, CosmicWeb, BH, Klein, Turing)
- **v15.1**(現在):74 builders / 10 環更密(R=1.20-11.50)/ tilt ±47-60° / 每環獨特線條風格 / 新增 8 個(Voronoi, Poincaré, SpiralGalaxy, Ford, Epicycloid, 24-cell, Bloch, LogSpiral)

---

## 還沒放的下一批候選(使用者有興趣)

**3D 分形混沌家族**:Rössler / Aizawa / Thomas / Chua / Halvorsen Attractor(比 Lorenz 更俐落)、Mandelbulb 3D、Sierpinski Tetrahedron

**拓撲**:Boy's Surface、Roman Surface、Alexander Horned Sphere、Figure-8 Knot、Hopf Link、Whitehead Link、Celtic Knot

**宇宙學**:Einstein Ring、Light Cone、Penrose Diagram、CMB Anisotropy、Kerr Ergosphere、Spin Network(LQG)、Feynman Diagrams、Kepler Ellipse Orbits

**4D 多胞形**:120-cell、600-cell、Compound of 5 Tetrahedra、Great Stellated Dodecahedron

**反應擴散 / 生物**:Belousov-Zhabotinsky、Slime Mold、Vein Venation、Neural Network Graph、Gray-Scott 斑點 vs Turing 條紋

**數論**:Collatz Tree、Zeta Zeros、Stern-Brocot Tree、Pascal Mod N、Gaussian Primes

**參數曲線**:Hypocycloid、Astroid、Deltoid、Nephroid、Cardioid、Cassini Ovals、Lemniscate

**其他**:Islamic Girih Tiling、Truchet Tiles、Guilloche Pattern、Chladni 變種(圓盤版)、Reuleaux Triangle

**3D 極小曲面家族**:Schwarz P Surface、Schoen I-WP、Enneper、Costa's Minimal(Gyroid 親戚)

使用者偏好下一步可能:**加 Ring 10(專放 3D 混沌吸引子一家子)** 或 **Ring -1(中軸內層塞 Light Cone / Einstein Ring)**

---

## 下次開場直接丟這段

> 這是 ekkoee.com hero 動畫 v15.1「SACRED ORRERY · DENSER DANCE」,附上 `ekkoee_hero_v15.jsx`。請遵守交接文件裡的美學守則和技術約束。使用者繁體中文直接溝通,偏好執行力優於解釋。目前 74 builders / 10 環 / 190+ mounts,下一批想加 [具體模型]。
