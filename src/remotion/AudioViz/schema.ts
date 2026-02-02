import { z } from "zod";

export const audioVizSchema = z.object({
  audioSrc: z.string(),
  srtSrc: z.string(),
  fontFamily: z.string().optional(),
  fontSize: z.number().optional(),
  backgroundType: z.enum(["Aurora", "NeonPulse", "StarField", "GradientWaves"]).optional(),
});

export type AudioVizProps = z.infer<typeof audioVizSchema>;
