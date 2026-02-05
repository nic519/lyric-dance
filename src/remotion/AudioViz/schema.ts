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
  srtSrc: "demo/demo-繁体.srt",
  fontFamily: "'TengXiangXiaoXiaoXinTiJian', sans-serif",
  fontSize: 80,
  backgroundType: "Aurora",
  coverImg: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=600&auto=format&fit=crop",
  songTitle: "长城",
  artistName: "时光旋律站",
  description: "A journey through the stars and beyond.",
};
