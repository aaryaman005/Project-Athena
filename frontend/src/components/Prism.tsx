import React, { useEffect, useRef } from 'react';
import { Renderer, Triangle, Program, Mesh } from 'ogl';
import './Prism.css';

interface PrismProps {
    animationType?: 'rotate' | 'hover' | '3drotate';
    glow?: number;
    noise?: number;
    scale?: number;
    timeScale?: number;
}

const Prism: React.FC<PrismProps> = ({
    animationType = 'rotate',
    glow = 1,
    noise = 0.5,
    scale = 3.6,
    timeScale = 0.5
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const SCALE = Math.max(0.001, scale);
        const TS = Math.max(0, timeScale || 1);

        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const renderer = new Renderer({
            dpr,
            alpha: true,
            antialias: true
        });
        const gl = renderer.gl;

        // Ensure transparency works correctly
        gl.clearColor(0, 0, 0, 0);

        Object.assign(gl.canvas.style, {
            position: 'absolute',
            inset: '0',
            width: '100%',
            height: '100%',
            display: 'block',
            pointerEvents: 'none' // Background should never block interactions
        });
        container.appendChild(gl.canvas);

        const vertex = /* glsl */ `
            attribute vec2 position;
            varying vec2 vUv;
            void main() {
                vUv = position * 0.5 + 0.5;
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;

        const fragment = /* glsl */ `
            precision highp float;
            uniform vec2 iResolution;
            uniform float iTime;
            uniform float uGlow;
            uniform float uScale;
            uniform float uNoise;
            uniform float uTimeScale;
            uniform mat3 uRot;

            varying vec2 vUv;

            vec3 palette(float t) {
                // Tactical Purple Palette: Deep Violets to Magentas
                vec3 a = vec3(0.5, 0.0, 0.5);
                vec3 b = vec3(0.5, 0.0, 0.5);
                vec3 c = vec3(1.0, 1.0, 1.0);
                vec3 d = vec3(0.3, 0.2, 0.2);
                return a + b * cos(6.28318 * (c * t + d));
            }

            float sdOctahedron(vec3 p, float s) {
                p = abs(p);
                return (p.x + p.y + p.z - s) * 0.57735027;
            }

            void main() {
                vec2 uv = (gl_FragCoord.xy * 2.0 - iResolution.xy) / min(iResolution.y, iResolution.x);
                uv *= uScale * 0.5;

                vec3 ro = vec3(0.0, 0.0, 3.0);
                vec3 rd = normalize(vec3(uv, -1.5));
                vec3 col = vec3(0.0);

                float t = 0.0;
                for (int i = 0; i < 64; i++) {
                    vec3 p = ro + rd * t;
                    p = uRot * p;
                    
                    float d = sdOctahedron(p, 1.5);
                    
                    t += d * 0.5;
                    
                    if (d < 0.001 || t > 10.0) break;

                    // Neon Glow Accumulation
                    float glow = 0.01 / (d + 0.02);
                    col += palette(length(p) * 0.1 + iTime * uTimeScale * 0.2) * glow * uGlow;
                }

                // Add subtle noise
                float n = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
                col += (n - 0.5) * uNoise * 0.1;

                gl_FragColor = vec4(col, clamp(length(col), 0.0, 1.0));
            }
        `;

        const geometry = new Triangle(gl);
        const program = new Program(gl, {
            vertex,
            fragment,
            uniforms: {
                iResolution: { value: [0, 0] },
                iTime: { value: 0 },
                uGlow: { value: glow },
                uScale: { value: SCALE },
                uNoise: { value: noise },
                uTimeScale: { value: TS },
                uRot: { value: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]) }
            },
            transparent: true
        });
        const mesh = new Mesh(gl, { geometry, program });

        const resize = () => {
            const w = container.clientWidth || 1;
            const h = container.clientHeight || 1;
            renderer.setSize(w, h);
            program.uniforms.iResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight];
        };
        const ro = new ResizeObserver(resize);
        ro.observe(container);
        resize();

        let raf = 0;
        const t0 = performance.now();
        const rotBuf = new Float32Array(9);

        const render = (now: number) => {
            const time = (now - t0) * 0.001;
            program.uniforms.iTime.value = time;

            // Rotation logic
            const angle = time * TS * 0.5;
            const c = Math.cos(angle);
            const s = Math.sin(angle);

            // Rotate around Y axis for simple elegant effect
            rotBuf[0] = c; rotBuf[1] = 0; rotBuf[2] = s;
            rotBuf[3] = 0; rotBuf[4] = 1; rotBuf[5] = 0;
            rotBuf[6] = -s; rotBuf[7] = 0; rotBuf[8] = c;

            program.uniforms.uRot.value = rotBuf;

            renderer.render({ scene: mesh });
            raf = requestAnimationFrame(render);
        };
        raf = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            if (gl.canvas.parentElement === container) container.removeChild(gl.canvas);
        };
    }, [scale, timeScale, glow, noise, animationType]);

    return <div className="prism-container" ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />;
};

export default Prism;
