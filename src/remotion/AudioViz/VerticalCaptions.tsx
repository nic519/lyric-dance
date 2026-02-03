import { parseSrt } from "@remotion/captions";
import type { Caption } from "@remotion/captions";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import { resolveSrc } from "../utils";
import { parseCaptionText } from "./utils/caption-utils";

const findCaptionAt = (captions: Caption[], timeMs: number) => {
  let lo = 0;
  let hi = captions.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const c = captions[mid];
    if (timeMs < c.startMs) {
      hi = mid - 1;
    } else if (timeMs >= c.endMs) {
      lo = mid + 1;
    } else {
      return { caption: c, index: mid };
    }
  }
  return null;
};

import { loadFonts } from "../load-fonts";

export const VerticalCaptions: React.FC<{
  srtSrc: string;
  fontFamily?: string;
  fontSize?: number;
}> = ({ srtSrc, fontFamily, fontSize }) => {
  loadFonts();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [handle] = useState(() => delayRender());
  const [captions, setCaptions] = useState<Caption[] | null>(null);

  const fetchCaptions = useCallback(async () => {
    try {
      const response = await fetch(resolveSrc(srtSrc));
      const text = await response.text();
      const parsed = parseSrt({ input: text });
      setCaptions(parsed.captions);
      continueRender(handle);
    } catch (e) {
      cancelRender(e);
    }
  }, [cancelRender, continueRender, handle, srtSrc]);

  useEffect(() => {
    fetchCaptions();
  }, [fetchCaptions]);

  const current = useMemo(() => {
    if (!captions) return null;
    const timeMs = (frame / fps) * 1000;
    return findCaptionAt(captions, timeMs);
  }, [captions, frame, fps]);

  const lines = useMemo(() => {
    if (!current) return [];
    return parseCaptionText(current.caption.text);
  }, [current]);

  if (!captions) return null;
  if (!current) return null;

  const { caption, index } = current;
  const startFrame = (caption.startMs / 1000) * fps;
  const endFrame = (caption.endMs / 1000) * fps;
  const timeSinceStart = frame - startFrame;

  return (
    <AbsoluteFill className="items-center justify-center pointer-events-none">
      <div
        style={{
          writingMode: "vertical-rl",
          textOrientation: "upright",
          display: "flex",
          flexDirection: "row-reverse", // RL writing mode
          gap: "1.2em",
          height: "80%",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {lines.map((line, lIndex) => {
          const lineDelay = lIndex * 10; // Delay for each line

          return (
            <div
              key={lIndex}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {line.segments.map((segment, sIndex) => {
                const chars = Array.from(segment.text);
                const isZoom = segment.tags.some(t => t.type === 'zoom');
                const isShake = segment.tags.some(t => t.type === 'shake');
                const colorTag = segment.tags.find(t => t.type === 'color');
                const color = colorTag?.value || "white";

                return (
                  <React.Fragment key={sIndex}>
                    {chars.map((char, i) => {
                      const charDelay = lineDelay + i * 3;
                      const charFrame = timeSinceStart - charDelay;

                      const spr = spring({
                        fps,
                        frame: charFrame,
                        config: { damping: 12, stiffness: 200 },
                        durationInFrames: 30,
                      });

                      const seed = index * 1000 + lIndex * 100 + sIndex * 10 + i;
                      const floatX = Math.sin(frame * 0.05 + seed) * 10;
                      const floatY = Math.cos(frame * 0.03 + seed) * 10;

                      const opacity = interpolate(spr, [0, 1], [0, 1]);
                      const baseScale = interpolate(spr, [0, 1], [2, 1]);
                      const zoomScale = isZoom ? interpolate(spr, [0, 1], [1, 1.5]) : 1;
                      const scale = baseScale * zoomScale;

                      const blur = interpolate(spr, [0, 1], [20, 0]);

                      const exitOpacity = interpolate(frame, [endFrame - 10, endFrame], [1, 0], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                      });

                      const shakeX = isShake ? (random(`v-shake-x-${frame}-${seed}`) - 0.5) * 8 * spr : 0;
                      const shakeY = isShake ? (random(`v-shake-y-${frame}-${seed}`) - 0.5) * 8 * spr : 0;

                      return (
                        <span
                          key={i}
                          style={{
                            fontSize: fontSize ?? 80,
                            fontWeight: 900,
                            color,
                            opacity: opacity * exitOpacity,
                            transform: `scale(${scale}) translate(${floatX + shakeX}px, ${floatY + shakeY}px)`,
                            filter: `blur(${blur}px) drop-shadow(0 0 10px rgba(255,255,255,0.5))`,
                            fontFamily: fontFamily ?? "'Noto Sans SC', sans-serif",
                            marginBottom: "0.15em",
                            display: "inline-block",
                          }}
                        >
                          {char}
                        </span>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
