import { z } from "zod";
import { FONT_OPTIONS, BACKGROUND_OPTIONS } from "../../../types/options";

const fontValues = FONT_OPTIONS.map((f) => f.value) as [string, ...string[]];
const backgroundValues = BACKGROUND_OPTIONS.map((b) => b.value) as [string, ...string[]];

export const audioVizSchema = z.object({
  audioSrc: z.string(),
  srtSrc: z.string(),
  fontFamily: z.enum(fontValues),
  fontSize: z.number(),
  backgroundType: z.enum(backgroundValues),
  coverImg: z.string().optional(),
  songTitle: z.string().optional(),
  artistName: z.string().optional(),
  description: z.string().optional(),
});

export type AudioVizProps = z.infer<typeof audioVizSchema>;

export const defaultAudioVizProps: AudioVizProps = {
  audioSrc: "demo/demo.mp3",
  srtSrc: "demo/demo.srt",
  fontFamily: "'Long Cang', cursive",
  fontSize: 80,
  backgroundType: "Aurora",
  coverImg: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=600&auto=format&fit=crop",
  songTitle: "大地",
  artistName: "时光旋律站",
  description: "词：刘卓辉 曲：黄家驹",
};
