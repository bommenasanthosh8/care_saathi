// ==============================================================================
// CareSaathi AI - 3D "Care Core" Centerpiece Component
// Specs: Flat ink background, teal-lit translucent medical glass sphere,
// inner pulsing nucleus, dual orbiting rings, floating medical cross & capsule,
// desktop hairline leader-line captions, and accessible SVG/CSS fallback.
// ==============================================================================

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface CareCore3DProps {
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
}

export const CareCore3D: React.FC<CareCore3DProps> = ({
  className = '',
  style = {},
  interactive = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);
  const mousePos = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    // 1. Detect WebGL support
    const checkWebGL = () => {
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

    if (!checkWebGL()) {
      setHasWebGL(false);
      return;
    }

    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 2. Initialize Scene, Camera, and Renderer
    const width = container.clientWidth || 480;
    const height = container.clientHeight || 480;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 8.0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Main Centerpiece Group
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // 4. Lighting Rig tailored for bright, clean healthcare theme
    const ambientLight = new THREE.AmbientLight(new THREE.Color('#FFFFFF'), 1.8);
    scene.add(ambientLight);

    // Key Light: Soft luminous teal
    const keyLight = new THREE.PointLight(new THREE.Color('#438F84'), 3.0, 25);
    keyLight.position.set(4, 4.5, 4.5);
    scene.add(keyLight);

    // Rim Light: Cyan rim contour
    const rimLight = new THREE.PointLight(new THREE.Color('#38BDF8'), 2.2, 20);
    rimLight.position.set(-4.5, -2, -3.5);
    scene.add(rimLight);

    // Soft Fill: Clean mint
    const fillLight = new THREE.PointLight(new THREE.Color('#E7F3EF'), 1.6, 18);
    fillLight.position.set(0, -4, 4);
    scene.add(fillLight);

    const dirLight = new THREE.DirectionalLight(new THREE.Color('#FFFFFF'), 1.2);
    dirLight.position.set(2, 5, 6);
    scene.add(dirLight);

    // --------------------------------------------------------------------------
    // 5. Layer 1: Translucent Medical Glass Healthcare Sphere ("Care Core")
    // --------------------------------------------------------------------------
    const sphereGeo = new THREE.SphereGeometry(1.65, 64, 64);
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#438F84'),
      emissive: new THREE.Color('#1F7A63'),
      emissiveIntensity: 0.18,
      roughness: 0.14,
      metalness: 0.08,
      transmission: 0.88,
      thickness: 1.1,
      ior: 1.45,
      transparent: true,
      opacity: 0.85,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const outerSphere = new THREE.Mesh(sphereGeo, sphereMat);
    masterGroup.add(outerSphere);

    // --------------------------------------------------------------------------
    // 6. Layer 2: Inner Pulsing AI Nucleus & Lattice
    // --------------------------------------------------------------------------
    const coreGroup = new THREE.Group();
    masterGroup.add(coreGroup);

    const nucleusGeo = new THREE.IcosahedronGeometry(0.8, 3);
    const nucleusMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#438F84'),
      emissive: new THREE.Color('#2C8C83'),
      emissiveIntensity: 0.65,
      roughness: 0.25,
      metalness: 0.35,
    });
    const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
    coreGroup.add(nucleus);

    const latticeGeo = new THREE.IcosahedronGeometry(1.2, 1);
    const latticeMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#A7F3D0'),
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const innerLattice = new THREE.Mesh(latticeGeo, latticeMat);
    coreGroup.add(innerLattice);

    // --------------------------------------------------------------------------
    // 7. Layer 3: Orbiting Glowing Rings
    // --------------------------------------------------------------------------
    const ring1Geo = new THREE.TorusGeometry(2.32, 0.024, 16, 120);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#5EEAD4'),
      emissive: new THREE.Color('#438F84'),
      emissiveIntensity: 1.1,
      roughness: 0.2,
      metalness: 0.8,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI * 0.38;
    ring1.rotation.y = Math.PI * 0.12;
    masterGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(2.58, 0.018, 16, 120);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#93C5FD'),
      emissive: new THREE.Color('#2563EB'),
      emissiveIntensity: 0.75,
      roughness: 0.3,
      metalness: 0.7,
      transparent: true,
      opacity: 0.85,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = -Math.PI * 0.32;
    ring2.rotation.z = Math.PI * 0.25;
    masterGroup.add(ring2);

    // Orbiting Satellite Beacon on Ring 1
    const satelliteGeo = new THREE.SphereGeometry(0.085, 16, 16);
    const satelliteMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#FFFFFF'),
      emissive: new THREE.Color('#5EEAD4'),
      emissiveIntensity: 1.6,
      roughness: 0.1,
    });
    const satellite1 = new THREE.Mesh(satelliteGeo, satelliteMat);
    masterGroup.add(satellite1);

    // Orbiting Satellite Beacon on Ring 2
    const satellite2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 16, 16),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#93C5FD'),
        emissive: new THREE.Color('#38BDF8'),
        emissiveIntensity: 1.4,
      })
    );
    masterGroup.add(satellite2);

    // --------------------------------------------------------------------------
    // 8. Layer 4: Floating 3D Medical Cross & Capsule
    // --------------------------------------------------------------------------
    // 3D Medical Cross (No heart)
    const crossGroup = new THREE.Group();
    const crossMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#FFFFFF'),
      emissive: new THREE.Color('#A7F3D0'),
      emissiveIntensity: 0.45,
      roughness: 0.18,
      metalness: 0.15,
    });
    const barH = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.16, 0.15), crossMat);
    const barV = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.52, 0.15), crossMat);
    crossGroup.add(barH);
    crossGroup.add(barV);
    crossGroup.position.set(2.3, 1.2, 0.8);
    crossGroup.scale.set(0.7, 0.7, 0.7);
    masterGroup.add(crossGroup);

    // 3D Medical Capsule
    const capsuleGroup = new THREE.Group();
    const capTopMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#438F84'),
      emissive: new THREE.Color('#1F5B53'),
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.1,
    });
    const capBottomMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#FAFAF7'),
      roughness: 0.2,
      metalness: 0.05,
    });

    const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.3, 20), capTopMat);
    const sphereTop = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2),
      capTopMat
    );
    sphereTop.position.y = 0.15;
    const sphereBottom = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 20, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      capBottomMat
    );
    sphereBottom.position.y = -0.15;

    capsuleGroup.add(cylinder);
    capsuleGroup.add(sphereTop);
    capsuleGroup.add(sphereBottom);
    capsuleGroup.position.set(-2.4, -1.1, 0.9);
    capsuleGroup.scale.set(0.8, 0.8, 0.8);
    capsuleGroup.rotation.z = Math.PI * 0.25;
    masterGroup.add(capsuleGroup);

    // --------------------------------------------------------------------------
    // 9. Layer 5: Ground Depth Shadow Mesh
    // --------------------------------------------------------------------------
    const shadowGeo = new THREE.PlaneGeometry(3.4, 3.4);
    const shadowMat = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uColor: { value: new THREE.Color('#0A1B24') },
        uOpacity: { value: 0.32 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform vec3 uColor;
        uniform float uOpacity;
        void main() {
          float dist = distance(vUv, vec2(0.5));
          float alpha = smoothstep(0.5, 0.05, dist) * uOpacity;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -2.6;
    scene.add(shadowMesh);

    // --------------------------------------------------------------------------
    // 10. Mouse Interaction / Parallax Handler
    // --------------------------------------------------------------------------
    const handlePointerMove = (e: MouseEvent | PointerEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mousePos.current.targetX = x * 0.45;
      mousePos.current.targetY = y * 0.35;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    // --------------------------------------------------------------------------
    // 11. Animation Loop
    // --------------------------------------------------------------------------
    let animationFrameId: number;
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) * 0.001;

      // Smooth mouse lerp
      mousePos.current.x = THREE.MathUtils.lerp(mousePos.current.x, mousePos.current.targetX, 0.05);
      mousePos.current.y = THREE.MathUtils.lerp(mousePos.current.y, mousePos.current.targetY, 0.05);

      if (!prefersReducedMotion) {
        outerSphere.rotation.y = elapsedTime * 0.12;
        outerSphere.rotation.x = Math.sin(elapsedTime * 0.08) * 0.1;

        coreGroup.rotation.y = -elapsedTime * 0.18;
        innerLattice.rotation.x = elapsedTime * 0.15;
        innerLattice.rotation.z = elapsedTime * 0.09;

        // Gentle resting heartbeat pulse
        const pulse = 1.0 + Math.sin(elapsedTime * 3.8) * 0.055;
        coreGroup.scale.set(pulse, pulse, pulse);

        ring1.rotation.z = elapsedTime * 0.22;
        ring2.rotation.y = -elapsedTime * 0.18;

        const sat1Angle = elapsedTime * 0.85;
        satellite1.position.set(
          Math.cos(sat1Angle) * 2.32,
          Math.sin(sat1Angle) * 2.32 * Math.sin(ring1.rotation.x),
          Math.sin(sat1Angle) * 2.32 * Math.cos(ring1.rotation.x)
        );

        const sat2Angle = -elapsedTime * 0.65;
        satellite2.position.set(
          Math.cos(sat2Angle) * 2.58 * Math.cos(ring2.rotation.z),
          Math.sin(sat2Angle) * 2.58,
          Math.cos(sat2Angle) * 2.58 * Math.sin(ring2.rotation.z)
        );

        const crossOrbitAngle = elapsedTime * 0.42;
        crossGroup.position.x = Math.cos(crossOrbitAngle) * 2.4;
        crossGroup.position.z = Math.sin(crossOrbitAngle) * 1.8;
        crossGroup.position.y = 1.1 + Math.sin(elapsedTime * 1.4) * 0.22;
        crossGroup.rotation.x = elapsedTime * 0.6;
        crossGroup.rotation.y = elapsedTime * 0.5;

        const capOrbitAngle = elapsedTime * 0.35 + Math.PI;
        capsuleGroup.position.x = Math.cos(capOrbitAngle) * 2.3;
        capsuleGroup.position.z = Math.sin(capOrbitAngle) * 1.9;
        capsuleGroup.position.y = -1.1 + Math.cos(elapsedTime * 1.2) * 0.2;
        capsuleGroup.rotation.x = elapsedTime * 0.7;
        capsuleGroup.rotation.z = elapsedTime * 0.4;

        const floatY = Math.sin(elapsedTime * 1.2) * 0.14;
        masterGroup.position.y = floatY;
        shadowMesh.scale.set(1 - floatY * 0.45, 1 - floatY * 0.45, 1);
        (shadowMat.uniforms.uOpacity as any).value = 0.32 - floatY * 0.08;
      }

      masterGroup.rotation.y = mousePos.current.x * 0.55;
      masterGroup.rotation.x = -mousePos.current.y * 0.55;

      renderer.render(scene, camera);
    };

    animate();

    // 12. Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth > 0 && newHeight > 0) {
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      }
    });
    resizeObserver.observe(container);

    // 13. Resource Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointermove', handlePointerMove);
      resizeObserver.disconnect();

      sphereGeo.dispose();
      sphereMat.dispose();
      nucleusGeo.dispose();
      nucleusMat.dispose();
      latticeGeo.dispose();
      latticeMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      satelliteGeo.dispose();
      satelliteMat.dispose();
      crossMat.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();

      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [interactive]);

  return (
    <div
      className={`care-core-3d-wrapper ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '440px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        ...style,
      }}
      onMouseLeave={() => {
        mousePos.current.targetX = 0;
        mousePos.current.targetY = 0;
      }}
    >
      {/* 3D WebGL Canvas */}
      {hasWebGL ? (
        <div
          ref={mountRef}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            inset: 0,
            cursor: interactive ? 'grab' : 'default',
          }}
          aria-label="CareSaathi AI Interactive 3D Care Core"
          role="img"
        />
      ) : (
        /* Accessible Fallback: SVG/CSS Translucent Sphere (No Heart) */
        <div
          style={{
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 35% 35%, #A7F3D0 0%, #52a69a 45%, #1F7A63 100%)',
            boxShadow:
              '0 8px 30px rgba(31, 122, 99, 0.15), inset 0 0 25px rgba(255, 255, 255, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '110px',
              height: '110px',
              borderRadius: '50%',
              backgroundColor: 'rgba(231, 243, 239, 0.35)',
              border: '2px solid rgba(15, 118, 110, 0.4)',
            }}
          />
        </div>
      )}

      {/* Desktop-only Static Hairline Leader Line Caption: Node 1 (Top-Right) */}
      <div
        className="care-core-leader-label top-right"
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '32px',
          right: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          pointerEvents: 'none',
          zIndex: 6,
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'var(--hero-badge-text, #0F766E)',
          }}
        />
        <div
          style={{
            width: '28px',
            height: '1px',
            backgroundColor: 'rgba(15, 118, 110, 0.3)',
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--hero-heading, #0F2F36)',
            letterSpacing: '0.02em',
            backgroundColor: 'var(--hero-chip-bg, #FFFFFF)',
            border: '1px solid var(--hero-badge-border, rgba(15, 118, 110, 0.28))',
            padding: '5px 12px',
            borderRadius: '20px',
            boxShadow: '0 2px 8px rgba(15, 47, 54, 0.08)',
          }}
        >
          PM-JAY &amp; Aarogyasri Aligned
        </span>
      </div>

      {/* Desktop-only Static Hairline Leader Line Caption: Node 2 (Bottom-Left) */}
      <div
        className="care-core-leader-label bottom-left"
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '36px',
          left: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          pointerEvents: 'none',
          zIndex: 6,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--hero-heading, #0F2F36)',
            letterSpacing: '0.02em',
            backgroundColor: 'var(--hero-chip-bg, #FFFFFF)',
            border: '1px solid var(--hero-badge-border, rgba(15, 118, 110, 0.28))',
            padding: '5px 12px',
            borderRadius: '20px',
            boxShadow: '0 2px 8px rgba(15, 47, 54, 0.08)',
          }}
        >
          28 Empanelled Facilities
        </span>
        <div
          style={{
            width: '28px',
            height: '1px',
            backgroundColor: 'rgba(15, 118, 110, 0.3)',
          }}
        />
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'var(--hero-badge-text, #0F766E)',
          }}
        />
      </div>

      <style>{`
        @media (max-width: 900px) {
          .care-core-leader-label {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
