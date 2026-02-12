"use client";

import { useEffect, useCallback, useRef } from "react";

export default function SparkleTrail() {
    const lastPos = useRef({ x: 0, y: 0 });
    const throttle = useRef(false);

    const createSparkle = useCallback((x: number, y: number) => {
        const el = document.createElement("div");
        el.className = "sparkle";
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 600);
    }, []);

    useEffect(() => {
        // Respect reduced motion preference
        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;
        if (prefersReducedMotion) return;

        const handleMove = (e: MouseEvent) => {
            if (throttle.current) return;

            const dx = e.clientX - lastPos.current.x;
            const dy = e.clientY - lastPos.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 20) return; // Only sparkle when moving enough

            lastPos.current = { x: e.clientX, y: e.clientY };
            throttle.current = true;

            createSparkle(
                e.clientX + (Math.random() - 0.5) * 12,
                e.clientY + (Math.random() - 0.5) * 12
            );

            setTimeout(() => {
                throttle.current = false;
            }, 50);
        };

        window.addEventListener("mousemove", handleMove);
        return () => window.removeEventListener("mousemove", handleMove);
    }, [createSparkle]);

    return null; // This component only adds side effects
}
