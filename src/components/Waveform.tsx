import { useEffect, useRef, useState } from "react";

interface WaveformProps {
  audioSrc: string;
  width?: number;
  height?: number;
  color?: string;
  className?: string;
  durationInSeconds?: number;
}

export const Waveform: React.FC<WaveformProps> = ({
  audioSrc,
  width = 600,
  height = 60,
  color = "#22d3ee", // cyan-400
  className,
  durationInSeconds,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  useEffect(() => {
    if (!audioSrc) return;

    const fetchAudio = async () => {
      try {
        const response = await fetch(audioSrc);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
        setAudioBuffer(decodedBuffer);
      } catch (error) {
        console.error("Error decoding audio data", error);
      }
    };

    fetchAudio();
  }, [audioSrc]);

  useEffect(() => {
    if (!audioBuffer || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw waveform
    const data = audioBuffer.getChannelData(0);
    
    // Calculate how many samples to visualize
    const sampleRate = audioBuffer.sampleRate;
    const samplesToDraw = durationInSeconds 
      ? Math.min(data.length, Math.floor(durationInSeconds * sampleRate))
      : data.length;
      
    const step = Math.ceil(samplesToDraw / width);
    const amp = height / 2;

    ctx.fillStyle = color;
    
    // Draw bars
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const index = (i * step) + j;
        if (index >= data.length) break;
        
        const datum = data[index];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      
      // Prevent infinite/NaN values
      if (!isFinite(min)) min = 0;
      if (!isFinite(max)) max = 0;

      // Calculate height of the bar
      const barHeight = Math.max(1, (max - min) * amp);
      // Center the bar vertically
      const y = (height - barHeight) / 2;
      
      ctx.fillRect(i, y, 1, barHeight);
    }
  }, [audioBuffer, width, height, color, durationInSeconds]);

  return <canvas ref={canvasRef} width={width} height={height} className={className} />;
};
