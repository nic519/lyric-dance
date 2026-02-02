import { z } from "zod";

export const audioVizSchema = z.object({
  audioSrc: z.string(),
  srtSrc: z.string(),
  fontFamily: z.string(),
  fontSize: z.number(),
  backgroundType: z.enum(["Aurora", "NeonPulse", "StarField", "GradientWaves"]),
  coverImg: z.string().optional(),
  songTitle: z.string().optional(),
  artistName: z.string().optional(),
  description: z.string().optional(),
});

export type AudioVizProps = z.infer<typeof audioVizSchema>;
