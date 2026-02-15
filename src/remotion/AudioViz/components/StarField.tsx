import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { resolveSrc } from "../../utils";

export const StarField: React.FC<{
  audioSrc: string;
}> = ({ audioSrc }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const audioData = useAudioData(resolveSrc(audioSrc));

  const stars = useMemo(() => {
    return new Array(200).fill(0).map((_, i) => {
      const seed = i * 789.12;
      return {
        x: random(seed) * width,
        y: random(seed + 1) * height,
        size: random(seed + 2) * 2 + 1, // 1px to 3px
        speed: random(seed + 3) * 0.5 + 0.2, // Constant natural drift speed
        baseOpacity: random(seed + 4) * 0.5 + 0.1, // Each star has a base brightness
        twinkleSpeed: random(seed + 5) * 0.1 + 0.05, // Different twinkle rates
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
        // Natural movement: purely time-based, no audio influence on position
        const yPos = (star.y + frame * star.speed) % height;

        // Audio reactivity:
        // 1. Twinkle effect: Sine wave based on time + individual star speed
        const twinkle = Math.sin(frame * star.twinkleSpeed) * 0.2;

        // 2. Audio boost: Intensity increases opacity significantly
        // When music is loud, stars shine brighter. When quiet, they are dimmer.
        const audioBoost = interpolate(intensity, [0, 0.5], [0, 0.8], { extrapolateRight: "clamp" });

        // Combined opacity
        const opacity = Math.min(1, Math.max(0, star.baseOpacity + twinkle + audioBoost));

        // 3. Size pulse: Subtle scaling with intensity
        const scale = 1 + intensity * 0.5;

        // 4. "Appearance" threshold: Fainter stars might only be visible when intensity is high
        if (opacity < 0.1) return null;

        return (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: star.x,
              top: yPos,
              width: star.size,
              height: star.size,
              opacity,
              transform: `scale(${scale})`,
              boxShadow: `0 0 ${star.size * 2 * scale}px ${star.size * scale}px rgba(255, 255, 255, ${opacity * 0.5})`,
            }}
          />
        );
      })}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-900/10 via-transparent to-transparent" />
    </AbsoluteFill>
  );
};
