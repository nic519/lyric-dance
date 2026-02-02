"use client";

import { Player } from "@remotion/player";
import type { NextPage } from "next";
import { useMemo } from "react";
import { VIDEO_FPS } from "../../types/constants";
import { Spacing } from "../components/Spacing";
import { Tips } from "../components/Tips";
import { AudioViz } from "../remotion/AudioViz/AudioViz";

const Home: NextPage = () => {
  const inputProps = useMemo(() => {
    return {
      audioSrc: "demo/demo.mp3",
      srtSrc: "demo/demo.srt",
      background: {
        from: "#1a2a6c",
        to: "#0b1020",
      },
    };
  }, []);

  return (
    <div>
      <div className="max-w-screen-md m-auto mb-5">
        <div className="overflow-hidden rounded-geist shadow-[0_0_200px_rgba(0,0,0,0.15)] mb-10 mt-16">
          <Player
            component={AudioViz}
            inputProps={inputProps}
            durationInFrames={30 * 10}
            fps={VIDEO_FPS}
            compositionHeight={1920}
            compositionWidth={1080}
            acknowledgeRemotionLicense
            style={{
              width: "100%",
              aspectRatio: "9/16",
              maxWidth: "400px",
              margin: "0 auto",
            }}
            controls
            autoPlay
            loop
            initiallyMuted
          />
        </div>
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold mb-2">Dev Mode</h2>
          <p className="text-gray-500">
            To view the full Studio with timeline and accurate duration:
          </p>
          <code className="bg-gray-100 px-2 py-1 rounded mt-2 block w-fit mx-auto">bun run remotion</code>
        </div>
        <Spacing></Spacing>
        <Tips></Tips>
      </div>
    </div>
  );
};

export default Home;
