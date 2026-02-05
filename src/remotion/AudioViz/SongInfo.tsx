import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { resolveSrc } from '../utils';
import type { Caption } from '@remotion/captions';
import { getDistToNearestCaption, getGapDuration } from './utils/caption-utils';

export const SongInfo: React.FC<{
  coverImg?: string;
  songTitle?: string;
  artistName?: string;
  description?: string;
  captions: Caption[] | null;
}> = ({ coverImg, songTitle, artistName, description, captions }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const timeMs = (frame / fps) * 1000;

  // Calculate distance to nearest caption
  const distMs = captions ? getDistToNearestCaption(captions, timeMs) : Infinity;
  const currentGapDuration = captions ? getGapDuration(captions, timeMs) : Infinity;

  const MIN_GAP_THRESHOLD = 3000;
  const isLargeGap = currentGapDuration >= MIN_GAP_THRESHOLD;

  let centerStrength = interpolate(distMs, [1000, 3000], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // If the gap itself is small, never go to center
  if (!isLargeGap) {
    centerStrength = 0;
  }

  if (!coverImg && !songTitle && !artistName && !description) return null;

  const FONT_FAMILY = "'Long Cang', cursive";

  // --- Animation Logic ---

  // Center Mode Entrance (0 -> 1)
  const centerContainerOpacity = interpolate(centerStrength, [0.0, 0.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }); // Fade in container quickly
  const centerCoverOpacity = interpolate(centerStrength, [0.5, 0.7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const centerTitleOpacity = interpolate(centerStrength, [0.6, 0.8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const centerInfoOpacity = interpolate(centerStrength, [0.7, 0.9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }); // Artist & Desc

  const centerScale = interpolate(centerStrength, [0.5, 1], [0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const centerY = interpolate(centerStrength, [0.5, 1], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Bottom Mode Entrance (1 -> 0)
  const bottomCoverOpacity = interpolate(centerStrength, [0.2, 0.4], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bottomTitleOpacity = interpolate(centerStrength, [0.1, 0.3], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bottomArtistOpacity = interpolate(centerStrength, [0.0, 0.2], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const bottomY = interpolate(centerStrength, [0, 1], [0, 20], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });


  return (
    <AbsoluteFill style={{ zIndex: 5, fontFamily: FONT_FAMILY }}>
      {/* --- CENTER MODE LAYOUT --- */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}
      >
        <div
          className="flex flex-col items-center justify-center gap-10 p-12 bg-black/20 backdrop-blur-2xl rounded-[3rem] border border-white/5 shadow-2xl max-w-[80%]"
          style={{
            transform: `scale(${centerScale}) translateY(${centerY}px)`,
            opacity: centerContainerOpacity,
          }}
        >
          {coverImg && (
            <div
              className="relative w-[36rem] h-[36rem] rounded-[2rem] overflow-hidden shadow-2xl border border-white/20 ring-4 ring-white/5"
              style={{ opacity: centerCoverOpacity }}
            >
              <Img src={resolveSrc(coverImg)} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex flex-col items-center gap-4 text-center">
            {songTitle && (
              <h1
                className="text-7xl text-white drop-shadow-xl tracking-wide leading-tight"
                style={{ opacity: centerTitleOpacity }}
              >
                {songTitle}
              </h1>
            )}
            <div style={{ opacity: centerInfoOpacity }} className="flex flex-col items-center gap-2">
              {artistName && (
                <h2 className="text-4xl text-white/90 tracking-widest opacity-90">
                  {artistName}
                </h2>
              )}
              {description && (
                <p className="text-2xl text-white/70 max-w-2xl mt-4 leading-relaxed font-sans opacity-80">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- BOTTOM MODE LAYOUT --- */}
      <div
        style={{
          position: 'absolute',
          bottom: 260,
          left: 80,
          right: 80,
          height: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 32,
          transform: `translateY(${bottomY}px)`,
        }}
      >
        {coverImg && (
          <div
            className="h-28 w-28 shrink-0 rounded-2xl overflow-hidden border border-white/20 shadow-xl"
            style={{ opacity: bottomCoverOpacity }}
          >
            <Img src={resolveSrc(coverImg)} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex flex-col justify-center min-w-0 gap-2">
          {songTitle && (
            <h3
              className="text-6xl text-white truncate leading-none drop-shadow-md"
              style={{ opacity: bottomTitleOpacity }}
            >
              {songTitle}
            </h3>
          )}
          {artistName && (
            <p
              className="text-4xl text-white/80 tracking-wider truncate shadow-black drop-shadow-sm"
              style={{ opacity: bottomArtistOpacity }}
            >
              {artistName}
            </p>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
