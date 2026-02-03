import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { useMemo } from "react";
import { resolveSrc } from "../utils";

// ------------------------------------------------------------------
// 核心配置参数 (Configuration)
// ------------------------------------------------------------------

// 星星相关配置
const STAR_CONFIG = {
  count: 70,              // 星星数量
  minSize: 1,             // 最小尺寸 (px)
  maxSizeAddition: 3,     // 尺寸随机增量 (px) -> 最终范围 [1, 4]
  baseSpeed: 0.1,         // 基础漂浮速度
  speedVariance: 0.2,     // 速度随机变量
  baseOpacity: 0.1,       // 基础透明度
  opacityVariance: 0.4,   // 透明度随机增量
  audioReactivity: 0.8,   // 音频对星星闪烁的影响强度 (0-1)
};

// 光晕/氛围相关配置
const BLOB_CONFIG = {
  primary: {
    blur: 120,            // 主光斑模糊度 (px)
    opacity: 0.4,         // 主光斑透明度
    scaleBase: 1,         // 基础缩放
    scaleMax: 1.9,        // 最大缩放 (受低音控制)
    hueCenter: 215,       // 基础色相 (青蓝色)
    hueSwing: 25,         // 色相摆动范围 (+/-)
  },
  secondary: {
    blur: 100,            // 次光斑模糊度 (px)
    opacity: 0.3,         // 次光斑透明度
    scaleBase: 1,         // 基础缩放
    scaleMax: 1.2,        // 最大缩放 (受中高音控制)
    hueCenter: 290,       // 基础色相 (紫粉色)
    hueSwing: 30,         // 色相摆动范围 (+/-)
  }
};

// 音频分析配置
const AUDIO_CONFIG = {
  fftSize: 16,            // 采样样本数 (用于FFT)
  bassRange: 4,           // 低音截取范围 (前4个样本)
};

export const Atmosphere: React.FC<{
  audioSrc: string;
}> = ({ audioSrc }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const audioData = useAudioData(resolveSrc(audioSrc));

  // ------------------------------------------------------------------
  // 1. 初始化星星数据 (仅计算一次)
  // ------------------------------------------------------------------
  const stars = useMemo(() => {
    return new Array(STAR_CONFIG.count).fill(0).map((_, i) => {
      const seed = i * 123.45;
      return {
        x: random(seed) * width,
        y: random(seed + 1) * height,
        size: random(seed + 2) * STAR_CONFIG.maxSizeAddition + STAR_CONFIG.minSize,
        speed: random(seed + 3) * STAR_CONFIG.speedVariance + STAR_CONFIG.baseSpeed, // 缓慢的恒定漂浮
        opacityBase: random(seed + 4) * STAR_CONFIG.opacityVariance + STAR_CONFIG.baseOpacity,
      };
    });
  }, [width, height]);

  if (!audioData) {
    return null;
  }

  // ------------------------------------------------------------------
  // 2. 音频频谱分析
  // ------------------------------------------------------------------
  const spectrum = visualizeAudio({
    fps,
    frame,
    audioData,
    numberOfSamples: AUDIO_CONFIG.fftSize,
    optimizeFor: "speed",
  });

  // 提取低音 (Bass) - 控制主光斑的脉冲
  const bass = spectrum.slice(0, AUDIO_CONFIG.bassRange).reduce((a, b) => a + b, 0) / AUDIO_CONFIG.bassRange;

  // 提取中高音 (MidHigh) - 控制次光斑和星星闪烁
  const midHighSamples = spectrum.length - AUDIO_CONFIG.bassRange;
  const midHigh = spectrum.slice(AUDIO_CONFIG.bassRange).reduce((a, b) => a + b, 0) / midHighSamples;

  const t = frame / fps; // 当前时间 (秒)

  // ------------------------------------------------------------------
  // 3. 动态参数计算
  // ------------------------------------------------------------------

  // 主光斑脉冲缩放 (随低音跳动)
  const pulseScale = interpolate(bass, [0, 1], [BLOB_CONFIG.primary.scaleBase, BLOB_CONFIG.primary.scaleMax], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 颜色设计: 星云主题 (深空风格)
  // 在青蓝 (Cyan/Blue) 和 紫粉 (Purple/Magenta) 之间缓慢呼吸，而不是剧烈旋转

  // Hue 1: 主光斑色相 (190 - 240)
  const hue1 = BLOB_CONFIG.primary.hueCenter + Math.sin(t * 0.2) * BLOB_CONFIG.primary.hueSwing;

  // Hue 2: 次光斑色相 (260 - 320)
  const hue2 = BLOB_CONFIG.secondary.hueCenter + Math.cos(t * 0.25) * BLOB_CONFIG.secondary.hueSwing;

  return (
    <AbsoluteFill className="overflow-hidden bg-[#020204]">
      {/* 
        ---------------------------------------------------------------
        主光斑 (Primary Blob) 
        - 响应低音 (Bass)
        - 冷色调 (Blue/Cyan)
        ---------------------------------------------------------------
      */}
      <div
        className={`absolute rounded-full blur-[${BLOB_CONFIG.primary.blur}px] opacity-${Math.round(BLOB_CONFIG.primary.opacity * 100)}`}
        style={{
          width: width * 1.5,
          height: width * 1.5,
          left: -width * 0.25,
          top: -width * 0.25,
          background: `radial-gradient(circle, hsla(${hue1}, 85%, 45%, 0.5), transparent 70%)`,
          // 复合变换: 缩放(低音) + 缓慢位移(时间)
          transform: `scale(${pulseScale}) translate(${Math.sin(t * 0.2) * 30}px, ${Math.cos(t * 0.2) * 30}px)`,
          filter: `blur(${BLOB_CONFIG.primary.blur}px)`, // 显式内联样式确保模糊生效
          opacity: BLOB_CONFIG.primary.opacity,
        }}
      />

      {/* 
        ---------------------------------------------------------------
        次光斑 (Secondary Blob)
        - 响应中高音 (MidHigh)
        - 神秘色调 (Purple)
        ---------------------------------------------------------------
      */}
      <div
        className="absolute rounded-full"
        style={{
          width: width * 1.2,
          height: width * 1.2,
          right: -width * 0.2,
          bottom: -width * 0.2,
          background: `radial-gradient(circle, hsla(${hue2}, 80%, 55%, 0.4), transparent 70%)`,
          // 缩放响应中高音，位移频率略不同以制造错落感
          transform: `scale(${interpolate(midHigh, [0, 1], [BLOB_CONFIG.secondary.scaleBase, BLOB_CONFIG.secondary.scaleMax])}) translate(${Math.cos(t * 0.15) * 40}px, ${Math.sin(t * 0.1) * 40}px)`,
          filter: `blur(${BLOB_CONFIG.secondary.blur}px)`,
          opacity: BLOB_CONFIG.secondary.opacity,
        }}
      />

      {/* 
        ---------------------------------------------------------------
        星星层 (Star Field)
        - 自然漂浮 (Natural Drift)
        - 音频响应闪烁 (Audio Reactivity Shimmer)
        ---------------------------------------------------------------
      */}
      {stars.map((star, i) => {
        // 计算自然向上漂浮的位移
        const offset = t * 60 * star.speed;
        const yRaw = star.y - offset;
        // 循环滚动: 当星星飘出顶部时，从底部重新出现
        const yPos = ((yRaw % (height + 50)) + (height + 50)) % (height + 50) - 25;

        // 音频仅影响透明度 (闪烁感)，不影响位置，避免画面抖动
        const shimmer = midHigh * STAR_CONFIG.audioReactivity;
        const finalOpacity = Math.min(1, star.opacityBase + shimmer);

        return (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: star.x,
              top: yPos,
              width: star.size,
              height: star.size,
              opacity: finalOpacity,
              boxShadow: `0 0 ${star.size * 2}px rgba(255, 255, 255, ${finalOpacity})`,
            }}
          />
        );
      })}

      {/* 
        ---------------------------------------------------------------
        暗角遮罩 (Vignette)
        - 增加深邃感，让中心更亮
        ---------------------------------------------------------------
      */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(circle at center, transparent 30%, #000000 130%)'
        }}
      />
    </AbsoluteFill>
  );
};
