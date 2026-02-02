import { Composition, staticFile } from "remotion";
import { Main } from "./MyComp/Main";
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
          background: {
            from: "#1a2a6c",
            to: "#0b1020",
          },
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
