'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle, Texture } from 'ogl';
import type { AudioData } from '../types/audio';

type OGLCacheEntry = {
    renderer: Renderer;
    program: Program;
    mesh: Mesh;
    texture: Texture;
    smoothedBins: Float32Array;
};

const oglCache = new WeakMap<HTMLCanvasElement, OGLCacheEntry>();

const VERTEX_SHADER = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = vec4(position, 0, 1);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform vec3 iResolution;
uniform float iTime;
uniform sampler2D iChannel0;

varying vec2 vUv;

const float dots = 40.;
const float radius = 0.25;
const float brightness = 0.018;

vec3 hsv2rgb(vec3 c){ 
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0); 
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www); 
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y); 
} 

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 p = (fragCoord.xy - .5 * iResolution.xy) / min(iResolution.x, iResolution.y);
    vec3 c = vec3(0.0, 0.0, 0.08);
        
    for(int ii = 0; ii < 40; ii++){ 
        float i = float(ii);
        float vol = texture2D(iChannel0, vec2((i + 0.5) / dots, 0.0)).x;
        vol = clamp(vol, 0.0, 1.0);
        vol = max(vol, 0.06 + 0.03 * sin(iTime * 2.0 + i * 0.1));
        float b = vol * brightness;
        
        float x = radius * cos(2. * 3.14159 * i / dots); 
        float y = radius * sin(2. * 3.14159 * i / dots); 
        vec2 o = vec2(x, y); 
        
        vec3 dotCol = hsv2rgb(vec3((i + iTime * 8.) / dots, 1., 1.0));
        float d = max(length(p - o), 0.035);
        c += (b / d) * dotCol;
    } 

    float dist = length(p);
    float ringMask = smoothstep(0.22, 0.245, dist);
    ringMask *= (1.0 - smoothstep(0.92, 1.12, dist));
    c *= ringMask;

    c = 1.0 - exp(-c * 1.15);
    c = pow(c, vec3(1.0 / 2.2));

    fragColor = vec4(c, 1.0);
}

void main() {
    vec4 fragColor;
    mainImage(fragColor, gl_FragCoord.xy);
    gl_FragColor = fragColor;
}
`;

export function useCircularAudioOGL(
    canvas: HTMLCanvasElement | null,
    audioData: AudioData,
    width: number,
    height: number
) {
    const rendererRef = useRef<Renderer | null>(null);
    const programRef = useRef<Program | null>(null);
    const meshRef = useRef<Mesh | null>(null);
    const textureRef = useRef<Texture | null>(null);
    const smoothedBinsRef = useRef<Float32Array>(new Float32Array(40));

    useEffect(() => {
        if (!canvas) return;

        const renderer = new Renderer({
            canvas,
            width,
            height,
            dpr: 1, // Fix dpr to 1 for consistent Remotion rendering
            alpha: true,
            webgl: 1
        });
        const gl = renderer.gl;
        gl.clearColor(0, 0, 0, 1);

        const geometry = new Triangle(gl);

        const texture = new Texture(gl, {
            image: new Uint8Array(40),
            width: 40,
            height: 1,
            format: gl.LUMINANCE,
            generateMipmaps: false,
            minFilter: gl.LINEAR,
            magFilter: gl.LINEAR,
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE,
        });

        const program = new Program(gl, {
            vertex: VERTEX_SHADER,
            fragment: FRAGMENT_SHADER,
            uniforms: {
                iTime: { value: 0 },
                iResolution: { value: [width, height, 1] },
                iChannel0: { value: texture },
            },
        });

        const mesh = new Mesh(gl, { geometry, program });

        rendererRef.current = renderer;
        programRef.current = program;
        meshRef.current = mesh;
        textureRef.current = texture;

        const resize = () => {
            renderer.setSize(width, height);
            program.uniforms.iResolution.value = [gl.canvas.width, gl.canvas.height, 1];
        };
        resize();

        return () => {
            // Cleanup
        };
    }, [canvas, width, height]);

    const render = useCallback((time: number, frameAudioData: AudioData) => {
        if (!rendererRef.current || !programRef.current || !meshRef.current || !textureRef.current) return;

        programRef.current.uniforms.iTime.value = time;

        if (frameAudioData.frequencyData) {
            const data = new Uint8Array(40);
            const bins = frameAudioData.frequencyData.length;
            for (let i = 0; i < 40; i++) {
                const idx = Math.floor((i / 40) * bins);
                const normalized = frameAudioData.frequencyData[idx] / 255;
                const shaped = Math.pow(normalized, 0.85);
                const prev = smoothedBinsRef.current[i] ?? 0;
                const next = prev + (shaped - prev) * 0.35;
                smoothedBinsRef.current[i] = next;
                data[i] = Math.max(0, Math.min(255, Math.round(next * 255)));
            }
            textureRef.current.image = data;
            textureRef.current.needsUpdate = true;
        }

        rendererRef.current.render({ scene: meshRef.current });
    }, []);

    return { render };
}
