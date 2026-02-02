import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { resolveSrc } from '../utils';
import type { Caption } from '@remotion/captions';
import { getDistToNearestCaption } from './utils/caption-utils';

export const SongInfo: React.FC<{
  coverImg?: string;
  songTitle?: string;
  artistName?: string;
  description?: string;
  captions: Caption[] | null;
}> = ({ coverImg, songTitle, artistName, description, captions }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const timeMs = (frame / fps) * 1000;
  
  // Calculate distance to nearest caption
  const distMs = captions ? getDistToNearestCaption(captions, timeMs) : Infinity;
  
  // Define active zone
  // If dist > 1000ms (1s), we are fully visible
  // If dist < 300ms (0.3s), we start fading out
  // If dist == 0, we are fully hidden (or maybe keep slight visibility?)
  // Let's fade out completely when text is there to avoid clutter.
  
  // Interpolate opacity based on distance
  const opacity = interpolate(distMs, [200, 800], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  
  const scale = interpolate(distMs, [0, 800], [0.95, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  
  const blur = interpolate(distMs, [200, 800], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  
  // If no content, return null
  if (!coverImg && !songTitle && !artistName && !description) return null;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
        transform: `scale(${scale})`,
        filter: `blur(${blur}px)`,
        zIndex: 5, // Behind captions (usually 10+)
      }}
    >
      <div className="flex flex-col items-center justify-center gap-8 p-10 bg-black/40 backdrop-blur-md rounded-[3rem] border border-white/10 shadow-2xl max-w-[80%]">
        {coverImg && (
          <div className="relative w-72 h-72 rounded-3xl overflow-hidden shadow-2xl border border-white/20 ring-4 ring-white/5">
             <Img src={resolveSrc(coverImg)} className="w-full h-full object-cover" />
          </div>
        )}
        {(songTitle || artistName || description) && (
          <div className="flex flex-col items-center gap-3 text-center">
            {songTitle && (
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70 drop-shadow-xl tracking-tight leading-tight">
                {songTitle}
              </h1>
            )}
            {artistName && (
              <h2 className="text-2xl text-white/90 font-light tracking-[0.2em] uppercase">
                {artistName}
              </h2>
            )}
             {description && (
              <p className="text-lg text-white/60 font-medium max-w-lg mt-2 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
