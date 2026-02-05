import { loadFont as loadOpenSans } from "@remotion/google-fonts/OpenSans";
// 新增的中文字体
import { loadFont as loadMaShanZheng } from "@remotion/google-fonts/MaShanZheng";
import { loadFont as loadZCOOLQingKeHuangYou } from "@remotion/google-fonts/ZCOOLQingKeHuangYou";
import { loadFont as loadLongCang } from "@remotion/google-fonts/LongCang";
import { loadFont as loadZhiMangXing } from "@remotion/google-fonts/ZhiMangXing";
import { loadFont as loadKleeOne } from "@remotion/google-fonts/KleeOne";

let fontsLoaded = false;

export const loadFonts = () => {
  if (fontsLoaded) return;

  const fonts = [
    loadOpenSans(),
    loadMaShanZheng(),
    loadZCOOLQingKeHuangYou(),
    loadLongCang(),
    loadZhiMangXing(),
    loadKleeOne(),
  ];

  fontsLoaded = true;
  return fonts;
};
