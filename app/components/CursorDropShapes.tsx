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
    bounced: boolean;    // whether it has hit the floor
    bounceCount: number; // how many times it bounced
}

// ── Config ──────────────────────────────────────────────
const POOL_SIZE = 100;
const SPAWN_DISTANCE = 16; // min cursor travel before spawning
const SPAWN_COUNT = 3; // particles per spawn
const FLOOR_MARGIN = 30; // px from bottom of viewport
const BOUNCE_DAMPING = 0.45; // energy retained after bounce (higher = bouncier)
const FLOOR_FRICTION = 0.92; // horizontal friction on floor contact
const MAX_BOUNCES = 3; // max bounces before starting to fade
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
    const viewportHeightRef = useRef(0);

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
                bounced: false, bounceCount: 0,
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
            p.x = x + (Math.random() - 0.5) * 14;
            p.y = y - 8 + (Math.random() - 0.5) * 6; // spawn slightly above cursor
            p.vx = (Math.random() - 0.5) * 2.5;
            p.vy = Math.random() * -1.5 + 0.5; // slight upward arc then gravity pulls down
            p.rotation = Math.random() * Math.PI * 2;
            p.rotationSpeed = (Math.random() - 0.5) * 0.15;
            p.size = 8 + Math.random() * 12; // bigger: 8-20px
            p.opacity = 0.85 + Math.random() * 0.15; // start nearly fully opaque
            p.life = 0;
            p.maxLife = 120 + Math.random() * 60; // longer life for bouncing (~2-3s at 60fps)
            p.shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
            p.color = COLORS[Math.floor(Math.random() * COLORS.length)];
            p.gravity = 0.08 + Math.random() * 0.05;
            p.bounced = false;
            p.bounceCount = 0;
        }
    }, [getParticle]);

    // ── Animation loop ───────────────────────────────────
    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = dprRef.current;
        const floorY = viewportHeightRef.current - FLOOR_MARGIN;
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

            // ── Floor collision & bounce ──
            if (p.y >= floorY) {
                p.y = floorY; // clamp to floor
                p.vy = -Math.abs(p.vy) * BOUNCE_DAMPING; // bounce up with energy loss
                p.vx *= FLOOR_FRICTION; // friction slows horizontal
                p.rotationSpeed *= 0.7; // slow rotation on bounce
                p.bounced = true;
                p.bounceCount++;

                // If bounce is too weak, stop vertical movement
                if (Math.abs(p.vy) < 0.5) {
                    p.vy = 0;
                    p.gravity = 0; // rest on floor
                }
            }

            // ── Opacity: stay opaque during fall, fade after bouncing ──
            if (!p.bounced) {
                // Fully opaque during fall
                p.opacity = 0.85 + Math.random() * 0.05;
            } else if (p.bounceCount >= MAX_BOUNCES || Math.abs(p.vy) < 0.5) {
                // Fade out after settling
                p.opacity *= 0.94;
            } else {
                // Slight fade during bounces
                p.opacity = Math.max(0.3, p.opacity - 0.01);
            }

            // Kill when too transparent or life expired or off-screen horizontally
            if (p.opacity < 0.03 || p.life >= p.maxLife || p.x < -50 || p.x > canvas.width / dpr + 50) {
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
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            dprRef.current = dpr;
            viewportHeightRef.current = window.innerHeight;
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
