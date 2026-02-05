import React, { useEffect, useRef, useState } from "react";
import {
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const ProgressWaveform: React.FC<{
  audioSrc: string; // Keep for interface compatibility but ignore
  color?: string;
  height?: number;
}> = ({ color = "#22d3ee", height = 80 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Simple progress bar
  const progress = Math.min(1, Math.max(0, frame / durationInFrames));

  return (
    <div style={{
      position: 'absolute',
      bottom: 120, // Positioned above the bottom edge
      left: 60,
      right: 60,
      height: 6, // Thin line
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 3,
      overflow: 'hidden',
      zIndex: 10
    }}>
      <div style={{
        width: `${progress * 100}%`,
        height: '100%',
        background: color,
        boxShadow: `0 0 10px ${color}`,
        borderRadius: 3
      }} />
    </div>
  );
};
