import React, { useRef, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { useAudioData } from "@remotion/media-utils";
import { useVisualMusic2D } from "../hooks/useVisualMusic2D";
import { getAudioData } from "../utils/audio-utils";
import { resolveSrc } from "../../utils";

export const VisualMusicShader: React.FC<{
  audioSrc: string;
}> = ({ audioSrc }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const audioData = useAudioData(resolveSrc(audioSrc));
  const [canvasEl, setCanvasEl] = React.useState<HTMLCanvasElement | null>(null);

  const { render } = useVisualMusic2D(
    canvasEl,
    width,
    height,
    {
      intensity: 1.5,
      trail: 0.1,
      particleCount: 40,
      blurStrength: 15,
      orbSize: 25
    }
  );

  useEffect(() => {
    if (audioData && canvasEl) {
      render(frame / fps, getAudioData(frame, fps, audioData));
    }
  }, [frame, fps, audioData, render, canvasEl]);

  return (
    <AbsoluteFill>
      <canvas
        ref={setCanvasEl}
        width={width}
        height={height}
        style={{ width: "100%", height: "100%" }}
      />
    </AbsoluteFill>
  );
};
