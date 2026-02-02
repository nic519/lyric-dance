import { z } from "zod";

export const audioVizSchema = z.object({
  audioSrc: z.string(),
  srtSrc: z.string(),
  fontFamily: z.string(),
  fontSize: z.number(),
  backgroundType: z.enum(["Aurora", "NeonPulse", "StarField", "GradientWaves"]),
});

export type AudioVizProps = z.infer<typeof audioVizSchema>;
