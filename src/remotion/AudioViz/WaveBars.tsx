import {
  createSmoothSvgPath,
  useAudioData,
  visualizeAudio,
  visualizeAudioWaveform,
} from "@remotion/media-utils";
import { interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export const WaveBars: React.FC<{
  audioSrc: string;
  bars?: number;
}> = ({ audioSrc, bars = 256 }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const audioData = useAudioData(staticFile(audioSrc));

  if (!audioData) {
    return null;
  }

  const spectrum = visualizeAudio({
    fps,
    frame,
    audioData,
    numberOfSamples: bars,
    optimizeFor: "speed",
  });

  const t = frame / fps;
  const rotation = t * 0.35;
  const cx = width / 2;
  const cy = height * 0.41;
  const baseRadius = Math.min(width, height) * 0.18;
  const maxLen = Math.min(width, height) * 0.1;

  const wave = visualizeAudioWaveform({
    fps,
    frame,
    audioData,
    numberOfSamples: 96,
    windowInSeconds: 0.25,
  });

  const waveHeight = height * 0.07;
  const waveTop = height * 0.69;
  const waveLeft = width * 0.08;
  const waveWidth = width * 0.84;
  const wavePath = createSmoothSvgPath({
    points: wave.map((x, i) => {
      return {
        x: waveLeft + (i / (wave.length - 1)) * waveWidth,
        y: waveTop + (0.5 - x) * waveHeight,
      };
    }),
  });

  const intro = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{
        opacity: intro,
      }}
    >
      <defs>
        <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255, 90, 190, 0.95)" />
          <stop offset="50%" stopColor="rgba(80, 210, 255, 0.95)" />
          <stop offset="100%" stopColor="rgba(120, 255, 180, 0.95)" />
        </linearGradient>
        <radialGradient id="coreGlow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.40)" />
          <stop offset="40%" stopColor="rgba(120, 210, 255, 0.18)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <filter id="softGlow">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"
            result="glow"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="waveGlow">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle
        cx={cx}
        cy={cy}
        r={baseRadius * 1.25}
        fill="url(#coreGlow)"
        opacity={0.9}
      />

      <g filter="url(#softGlow)">
        {spectrum.map((raw, i) => {
          const v = Math.pow(raw, 0.55);
          const angle = ((i / spectrum.length + rotation) * Math.PI * 2) % (Math.PI * 2);
          const len = baseRadius + v * maxLen;
          const x1 = cx + Math.cos(angle) * baseRadius;
          const y1 = cy + Math.sin(angle) * baseRadius;
          const x2 = cx + Math.cos(angle) * len;
          const y2 = cy + Math.sin(angle) * len;

          const alpha = 0.12 + v * 0.9;
          const strokeWidth = 2 + v * 5;
          const hue = 190 + (i / spectrum.length) * 140;

          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={`hsla(${hue}, 100%, 65%, ${alpha})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          );
        })}
      </g>

      <circle
        cx={cx}
        cy={cy}
        r={baseRadius * 0.78}
        fill="rgba(0,0,0,0.22)"
        stroke="url(#ringGradient)"
        strokeWidth={2}
        opacity={0.8}
      />

      <g filter="url(#waveGlow)">
        <path
          d={wavePath as string}
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={16}
          strokeLinecap="round"
        />
        <path
          d={wavePath as string}
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth={6}
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};
