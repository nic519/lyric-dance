"use client";

import { Player } from "@remotion/player";
import type { NextPage } from "next";
import {
  defaultMyCompProps,
  DURATION_IN_FRAMES,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "../../../types/constants";
import { Main } from "../../remotion/MyComp/Main";

const MyCompPage: NextPage = () => {
  return (
    <div className="max-w-screen-md m-auto mb-5">
      <div className="overflow-hidden rounded-geist shadow-[0_0_200px_rgba(0,0,0,0.15)] mb-10 mt-16">
        <Player
          component={Main}
          inputProps={defaultMyCompProps}
          durationInFrames={DURATION_IN_FRAMES}
          fps={VIDEO_FPS}
          compositionHeight={VIDEO_HEIGHT}
          compositionWidth={VIDEO_WIDTH}
          acknowledgeRemotionLicense
          style={{
            width: "100%",
            aspectRatio: `${VIDEO_WIDTH} / ${VIDEO_HEIGHT}`,
            margin: "0 auto",
          }}
          controls
          autoPlay
          loop
          initiallyMuted
        />
      </div>
    </div>
  );
};

export default MyCompPage;
