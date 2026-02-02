import { AudioVizProps } from "./schema";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { Atmosphere } from "./Atmosphere";
import { VerticalCaptions } from "./VerticalCaptions";

export const AudioViz: React.FC<AudioVizProps> = ({ audioSrc, srtSrc }) => {
  const normalizedAudioSrc = audioSrc.startsWith("/") ? audioSrc.slice(1) : audioSrc;
  const normalizedSrtSrc = srtSrc.startsWith("/") ? srtSrc.slice(1) : srtSrc;

  return (
    <AbsoluteFill className="bg-black">
      <Audio src={staticFile(normalizedAudioSrc)} />
      <Atmosphere audioSrc={normalizedAudioSrc} />

      <VerticalCaptions srtSrc={normalizedSrtSrc} />
    </AbsoluteFill>
  );
};
