import React, { useRef, useState, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { useAudioData } from "@remotion/media-utils";
import { useAuroraOGL } from "../hooks/useAuroraOGL";
import { getAudioData } from "../utils/audio-utils";
import { resolveSrc } from "../../utils";

export const AuroraShader: React.FC<{
  audioSrc: string;
}> = ({ audioSrc }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const audioData = useAudioData(resolveSrc(audioSrc));
  const [canvasEl, setCanvasEl] = React.useState<HTMLCanvasElement | null>(null);
  
  const { render } = useAuroraOGL(
    canvasEl,
    width,
    height,
    {
      blend: 0.8,
      amplitude: 0.5,
      speed: 1.2,
      colorStops: ["#3A29FF", "#FF94B4", "#FF3232"]
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
