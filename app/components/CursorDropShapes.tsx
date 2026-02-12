"use client";

import { useEffect, useRef, useCallback } from "react";

// ── Shape types ──────────────────────────────────────────
type ShapeType = "heart" | "star" | "circle" | "diamond";

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    rotationSpeed: number;
    size: number;
    opacity: number;
    life: number;
    maxLife: number;
    shape: ShapeType;
    color: string;
    active: boolean;
    gravity: number;
}

// ── Config ──────────────────────────────────────────────
const POOL_SIZE = 80;
const SPAWN_DISTANCE = 18; // min cursor travel before spawning
const SPAWN_COUNT = 2; // particles per spawn
const COLORS = [
    "#D7263D",  // rose-deep
    "#FFB7C5",  // pink-soft
    "#FFD166",  // gold
    "#ff6b8a",  // warm pink
    "#ff9eb5",  // light rose
    "#ffc2d1",  // baby pink
];
const SHAPES: ShapeType[] = ["heart", "star", "circle", "diamond"];

// ── Drawing helpers (no DOM, pure canvas) ───────────────
function drawHeart(ctx: CanvasRenderingContext2D, size: number) {
    const s = size * 0.5;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.3);
    ctx.bezierCurveTo(-s, -s * 0.5, -s, s * 0.6, 0, s);
    ctx.bezierCurveTo(s, s * 0.6, s, -s * 0.5, 0, s * 0.3);
    ctx.closePath();
    ctx.fill();
}

function drawStar(ctx: CanvasRenderingContext2D, size: number) {
    const spikes = 5;
    const outer = size * 0.5;
    const inner = outer * 0.4;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
}

function drawCircle(ctx: CanvasRenderingContext2D, size: number) {
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
}

function drawDiamond(ctx: CanvasRenderingContext2D, size: number) {
    const s = size * 0.45;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.6, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s * 0.6, 0);
    ctx.closePath();
    ctx.fill();
}

const SHAPE_DRAW: Record<ShapeType, (ctx: CanvasRenderingContext2D, size: number) => void> = {
    heart: drawHeart,
    star: drawStar,
    circle: drawCircle,
    diamond: drawDiamond,
};

export default function CursorDropShapes() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const poolRef = useRef<Particle[]>([]);
    const lastPosRef = useRef({ x: -1000, y: -1000 });
    const rafRef = useRef<number>(0);
    const dprRef = useRef(1);
    const mouseActiveRef = useRef(false);

    // ── Initialize pool ──────────────────────────────────
    const initPool = useCallback(() => {
        const pool: Particle[] = [];
        for (let i = 0; i < POOL_SIZE; i++) {
            pool.push({
                x: 0, y: 0, vx: 0, vy: 0,
                rotation: 0, rotationSpeed: 0,
                size: 0, opacity: 0,
                life: 0, maxLife: 0,
                shape: "heart", color: "#fff",
                active: false, gravity: 0,
            });
        }
        poolRef.current = pool;
    }, []);

    // ── Get inactive particle from pool ──────────────────
    const getParticle = useCallback((): Particle | null => {
        const pool = poolRef.current;
        for (let i = 0; i < pool.length; i++) {
            if (!pool[i].active) return pool[i];
        }
        return null;
    }, []);

    // ── Spawn particles at position ──────────────────────
    const spawnAt = useCallback((x: number, y: number) => {
        for (let i = 0; i < SPAWN_COUNT; i++) {
            const p = getParticle();
            if (!p) return;

            p.active = true;
            p.x = x + (Math.random() - 0.5) * 10;
            p.y = y + (Math.random() - 0.5) * 6;
            p.vx = (Math.random() - 0.5) * 1.8;
            p.vy = Math.random() * -0.8 + 0.3; // slight upward then gravity pulls down
            p.rotation = Math.random() * Math.PI * 2;
            p.rotationSpeed = (Math.random() - 0.5) * 0.12;
            p.size = 6 + Math.random() * 10;
            p.opacity = 0.7 + Math.random() * 0.3;
            p.life = 0;
            p.maxLife = 50 + Math.random() * 40; // frames (~0.8-1.5s at 60fps)
            p.shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
            p.color = COLORS[Math.floor(Math.random() * COLORS.length)];
            p.gravity = 0.06 + Math.random() * 0.04;
        }
    }, [getParticle]);

    // ── Animation loop ───────────────────────────────────
    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = dprRef.current;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const pool = poolRef.current;
        let hasActive = false;

        for (let i = 0; i < pool.length; i++) {
            const p = pool[i];
            if (!p.active) continue;
            hasActive = true;

            // Physics
            p.vy += p.gravity; // gravity pulls down
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.rotationSpeed;
            p.life++;

            // Fade as life progresses
            const lifeRatio = p.life / p.maxLife;
            p.opacity = Math.max(0, (1 - lifeRatio) * 0.85);

            // Kill when expired or off screen
            if (p.life >= p.maxLife || p.y > canvas.height / dpr + 20) {
                p.active = false;
                continue;
            }

            // Draw
            ctx.save();
            ctx.translate(p.x * dpr, p.y * dpr);
            ctx.rotate(p.rotation);
            ctx.scale(dpr, dpr);
            ctx.globalAlpha = p.opacity;
            ctx.fillStyle = p.color;

            SHAPE_DRAW[p.shape](ctx, p.size);
            ctx.restore();
        }

        // Only keep the loop running if there are active particles or mouse is active
        if (hasActive || mouseActiveRef.current) {
            rafRef.current = requestAnimationFrame(animate);
        } else {
            rafRef.current = 0;
        }
    }, []);

    // ── Start loop if not running ────────────────────────
    const ensureLoop = useCallback(() => {
        if (!rafRef.current) {
            rafRef.current = requestAnimationFrame(animate);
        }
    }, [animate]);

    // ── Setup ────────────────────────────────────────────
    useEffect(() => {
        // Touch device check
        const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
        if (isTouch) return;

        // Reduced motion check
        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReduced) return;

        initPool();

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Resize handler
        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // cap at 1.5x for perf on low-end
            dprRef.current = dpr;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
        };
        resize();
        window.addEventListener("resize", resize);

        // Mouse handler
        const handleMove = (e: MouseEvent) => {
            const dx = e.clientX - lastPosRef.current.x;
            const dy = e.clientY - lastPosRef.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > SPAWN_DISTANCE) {
                lastPosRef.current = { x: e.clientX, y: e.clientY };
                spawnAt(e.clientX, e.clientY);
                mouseActiveRef.current = true;
                ensureLoop();
            }
        };

        const handleLeave = () => {
            mouseActiveRef.current = false;
        };

        const handleEnter = () => {
            mouseActiveRef.current = true;
            ensureLoop();
        };

        window.addEventListener("mousemove", handleMove, { passive: true });
        document.addEventListener("mouseleave", handleLeave);
        document.addEventListener("mouseenter", handleEnter);

        return () => {
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", handleMove);
            document.removeEventListener("mouseleave", handleLeave);
            document.removeEventListener("mouseenter", handleEnter);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [initPool, spawnAt, ensureLoop]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none"
            style={{ zIndex: 9997 }}
            aria-hidden="true"
        />
    );
}
