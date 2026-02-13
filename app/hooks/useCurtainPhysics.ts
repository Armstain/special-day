import { useRef, useCallback, RefObject } from "react";
import gsap from "gsap";

interface CurtainPhysicsOptions {
    leftRef: RefObject<HTMLDivElement | null>;
    rightRef: RefObject<HTMLDivElement | null>;
    containerRef: RefObject<HTMLDivElement | null>;
    onComplete: () => void;
    totalPullNeededRatio?: number;
    dragResistance?: number;
    autoCompleteThreshold?: number;
    curtainTravelRatio?: number;
}

export function useCurtainPhysics({
    leftRef,
    rightRef,
    containerRef,
    onComplete,
    totalPullNeededRatio = 0.55,
    dragResistance = 0.35,
    autoCompleteThreshold = 0.85,
    curtainTravelRatio = 0.52,
}: CurtainPhysicsOptions) {
    const totalProgress = useRef(0);
    const startProgress = useRef(0);
    const dragStartX = useRef(0);
    const lastClientX = useRef(0);
    const dragging = useRef(false);
    const dismissed = useRef(false);

    const velocity = useRef(0);
    const lastTime = useRef(0);

    function applyResistance(progress: number) {
        const resistanceStart = 0.65;
        if (progress <= resistanceStart) return progress;

        const excess = progress - resistanceStart;
        const range = 1 - resistanceStart;
        const normalized = excess / range;

        const eased = 1 - Math.pow(1 - normalized, 3);
        return resistanceStart + eased * range;
    }

    const applyCurtainPosition = useCallback((progress: number) => {
        if (!leftRef.current || !rightRef.current) return;

        const vw = window.innerWidth;
        const maxTravel = vw * curtainTravelRatio;
        const offset = progress * maxTravel;

        const lagOffset = offset * 0.95;

        gsap.to(leftRef.current, {
            x: -lagOffset,
            skewY: progress * 2,
            duration: 0.18,
            ease: "power2.out",
        });

        gsap.to(rightRef.current, {
            x: lagOffset,
            skewY: -progress * 2,
            duration: 0.18,
            ease: "power2.out",
        });
    }, [leftRef, rightRef, curtainTravelRatio]);

    const completeOpen = useCallback(() => {
        if (dismissed.current) return;
        dismissed.current = true;

        if (!leftRef.current || !rightRef.current || !containerRef.current) return;

        const vw = window.innerWidth;

        const tl = gsap.timeline({
            onComplete,
        });

        tl.to(leftRef.current, {
            x: -(vw * 0.6),
            duration: 1.4,
            ease: "expo.inOut",
        }, 0);

        tl.to(rightRef.current, {
            x: vw * 0.6,
            duration: 1.4,
            ease: "expo.inOut",
        }, 0);

        tl.to(containerRef.current, {
            opacity: 0,
            duration: 0.6,
        }, 1.0);
    }, [leftRef, rightRef, containerRef, onComplete]);

    const snapToProgress = useCallback(() => {
        if (!leftRef.current || !rightRef.current) return;

        const vw = window.innerWidth;
        const maxTravel = vw * curtainTravelRatio;
        const offset = totalProgress.current * maxTravel;

        gsap.to(leftRef.current, {
            x: -offset,
            duration: 0.6,
            ease: "expo.out",
        });

        gsap.to(rightRef.current, {
            x: offset,
            duration: 0.6,
            ease: "expo.out",
        });
    }, [leftRef, rightRef, curtainTravelRatio]);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (dismissed.current) return;

        dragging.current = true;
        dragStartX.current = e.clientX;
        startProgress.current = totalProgress.current;
        lastClientX.current = e.clientX;
        lastTime.current = performance.now();

        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    }, []);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!dragging.current || dismissed.current) return;

        const now = performance.now();
        const dt = now - lastTime.current;

        lastClientX.current = e.clientX;

        const dx = lastClientX.current - dragStartX.current;
        const absDx = Math.abs(dx);

        if (dt > 0) velocity.current = dx / dt;

        lastTime.current = now;

        const vw = window.innerWidth;
        const totalNeeded = vw * totalPullNeededRatio;

        const deltaProgress = (absDx * dragResistance) / totalNeeded;

        let rawProgress = startProgress.current + deltaProgress;
        rawProgress = Math.min(1, Math.max(0, rawProgress));

        const resisted = applyResistance(rawProgress);
        applyCurtainPosition(resisted);
    }, [applyCurtainPosition, totalPullNeededRatio, dragResistance]);

    const handlePointerUp = useCallback(() => {
        if (!dragging.current || dismissed.current) return;

        dragging.current = false;

        const dx = lastClientX.current - dragStartX.current;
        const absDx = Math.abs(dx);

        const vw = window.innerWidth;
        const totalNeeded = vw * totalPullNeededRatio;

        const deltaProgress = (absDx * dragResistance) / totalNeeded;

        let finalProgress = startProgress.current + deltaProgress;

        const momentumBoost = velocity.current * 0.15;
        finalProgress += momentumBoost;

        finalProgress = Math.min(1, Math.max(0, finalProgress));

        totalProgress.current = finalProgress;

        if (finalProgress >= autoCompleteThreshold) {
            completeOpen();
        } else {
            snapToProgress();
        }
    }, [completeOpen, snapToProgress, totalPullNeededRatio, dragResistance, autoCompleteThreshold]);

    return {
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        dismissed,
    };
}
