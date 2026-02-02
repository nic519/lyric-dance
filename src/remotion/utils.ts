import { staticFile } from "remotion";

export const resolveSrc = (src: string) => {
  if (src.startsWith("http") || src.startsWith("blob:")) {
    return src;
  }
  const normalized = src.startsWith("/") ? src.slice(1) : src;
  return staticFile(normalized);
};
