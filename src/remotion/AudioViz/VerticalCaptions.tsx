import { parseSrt } from "@remotion/captions";
import type { Caption } from "@remotion/captions";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import { resolveSrc } from "../utils";

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

export const VerticalCaptions: React.FC<{
  srtSrc: string;
  fontFamily?: string;
  fontSize?: number;
}> = ({ srtSrc, fontFamily, fontSize }) => {
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

  if (!captions) return null;

  if (!current) return null;

  const { caption, index } = current;
  const startFrame = (caption.startMs / 1000) * fps;
  const endFrame = (caption.endMs / 1000) * fps;
  const timeSinceStart = frame - startFrame;

  const characters = caption.text.trim().split("");

  return (
    <AbsoluteFill className="items-center justify-center pointer-events-none">
      <div
        style={{
          writingMode: "vertical-rl",
          textOrientation: "upright",
          display: "flex",
          gap: "0.5em",
          height: "80%",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {characters.map((char, i) => {
          const delay = i * 3;
          const charFrame = timeSinceStart - delay;

          const spr = spring({
            fps,
            frame: charFrame,
            config: { damping: 12, stiffness: 200 },
            durationInFrames: 30,
          });

          const seed = index * 100 + i;
          const floatX = Math.sin(frame * 0.05 + seed) * 10;
          const floatY = Math.cos(frame * 0.03 + seed) * 10;

          const opacity = interpolate(spr, [0, 1], [0, 1]);
          const scale = interpolate(spr, [0, 1], [2, 1]);
          const blur = interpolate(spr, [0, 1], [20, 0]);

          const exitOpacity = interpolate(frame, [endFrame - 10, endFrame], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <span
              key={i}
              style={{
                fontSize: fontSize ?? 80,
                fontWeight: 900,
                color: "white",
                opacity: opacity * exitOpacity,
                transform: `scale(${scale}) translate(${floatX}px, ${floatY}px)`,
                filter: `blur(${blur}px) drop-shadow(0 0 10px rgba(255,255,255,0.5))`,
                fontFamily: fontFamily ?? "'Noto Sans SC', sans-serif",
                marginBottom: "0.2em",
              }}
            >
              {char}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
