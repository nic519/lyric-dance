// Audio data type for OGL shaders
export interface AudioData {
  frequencyData: Uint8Array | null;
  averageFrequency: number;
  bassLevel: number;
  midLevel: number;
  trebleLevel: number;
  timeData?: Uint8Array;
}

export interface AuroraTweakOptions {
  blend: number;
  amplitude: number;
  speed: number;
  colorStops: [string, string, string];
}

export interface DarkVeilTweakOptions {
  hueShift: number;
  noiseIntensity: number;
  scanlineIntensity: number;
  speed: number;
  scanlineFrequency: number;
  warpAmount: number;
  resolutionScale: number;
}

export interface VisualMusicTweakOptions {
  intensity: number;
  trail: number;
  particleCount: number;
  blurStrength: number;
  orbSize: number;
}
