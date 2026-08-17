"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { WATERCOLOR_NOISE_GLSL } from "@/lib/three/watercolor-noise";

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // Bypass camera matrices entirely — this quad's local space already
    // spans clip space, so it always fills the viewport exactly, at any
    // aspect ratio, with zero stretch math needed on resize.
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform float uMouseEnergy;

  ${WATERCOLOR_NOISE_GLSL}

  void main() {
    float aspect = uResolution.x / uResolution.y;
    vec2 st = vUv;
    st.x *= aspect; // keep noise features square across any window shape

    float t = uTime * 0.022; // slow, hypnotic drift

    // Pointer repels the sampling coordinate outward — the wash parts
    // gently around the cursor instead of being redrawn by it.
    vec2 mouse = uMouse;
    mouse.x *= aspect;
    vec2 toPixel = st - mouse;
    float dist = length(toPixel);
    float repel = smoothstep(0.32, 0.0, dist) * uMouseEnergy;
    vec2 warped = st + normalize(toPixel + 1e-4) * repel * 0.05;

    // Domain-warped fbm (Inigo Quilez's "flow noise" technique): feeding
    // one noise field's output back in as coordinate offset for the next
    // is what makes the result read as fluid motion instead of static static.
    // Lower frequency here = fewer, bigger, more legible blobs instead of
    // fine marbling that averages out to a flat wash at a glance.
    vec2 q = vec2(fbm(vec3(warped * 0.9, t)), fbm(vec3(warped * 0.9 + 5.2, t)));
    float n = fbm(vec3(warped * 0.9 + 1.1 * q, t * 1.1));
    float n2 = fbm(vec3(warped * 0.65 - 3.1 + 0.7 * q, t * 0.7 + 11.0));

    // Two-tone B&Co palette: a near-white blush as the light wash, and the
    // signature pink carrying almost all the visible pigment — no other
    // hues, so nothing can mix together into a muddy in-between color.
    vec3 cream     = vec3(0.973, 0.965, 0.976); // --brand-cream #f8f6f9 (paper)
    vec3 lightBlush = vec3(1.0, 0.945, 0.945);  // #fff1f1 (light wash, used sparingly)
    vec3 corePink   = vec3(0.992, 0.812, 0.792); // --core-brand-color #fdcfca (dominant)

    // Narrow transition bands (vs. the earlier wide ones) so each wash gets
    // a crisper, more defined edge instead of a soft, hazy gradient — this
    // is what was actually reading as "blur," not the resolution.
    vec3 color = cream;
    color = mix(color, lightBlush, smoothstep(-0.02, 0.12, n2) * 0.4);
    color = mix(color, corePink, smoothstep(0.09, 0.17, n) * 0.75);

    // Paper grain: cheap per-pixel hash, no texture lookup needed.
    float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    color += (grain - 0.5) * 0.02;

    gl_FragColor = vec4(color, 1.0);
  }
`;

function ShaderPlane() {
  const { size, gl } = useThree();
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5, energy: 0, targetEnergy: 0 });

  // Construction params only, taken once — updates happen by mutating
  // materialRef.current.uniforms directly (the standard three.js/R3F
  // per-frame uniform pattern, cheaper than a React re-render every frame).
  const materialArgs = useMemo<[THREE.ShaderMaterialParameters]>(
    () => [
      {
        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: new THREE.Vector2(1, 1) },
          uMouse: { value: new THREE.Vector2(0.5, 0.5) },
          uMouseEnergy: { value: 0 },
        },
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        depthTest: false,
        depthWrite: false,
      },
    ],
    [],
  );

  useEffect(() => {
    const dpr = gl.getPixelRatio();
    materialRef.current?.uniforms.uResolution.value.set(size.width * dpr, size.height * dpr);
  }, [size, gl]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      mouseRef.current.x = event.clientX / window.innerWidth;
      mouseRef.current.y = 1 - event.clientY / window.innerHeight;
      mouseRef.current.targetEnergy = 1;
    };
    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  useFrame((_, delta) => {
    const material = materialRef.current;
    if (!material) return;
    material.uniforms.uTime.value += delta;
    const m = mouseRef.current;
    // Ease both up and down so the repel fades in and out instead of snapping.
    m.energy += (m.targetEnergy - m.energy) * 0.08;
    m.targetEnergy *= 0.96;
    material.uniforms.uMouse.value.set(m.x, m.y);
    material.uniforms.uMouseEnergy.value = m.energy;
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={materialRef} args={materialArgs} />
    </mesh>
  );
}

/**
 * Fully generative watercolor wash — no source image. A single full-screen
 * fragment shader (simplex noise + domain-warped fbm) simulates ink
 * diffusing in water: slow, hypnotic, resolution-independent, with a paper
 * grain and a pointer-repel field.
 *
 * Mounted exactly once, by app/layout.tsx via
 * components/canvas/watercolor-background-client.tsx (the "use client"
 * boundary `next/dynamic`'s `ssr: false` needs), above and outside
 * components/ui/screen-transition.tsx's per-screen wrapper — so it never
 * unmounts across navigations. It used to be mounted fresh by every page
 * instead (then later portaled from there into a shared root): either way,
 * that meant a brand new WebGL canvas on every navigation, and
 * react-three-fiber's <Canvas> always paints its first frame at a default
 * 300×150 before its resize observer catches up — a real, visible white
 * flash around the edges for a frame or two on each screen change. A
 * single persistent instance has nothing left to remount, so there's
 * nothing left to flash.
 */
export function WatercolorBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <Canvas dpr={[1, 1.5]} gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}>
        <ShaderPlane />
      </Canvas>
    </div>
  );
}
