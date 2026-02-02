import { AudioVizProps } from "./schema";
import { AbsoluteFill, Audio } from "remotion";
import { Atmosphere } from "./Atmosphere";
import { NeonPulse } from "./NeonPulse";
import { StarField } from "./StarField";
import { GradientWaves } from "./GradientWaves";
import { VerticalCaptions } from "./VerticalCaptions";
import { resolveSrc } from "../utils";

export const AudioViz: React.FC<AudioVizProps> = ({
  audioSrc,
  srtSrc,
  fontFamily,
  fontSize,
  backgroundType,
}) => {
  const renderBackground = () => {
    switch (backgroundType) {
      case "NeonPulse":
        return <NeonPulse audioSrc={audioSrc} />;
      case "StarField":
        return <StarField audioSrc={audioSrc} />;
      case "GradientWaves":
        return <GradientWaves audioSrc={audioSrc} />;
      case "Aurora":
      default:
        return <Atmosphere audioSrc={audioSrc} />;
    }
  };

  return (
    <AbsoluteFill className="bg-black">
      <Audio src={resolveSrc(audioSrc)} />
      {renderBackground()}

      <VerticalCaptions
        srtSrc={srtSrc}
        fontFamily={fontFamily}
        fontSize={fontSize}
      />
    </AbsoluteFill>
  );
};
