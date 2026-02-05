'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { AudioData, VisualMusicTweakOptions } from '../types/audio';

// ==========================================
// 核心配置常量 (Core Configuration Constants)
// ==========================================

// 音频强度系数：控制视觉效果对音频反应的灵敏度。数值越高，粒子对声音越敏感。
// 范围: 1-200 (推荐值: 80-120)
const DEFAULT_INTENSITY = 100;

// 拖尾/残影系数 (0-1)：控制上一帧画面的保留程度。
// 数值越小 (如 0.1)，上一帧保留越多，拖尾越长；数值越大 (如 0.9)，拖尾越短。
// 范围: 0-1 (推荐值: 0.1-0.4, 较小值会有流体感)
// 注意：实现逻辑中 alpha = 1 - trail。
const DEFAULT_TRAIL = 0.2;

// 默认粒子数量：屏幕上同时存在的粒子总数。
// 范围: 1-50 (推荐值: 5-15, 过多会影响性能且画面杂乱)
const DEFAULT_PARTICLE_COUNT = 3;

// 模糊/光晕强度：控制粒子周围光晕的扩散程度。
// 范围: 0-100 (推荐值: 0-20, 0为最实心，值越大光晕越扩散)
const DEFAULT_BLUR_STRENGTH = 0;

// 粒子基础大小：粒子核心的默认半径像素值。
// 范围: 10-500 (推荐值: 100-300, 根据屏幕大小调整)
const DEFAULT_ORB_SIZE = 100;

// 音频反应幅度：控制粒子随音乐跳动的幅度系数。
// 范围: 0.1-5.0 (推荐值: 0.5-1.5)
const DEFAULT_REACTION_SCALE = 1;

// 粒子颜色调色板 (11种颜色)
// 专为黑色背景优化的 Neon/Cyberpunk 霓虹色系，高饱和度、高亮度
const E0_COLORS = [
  '#FF0055', // 霓虹红 (Neon Red)
  '#00FFEA', // 赛博蓝 (Cyber Cyan)
  '#FFD500', // 电光黄 (Electric Yellow)
  '#B8FF01', // 毒液绿 (Toxic Green)
  '#8B00FF', // 电子紫 (Electric Violet)
  '#FF3800', // 烈焰橙 (Blaze Orange)
  '#0066FF', // 激光蓝 (Laser Blue)
  '#FF00CC', // 迷幻粉 (Hot Magenta)
  '#00FF00', // 纯正莱姆 (Pure Lime)
  '#00B3FF', // 天际蓝 (Sky Blue)
  '#FFFFFF', // 纯白核心 (Pure White)
] as const;


// ==========================================
// 类型定义 (Type Definitions)
// ==========================================

// 单个粒子的属性定义
type E0Particle = {
  x: number;           // 当前 X 坐标
  y: number;           // 当前 Y 坐标
  vx: number;          // X 轴速度 (Velocity X)
  vy: number;          // Y 轴速度 (Velocity Y)
  color: string;       // 粒子的 RGB 颜色字符串
  size: number;        // 当前渲染大小 (用于动画过渡)
  targetSize: number;  // 目标大小 (基于当前音频音量计算)
  opacity: number;     // 当前不透明度
};

// 粒子系统的整体状态
type E0State = {
  particles: E0Particle[];
};

// VisualMusic 组件的内部状态
type VisualMusicState = {
  isInit: boolean;     // 是否已初始化
  lastTime: number;    // 上一帧的时间戳 (用于检测时间倒流重置)
  e0?: E0State;        // 粒子系统状态
};

// ==========================================
// 工具函数 (Utility Functions)
// ==========================================

/**
 * 将数值限制在 0 到 1 之间
 */
function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/**
 * 将数值限制在指定范围内 [min, max]
 */
function clampInt(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * 获取重采样后的频率数据
 * 将原始音频频谱数据映射到目标长度 (通常对应粒子数量或其倍数)
 * 并应用强度系数。
 *
 * @param source 原始音频频率数据 (Uint8Array)
 * @param targetLength 目标数组长度
 * @param intensity 强度倍增系数
 */
function getResampledFrequencyData(source: Uint8Array | null, targetLength: number, intensity: number): Uint8Array {
  const result = new Uint8Array(targetLength);
  if (!source || source.length === 0) return result;

  const srcLen = source.length;
  const mult = intensity <= 0 ? 0 : intensity;

  // 简单的线性插值重采样
  for (let i = 0; i < targetLength; i++) {
    const srcIndex = Math.floor((i * srcLen) / targetLength);
    result[i] = clampInt(Math.round(source[srcIndex] * mult), 0, 255);
  }
  return result;
}

/**
 * 帧开始时的处理：绘制背景和拖尾效果
 * 通过绘制一个半透明的黑色矩形来覆盖上一帧，从而产生拖尾效果。
 *
 * @param trail 拖尾系数 (0-1)。
 * 逻辑：alpha = 1 - t。
 * t 值越大，alpha 越小 (覆盖层越淡)，上一帧保留越多，拖尾越长。
 */
function beginFrame(ctx: CanvasRenderingContext2D, width: number, height: number, trail: number) {
  const t = clamp01(trail);
  ctx.globalCompositeOperation = 'source-over';

  if (t === 0) {
    // 无拖尾，直接清空画布并填充黑色背景
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillRect(0, 0, width, height);
    return;
  }

  // 有拖尾：绘制半透明黑色层
  ctx.fillStyle = `rgba(0, 0, 0, ${clamp01(1 - t)})`;
  ctx.fillRect(0, 0, width, height);
}

/**
 * 将 Hex 颜色转换为 "R, G, B" 格式的字符串
 */
function hexToRgb(hex: string): string {
  // 移除 # 号
  const cleanHex = hex.replace('#', '');

  // 处理缩写形式 (如 FFF -> FFFFFF)
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(char => char + char).join('')
    : cleanHex;

  const bigint = parseInt(fullHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `${r}, ${g}, ${b}`;
}

/**
 * 初始化粒子系统状态
 * 随机生成粒子的位置、速度、颜色和初始透明度
 */
function initE0(width: number, height: number, particleCount: number, customColors?: string[]): E0State {
  const particles: E0Particle[] = [];
  // 如果提供了自定义颜色，使用自定义颜色；否则使用默认调色板
  const sourceColors = (customColors && customColors.length > 0) ? customColors : E0_COLORS;
  const colorNum = sourceColors.length;

  // 创建颜色索引池并洗牌 (Fisher-Yates Shuffle)
  // 保证在粒子数量少于颜色数量时，不会出现重复颜色
  const colorIndices = Array.from({ length: colorNum }, (_, k) => k);
  for (let i = colorNum - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [colorIndices[i], colorIndices[j]] = [colorIndices[j], colorIndices[i]];
  }

  for (let i = 0; i < particleCount; i++) {
    // 循环使用洗牌后的颜色索引
    const colorIndex = colorIndices[i % colorNum];
    const colorHex = sourceColors[colorIndex];
    // 转换 Hex 到 RGB 字符串
    const colorRgb = hexToRgb(colorHex);

    particles[i] = {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5, // 缓慢水平漂移速度
      vy: (Math.random() - 0.5) * 0.5, // 缓慢垂直漂移速度
      color: `rgba(${colorRgb}, 0)`,
      size: 0,
      targetSize: 0,
      opacity: Math.random() * 0.5 + 0.1, // 初始随机透明度 (0.1 ~ 0.6)
    };
  }
  return { particles };
}

/**
 * 绘制粒子系统的核心逻辑
 * 包括：
 * 1. 计算每个粒子的音频响应
 * 2. 更新粒子物理属性 (大小、透明度、位置)
 * 3. 绘制粒子的光晕和核心
 */
function drawE0(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  data: Uint8Array, // 音频频谱数据
  state: E0State,
  orbSize: number,
  blurStrength: number
) {
  const particleCount = state.particles.length;
  // 计算每个粒子对应音频数据的区间步长
  const binStep = Math.floor(data.length / particleCount);
  const prevComposite = ctx.globalCompositeOperation;

  for (let i = 0; i < particleCount; i++) {
    const p = state.particles[i];
    if (!p) continue;

    // --- 1. 音频响应计算 ---
    let sum = 0;
    // 累加该粒子对应的频段能量
    for (let j = 0; j < binStep; j++) {
      sum += data[i * binStep + j] ?? 0;
    }
    // 计算平均音量
    const rawV = binStep > 0 ? sum / binStep : 0;
    // 使用新的缩放系数计算动画强度，允许更大的动态范围
    const v = rawV * 1.2;

    // --- 2. 动画状态更新 ---

    // 大小更新：受到音频能量冲击变大，然后缓慢衰减
    if (p.targetSize < v) {
      p.targetSize = v; // 瞬间响应变大
    } else {
      p.targetSize -= 0.5; // 缓慢缩小 (Decay)
    }
    // 使用线性插值平滑过渡当前大小到目标大小
    p.size += (p.targetSize - p.size) * 0.05;

    // 透明度更新：音频越强越亮
    const targetOpacity = (v / 255) * 0.8 + 0.2; // 最小 0.2，最大 1.0
    p.opacity += (targetOpacity - p.opacity) * 0.1; // 平滑淡入淡出

    // --- 物理模拟：排斥与游荡 (Repulsion & Wander) ---
    // 解决粒子重叠和运动单调的问题

    // 1. 游荡力 (Wander Force)：让粒子不再走直线，而是有随机扰动
    p.vx += (Math.random() - 0.5) * 0.05;
    p.vy += (Math.random() - 0.5) * 0.05;

    // 2. 排斥力 (Repulsion Force)：防止粒子重叠
    // 使用基础大小作为参考，确保粒子之间保留一定间隙
    const repulsionRadius = Math.max(orbSize, 50) * 1.2;
    const repulsionStrength = 0.05;

    for (let j = 0; j < particleCount; j++) {
      if (i === j) continue;
      const other = state.particles[j];
      if (!other) continue;

      const dx = p.x - other.x;
      const dy = p.y - other.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < repulsionRadius && dist > 0) {
        // 距离越近，斥力越大
        const force = (repulsionRadius - dist) / repulsionRadius;
        p.vx += (dx / dist) * force * repulsionStrength;
        p.vy += (dy / dist) * force * repulsionStrength;
      }
    }

    // 3. 速度限制 (Speed Limit)：防止粒子因为斥力飞得太快
    // 增加一点阻尼，让运动更平滑
    p.vx *= 0.99;
    p.vy *= 0.99;

    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    const maxSpeed = 1.5; // 最大速度
    if (speed > maxSpeed) {
      p.vx = (p.vx / speed) * maxSpeed;
      p.vy = (p.vy / speed) * maxSpeed;
    }

    // 位置更新
    p.x += p.vx;
    p.y += p.vy;

    // 边界检查：如果粒子移出屏幕，从另一侧绕回 (Wrap around)
    // 预留 50px 缓冲区，保证粒子完全消失后再出现
    if (p.x < -50) p.x = width + 50;
    if (p.x > width + 50) p.x = -50;
    if (p.y < -50) p.y = height + 50;
    if (p.y > height + 50) p.y = -50;

    // --- 3. 绘制渲染 ---

    const alpha = clamp01(p.opacity);
    // 解析颜色字符串，提取 RGB 值
    const lastComma = p.color.lastIndexOf(',');
    const rgb = lastComma > 5 ? p.color.slice(5, lastComma).trim() : '255, 255, 255';

    const base = clampInt(Math.round(orbSize), 0, 200);
    const softness = clampInt(Math.round(blurStrength), 0, 200);

    // 计算半径 - 使用 DEFAULT_REACTION_SCALE 增强反应幅度
    const baseRadius = Math.max(8, base + p.size * DEFAULT_REACTION_SCALE);
    const outerRadius = baseRadius + softness; // 外部光晕半径，去除 +6 硬编码

    // 绘制统一的光晕 (Unified Glow)
    // 使用单个径向渐变，从中心向外平滑衰减，避免核心和外围的割裂感
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, outerRadius);
    gradient.addColorStop(0, `rgba(${rgb}, ${alpha})`);           // 中心最亮
    gradient.addColorStop(0.3, `rgba(${rgb}, ${alpha * 0.95})`);  // 扩大核心区域 (0.1 -> 0.3)，使其看起来更实
    gradient.addColorStop(0.6, `rgba(${rgb}, ${alpha * 0.5})`);   // 中间过渡更平滑
    gradient.addColorStop(1, `rgba(${rgb}, 0)`);                  // 边缘完全透明

    // 使用 'screen' 或 'lighter' 混合模式，让重叠部分产生漂亮的光感
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(p.x, p.y, outerRadius, 0, 2 * Math.PI, true);
    ctx.closePath();
    ctx.fill();

    // 移除独立的 Core 绘制，合二为一
  }

  ctx.globalCompositeOperation = prevComposite;
}

// 重置状态函数
function resetState(): VisualMusicState {
  return { isInit: false, lastTime: -Infinity };
}

// ==========================================
// 主 Hook: useVisualMusic2D
// ==========================================

export function useVisualMusic2D(
  canvas: HTMLCanvasElement | null,
  width: number,
  height: number,
  options?: Partial<VisualMusicTweakOptions>
) {
  // 使用 Ref 存储最新配置，避免闭包陷阱
  const optionsRef = useRef<VisualMusicTweakOptions>({
    intensity: DEFAULT_INTENSITY,
    trail: DEFAULT_TRAIL,
    particleCount: DEFAULT_PARTICLE_COUNT,
    blurStrength: DEFAULT_BLUR_STRENGTH,
    orbSize: DEFAULT_ORB_SIZE,
  });

  // 合并用户配置和默认配置
  // 使用 colorKey 避免数组引用变化导致的重新计算
  const colorKey = options?.colors ? options.colors.join(',') : '';

  const mergedOptions = useMemo<VisualMusicTweakOptions>(() => {
    return {
      intensity: typeof options?.intensity === 'number' ? options.intensity : DEFAULT_INTENSITY,
      trail: typeof options?.trail === 'number' ? options.trail : DEFAULT_TRAIL,
      particleCount: typeof options?.particleCount === 'number' ? options.particleCount : DEFAULT_PARTICLE_COUNT,
      blurStrength: typeof options?.blurStrength === 'number' ? options.blurStrength : DEFAULT_BLUR_STRENGTH,
      orbSize: typeof options?.orbSize === 'number' ? options.orbSize : DEFAULT_ORB_SIZE,
      colors: options?.colors,
    };
  }, [options?.intensity, options?.trail, options?.particleCount, options?.blurStrength, options?.orbSize, colorKey]);

  // 同步配置到 Ref
  useEffect(() => {
    optionsRef.current = mergedOptions;
  }, [mergedOptions]);

  const stateRef = useRef<VisualMusicState>(resetState());

  // 当粒子数量或颜色配置变化时，需要重置整个状态（重新生成粒子数组）
  // 使用 colorKey 避免数组引用变化导致的无限重置
  const mergedColorKey = mergedOptions.colors ? mergedOptions.colors.join(',') : '';
  useEffect(() => {
    stateRef.current = resetState();
  }, [mergedOptions.particleCount, mergedColorKey]);

  // 渲染回调函数，每帧调用
  const render = useCallback(
    (time: number, frameAudioData: AudioData) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { intensity, trail, particleCount, orbSize, blurStrength, colors } = optionsRef.current;

      // 如果时间倒流（例如视频循环播放），重置动画状态
      if (time < stateRef.current.lastTime) {
        stateRef.current = resetState();
      }
      stateRef.current.lastTime = time;

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // 1. 绘制背景/拖尾
      beginFrame(ctx, width, height, trail);

      // 2. 延迟初始化粒子系统 (确保有宽高)
      if (!stateRef.current.isInit) {
        stateRef.current.e0 = initE0(width, height, particleCount, colors);
        stateRef.current.isInit = true;
      }

      // 3. 绘制粒子
      if (stateRef.current.e0) {
        // 获取音频数据 (采样到 256 长度)
        const data = getResampledFrequencyData(frameAudioData.frequencyData, 256, intensity);
        drawE0(ctx, width, height, data, stateRef.current.e0, orbSize, blurStrength);
      }

      ctx.restore();
    },
    [canvas, width, height]
  );

  return { render };
}
