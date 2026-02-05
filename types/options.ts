
export const FONT_OPTIONS = [
  // 繁体中文优先
  { value: "'TengXiangXiaoXiaoXinTiJian', sans-serif", label: "Teng Xiang Xiao Xiao Xin Ti Jian (腾祥小小新体简)" },
  { value: "'Noto Serif TC', serif", label: "Noto Serif TC (思源宋体·繁体)" },
  { value: "'Klee One', cursive", label: "Klee One (克利字体·繁体手写)" },

  // 简体中文
  { value: "'Long Cang', cursive", label: "Long Cang (龙苍行书·简体)" },
  { value: "'Ma Shan Zheng', cursive", label: "Ma Shan Zheng (马善政毛笔·简体)" },
  { value: "'Zhi Mang Xing', cursive", label: "Zhi Mang Xing (志莽行书·简体)" },
  { value: "'ZCOOL QingKe HuangYou', sans-serif", label: "ZCOOL HuangYou (站酷黄油·简体)" },

  // 西文/通用
  { value: "Inter, sans-serif", label: "Inter" },
  { value: "Roboto, sans-serif", label: "Roboto" },
  { value: "'Open Sans', sans-serif", label: "Open Sans" },
  { value: "system-ui, sans-serif", label: "System UI" },
] as const;

export const BACKGROUND_OPTIONS = [
  { value: "Aurora", label: "Aurora (Polar Lights)" },
  { value: "NeonPulse", label: "Neon Pulse (Cyberpunk)" },
  { value: "StarField", label: "Star Field (Space)" },
  { value: "DarkVeil", label: "Dark Veil (Mysterious)" },
  { value: "AuroraShader", label: "Aurora Shader (GPU)" },
  { value: "VisualMusic", label: "Visual Music (Particles)" },
] as const;
