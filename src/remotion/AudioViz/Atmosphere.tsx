import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import { AbsoluteFill, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export const Atmosphere: React.FC<{
  audioSrc: string;
}> = ({ audioSrc }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const audioData = useAudioData(staticFile(audioSrc));

  if (!audioData) {
    return null;
  }

  const spectrum = visualizeAudio({
    fps,
    frame,
    audioData,
    numberOfSamples: 16,
    optimizeFor: "speed",
  });

  const bass = spectrum.slice(0, 4).reduce((a, b) => a + b, 0) / 4;

  const midHigh = spectrum.slice(4).reduce((a, b) => a + b, 0) / (spectrum.length - 4);

  const t = frame / fps;

  const pulseScale = interpolate(bass, [0, 1], [1, 1.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const hue1 = (t * 10) % 360;
  const hue2 = (t * 15 + 180) % 360;

  return (
    <AbsoluteFill className="overflow-hidden bg-[#050505]">
      <div
        className="absolute rounded-full blur-[120px] opacity-40"
        style={{
          width: width * 1.5,
          height: width * 1.5,
          left: -width * 0.25,
          top: -width * 0.25,
          background: `radial-gradient(circle, hsla(${hue1}, 80%, 50%, 0.4), transparent)`,
          transform: `scale(${pulseScale}) translate(${Math.sin(t * 0.5) * 50}px, ${Math.cos(t * 0.5) * 50}px)`,
        }}
      />
      <div
        className="absolute rounded-full blur-[100px] opacity-30"
        style={{
          width: width * 1.2,
          height: width * 1.2,
          right: -width * 0.2,
          bottom: -width * 0.2,
          background: `radial-gradient(circle, hsla(${hue2}, 70%, 60%, 0.4), transparent)`,
          transform: `scale(${interpolate(midHigh, [0, 1], [1, 1.3])}) translate(${Math.cos(t * 0.3) * 50}px, ${Math.sin(t * 0.4) * 50}px)`,
        }}
      />

      {new Array(20).fill(0).map((_, i) => {
        const seed = i * 123.45;
        const x = random(seed) * width;
        const y = random(seed + 1) * height;
        const size = random(seed + 2) * 4 + 2;
        const speed = random(seed + 3) * 0.5 + 0.2;

        const yPos = (y - t * 50 * speed - bass * 100) % (height + 100) - 50;
        const xPos = x + Math.sin(t + i) * 20 * (midHigh + 0.5);

        const opacity = random(seed + 4) * 0.5 + 0.2;

        return (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: xPos,
              top: yPos,
              width: size,
              height: size,
              opacity: opacity + midHigh * 0.5,
              boxShadow: `0 0 ${size * 2}px white`,
            }}
          />
        );
      })}

      <AbsoluteFill
        style={{
          background: 'radial-gradient(circle at center, transparent 40%, black 120%)'
        }}
      />
    </AbsoluteFill>
  );
};
