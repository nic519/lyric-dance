import { z } from "zod";

export const audioVizSchema = z.object({
  audioSrc: z.string(),
  srtSrc: z.string(),
  fontFamily: z.string().optional(),
  fontSize: z.number().optional(),
  background: z
    .object({
      from: z.string(),
      to: z.string(),
    })
    .optional(),
});

export type AudioVizProps = z.infer<typeof audioVizSchema>;
