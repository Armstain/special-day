"use client";

import { useEffect, useRef, useCallback, createContext, useContext } from "react";
import Lenis from "lenis";
import gsap from "gsap";

interface SmoothScrollContextType {
    lenis: Lenis | null;
}

const SmoothScrollContext = createContext<SmoothScrollContextType>({ lenis: null });

export function useSmoothScroll() {
    return useContext(SmoothScrollContext);
}

interface Props {
    children: React.ReactNode;
}

/**
 * SmoothScrollProvider
 * - Integrates Lenis for silky smooth scroll feel on the viewport
 * - Syncs Lenis with GSAP's ticker for frame-perfect updates
 * - Provides the lenis instance to any child that needs it
 *
 * Note: The actual page uses horizontal GSAP-driven navigation (not native scroll),
 * so Lenis is mainly used here for:
 *   1. Smooth "feel" on wheel/trackpad events (momentum, easing)
 *   2. Syncing with GSAP ticker for consistent frame timing
 *   3. Enabling smooth scroll behavior globally
 */
export default function SmoothScrollProvider({ children }: Props) {
    const lenisRef = useRef<Lenis | null>(null);
    const rafRef = useRef<number>(0);

    const lenisUpdate = useCallback((time: number) => {
        lenisRef.current?.raf(time);
        rafRef.current = requestAnimationFrame(lenisUpdate);
    }, []);

    useEffect(() => {
        // Create Lenis with optimized settings
        const lenis = new Lenis({
            duration: 1.2,          // smooth scroll duration
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // exponential ease
            smoothWheel: true,
            touchMultiplier: 1.5,
            infinite: false,
        });

        lenisRef.current = lenis;

        // Connect Lenis to GSAP's ticker for frame sync
        gsap.ticker.add((time: number) => {
            lenis.raf(time * 1000); // GSAP time is in seconds, Lenis expects ms
        });

        // Set GSAP defaults for smooth feel
        gsap.ticker.lagSmoothing(0); // Disable lag smoothing for buttery results

        return () => {
            lenis.destroy();
            lenisRef.current = null;
            gsap.ticker.remove(lenisUpdate);
        };
    }, [lenisUpdate]);

    return (
        <SmoothScrollContext.Provider value={{ lenis: lenisRef.current }}>
            {children}
        </SmoothScrollContext.Provider>
    );
}
