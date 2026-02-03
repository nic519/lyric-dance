import { z } from "zod";

export const audioVizSchema = z.object({
  audioSrc: z.string(),
  srtSrc: z.string(),
  fontFamily: z.string(),
  fontSize: z.number(),
  backgroundType: z.enum(["Aurora", "NeonPulse", "StarField", "DarkVeil", "AuroraShader", "VisualMusic"]),
  coverImg: z.string().optional(),
  songTitle: z.string().optional(),
  artistName: z.string().optional(),
  description: z.string().optional(),
});

export type AudioVizProps = z.infer<typeof audioVizSchema>;

export const defaultAudioVizProps: AudioVizProps = {
  audioSrc: "demo/demo.mp3",
  srtSrc: "demo/demo.srt",
  fontFamily: "'Noto Sans SC', sans-serif",
  fontSize: 80,
  backgroundType: "Aurora",
  coverImg: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=600&auto=format&fit=crop",
  songTitle: "Midnight Dreams",
  artistName: "Cosmic Voyager",
  description: "A journey through the stars and beyond.",
};
