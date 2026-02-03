import React, { useRef, useState, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { useAudioData } from "@remotion/media-utils";
import { useDarkVeilOGL } from "../hooks/useDarkVeilOGL";
import { getAudioData } from "../utils/audio-utils";
import { resolveSrc } from "../../utils";

export const DarkVeilShader: React.FC<{
  audioSrc: string;
}> = ({ audioSrc }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const audioData = useAudioData(resolveSrc(audioSrc));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { render } = useDarkVeilOGL(
    canvasRef.current,
    width,
    height,
    {
      speed: 0.8,
      hueShift: 0,
      noiseIntensity: 0.05,
      scanlineIntensity: 0.1,
      warpAmount: 0.2
    }
  );

  useEffect(() => {
    if (audioData) {
      render(frame / fps);
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
