"use client";

import { Player } from "@remotion/player";
import type { NextPage } from "next";
import { useMemo, useState } from "react";
import {
  defaultMyCompProps,
  DURATION_IN_FRAMES,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "../../types/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { AudioViz } from "../remotion/AudioViz/AudioViz";
import { Main } from "../remotion/MyComp/Main";

const Home: NextPage = () => {
  const [activeProjectId, setActiveProjectId] = useState("AudioViz");

  const [audioSrc, setAudioSrc] = useState("demo/demo.mp3");
  const [srtSrc, setSrtSrc] = useState("demo/demo.srt");
  const [fontFamily, setFontFamily] = useState("'Noto Sans SC', sans-serif");
  const [fontSize, setFontSize] = useState(80);

  const audioVizInputProps = useMemo(() => {
    return {
      audioSrc,
      srtSrc,
      fontFamily,
      fontSize,
      background: {
        from: "#1a2a6c",
        to: "#0b1020",
      },
    };
  }, [audioSrc, fontFamily, fontSize, srtSrc]);

  const fontOptions = [
    { value: "'Noto Sans SC', sans-serif", label: "Noto Sans SC" },
    { value: "Inter, sans-serif", label: "Inter" },
    { value: "system-ui, sans-serif", label: "System UI" },
  ];
  const fontSizeOptions = [56, 64, 72, 80, 96];

  return (
    <div className="flex h-screen w-full flex-col bg-[#050505] text-slate-200 selection:bg-cyan-500/30">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#0A0A0A] px-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
          <span className="font-mono text-sm font-bold tracking-wider text-slate-100">
            REMOTION<span className="text-white/40">STUDIO</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Ready
          </span>
          <a
            href="https://www.remotion.dev/docs"
            target="_blank"
            rel="noreferrer"
            className="hover:text-slate-300 transition-colors"
          >
            DOCS
          </a>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left: Preview Area */}
        <div className="relative flex flex-1 flex-col items-center justify-center bg-[#030303] p-8">
          {/* Grid Background Effect */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_50%,#0A0A0A_0%,transparent_100%)]" />

          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-1 shadow-2xl shadow-black/50 ring-1 ring-white/5">
              <div className="overflow-hidden rounded-lg">
                {activeProjectId === "AudioViz" ? (
                  <Player
                    component={AudioViz}
                    inputProps={audioVizInputProps}
                    durationInFrames={30 * 10}
                    fps={VIDEO_FPS}
                    compositionHeight={1920}
                    compositionWidth={1080}
                    acknowledgeRemotionLicense
                    style={{
                      width: "360px",
                      height: "640px",
                    }}
                    controls
                    autoPlay
                    loop
                    initiallyMuted
                  />
                ) : (
                  <Player
                    component={Main}
                    inputProps={defaultMyCompProps}
                    durationInFrames={DURATION_IN_FRAMES}
                    fps={VIDEO_FPS}
                    compositionHeight={VIDEO_HEIGHT}
                    compositionWidth={VIDEO_WIDTH}
                    acknowledgeRemotionLicense
                    style={{
                      width: "640px",
                      aspectRatio: `${VIDEO_WIDTH} / ${VIDEO_HEIGHT}`,
                    }}
                    controls
                    autoPlay
                    loop
                    initiallyMuted
                  />
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1 text-[10px] text-slate-500 backdrop-blur">
              <span>{activeProjectId === "AudioViz" ? "1080x1920" : `${VIDEO_WIDTH}x${VIDEO_HEIGHT}`}</span>
              <span className="h-3 w-px bg-white/10" />
              <span>{VIDEO_FPS} FPS</span>
            </div>
          </div>
        </div>

        {/* Right: Controls Panel */}
        <div className="w-[400px] shrink-0 overflow-y-auto border-l border-white/10 bg-[#0A0A0A]">
          <div className="p-6">
            <Tabs value={activeProjectId} onValueChange={setActiveProjectId} className="w-full">
              <div className="mb-8">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Project
                </div>
                <TabsList className="h-10 w-full rounded-lg border border-white/10 bg-white/5 p-1">
                  <TabsTrigger
                    value="AudioViz"
                    className="flex-1 rounded-md text-xs data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400 data-[state=active]:shadow-none hover:text-slate-300"
                  >
                    AudioViz
                  </TabsTrigger>
                  <TabsTrigger
                    value="MyComp"
                    className="flex-1 rounded-md text-xs data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400 data-[state=active]:shadow-none hover:text-slate-300"
                  >
                    MyComp
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="AudioViz" className="mt-0 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Configuration Group */}
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Configuration
                    </span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-400">Audio Source</Label>
                      <Input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAudioSrc(URL.createObjectURL(file));
                          }
                        }}
                        className="h-9 cursor-pointer border-white/10 bg-white/5 text-xs text-slate-300 file:mr-4 file:mt-0.5 file:cursor-pointer file:rounded-full file:border-0 file:bg-cyan-500/10 file:px-3 file:py-0.5 file:text-[10px] file:font-bold file:uppercase file:tracking-wider file:text-cyan-400 hover:bg-white/10 hover:file:bg-cyan-500/20"
                      />
                      <div className="text-[10px] text-slate-600 truncate px-1">
                        Current: {audioSrc.startsWith("blob:") ? "Uploaded File" : audioSrc}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-400">Subtitle Source (.srt)</Label>
                      <Input
                        type="file"
                        accept=".srt"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSrtSrc(URL.createObjectURL(file));
                          }
                        }}
                        className="h-9 cursor-pointer border-white/10 bg-white/5 text-xs text-slate-300 file:mr-4 file:mt-0.5 file:cursor-pointer file:rounded-full file:border-0 file:bg-cyan-500/10 file:px-3 file:py-0.5 file:text-[10px] file:font-bold file:uppercase file:tracking-wider file:text-cyan-400 hover:bg-white/10 hover:file:bg-cyan-500/20"
                      />
                      <div className="text-[10px] text-slate-600 truncate px-1">
                        Current: {srtSrc.startsWith("blob:") ? "Uploaded File" : srtSrc}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Appearance Group */}
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Appearance
                    </span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-400">Font Family</Label>
                      <Select value={fontFamily} onValueChange={setFontFamily}>
                        <SelectTrigger className="border-white/10 bg-white/5 text-slate-300 hover:border-white/20 focus:ring-cyan-500/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#111] text-slate-300">
                          {fontOptions.map((f) => (
                            <SelectItem key={f.value} value={f.value} className="focus:bg-cyan-500/10 focus:text-cyan-400">
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-400">Font Size</Label>
                      <Select value={String(fontSize)} onValueChange={(v) => setFontSize(Number(v))}>
                        <SelectTrigger className="border-white/10 bg-white/5 text-slate-300 hover:border-white/20 focus:ring-cyan-500/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#111] text-slate-300">
                          {fontSizeOptions.map((s) => (
                            <SelectItem key={s} value={String(s)} className="focus:bg-cyan-500/10 focus:text-cyan-400">
                              {s}px
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="MyComp" className="mt-0">
                <div className="rounded-lg border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-slate-500">
                  <p>No configurable parameters for this composition.</p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Render Actions (Bottom of sidebar) */}
            <div className="mt-12 space-y-4">
              <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500 shadow-[0_0_8px_#22d3ee]" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-cyan-400">Development Mode</h4>
                    <p className="text-[10px] leading-relaxed text-cyan-200/60">
                      Run <code className="mx-1 rounded bg-cyan-500/10 px-1 py-0.5 font-mono text-cyan-300">bun run remotion</code> to open the full studio with timeline.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
