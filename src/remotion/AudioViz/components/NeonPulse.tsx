import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { resolveSrc } from "../../utils";

export const NeonPulse: React.FC<{
  audioSrc: string;
}> = ({ audioSrc }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioData = useAudioData(resolveSrc(audioSrc));

  if (!audioData) {
    return null;
  }

  const spectrum = visualizeAudio({
    fps,
    frame,
    audioData,
    numberOfSamples: 32,
    optimizeFor: "speed",
  });

  const bass = spectrum.slice(0, 4).reduce((a, b) => a + b, 0) / 4;
  const t = frame / fps;

  return (
    <AbsoluteFill className="bg-[#110011] overflow-hidden">
      {/* Center Grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            linear-gradient(transparent 95%, #ff00ff 95%),
            linear-gradient(90deg, transparent 95%, #00ffff 95%)
          `,
          backgroundSize: '100px 100px',
          transform: `perspective(500px) rotateX(60deg) translateY(${t * 50}px) scale(2)`,
          transformOrigin: 'center 80%'
        }}
      />

      {/* Pulsing Circles */}
      <AbsoluteFill className="items-center justify-center">
        {new Array(5).fill(0).map((_, i) => {
          const delay = i * 0.5;
          const scale = interpolate((t + delay) % 4, [0, 4], [0.8, 2.5]);
          const opacity = interpolate((t + delay) % 4, [0, 2, 4], [0.6, 0.3, 0]);

          return (
            <div
              key={i}
              className="absolute rounded-full border border-cyan-400/50"
              style={{
                width: 300,
                height: 300,
                transform: `scale(${scale * (1 + bass * 0.15)})`,
                opacity: opacity,
                boxShadow: `0 0 40px ${i % 2 ? 'rgba(0, 255, 255, 0.2)' : 'rgba(255, 0, 255, 0.2)'}`,
              }}
            />
          );
        })}
      </AbsoluteFill>

      <AbsoluteFill style={{ background: 'radial-gradient(circle, transparent, #110011 90%)' }} />
    </AbsoluteFill>
  );
};
