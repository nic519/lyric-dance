"use client";

import { Player } from "@remotion/player";
import type { NextPage } from "next";
import { useMemo, useState } from "react";
import { VIDEO_FPS } from "../../../types/constants";
import { AudioViz } from "../../remotion/AudioViz/AudioViz";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

const AudioVizPage: NextPage = () => {
  const [songTitle, setSongTitle] = useState("Midnight Dreams");
  const [artistName, setArtistName] = useState("Cosmic Voyager");
  const [description, setDescription] = useState("A journey through the stars and beyond.");
  const [coverImg, setCoverImg] = useState("https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=600&auto=format&fit=crop");
  const [backgroundType, setBackgroundType] = useState<"Aurora" | "NeonPulse" | "StarField" | "GradientWaves" | "CircularAudio" | "DarkVeil" | "AuroraShader" | "VisualMusic">("Aurora");

  const inputProps = useMemo(() => {
    return {
      audioSrc: "demo/demo.mp3",
      srtSrc: "demo/demo.srt",
      backgroundType,
      fontFamily: "Noto Sans SC",
      fontSize: 80,
      songTitle,
      artistName,
      description,
      coverImg,
    };
  }, [songTitle, artistName, description, coverImg, backgroundType]);

  return (
    <div className="max-w-screen-md m-auto mb-5 px-4">
      <div className="overflow-hidden rounded-geist shadow-[0_0_200px_rgba(0,0,0,0.15)] mb-10 mt-16">
        <Player
          component={AudioViz}
          inputProps={inputProps}
          durationInFrames={30 * 60} // Extended duration for testing
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

      <div className="grid gap-6 p-6 border rounded-xl bg-card text-card-foreground shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight">Customization</h2>

        <div className="grid gap-2">
          <Label htmlFor="backgroundType">Background Effect</Label>
          <Select value={backgroundType} onValueChange={(value: any) => setBackgroundType(value)}>
            <SelectTrigger id="backgroundType">
              <SelectValue placeholder="Select background" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Aurora">Atmosphere (Default)</SelectItem>
              <SelectItem value="AuroraShader">Aurora (Shader)</SelectItem>
              <SelectItem value="CircularAudio">Circular Audio (Shader)</SelectItem>
              <SelectItem value="DarkVeil">Dark Veil (Shader)</SelectItem>
              <SelectItem value="VisualMusic">Visual Music (Canvas 2D)</SelectItem>
              <SelectItem value="NeonPulse">Neon Pulse</SelectItem>
              <SelectItem value="StarField">Star Field</SelectItem>
              <SelectItem value="GradientWaves">Gradient Waves</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="songTitle">Song Title</Label>
          <Input
            id="songTitle"
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            placeholder="Enter song title"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="artistName">Artist Name</Label>
          <Input
            id="artistName"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            placeholder="Enter artist name"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter a short description"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="coverImg">Cover Image URL</Label>
          <Input
            id="coverImg"
            value={coverImg}
            onChange={(e) => setCoverImg(e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>
    </div>
  );
};

export default AudioVizPage;
