import { Composition, staticFile } from "remotion";
import { loadFonts } from "./load-fonts";
import { Main } from "./MyComp/Main";

loadFonts();
import {
  COMP_NAME,
  defaultMyCompProps,
  DURATION_IN_FRAMES,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "../../types/constants";
import { NextLogo } from "./MyComp/NextLogo";
import { AudioViz } from "./AudioViz/AudioViz";
import { audioVizSchema } from "./AudioViz/schema";
import { getAudioDurationInSeconds } from "@remotion/media-utils";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id={COMP_NAME}
        component={Main}
        durationInFrames={DURATION_IN_FRAMES}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={defaultMyCompProps}
      />
      <Composition
        id="NextLogo"
        component={NextLogo}
        durationInFrames={300}
        fps={30}
        width={140}
        height={140}
        defaultProps={{
          outProgress: 0,
        }}
      />
      <Composition
        id="AudioViz"
        component={AudioViz}
        durationInFrames={1}
        fps={VIDEO_FPS}
        width={1080}
        height={1920}
        schema={audioVizSchema}
        defaultProps={{
          audioSrc: "demo/demo.mp3",
          srtSrc: "demo/demo.srt",
          fontFamily: "Noto Sans SC",
          fontSize: 80,
          backgroundType: "Aurora" as const,
          coverImg: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=600&auto=format&fit=crop",
          songTitle: "Midnight Dreams",
          artistName: "Cosmic Voyager",
          description: "A journey through the stars and beyond.",
        }}
        calculateMetadata={async ({ props }) => {
          const durationInSeconds = await getAudioDurationInSeconds(
            staticFile(props.audioSrc),
          );
          return {
            durationInFrames: Math.ceil(durationInSeconds * VIDEO_FPS),
            width: 1080,
            height: 1920,
          };
        }}
      />
    </>
  );
};
