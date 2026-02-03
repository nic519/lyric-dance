'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle, Texture } from 'ogl';
import type { AudioData } from '../types/audio';

// ==========================================
// 核心配置变量 (Core Configuration Variables)
// ==========================================

/**
 * 圆点数量
 * Number of dots in the circle
 */
const DOTS_COUNT = 40;

/**
 * 圆环半径 (归一化坐标 0-1)
 * Radius of the circle
 */
const CIRCLE_RADIUS = 0.25;

/**
 * 基础亮度
 * Base brightness of the dots
 */
const BASE_BRIGHTNESS = 0.018;

/**
 * 音频平滑系数 (0-1)
 * Audio smoothing factor (higher means smoother)
 */
const SMOOTHING_FACTOR = 0.35;

/**
 * 音频响应指数 (用于非线性缩放)
 * Audio response exponent
 */
const RESPONSE_EXPONENT = 0.85;

// ==========================================
// 着色器代码 (Shader Code)
// ==========================================

/**
 * 顶点着色器
 * Vertex Shader
 * 传递纹理坐标和位置
 */
const VERTEX_SHADER = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = vec4(position, 0, 1);
}
`;

/**
 * 片元着色器
 * Fragment Shader
 * 绘制圆形频谱可视化效果
 */
const FRAGMENT_SHADER = `
precision highp float;

uniform vec3 iResolution; // 画布分辨率
uniform float iTime;      // 时间
uniform sampler2D iChannel0; // 音频数据纹理

varying vec2 vUv;

// 核心常量，与 JavaScript 中的配置保持一致
const float dots = ${DOTS_COUNT}.;
const float radius = ${CIRCLE_RADIUS};
const float brightness = ${BASE_BRIGHTNESS};

// HSV 转 RGB 函数
// 用于生成彩虹色效果
vec3 hsv2rgb(vec3 c){ 
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0); 
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www); 
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y); 
} 

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // 归一化坐标，保持中心为 (0,0) 并纠正长宽比
    vec2 p = (fragCoord.xy - .5 * iResolution.xy) / min(iResolution.x, iResolution.y);
    vec3 c = vec3(0.0, 0.0, 0.08); // 背景色微调
        
    // 遍历所有圆点进行绘制
    for(int ii = 0; ii < ${DOTS_COUNT}; ii++){ 
        float i = float(ii);
        // 从纹理中读取音频音量数据
        float vol = texture2D(iChannel0, vec2((i + 0.5) / dots, 0.0)).x;
        vol = clamp(vol, 0.0, 1.0);
        // 添加基础脉动效果
        vol = max(vol, 0.06 + 0.03 * sin(iTime * 2.0 + i * 0.1));
        float b = vol * brightness;
        
        // 计算圆点位置
        float x = radius * cos(2. * 3.14159 * i / dots); 
        float y = radius * sin(2. * 3.14159 * i / dots); 
        vec2 o = vec2(x, y); 
        
        // 计算颜色 (随时间和索引变化的彩虹色)
        vec3 dotCol = hsv2rgb(vec3((i + iTime * 8.) / dots, 1., 1.0));
        
        // 计算当前像素到圆点的距离，并根据距离衰减亮度 (光晕效果)
        float d = max(length(p - o), 0.035);
        c += (b / d) * dotCol;
    } 

    // 添加圆环遮罩，使某些区域变暗或不可见
    float dist = length(p);
    float ringMask = smoothstep(0.22, 0.245, dist);
    ringMask *= (1.0 - smoothstep(0.92, 1.12, dist));
    c *= ringMask;

    // 色调映射和伽马校正
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

type OGLCacheEntry = {
    renderer: Renderer;
    program: Program;
    mesh: Mesh;
    texture: Texture;
    smoothedBins: Float32Array;
};

// 缓存 OGL 实例 (目前未使用，但保留结构)
const oglCache = new WeakMap<HTMLCanvasElement, OGLCacheEntry>();

/**
 * useCircularAudioOGL Hook
 * 创建圆形音频可视化效果
 * 
 * @param canvas - 画布元素
 * @param audioData - 音频数据
 * @param width - 宽度
 * @param height - 高度
 */
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
    // 用于平滑音频数据的缓冲区
    const smoothedBinsRef = useRef<Float32Array>(new Float32Array(DOTS_COUNT));

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

        // 创建音频数据纹理
        const texture = new Texture(gl, {
            image: new Uint8Array(DOTS_COUNT),
            width: DOTS_COUNT,
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

    // 渲染循环
    const render = useCallback((time: number, frameAudioData: AudioData) => {
        if (!rendererRef.current || !programRef.current || !meshRef.current || !textureRef.current) return;

        programRef.current.uniforms.iTime.value = time;

        if (frameAudioData.frequencyData) {
            const data = new Uint8Array(DOTS_COUNT);
            const bins = frameAudioData.frequencyData.length;

            // 处理音频数据：降采样、平滑、映射
            for (let i = 0; i < DOTS_COUNT; i++) {
                const idx = Math.floor((i / DOTS_COUNT) * bins);
                const normalized = frameAudioData.frequencyData[idx] / 255;
                // 非线性缩放，增强低音量部分的可见性
                const shaped = Math.pow(normalized, RESPONSE_EXPONENT);

                // 时间平滑 (Lerp)
                const prev = smoothedBinsRef.current[i] ?? 0;
                const next = prev + (shaped - prev) * SMOOTHING_FACTOR;

                smoothedBinsRef.current[i] = next;
                data[i] = Math.max(0, Math.min(255, Math.round(next * 255)));
            }

            // 更新纹理数据
            textureRef.current.image = data;
            textureRef.current.needsUpdate = true;
        }

        rendererRef.current.render({ scene: meshRef.current });
    }, []);

    return { render };
}
