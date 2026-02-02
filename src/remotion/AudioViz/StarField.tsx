import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { resolveSrc } from "../utils";

export const StarField: React.FC<{
  audioSrc: string;
}> = ({ audioSrc }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const audioData = useAudioData(resolveSrc(audioSrc));

  const stars = useMemo(() => {
    return new Array(100).fill(0).map((_, i) => {
      const seed = i * 789.12;
      return {
        x: random(seed) * width,
        y: random(seed + 1) * height,
        size: random(seed + 2) * 3 + 1,
        speed: random(seed + 3) * 2 + 0.5,
      };
    });
  }, [width, height]);

  if (!audioData) {
    return null;
  }

  const spectrum = visualizeAudio({
    fps,
    frame,
    audioData,
    numberOfSamples: 16,
  });

  const intensity = spectrum.reduce((a, b) => a + b, 0) / spectrum.length;

  return (
    <AbsoluteFill className="bg-black">
      {stars.map((star, i) => {
        // Reduced speed multiplier from 5 to 0.5 for smoother movement
        const yPos = (star.y + frame * star.speed * (1 + intensity * 0.5)) % height;
        
        return (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: star.x,
              top: yPos,
              width: star.size,
              height: star.size,
              // Reduced opacity range for less flickering
              opacity: interpolate(intensity, [0, 1], [0.4, 0.8]) * random(i),
              boxShadow: `0 0 ${star.size}px rgba(255, 255, 255, 0.5)`,
            }}
          />
        );
      })}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent" />
    </AbsoluteFill>
  );
};
