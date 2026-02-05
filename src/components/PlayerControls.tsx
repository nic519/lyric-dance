import React, { useEffect, useRef, useState } from "react";
import { PlayerRef } from "@remotion/player";
import { Waveform } from "./Waveform";

interface PlayerControlsProps {
  playerRef: React.RefObject<PlayerRef>;
  audioSrc: string;
  durationInFrames: number;
  fps: number;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  playerRef,
  audioSrc,
  durationInFrames,
  fps,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Sync state with player
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onFrameUpdate = (e: { frame: number }) => {
      if (!isDragging) {
        setCurrentFrame(e.frame);
      }
    };
    
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    player.addEventListener("frameupdate", onFrameUpdate);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);

    return () => {
      player.removeEventListener("frameupdate", onFrameUpdate);
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
    };
  }, [playerRef, isDragging]);

  const togglePlay = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pause();
      } else {
        playerRef.current.play();
      }
    }
  };

  const seekToPosition = (clientX: number) => {
    if (!progressBarRef.current || !playerRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const clampedX = Math.max(0, Math.min(x, rect.width));
    const percentage = clampedX / rect.width;
    const frame = Math.floor(percentage * durationInFrames);
    
    playerRef.current.seekTo(frame);
    setCurrentFrame(frame);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    seekToPosition(e.clientX);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      seekToPosition(moveEvent.clientX);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const progress = Math.min(100, Math.max(0, (currentFrame / durationInFrames) * 100));
  
  const formatTime = (frame: number) => {
    const totalSeconds = Math.floor(frame / fps);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-[360px] mt-6 flex flex-col gap-3">
      {/* Waveform & Progress */}
      <div 
        ref={progressBarRef}
        className="relative h-12 bg-white/5 rounded-md cursor-pointer overflow-hidden group border border-white/5 hover:border-white/10 transition-colors"
        onMouseDown={handleMouseDown}
      >
        {/* Static Waveform Background */}
        <div className="absolute inset-0 opacity-40">
           <Waveform 
             audioSrc={audioSrc} 
             width={360}
             height={48} 
             color="#22d3ee"
             className="w-full h-full" 
             durationInSeconds={durationInFrames / fps}
           />
        </div>
        
        {/* Progress Overlay */}
        <div 
          className="absolute inset-y-0 left-0 bg-cyan-500/10 border-r border-cyan-500/50 transition-none"
          style={{ width: `${progress}%` }} 
        />
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
           <button 
             onClick={togglePlay}
             className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500 text-black hover:bg-cyan-400 transition-colors shadow-[0_0_10px_rgba(34,211,238,0.3)]"
           >
             {isPlaying ? (
               <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
             ) : (
               <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5"><path d="M5 3l14 9-14 9V3z" /></svg>
             )}
           </button>
           
           <div className="flex flex-col">
             <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Playback</span>
             <div className="font-mono text-xs text-slate-300">
               <span>{formatTime(currentFrame)}</span>
               <span className="mx-1 text-slate-600">/</span>
               <span>{formatTime(durationInFrames)}</span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
