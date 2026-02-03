'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { AudioData, VisualMusicTweakOptions } from '../types/audio';

// 核心配置变量 (Core Configuration Variables)
const DEFAULT_INTENSITY = 1;
const DEFAULT_TRAIL = 0.2;
const DEFAULT_PARTICLE_COUNT = 25;
const DEFAULT_BLUR_STRENGTH = 8;
const DEFAULT_ORB_SIZE = 22;

const E0_COLORS = [
  '105, 210, 231',
  '27, 103, 107',
  '160, 212, 104', // Softer Green
  '255, 206, 84',  // Sunflower
  '0, 205, 172',
  '22, 147, 165',
  '255, 180, 50',  // Softer Orange-Yellow
  '255, 107, 107', // Softer Red
  '231, 60, 100',  // Softer Pink
  '12, 202, 186',
  '236, 135, 192', // Lavender/Pink
] as const;

type E0Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  targetSize: number;
  opacity: number;
};

type E0State = {
  particles: E0Particle[];
};

type VisualMusicState = {
  isInit: boolean;
  lastTime: number;
  e0?: E0State;
};

// 工具函数：限制值在 0-1 之间 (Utility: Clamp value between 0-1)
function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

// 工具函数：限制值在 min-max 之间 (Utility: Clamp value between min-max)
function clampInt(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

// 获取重采样后的频率数据 (Get Resampled Frequency Data)
function getResampledFrequencyData(source: Uint8Array | null, targetLength: number, intensity: number): Uint8Array {
  const result = new Uint8Array(targetLength);
  if (!source || source.length === 0) return result;

  const srcLen = source.length;
  const mult = intensity <= 0 ? 0 : intensity;
  for (let i = 0; i < targetLength; i++) {
    const srcIndex = Math.floor((i * srcLen) / targetLength);
    result[i] = clampInt(Math.round(source[srcIndex] * mult), 0, 255);
  }
  return result;
}

// 开始新的一帧 (Begin Frame)
function beginFrame(ctx: CanvasRenderingContext2D, width: number, height: number, trail: number) {
  const t = clamp01(trail);
  ctx.globalCompositeOperation = 'source-over';
  if (t === 0) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillRect(0, 0, width, height);
    return;
  }
  ctx.fillStyle = `rgba(0, 0, 0, ${clamp01(1 - t)})`;
  ctx.fillRect(0, 0, width, height);
}

// 初始化粒子状态 (Initialize Particle State)
function initE0(width: number, height: number, particleCount: number): E0State {
  const particles: E0Particle[] = [];
  const colorNum = E0_COLORS.length;

  for (let i = 0; i < particleCount; i++) {
    particles[i] = {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5, // 缓慢水平漂移 (Slow horizontal drift)
      vy: (Math.random() - 0.5) * 0.5, // 缓慢垂直漂移 (Slow vertical drift)
      color: `rgba(${E0_COLORS[Math.floor(Math.random() * colorNum)]}, 0)`,
      size: 0,
      targetSize: 0,
      opacity: Math.random() * 0.5 + 0.1, // 较低的初始不透明度 (Lower initial opacity)
    };
  }
  return { particles };
}

// 绘制粒子 (Draw Particles)
function drawE0(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  data: Uint8Array,
  state: E0State,
  orbSize: number,
  blurStrength: number
) {
  const particleCount = state.particles.length;
  const binStep = Math.floor(data.length / particleCount);
  const prevComposite = ctx.globalCompositeOperation;

  for (let i = 0; i < particleCount; i++) {
    const p = state.particles[i];
    if (!p) continue;

    let sum = 0;
    for (let j = 0; j < binStep; j++) {
      sum += data[i * binStep + j] ?? 0;
    }
    const rawV = binStep > 0 ? sum / binStep : 0;

    const v = rawV * 0.6;

    if (p.targetSize < v) {
      p.targetSize = v;
    } else {
      p.targetSize -= 0.5;
    }

    p.size += (p.targetSize - p.size) * 0.05;

    const targetOpacity = (v / 255) * 0.8 + 0.2; // 目标不透明度更亮 (Brighter target opacity)
    p.opacity += (targetOpacity - p.opacity) * 0.1; // 淡入更快 (Faster fade in)

    p.x += p.vx;
    p.y += p.vy;

    if (p.x < -50) p.x = width + 50;
    if (p.x > width + 50) p.x = -50;
    if (p.y < -50) p.y = height + 50;
    if (p.y > height + 50) p.y = -50;

    const alpha = clamp01(p.opacity);
    const lastComma = p.color.lastIndexOf(',');
    const rgb = lastComma > 5 ? p.color.slice(5, lastComma).trim() : '255, 255, 255';
    const base = clampInt(Math.round(orbSize), 0, 200);
    const softness = clampInt(Math.round(blurStrength), 0, 200);

    const baseRadius = Math.max(8, base + p.size * 0.1); // 稍大的基础半径 (Slightly larger base)
    const outerRadius = baseRadius + 6 + softness * 0.5; // 更大的外部光晕 (Larger outer glow)

    const outerGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, outerRadius);
    outerGradient.addColorStop(0, `rgba(${rgb}, ${alpha * 0.3})`); // 光晕更亮 (Brighter glow)
    outerGradient.addColorStop(0.25, `rgba(${rgb}, ${alpha * 0.2})`);
    outerGradient.addColorStop(0.6, `rgba(${rgb}, ${alpha * 0.1})`);
    outerGradient.addColorStop(1, `rgba(${rgb}, 0)`);

    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = outerGradient;
    ctx.beginPath();
    ctx.arc(p.x, p.y, outerRadius, 0, 2 * Math.PI, true);
    ctx.closePath();
    ctx.fill();

    const coreRadius = Math.max(5, baseRadius * 0.7);
    const coreGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, coreRadius);
    coreGradient.addColorStop(0, `rgba(${rgb}, ${alpha * 0.8})`); // 核心更亮 (Brighter core)
    coreGradient.addColorStop(0.7, `rgba(${rgb}, ${alpha * 0.4})`);
    coreGradient.addColorStop(1, `rgba(${rgb}, ${alpha * 0.1})`);

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(p.x, p.y, coreRadius, 0, 2 * Math.PI, true);
    ctx.closePath();
    ctx.fill();
  }

  ctx.globalCompositeOperation = prevComposite;
}

function resetState(): VisualMusicState {
  return { isInit: false, lastTime: -Infinity };
}

export function useVisualMusic2D(
  canvas: HTMLCanvasElement | null,
  width: number,
  height: number,
  options?: Partial<VisualMusicTweakOptions>
) {
  const optionsRef = useRef<VisualMusicTweakOptions>({
    intensity: DEFAULT_INTENSITY,
    trail: DEFAULT_TRAIL,
    particleCount: DEFAULT_PARTICLE_COUNT,
    blurStrength: DEFAULT_BLUR_STRENGTH,
    orbSize: DEFAULT_ORB_SIZE,
  });

  const mergedOptions = useMemo<VisualMusicTweakOptions>(() => {
    return {
      intensity: typeof options?.intensity === 'number' ? options.intensity : DEFAULT_INTENSITY,
      trail: typeof options?.trail === 'number' ? options.trail : DEFAULT_TRAIL,
      particleCount: typeof options?.particleCount === 'number' ? options.particleCount : DEFAULT_PARTICLE_COUNT,
      blurStrength: typeof options?.blurStrength === 'number' ? options.blurStrength : DEFAULT_BLUR_STRENGTH,
      orbSize: typeof options?.orbSize === 'number' ? options.orbSize : DEFAULT_ORB_SIZE,
    };
  }, [options?.intensity, options?.trail, options?.particleCount, options?.blurStrength, options?.orbSize]);

  useEffect(() => {
    optionsRef.current = mergedOptions;
  }, [mergedOptions]);

  const stateRef = useRef<VisualMusicState>(resetState());

  useEffect(() => {
    stateRef.current = resetState();
  }, [mergedOptions.particleCount]);

  const render = useCallback(
    (time: number, frameAudioData: AudioData) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { intensity, trail, particleCount, orbSize, blurStrength } = optionsRef.current;

      if (time < stateRef.current.lastTime) {
        stateRef.current = resetState();
      }
      stateRef.current.lastTime = time;

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      beginFrame(ctx, width, height, trail);

      if (!stateRef.current.isInit) {
        stateRef.current.e0 = initE0(width, height, particleCount);
        stateRef.current.isInit = true;
      }

      if (stateRef.current.e0) {
        const data = getResampledFrequencyData(frameAudioData.frequencyData, 256, intensity);
        drawE0(ctx, width, height, data, stateRef.current.e0, orbSize, blurStrength);
      }

      ctx.restore();
    },
    [canvas, width, height]
  );

  return { render };
}
