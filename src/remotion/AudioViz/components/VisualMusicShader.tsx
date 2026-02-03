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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { render } = useVisualMusic2D(
    canvasRef.current,
    width,
    height,
    {
      intensity: 1.2,
      trail: 0.15,
      particleCount: 30,
      blurStrength: 10,
      orbSize: 20
    }
  );

  useEffect(() => {
    if (audioData) {
      render(frame / fps, getAudioData(frame, fps, audioData));
    }
  }, [frame, fps, audioData, render]);

  return (
    <AbsoluteFill>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width: "100%", height: "100%" }}
      />
    </AbsoluteFill>
  );
};
