import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { resolveSrc } from "../utils";

export const GradientWaves: React.FC<{
  audioSrc: string;
}> = ({ audioSrc }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const audioData = useAudioData(resolveSrc(audioSrc));

  if (!audioData) {
    return null;
  }

  const spectrum = visualizeAudio({
    fps,
    frame,
    audioData,
    numberOfSamples: 16,
  });

  const low = spectrum.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
  const high = spectrum.slice(10).reduce((a, b) => a + b, 0) / 6;
  const t = frame / fps;

  return (
    <AbsoluteFill className="bg-[#0f172a] overflow-hidden">
      {new Array(3).fill(0).map((_, i) => {
        // Significantly reduced audio influence on scale
        const scale = 1 + low * 0.15;
        // Slower, smoother rotation
        const rotate = t * (4 + i * 2);
        
        return (
          <div
            key={i}
            className="absolute rounded-[40%]"
            style={{
              width: width * 2,
              height: width * 2,
              left: -width / 2,
              top: height / 2 - width + (i * 100),
              background: `linear-gradient(${45 + i * 60}deg, #4f46e5, #ec4899)`,
              opacity: 0.2 + high * 0.1, // Reduced opacity fluctuation
              transform: `rotate(${rotate}deg) scale(${scale}) translate(${Math.sin(t * 0.5 + i) * 30}px, ${Math.cos(t * 0.5 + i) * 30}px)`,
              filter: 'blur(80px)', // Increased blur for softness
            }}
          />
        );
      })}
      
      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 50%, transparent, #000 120%)`,
          opacity: 0.6 // Constant opacity for overlay
        }}
      />
    </AbsoluteFill>
  );
};
