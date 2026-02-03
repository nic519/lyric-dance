'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle, Color } from 'ogl';
import type { AudioData } from '../types/audio';

// ==========================================
// 核心配置变量 (Core Configuration Variables)
// ==========================================

/**
 * 默认极光颜色配置
 * Default aurora color stops
 */
const DEFAULT_COLOR_STOPS: [string, string, string] = ["#3A29FF", "#FF94B4", "#FF3232"];

/**
 * 默认混合度
 * Default blend factor
 */
const DEFAULT_BLEND = 0.5;

/**
 * 默认振幅
 * Default amplitude
 */
const DEFAULT_AMPLITUDE = 1.0;

/**
 * 默认速度
 * Default speed
 */
const DEFAULT_SPEED = 1.0;

// ==========================================
// 着色器代码 (Shader Code)
// ==========================================

/**
 * 顶点着色器
 * Vertex Shader
 * 负责处理顶点位置，这里只是简单的传递位置
 */
const VERTEX_SHADER = `
attribute vec2 position;
void main() {
    gl_Position = vec4(position, 0, 1);
}
`;

/**
 * 片元着色器
 * Fragment Shader
 * 负责生成极光的颜色和动画效果
 */
const FRAGMENT_SHADER = `
precision highp float;

uniform float uTime;        // 时间，用于动画
uniform float uAmplitude;   // 振幅，受音频控制
uniform vec3 uColorStops[3];// 颜色渐变点
uniform vec2 uResolution;   // 画布分辨率
uniform float uBlend;       // 混合度
uniform float uSpeed;       // 动画速度

// 简单的伪随机置换函数
vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

// Simplex Noise 噪声函数
// 用于生成自然的流动纹理
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

// 颜色渐变函数
// 根据 factor 在三种颜色之间插值
vec3 colorRamp(vec3 colors0, vec3 colors1, vec3 colors2, float factor) {
  if (factor < 0.5) {
    return mix(colors0, colors1, factor / 0.5);
  }
  return mix(colors1, colors2, (factor - 0.5) / 0.5);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  // 计算当前像素的颜色
  vec3 rampColor = colorRamp(uColorStops[0], uColorStops[1], uColorStops[2], uv.x);

  // 使用噪声生成极光的高度和形状
  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1 * uSpeed, uTime * 0.25 * uSpeed)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;

  // 计算透明度，使其在中间部分最亮
  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);

  vec3 auroraColor = intensity * rampColor;
  gl_FragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`;

/**
 * useAuroraOGL Hook
 * 用于创建和管理极光效果的 WebGL 上下文
 * 
 * @param canvas - HTMLCanvasElement 画布元素
 * @param width - 画布宽度
 * @param height - 画布高度
 * @param options - 配置选项
 */
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
    blend = DEFAULT_BLEND,
    amplitude = DEFAULT_AMPLITUDE,
    speed = DEFAULT_SPEED,
    colorStops = DEFAULT_COLOR_STOPS
  } = options;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rendererRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const programRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meshRef = useRef<any>(null);

  // 初始化 WebGL 环境
  useEffect(() => {
    if (!canvas) return;

    const renderer = new Renderer({
      canvas,
      width,
      height,
      dpr: 1, // 保持 DPR 为 1 以获得一致的渲染效果
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
      // 清理逻辑 (OGL 会自动处理大部分清理工作)
    };
  }, [canvas, width, height]);

  // 更新配置引用
  const optionsRef = useRef({ blend, amplitude, speed, colorStops });
  useEffect(() => {
    optionsRef.current = { blend, amplitude, speed, colorStops };
  }, [blend, amplitude, speed, colorStops]);

  // 渲染函数，每帧调用
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

    // 根据音频的低音部分增强振幅
    const amplitude = (1.0 + Math.max(frameAudioData.bassLevel, 0) * 1.5) * optionsRef.current.amplitude;
    programRef.current.uniforms.uAmplitude.value = amplitude;

    rendererRef.current.render({ scene: meshRef.current });
  }, []);

  return { render };
}
