import React, { useRef, useState, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { useAudioData } from "@remotion/media-utils";
import { useCircularAudioOGL } from "../hooks/useCircularAudioOGL";
import { getAudioData } from "../utils/audio-utils";
import { resolveSrc } from "../../utils";

export const CircularAudioShader: React.FC<{
  audioSrc: string;
}> = ({ audioSrc }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const audioData = useAudioData(resolveSrc(audioSrc));
  const [canvasEl, setCanvasEl] = React.useState<HTMLCanvasElement | null>(null);
  
  const { render } = useCircularAudioOGL(
    canvasEl,
    getAudioData(frame, fps, audioData),
    width,
    height
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
