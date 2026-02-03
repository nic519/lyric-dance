'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle, Color } from 'ogl';
import type { AudioData } from '../types/audio';

const VERTEX_SHADER = `
attribute vec2 position;
void main() {
    gl_Position = vec4(position, 0, 1);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;
uniform float uSpeed;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187, 0.366025403784439,
    -0.577350269189626, 0.024390243902439
  );
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
    permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
    0.5 - vec3(
      dot(x0, x0),
      dot(x12.xy, x12.xy),
      dot(x12.zw, x12.zw)
    ),
    0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

vec3 colorRamp(vec3 colors0, vec3 colors1, vec3 colors2, float factor) {
  if (factor < 0.5) {
    return mix(colors0, colors1, factor / 0.5);
  }
  return mix(colors1, colors2, (factor - 0.5) / 0.5);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  vec3 rampColor = colorRamp(uColorStops[0], uColorStops[1], uColorStops[2], uv.x);

  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1 * uSpeed, uTime * 0.25 * uSpeed)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;

  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);

  vec3 auroraColor = intensity * rampColor;
  gl_FragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`;

export function useAuroraOGL(
  canvas: HTMLCanvasElement | null,
  width: number,
  height: number,
  options: {
    blend?: number;
    amplitude?: number;
    speed?: number;
    colorStops?: [string, string, string];
  } = {}
) {
  const {
    blend = 0.5,
    amplitude = 1.0,
    speed = 1.0,
    colorStops = ["#3A29FF", "#FF94B4", "#FF3232"]
  } = options;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rendererRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const programRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meshRef = useRef<any>(null);

  useEffect(() => {
    if (!canvas) return;

    const renderer = new Renderer({
      canvas,
      width,
      height,
      dpr: 1,
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
      webgl: 1
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const geometry = new Triangle(gl);

    const defaultColorStops = colorStops.map((hex) => {
      const c = new Color(hex);
      return [c.r, c.g, c.b];
    });

    const program = new Program(gl, {
      vertex: VERTEX_SHADER,
      fragment: FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: 1.0 },
        uColorStops: { value: defaultColorStops },
        uResolution: { value: [width, height] },
        uBlend: { value: blend },
        uSpeed: { value: speed },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    rendererRef.current = renderer;
    programRef.current = program;
    meshRef.current = mesh;

    return () => {
      // Cleanup
    };
  }, [canvas, width, height]);

  const optionsRef = useRef({ blend, amplitude, speed, colorStops });
  useEffect(() => {
    optionsRef.current = { blend, amplitude, speed, colorStops };
  }, [blend, amplitude, speed, colorStops]);

  const render = useCallback((time: number, frameAudioData: AudioData) => {
    if (!rendererRef.current || !programRef.current || !meshRef.current) return;

    programRef.current.uniforms.uTime.value = time;
    programRef.current.uniforms.uBlend.value = optionsRef.current.blend;
    programRef.current.uniforms.uSpeed.value = optionsRef.current.speed;

    const currentStops = optionsRef.current.colorStops.map((hex) => {
      const c = new Color(hex);
      return [c.r, c.g, c.b];
    });
    programRef.current.uniforms.uColorStops.value = currentStops;

    const amplitude = (1.0 + Math.max(frameAudioData.bassLevel, 0) * 1.5) * optionsRef.current.amplitude;
    programRef.current.uniforms.uAmplitude.value = amplitude;

    rendererRef.current.render({ scene: meshRef.current });
  }, []);

  return { render };
}
