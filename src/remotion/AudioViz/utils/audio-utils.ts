import { visualizeAudio } from "@remotion/media-utils";
import type { AudioData } from "../types/audio";

export const getAudioData = (
  frame: number,
  fps: number,
  audioData: any, // AudioData from useAudioData
): AudioData => {
  if (!audioData) {
    return {
      frequencyData: null,
      averageFrequency: 0,
      bassLevel: 0,
      midLevel: 0,
      trebleLevel: 0,
    };
  }

  const numberOfSamples = 256;
  const spectrum = visualizeAudio({
    fps,
    frame,
    audioData,
    numberOfSamples,
  });

  // Map 0-1 spectrum to 0-255 Uint8Array for the shader
  const frequencyData = new Uint8Array(spectrum.map(v => v * 255));
  
  const averageFrequency = spectrum.reduce((a, b) => a + b, 0) / spectrum.length;
  
  // Simple bands
  const bassLevel = spectrum.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
  const midLevel = spectrum.slice(10, 100).reduce((a, b) => a + b, 0) / 90;
  const trebleLevel = spectrum.slice(100).reduce((a, b) => a + b, 0) / (spectrum.length - 100);

  return {
    frequencyData,
    averageFrequency,
    bassLevel,
    midLevel,
    trebleLevel,
  };
};
