import { AudioVizProps } from "./schema";
import { AbsoluteFill, Audio, useDelayRender } from "remotion";
import { Atmosphere } from "./Atmosphere";
import { NeonPulse } from "./NeonPulse";
import { StarField } from "./StarField";
import { DarkVeilShader } from "./components/DarkVeilShader";
import { AuroraShader } from "./components/AuroraShader";
import { VisualMusicShader } from "./components/VisualMusicShader";
import { VerticalCaptions } from "./VerticalCaptions";
import { resolveSrc } from "../utils";
import React, { useEffect, useState } from "react";
import { parseSrt } from "@remotion/captions";
import type { Caption } from "@remotion/captions";
import { SongInfo } from "./SongInfo";

export const AudioViz: React.FC<AudioVizProps> = ({
  audioSrc,
  srtSrc,
  fontFamily,
  fontSize,
  backgroundType,
  coverImg,
  songTitle,
  artistName,
  description,
}) => {
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [handle] = useState(() => delayRender());
  const [captions, setCaptions] = useState<Caption[] | null>(null);

  useEffect(() => {
    const fetchCaptions = async () => {
      try {
        const response = await fetch(resolveSrc(srtSrc));
        const text = await response.text();
        const parsed = parseSrt({ input: text });
        setCaptions(parsed.captions);
        continueRender(handle);
      } catch (e) {
        cancelRender(e);
      }
    };
    fetchCaptions();
  }, [srtSrc, handle, continueRender, cancelRender]);

  const renderBackground = () => {
    switch (backgroundType) {
      case "NeonPulse":
        return <NeonPulse audioSrc={audioSrc} />;
      case "StarField":
        return <StarField audioSrc={audioSrc} />;
      case "DarkVeil":
        return <DarkVeilShader audioSrc={audioSrc} />;
      case "AuroraShader":
        return <AuroraShader audioSrc={audioSrc} />;
      case "VisualMusic":
        return <VisualMusicShader audioSrc={audioSrc} />;
      case "Aurora":
      default:
        return <Atmosphere audioSrc={audioSrc} />;
    }
  };

  return (
    <AbsoluteFill className="bg-black">
      <Audio src={resolveSrc(audioSrc)} />
      {renderBackground()}

      <SongInfo
        coverImg={coverImg}
        songTitle={songTitle}
        artistName={artistName}
        description={description}
        captions={captions}
      />

      <VerticalCaptions
        srtSrc={srtSrc}
        fontFamily={fontFamily}
        fontSize={fontSize}
      />
    </AbsoluteFill>
  );
};
