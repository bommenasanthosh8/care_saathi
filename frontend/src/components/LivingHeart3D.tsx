// ==============================================================================
// CareSaathi AI - "The Living Heart" 3D Scene
//
// Centerpiece: Glossy 3D Heart with lub-dub double pulse, shockwave ring,
//              orbiting tablets and capsules (instanced, multi-color candy gloss),
//              dynamic ECG waveform line, studio lighting, pointer parallax,
//              and desktop hairline leader line captions.
// Fallback: Layered SVG illustration for WebGL-off or reduced-motion.
// ==============================================================================

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export interface LivingHeart3DProps {
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
  compact?: boolean;
  variant?: 'hero' | 'login';
  loginState?: 'idle' | 'focus' | 'typing' | 'loading' | 'success' | 'error';
}

// ------------------------------------------------------------------------------
// WebGL Detection Helper
// ------------------------------------------------------------------------------
const checkWebGLSupport = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
};

// ------------------------------------------------------------------------------
// Tablet / Pill Color Palette (Soft Harmonious Pastels, MeshPhysicalMaterial)
// ------------------------------------------------------------------------------
const TABLET_PALETTE = [
  { name: 'coral', hex: '#F6A89E', labelColor: '#C85A48' },
  { name: 'aqua', hex: '#7DD3C7', labelColor: '#2F8F83' },
  { name: 'sky', hex: '#93C5FD', labelColor: '#2563EB' },
  { name: 'violet', hex: '#C4B5FD', labelColor: '#6D28D9' },
  { name: 'sunny', hex: '#FDE68A', labelColor: '#B45309' },
  { name: 'mint', hex: '#A7F3D0', labelColor: '#059669' },
  { name: 'white-pearl', hex: '#F8FAFC', labelColor: '#64748B' }
];

// Captions attached to real app features
interface FeatureAnchor {
  title: string;
  sub: string;
  color: string;
  pillIdx: number;
  slot: 'top-left' | 'bottom-left' | 'right';
}

const FEATURE_ANCHORS: FeatureAnchor[] = [
  { 
    title: 'Cost estimates', 
    sub: 'Statutory & Private tariffs', 
    color: '#2F8F83', 
    pillIdx: 2,
    slot: 'top-left'
  },
  { 
    title: 'Empanelled hospitals', 
    sub: 'Empanelled network mapped', 
    color: '#2563EB', 
    pillIdx: 6,
    slot: 'bottom-left'
  },
  { 
    title: 'Scheme guidance', 
    sub: 'PM-JAY & Aarogyasri coverage', 
    color: '#C85A48', 
    pillIdx: 10,
    slot: 'right'
  }
];

export const LivingHeart3D: React.FC<LivingHeart3DProps> = ({
  className = '',
  style = {},
  interactive = true,
  compact = false,
  variant = 'hero',
  loginState = 'idle'
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hasWebGL] = useState<boolean>(checkWebGLSupport);
  const mousePos = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const isVisibleRef = useRef<boolean>(true);
  const loginStateRef = useRef(loginState);
  useEffect(() => {
    loginStateRef.current = loginState;
  }, [loginState]);
  const [screenCoords, setScreenCoords] = useState<{ [idx: number]: { x: number; y: number } }>({});
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: compact ? 340 : (variant === 'login' ? 480 : 540),
    height: compact ? 320 : (variant === 'login' ? 440 : 480)
  });

  useEffect(() => {
    if (!hasWebGL) return;

    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768 || compact;

    // --------------------------------------------------------------------------
    // 1. Scene, Camera, Renderer Setup
    // --------------------------------------------------------------------------
    const isLogin = variant === 'login';
    const width = container.clientWidth || (compact ? 340 : (isLogin ? 480 : 540));
    const height = container.clientHeight || (compact ? 320 : (isLogin ? 440 : 480));
    setDimensions({ width, height });

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, isLogin ? 5.8 : (compact ? 7.6 : 6.8));

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });

    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    // Clear any previous children
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // --------------------------------------------------------------------------
    // 2. Studio Lighting Setup
    // --------------------------------------------------------------------------
    // Key Light (Softbox cool white, softened)
    const keyLight = new THREE.DirectionalLight(0xF8FAFC, 1.05);
    keyLight.position.set(4, 5, 5);
    scene.add(keyLight);

    // Warm Peach Bounce Light (from lower-left, softened)
    const bounceLight = new THREE.DirectionalLight(0xFED7AA, 0.45);
    bounceLight.position.set(-4, -3, 3);
    scene.add(bounceLight);

    // Soft Mint Rim Light (from behind right, softened)
    const rimLight = new THREE.DirectionalLight(0xA7F3D0, 0.60);
    rimLight.position.set(3, 2, -4);
    scene.add(rimLight);

    // Bright Soft Ambient Fill (eliminates harsh dark shadows)
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.85);
    scene.add(ambientLight);

    // Soft lightened floor contact shadow
    const shadowGeo = new THREE.PlaneGeometry(5.5, 5.5);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(64, 64, 10, 64, 64, 60);
      grad.addColorStop(0, 'rgba(16, 42, 54, 0.08)');
      grad.addColorStop(0.5, 'rgba(16, 42, 54, 0.02)');
      grad.addColorStop(1, 'rgba(16, 42, 54, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.4,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -2.1;
    scene.add(shadowMesh);

    // --------------------------------------------------------------------------
    // 3. Centerpiece: Procedural Soft Pastel 3D Heart Mesh (#F2A0A0 to #E88B8B)
    // --------------------------------------------------------------------------
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0.42);
    // Left atrium bulge
    heartShape.bezierCurveTo(-0.08, 0.82, -0.78, 0.82, -0.78, 0.32);
    // Left ventricle taper down to bottom apex
    heartShape.bezierCurveTo(-0.78, -0.15, -0.42, -0.68, 0, -1.08);
    // Right ventricle taper up from bottom apex
    heartShape.bezierCurveTo(0.42, -0.68, 0.78, -0.15, 0.78, 0.32);
    // Right atrium bulge back to top cleft
    heartShape.bezierCurveTo(0.78, 0.82, 0.08, 0.82, 0, 0.42);

    const extrudeSettings = {
      depth: 0.32,
      bevelEnabled: true,
      bevelSegments: 20,
      steps: 2,
      bevelSize: 0.32,
      bevelThickness: 0.32,
      curveSegments: 36
    };

    const heartGeo = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    heartGeo.center();

    // Sculpt vertex depth to give plump volume to the lobes and taper the apex in 3D
    const pos = heartGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      let z = pos.getZ(i);
      // Volume factor based on height
      const heightFactor = Math.max(0.15, (y + 1.15) / 1.7);
      z *= Math.pow(heightFactor, 0.48);
      // Organic forward curve
      z += Math.sin((y + 0.6) * 1.4) * 0.12;
      pos.setZ(i, z);
    }
    heartGeo.computeVertexNormals();

    const heartMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#F2A0A0'),
      emissive: new THREE.Color('#E88B8B'),
      emissiveIntensity: 0.12,
      roughness: 0.22,
      metalness: 0.02,
      clearcoat: 0.55,
      clearcoatRoughness: 0.14,
      sheen: 0.45,
      sheenColor: new THREE.Color('#FCE7F3'),
      transmission: 0.08,
      ior: 1.40
    });

    const heartMesh = new THREE.Mesh(heartGeo, heartMat);
    heartMesh.scale.set(1.4, 1.4, 1.4);
    heartMesh.position.set(0, 0.1, 0);

    const heartGroup = new THREE.Group();
    heartGroup.add(heartMesh);
    scene.add(heartGroup);

    // Shockwave Rings (Soft Pastel Pulse Rings)
    const ringGeo = new THREE.TorusGeometry(1.2, 0.022, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#FBCFE8'),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const shockwaveRing1 = new THREE.Mesh(ringGeo, ringMat);
    const shockwaveRing2 = shockwaveRing1.clone();
    shockwaveRing1.rotation.x = Math.PI * 0.15;
    shockwaveRing2.rotation.x = -Math.PI * 0.1;
    scene.add(shockwaveRing1);
    scene.add(shockwaveRing2);

    // --------------------------------------------------------------------------
    // 4. Orbiting Tablets and Capsules (calmer 8-10 pieces on 2 orbits for login)
    // --------------------------------------------------------------------------
    const pieceCount = isLogin ? (isMobile ? 6 : 9) : (isMobile ? 9 : 14);
    const pieces: {
      group: THREE.Group;
      mesh: THREE.Object3D;
      orbitRadius: number;
      orbitSpeed: number;
      orbitAngle: number;
      orbitTiltX: number;
      orbitTiltZ: number;
      selfRotSpeed: { x: number; y: number; z: number };
      colorHex: string;
      index: number;
      originalPos: THREE.Vector3;
      hoverOffset: number;
    }[] = [];

    // Shared Geometries for Performance
    const capsuleTopGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.16, 16);
    const capsuleCapGeo = new THREE.SphereGeometry(0.12, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const tabletGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.08, 24);
    const capletGeo = new THREE.SphereGeometry(0.16, 16, 16);
    const beadGeo = new THREE.SphereGeometry(0.1, 16, 16);

    // Pre-allocated materials for each palette color (Soft pastel sheen)
    const paletteMaterials = TABLET_PALETTE.map(item => {
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(item.hex),
        roughness: 0.26,
        metalness: 0.02,
        clearcoat: 0.55,
        clearcoatRoughness: 0.15,
        transmission: item.name === 'white-pearl' ? 0.04 : 0.06,
        ior: 1.38
      });
    });

    const orbitConfigs = isLogin ? [
      { radius: 2.05, tiltX: 0.30, tiltZ: 0.12, speed: 0.18 },
      { radius: 2.75, tiltX: -0.36, tiltZ: -0.18, speed: -0.13 }
    ] : [
      { radius: 2.2, tiltX: 0.35, tiltZ: 0.15, speed: 0.22 },   // slowed ~27% from 0.30
      { radius: 2.82, tiltX: -0.42, tiltZ: -0.22, speed: -0.15 }, // slowed 25% from -0.20
      { radius: 3.42, tiltX: 0.20, tiltZ: -0.32, speed: 0.11 }  // slowed ~27% from 0.15
    ];

    // Optional faint orbit trail lines (reduced opacity to 0.05)
    orbitConfigs.forEach(cfg => {
      const trailCurve = new THREE.EllipseCurve(
        0, 0,
        cfg.radius, cfg.radius * 0.92,
        0, 2 * Math.PI,
        false,
        0
      );
      const trailPoints = trailCurve.getPoints(64).map(p => new THREE.Vector3(p.x, 0, p.y));
      const trailGeo = new THREE.BufferGeometry().setFromPoints(trailPoints);
      const trailMat = new THREE.LineBasicMaterial({
        color: 0x438F84,
        transparent: true,
        opacity: 0.05
      });
      const trailLine = new THREE.Line(trailGeo, trailMat);
      trailLine.rotation.x = cfg.tiltX;
      trailLine.rotation.z = cfg.tiltZ;
      scene.add(trailLine);
    });

    for (let i = 0; i < pieceCount; i++) {
      const orbitCfg = orbitConfigs[i % orbitConfigs.length];
      const colorItem = TABLET_PALETTE[i % TABLET_PALETTE.length];
      const mat = paletteMaterials[i % TABLET_PALETTE.length];
      const altMat = paletteMaterials[(i + 3) % TABLET_PALETTE.length];

      const pieceGroup = new THREE.Group();
      let pieceMesh: THREE.Object3D;

      const shapeType = i % 4;
      if (shapeType === 0) {
        // Two-tone capsule
        const capGroup = new THREE.Group();
        const topBody = new THREE.Mesh(capsuleTopGeo, mat);
        topBody.position.y = 0.08;
        const topDome = new THREE.Mesh(capsuleCapGeo, mat);
        topDome.position.y = 0.16;

        const botBody = new THREE.Mesh(capsuleTopGeo, altMat);
        botBody.position.y = -0.08;
        const botDome = new THREE.Mesh(capsuleCapGeo, altMat);
        botDome.rotation.x = Math.PI;
        botDome.position.y = -0.16;

        capGroup.add(topBody, topDome, botBody, botDome);
        pieceMesh = capGroup;
      } else if (shapeType === 1) {
        // Round tablet with score line
        const tabMesh = new THREE.Mesh(tabletGeo, mat);
        // Score line across top
        const scoreGeo = new THREE.BoxGeometry(0.34, 0.02, 0.02);
        const scoreMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.4 });
        const scoreMesh = new THREE.Mesh(scoreGeo, scoreMat);
        scoreMesh.position.y = 0.042;
        tabMesh.add(scoreMesh);
        pieceMesh = tabMesh;
      } else if (shapeType === 2) {
        // Oval caplet
        const capletMesh = new THREE.Mesh(capletGeo, mat);
        capletMesh.scale.set(1.5, 0.9, 0.9);
        pieceMesh = capletMesh;
      } else {
        // Tiny glossy pearl bead
        pieceMesh = new THREE.Mesh(beadGeo, mat);
      }

      pieceGroup.add(pieceMesh);
      scene.add(pieceGroup);

      const angle = (i / pieceCount) * Math.PI * 2 + (i % 3) * 0.4;
      pieces.push({
        group: pieceGroup,
        mesh: pieceMesh,
        orbitRadius: orbitCfg.radius,
        orbitSpeed: orbitCfg.speed,
        orbitAngle: angle,
        orbitTiltX: orbitCfg.tiltX,
        orbitTiltZ: orbitCfg.tiltZ,
        selfRotSpeed: {
          x: 0.5 + Math.random() * 0.8,
          y: 0.4 + Math.random() * 0.7,
          z: 0.3 + Math.random() * 0.5
        },
        colorHex: colorItem.hex,
        index: i,
        originalPos: new THREE.Vector3(),
        hoverOffset: 0
      });
    }

    // --------------------------------------------------------------------------
    // 5. Dynamic ECG Waveform Line (Gradient Tube: Coral → Violet → Sky → Aqua)
    // --------------------------------------------------------------------------
    const ecgPoints: THREE.Vector3[] = [];
    const numEcgSteps = 80;
    const ecgRadius = 2.4;

    for (let j = 0; j <= numEcgSteps; j++) {
      const u = j / numEcgSteps;
      const th = u * Math.PI * 2;
      const baseX = Math.cos(th) * ecgRadius;
      const baseZ = Math.sin(th) * ecgRadius * 0.75;
      let baseY = Math.sin(th) * 0.25;

      // Realistic ECG QRS Complex spikes at 2 locations along the loop
      const phase1 = Math.abs(u - 0.22);
      const phase2 = Math.abs(u - 0.72);

      if (phase1 < 0.06) {
        const local = (u - 0.22) / 0.06;
        if (local > -0.5 && local < -0.2) baseY -= 0.15; // Q
        else if (local >= -0.2 && local <= 0.2) baseY += 0.85 * (1 - Math.abs(local) * 5); // R
        else if (local > 0.2 && local < 0.5) baseY -= 0.25; // S
      } else if (phase2 < 0.06) {
        const local = (u - 0.72) / 0.06;
        if (local > -0.5 && local < -0.2) baseY -= 0.12;
        else if (local >= -0.2 && local <= 0.2) baseY += 0.75 * (1 - Math.abs(local) * 5);
        else if (local > 0.2 && local < 0.5) baseY -= 0.2;
      }

      ecgPoints.push(new THREE.Vector3(baseX, baseY, baseZ));
    }

    const ecgCurve = new THREE.CatmullRomCurve3(ecgPoints, true);
    // Thinned slightly (0.018 vs 0.024)
    const ecgTubeGeo = new THREE.TubeGeometry(ecgCurve, 120, 0.018, 8, true);

    // Apply soft pastel vertex colors (coral → violet → sky → aqua)
    const ecgColors: number[] = [];
    const colorCoral = new THREE.Color('#FCA5A5');
    const colorViolet = new THREE.Color('#C4B5FD');
    const colorSky = new THREE.Color('#93C5FD');
    const colorAqua = new THREE.Color('#6EE7B7');

    const tubePos = ecgTubeGeo.attributes.position;
    for (let k = 0; k < tubePos.count; k++) {
      const x = tubePos.getX(k);
      const normAngle = (Math.atan2(tubePos.getZ(k), x) + Math.PI) / (Math.PI * 2);
      const col = new THREE.Color();
      if (normAngle < 0.33) {
        col.lerpColors(colorCoral, colorViolet, normAngle / 0.33);
      } else if (normAngle < 0.66) {
        col.lerpColors(colorViolet, colorSky, (normAngle - 0.33) / 0.33);
      } else {
        col.lerpColors(colorSky, colorAqua, (normAngle - 0.66) / 0.34);
      }
      ecgColors.push(col.r, col.g, col.b);
    }
    ecgTubeGeo.setAttribute('color', new THREE.Float32BufferAttribute(ecgColors, 3));

    // Opacity lowered to 0.50
    const ecgMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.50
    });

    const ecgMesh = new THREE.Mesh(ecgTubeGeo, ecgMat);
    ecgMesh.rotation.x = 0.25;
    scene.add(ecgMesh);

    // Travelling soft pulse bead along the ECG line
    const ecgBeadGeo = new THREE.SphereGeometry(0.046, 16, 16);
    const ecgBeadMat = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.85
    });
    const ecgBead = new THREE.Mesh(ecgBeadGeo, ecgBeadMat);
    scene.add(ecgBead);

    // --------------------------------------------------------------------------
    // 6. Raycasting & Interaction Setup
    // --------------------------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2(-999, -999);
    let hoveredPieceIdx: number | null = null;

    const handleMouseMove = (event: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      mouseVector.x = x;
      mouseVector.y = y;

      mousePos.current.targetX = x * 0.15;
      mousePos.current.targetY = y * 0.12;
    };

    const handleMouseLeave = () => {
      mouseVector.x = -999;
      mouseVector.y = -999;
      mousePos.current.targetX = 0;
      mousePos.current.targetY = 0;
      hoveredPieceIdx = null;
    };

    if (interactive && !isMobile) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);
    }

    // --------------------------------------------------------------------------
    // 7. Scroll & Visibility Management
    // --------------------------------------------------------------------------
    let scrollY = 0;
    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const observer = new IntersectionObserver(([entry]) => {
      isVisibleRef.current = entry.isIntersecting;
    });
    observer.observe(container);

    const handleVisibility = () => {
      if (document.hidden) isVisibleRef.current = false;
      else isVisibleRef.current = true;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // --------------------------------------------------------------------------
    // 8. Animation Loop
    // --------------------------------------------------------------------------
    let animationFrameId: number;
    let startTime = performance.now();
    let lastTime = performance.now();
    let ringProgress1 = 0;
    let ringProgress2 = 0.5;

    const render = () => {
      animationFrameId = requestAnimationFrame(render);

      if (!isVisibleRef.current) return;

      const now = performance.now();
      const delta = Math.min((now - lastTime) * 0.001, 0.1);
      lastTime = now;
      const time = (now - startTime) * 0.001;

      // Damped pointer parallax
      mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * 0.05;
      mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * 0.05;

      camera.position.x = mousePos.current.x;
      camera.position.y = mousePos.current.y;

      // Scroll-linked camera dolly (gently moves back on scroll)
      const scrollDolly = Math.min(scrollY * 0.002, 1.2);
      camera.position.z = (compact ? 7.6 : 6.8) + scrollDolly;
      camera.lookAt(0, 0, 0);

      if (!prefersReducedMotion) {
        // --- HEARTBEAT "LUB-DUB" ANIMATION (Calm, softened pulse) ---
        const curLoginState = loginStateRef.current;
        const beatPeriod = isLogin ? 1.0 : 0.833;
        const bpmCycle = (time % beatPeriod) / beatPeriod;
        let pulseScale = 1.0;
        let emissiveBoost = 0.12;

        if (curLoginState === 'loading') emissiveBoost += 0.18;
        if (curLoginState === 'success') pulseScale += 0.10;

        if (bpmCycle < 0.14) {
          // Lub: scale 1.0 -> 1.06 -> 1.0
          const p = bpmCycle / 0.14;
          const s = Math.sin(p * Math.PI) * 0.06;
          pulseScale += s;
          emissiveBoost += Math.sin(p * Math.PI) * 0.16;
        } else if (bpmCycle >= 0.22 && bpmCycle < 0.35) {
          // Dub: scale 1.0 -> 1.035 -> 1.0
          const p = (bpmCycle - 0.22) / 0.13;
          const s = Math.sin(p * Math.PI) * 0.035;
          pulseScale += s;
          emissiveBoost += Math.sin(p * Math.PI) * 0.10;
        }

        const baseHeartScale = isLogin ? 1.15 : 1.4;
        heartMesh.scale.set(
          baseHeartScale * pulseScale,
          baseHeartScale * pulseScale,
          baseHeartScale * pulseScale
        );
        heartMat.emissiveIntensity = emissiveBoost;

        // Calm float and gentle yaw sway (slowed ~25-30% with eased motion)
        const targetRotY = isLogin && curLoginState === 'focus' ? 0.20 : 0;
        heartGroup.position.y = 0.1 + Math.sin(time * 1.1) * 0.04;
        heartGroup.rotation.y = targetRotY + Math.sin(time * 0.52) * (isLogin ? 0.18 : 0.30);
        heartGroup.rotation.x = Math.sin(time * 0.38) * 0.06;

        // Shockwave rings expansion (softened and calmed)
        ringProgress1 += delta * 0.85;
        if (ringProgress1 > 1.0) ringProgress1 = 0;
        const scale1 = 1.0 + ringProgress1 * 1.3;
        shockwaveRing1.scale.set(scale1, scale1, scale1);
        (shockwaveRing1.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - ringProgress1) * 0.28);

        ringProgress2 += delta * 0.85;
        if (ringProgress2 > 1.0) ringProgress2 = 0;
        const scale2 = 1.0 + ringProgress2 * 1.3;
        shockwaveRing2.scale.set(scale2, scale2, scale2);
        (shockwaveRing2.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - ringProgress2) * 0.20);

        // --- ORBITING TABLETS & PILLS ANIMATION ---
        // Raycasting for interactive hover
        if (interactive && !isMobile && mouseVector.x !== -999) {
          raycaster.setFromCamera(mouseVector, camera);
          const intersects = raycaster.intersectObjects(pieces.map(p => p.group), true);
          if (intersects.length > 0) {
            // Find root piece
            const hitObj = intersects[0].object;
            const piece = pieces.find(p => p.group === hitObj || p.group === hitObj.parent || p.group === hitObj.parent?.parent);
            hoveredPieceIdx = piece ? piece.index : null;
          } else {
            hoveredPieceIdx = null;
          }
        }

        const newCoords: { [idx: number]: { x: number; y: number } } = {};

        pieces.forEach(p => {
          // Orbit angle update
          p.orbitAngle += p.orbitSpeed * delta;

          // Orbit expansion on scroll
          const currentRadius = p.orbitRadius + scrollDolly * 0.3;

          // Raw circular position
          let px = Math.cos(p.orbitAngle) * currentRadius;
          let py = Math.sin(time * 1.2 + p.index) * 0.12; // vertical bob
          let pz = Math.sin(p.orbitAngle) * currentRadius * 0.85;

          // Apply orbital plane tilt (Euler rotation)
          const tiltX = p.orbitTiltX;
          const tiltZ = p.orbitTiltZ;
          const tiltedY = py * Math.cos(tiltX) - pz * Math.sin(tiltX);
          const tiltedZ = py * Math.sin(tiltX) + pz * Math.cos(tiltX);
          pz = tiltedZ;
          py = tiltedY;

          const tiltedX = px * Math.cos(tiltZ) - py * Math.sin(tiltZ);
          py = px * Math.sin(tiltZ) + py * Math.cos(tiltZ);
          px = tiltedX;

          // Smooth hover offset
          const isHovered = hoveredPieceIdx === p.index;
          const targetHover = isHovered ? 0.22 : 0;
          p.hoverOffset += (targetHover - p.hoverOffset) * 0.1;

          // Offset outward along normalized position
          const norm = new THREE.Vector3(px, py, pz).normalize();
          px += norm.x * p.hoverOffset;
          py += norm.y * p.hoverOffset;
          pz += norm.z * p.hoverOffset;

          p.group.position.set(px, py, pz);

          // Self-rotation
          p.mesh.rotation.x += p.selfRotSpeed.x * delta;
          p.mesh.rotation.y += p.selfRotSpeed.y * delta;
          p.mesh.rotation.z += p.selfRotSpeed.z * delta;

          // Track 2D screen coordinates for desktop leader line captions
          if (!isMobile && FEATURE_ANCHORS.some(a => a.pillIdx === p.index)) {
            const screenV = p.group.position.clone().project(camera);
            const sx = ((screenV.x + 1) / 2) * width;
            const sy = ((-screenV.y + 1) / 2) * height;
            newCoords[p.index] = { x: sx, y: sy };
          }
        });

        // Throttle screen coordinate state update to keep 60fps
        if (!isMobile && Math.floor(time * 30) % 2 === 0) {
          setScreenCoords(newCoords);
        }

        // --- ECG WAVEFORM ANIMATION (Slowed ~25-28%) ---
        ecgMesh.rotation.y += delta * 0.11;
        // Move travelling bead along the curve
        const beadT = (time * 0.25) % 1.0;
        const beadPos = ecgCurve.getPointAt(beadT);
        ecgBead.position.copy(beadPos);
        ecgBead.position.applyEuler(ecgMesh.rotation);
      }

      renderer.render(scene, camera);
    };

    render();

    // --------------------------------------------------------------------------
    // 9. Resize Handler
    // --------------------------------------------------------------------------
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      if (newW > 0 && newH > 0) {
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
        setDimensions({ width: newW, height: newH });
      }
    };
    window.addEventListener('resize', handleResize);

    // --------------------------------------------------------------------------
    // 10. WebGL Context Lost Handling
    // --------------------------------------------------------------------------
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(animationFrameId);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);

    // --------------------------------------------------------------------------
    // 11. Cleanup & Disposal
    // --------------------------------------------------------------------------
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibility);
      observer.disconnect();

      if (interactive && !isMobile) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }

      // Dispose Geometries
      heartGeo.dispose();
      ringGeo.dispose();
      capsuleTopGeo.dispose();
      capsuleCapGeo.dispose();
      tabletGeo.dispose();
      capletGeo.dispose();
      beadGeo.dispose();
      ecgTubeGeo.dispose();
      ecgBeadGeo.dispose();
      shadowGeo.dispose();
      shadowTex.dispose();

      // Dispose Materials
      heartMat.dispose();
      ringMat.dispose();
      shadowMat.dispose();
      ecgMat.dispose();
      ecgBeadMat.dispose();
      paletteMaterials.forEach(m => m.dispose());

      renderer.dispose();
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [interactive, compact, hasWebGL, variant]);

  // ============================================================================
  // Static SVG Fallback for WebGL-off / Reduced-Motion
  // ============================================================================
  if (!hasWebGL) {
    return (
      <div
        className={`living-heart-fallback ${className}`}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          ...style
        }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 500 460"
          style={{ width: '85%', maxWidth: '440px', height: 'auto', filter: 'drop-shadow(0 14px 28px rgba(232, 139, 139, 0.14))' }}
        >
          <defs>
            <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FAD2D2" />
              <stop offset="50%" stopColor="#F2A0A0" />
              <stop offset="100%" stopColor="#E88B8B" />
            </linearGradient>
            <linearGradient id="ecgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FCA5A5" />
              <stop offset="35%" stopColor="#C4B5FD" />
              <stop offset="70%" stopColor="#93C5FD" />
              <stop offset="100%" stopColor="#6EE7B7" />
            </linearGradient>
            <radialGradient id="haloGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(242, 160, 160, 0.15)" />
              <stop offset="100%" stopColor="rgba(242, 160, 160, 0)" />
            </radialGradient>
          </defs>

          {/* Radial Halo */}
          <circle cx="250" cy="220" r="180" fill="url(#haloGrad)" />

          {/* Orbit rings */}
          <ellipse cx="250" cy="220" rx="190" ry="85" fill="none" stroke="#7DD3C7" strokeWidth="1.5" strokeOpacity="0.22" strokeDasharray="4 6" />
          <ellipse cx="250" cy="220" rx="220" ry="110" fill="none" stroke="#93C5FD" strokeWidth="1.5" strokeOpacity="0.18" transform="rotate(-15 250 220)" />

          {/* Heart Centerpiece */}
          <path
            d="M 250 140 C 235 75, 120 75, 120 180 C 120 250, 200 310, 250 350 C 300 310, 380 250, 380 180 C 380 75, 265 75, 250 140 Z"
            fill="url(#heartGrad)"
          />

          {/* Glossy highlight */}
          <path
            d="M 160 145 C 150 165, 150 195, 170 215"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="4"
            strokeLinecap="round"
            strokeOpacity="0.45"
          />

          {/* ECG Waveform */}
          <path
            d="M 50 240 L 160 240 L 180 220 L 200 270 L 220 170 L 240 290 L 260 230 L 280 240 L 450 240"
            fill="none"
            stroke="url(#ecgGrad)"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Orbiting colorful pill icons (Pastels) */}
          <rect x="70" y="170" width="36" height="18" rx="9" fill="#7DD3C7" />
          <rect x="380" y="270" width="38" height="18" rx="9" fill="#93C5FD" />
          <circle cx="370" cy="130" r="14" fill="#F6A89E" />
          <circle cx="110" cy="280" r="13" fill="#C4B5FD" />
          <rect x="230" y="70" width="32" height="16" rx="8" fill="#FDE68A" />
        </svg>
      </div>
    );
  }

  // ============================================================================
  // Standard 3D WebGL Presentation + Desktop Hairline Captions
  // ============================================================================
  return (
    <div
      className={`living-heart-3d-wrapper ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: compact ? '320px' : '460px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
    >
      {/* Soft CSS radial rose halo behind canvas */}
      <div
        style={{
          position: 'absolute',
          width: '75%',
          height: '75%',
          top: '12.5%',
          left: '12.5%',
          background: 'radial-gradient(circle at 50% 50%, rgba(242, 160, 160, 0.10) 0%, rgba(246, 168, 158, 0.03) 50%, transparent 72%)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* Three.js Canvas Container (pointer-events transparent for buttons) */}
      <div
        ref={mountRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          zIndex: 2,
          pointerEvents: interactive ? 'auto' : 'none'
        }}
        aria-hidden="true"
      />

      {/* Desktop HTML Leader Line Captions (purely decorative, hero only, scoped hc-) */}
      {!compact && variant !== 'login' && (
        <div
          className="hc-captions-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 3
          }}
          aria-hidden="true"
        >
          {/* Hairline SVG Leader Lines Connecting Peripheral Cards to Tablets */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}
          >
            {FEATURE_ANCHORS.map(anchor => {
              const coords = screenCoords[anchor.pillIdx];
              if (!coords) return null;

              const containerW = dimensions.width || 520;
              const containerH = dimensions.height || 460;
              const cardW = 152;

              let anchorX = 12 + cardW;
              let anchorY = 14 + 18;

              if (anchor.slot === 'top-left') {
                anchorX = 12 + cardW;
                anchorY = 14 + 18;
              } else if (anchor.slot === 'bottom-left') {
                anchorX = 12 + cardW;
                anchorY = (containerH - 74) + 18;
              } else if (anchor.slot === 'right') {
                anchorX = containerW - cardW - 12;
                anchorY = Math.round(containerH * 0.44) + 18;
              }

              return (
                <g key={`line-${anchor.title}`}>
                  <line
                    x1={anchorX}
                    y1={anchorY}
                    x2={coords.x}
                    y2={coords.y}
                    stroke={anchor.color}
                    strokeWidth="1"
                    strokeOpacity="0.45"
                    strokeDasharray="3 3"
                  />
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r="2.5"
                    fill={anchor.color}
                    fillOpacity="0.85"
                  />
                </g>
              );
            })}
          </svg>

          {/* Peripheral Caption Cards Placed in Clear Margins (never over heart body) */}
          {FEATURE_ANCHORS.map((anchor, idx) => {
            const containerW = dimensions.width || 520;
            const containerH = dimensions.height || 460;
            const cardW = 152;

            let cardLeft: string | number = '12px';
            let cardTop: string | number = '14px';

            if (anchor.slot === 'top-left') {
              cardLeft = '12px';
              cardTop = '14px';
            } else if (anchor.slot === 'bottom-left') {
              cardLeft = '12px';
              cardTop = `${containerH - 74}px`;
            } else if (anchor.slot === 'right') {
              cardLeft = `${containerW - cardW - 12}px`;
              cardTop = `${Math.round(containerH * 0.44)}px`;
            }

            return (
              <div
                key={anchor.title}
                className="hc-caption-card"
                style={{
                  position: 'absolute',
                  left: cardLeft,
                  top: cardTop,
                  width: `${cardW}px`,
                  animationDelay: `${idx * 120 + 900}ms`
                }}
              >
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.94)',
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${anchor.color}35`,
                    borderLeft: `3px solid ${anchor.color}`,
                    borderRadius: '6px',
                    padding: '6px 10px',
                    boxShadow: '0 4px 12px rgba(16, 42, 54, 0.06)'
                  }}
                >
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: anchor.color, lineHeight: 1.25 }}>
                    {anchor.title}
                  </div>
                  <div style={{ fontSize: '0.66rem', color: '#64717D', lineHeight: 1.15, marginTop: '2px' }}>
                    {anchor.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scoped CSS Styles for Hero Captions (hc-) */}
      <style>{`
        @keyframes hcCaptionFadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 0.95;
            transform: translateY(0);
          }
        }

        .hc-caption-card {
          opacity: 0;
          animation: hcCaptionFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transition: transform 0.2s ease;
        }

        @media (max-width: 1023px) {
          .hc-captions-overlay {
            display: none !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hc-caption-card {
            animation: none !important;
            opacity: 0.95 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
};
