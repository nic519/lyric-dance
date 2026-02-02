import { AudioVizProps } from "./schema";
import { AbsoluteFill, Audio } from "remotion";
import { Atmosphere } from "./Atmosphere";
import { VerticalCaptions } from "./VerticalCaptions";
import { resolveSrc } from "../utils";

export const AudioViz: React.FC<AudioVizProps> = ({
  audioSrc,
  srtSrc,
  fontFamily,
  fontSize,
}) => {
  return (
    <AbsoluteFill className="bg-black">
      <Audio src={resolveSrc(audioSrc)} />
      <Atmosphere audioSrc={audioSrc} />

      <VerticalCaptions
        srtSrc={srtSrc}
        fontFamily={fontFamily}
        fontSize={fontSize}
      />
    </AbsoluteFill>
  );
};
