import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadNotoSansSC } from "@remotion/google-fonts/NotoSansSC";
import { loadFont as loadRoboto } from "@remotion/google-fonts/Roboto";
import { loadFont as loadOpenSans } from "@remotion/google-fonts/OpenSans";
// 新增的中文字体
import { loadFont as loadMaShanZheng } from "@remotion/google-fonts/MaShanZheng";
import { loadFont as loadZCOOLKuaiLe } from "@remotion/google-fonts/ZCOOLKuaiLe";
import { loadFont as loadZCOOLQingKeHuangYou } from "@remotion/google-fonts/ZCOOLQingKeHuangYou";
import { loadFont as loadLongCang } from "@remotion/google-fonts/LongCang";
import { loadFont as loadZhiMangXing } from "@remotion/google-fonts/ZhiMangXing";
import { loadFont as loadNotoSerifSC } from "@remotion/google-fonts/NotoSerifSC";

let fontsLoaded = false;

export const loadFonts = () => {
  if (fontsLoaded) return;

  const fonts = [
    loadInter(),
    loadNotoSansSC(),
    loadRoboto(),
    loadOpenSans(),
    loadMaShanZheng(),
    loadZCOOLKuaiLe(),
    loadZCOOLQingKeHuangYou(),
    loadLongCang(),
    loadZhiMangXing(),
    loadNotoSerifSC(),
  ];

  fontsLoaded = true;
  return fonts;
};
