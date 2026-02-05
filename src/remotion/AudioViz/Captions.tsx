import { parseSrt } from "@remotion/captions";
import type { Caption } from "@remotion/captions";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
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

export const Captions: React.FC<{
  srtSrc: string;
}> = ({ srtSrc }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [handle] = useState(() => delayRender());
  const [captions, setCaptions] = useState<Caption[] | null>(null);

  const fetchCaptions = useCallback(async () => {
    try {
      const response = await fetch(staticFile(srtSrc));
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
    if (!captions) {
      return null;
    }
    const timeMs = (frame / fps) * 1000;
    return findCaptionAt(captions, timeMs);
  }, [captions, frame, fps]);

  if (!captions) {
    return null;
  }

  if (!current) {
    return null;
  }

  const caption = current.caption;
  const index = current.index;
  const timeMs = (frame / fps) * 1000;
  const durationMs = Math.max(1, caption.endMs - caption.startMs);
  const progress = Math.min(1, Math.max(0, (timeMs - caption.startMs) / durationMs));
  const startFrame = (caption.startMs / 1000) * fps;
  const endFrame = (caption.endMs / 1000) * fps;
  const localFrame = frame - startFrame;

  const enter = spring({
    fps,
    frame: localFrame,
    config: {
      damping: 16,
      stiffness: 160,
      mass: 0.9,
    },
    durationInFrames: 16,
  });

  const out = interpolate(frame, [endFrame - 6, endFrame], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const containerY = interpolate(enter, [0, 1], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const containerScale = interpolate(enter, [0, 1], [0.96, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const variant = index % 3;
  const accentA =
    variant === 0 ? "rgba(255, 90, 190, 0.95)" : variant === 1 ? "rgba(80, 210, 255, 0.95)" : "rgba(120, 255, 180, 0.95)";
  const accentB =
    variant === 0 ? "rgba(80, 210, 255, 0.95)" : variant === 1 ? "rgba(120, 255, 180, 0.95)" : "rgba(255, 90, 190, 0.95)";

  const lines = useMemo(() => parseCaptionText(caption.text), [caption.text]);
  const nLines = Math.max(1, lines.length);

  const jitter = Math.sin(frame * 0.6) * 0.7 * (1 - Math.min(1, localFrame / 10));
  const fontSize = Math.max(48, Math.min(72, 86 - nLines * 4));
  const lineHeight = Math.round(fontSize * 1.3);

  return (
    <AbsoluteFill
      className="items-center justify-end"
      style={{
        paddingBottom: height * 0.085,
      }}
    >
      <div
        style={{
          width: Math.min(width * 0.92, 980),
          opacity: enter * out,
          transform: `translateY(${containerY}px) scale(${containerScale})`,
        }}
      >
        <div
          className="relative overflow-hidden rounded-[26px]"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.62), rgba(0,0,0,0.38))",
            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow:
              "0 18px 60px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.10)",
            backdropFilter: "blur(14px)",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(900px 240px at 50% 0%, ${accentA}, rgba(0,0,0,0) 65%)`,
              opacity: 0.35,
              transform: `translateX(${jitter}px)`,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(700px 220px at 50% 100%, ${accentB}, rgba(0,0,0,0) 70%)`,
              opacity: 0.28,
              transform: `translateX(${-jitter}px)`,
            }}
          />
          <div className="relative px-[34px] pt-[24px] pb-[22px]">
            <div
              className="text-center font-extrabold tracking-[-0.02em]"
              style={{
                fontSize,
                lineHeight: `${lineHeight}px`,
                fontFamily:
                  "Inter, system-ui, -apple-system, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei'",
                textShadow:
                  "0 10px 40px rgba(0,0,0,0.55), 0 0 24px rgba(80,210,255,0.18)",
              }}
            >
              {lines.map((line, lIndex) => {
                const lineStart = lIndex / nLines;
                const lineEnd = (lIndex + 1) / nLines;

                return (
                  <div key={lIndex} style={{ marginBottom: lIndex < nLines - 1 ? 8 : 0 }}>
                    {line.segments.map((segment, sIndex) => {
                      const chars = Array.from(segment.text);
                      const isZoom = segment.tags.some(t => t.type === 'zoom');
                      const isShake = segment.tags.some(t => t.type === 'shake');
                      const colorTag = segment.tags.find(t => t.type === 'color');
                      const color = colorTag?.value || "rgba(255,255,255,0.88)";

                      return (
                        <span key={sIndex} style={{ display: "inline-block" }}>
                          {chars.map((ch, i) => {
                            const charProgress = i / chars.length;
                            // Map line progress to character progress
                            const a = lineStart + (charProgress * (lineEnd - lineStart) * 0.8);
                            const b = a + (0.2 / nLines);

                            const p = interpolate(progress, [a, b], [0, 1], {
                              extrapolateLeft: "clamp",
                              extrapolateRight: "clamp",
                            });

                            const y = interpolate(p, [0, 1], [10, 0], {
                              extrapolateLeft: "clamp",
                              extrapolateRight: "clamp",
                            });

                            const baseOpacity = 0.24 + p * 0.76;
                            const glow = 0.18 + p * 0.62;

                            // Shake effect
                            const shakeX = isShake ? (random(`shake-x-${frame}-${lIndex}-${sIndex}-${i}`) - 0.5) * 6 * p : 0;
                            const shakeY = isShake ? (random(`shake-y-${frame}-${lIndex}-${sIndex}-${i}`) - 0.5) * 6 * p : 0;

                            // Zoom effect
                            const scale = isZoom ? interpolate(p, [0, 1], [1, 1.4]) : 1;

                            return (
                              <span
                                key={i}
                                style={{
                                  display: "inline-block",
                                  transform: `translateY(${y}px) translate(${shakeX}px, ${shakeY}px) scale(${scale})`,
                                  opacity: baseOpacity,
                                  color,
                                  textShadow: `0 3px 14px rgba(0,0,0,0.65), 0 0 18px rgba(255,90,190,${glow}), 0 0 18px rgba(80,210,255,${glow})`,
                                  marginRight: ch === " " ? "0.2em" : "0.02em",
                                }}
                              >
                                {ch}
                              </span>
                            );
                          })}
                        </span>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div
              className="mt-[18px] h-[6px] rounded-full overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.10)",
              }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.round(progress * 100)}%`,
                  background: `linear-gradient(90deg, ${accentA}, ${accentB})`,
                  boxShadow: "0 0 22px rgba(80,210,255,0.35)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
