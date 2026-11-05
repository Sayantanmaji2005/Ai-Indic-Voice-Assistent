"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export function IndicaSplashLoader({ onComplete }) {
    const [isVisible, setIsVisible] = useState(true);
    const [isFadingOut, setIsFadingOut] = useState(false);
    const [revealedCount, setRevealedCount] = useState(0);
    const [isAllRevealed, setIsAllRevealed] = useState(false);
    const onCompleteRef = useRef(onComplete);
    const hasFinishedRef = useRef(false);

    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    const letters = [
        { char: "I", isAccent: false },
        { char: "N", isAccent: false },
        { char: "D", isAccent: false },
        { char: "I", isAccent: false },
        { char: "C", isAccent: false },
        { char: "A", isAccent: true },
    ];

    const finish = useCallback(() => {
        if (hasFinishedRef.current) return;
        hasFinishedRef.current = true;
        setIsFadingOut(true);
        setTimeout(() => {
            setIsVisible(false);
            if (typeof window !== "undefined") {
                try {
                    sessionStorage.setItem("indica_splash_shown", "1");
                } catch {
                    // ignore
                }
            }
            if (onCompleteRef.current) {
                onCompleteRef.current();
            }
        }, 250);
    }, []);

    useEffect(() => {
        // If already shown in this tab session, skip immediately
        if (typeof window !== "undefined") {
            try {
                if (sessionStorage.getItem("indica_splash_shown") === "1") {
                    setIsVisible(false);
                    if (onCompleteRef.current) onCompleteRef.current();
                    return;
                }
            } catch {
                // ignore
            }
        }

        const timers = [];

        // Fast & smooth letter-by-letter reveal (total ~600ms)
        letters.forEach((_, index) => {
            const t = setTimeout(() => {
                setRevealedCount(index + 1);
            }, 80 + index * 90); // 80ms, 170ms, 260ms, 350ms, 440ms, 530ms
            timers.push(t);
        });

        // Mark all letters complete
        const allDoneTimer = setTimeout(() => {
            setIsAllRevealed(true);
        }, 650);
        timers.push(allDoneTimer);

        // Quick clean exit
        const exitTimer = setTimeout(() => {
            finish();
        }, 1100);
        timers.push(exitTimer);

        // Absolute fail-safe: Force dismiss after 1.6s under any circumstances
        const hardSafetyTimer = setTimeout(() => {
            finish();
        }, 1600);
        timers.push(hardSafetyTimer);

        return () => {
            timers.forEach(clearTimeout);
        };
    }, [finish]); // Only depends on stable finish callback

    if (!isVisible) return null;

    return (
        <div
            className={`indica-aesthetic-splash-screen ${isFadingOut ? "aesthetic-splash-fade-out" : ""}`}
            onClick={finish}
            role="button"
            tabIndex={0}
            title="Click to skip"
            aria-label="Indica loading - Click to skip"
        >
            {/* Subtle 2D Dot Texture Background */}
            <div className="aesthetic-splash-grid-bg" />

            {/* Ambient warm sunset glow aura behind the brand name */}
            <div className="aesthetic-splash-ambient-glow" />

            {/* Main Container: The big designer brand name */}
            <div className="aesthetic-splash-content">
                <h1 className={`aesthetic-splash-brand-title ${isAllRevealed ? "brand-title-all-revealed" : ""}`}>
                    {letters.map((item, index) => {
                        const isRevealed = index < revealedCount;
                        const isCurrent = index === revealedCount - 1;
                        return (
                            <span
                                key={index}
                                className={`aesthetic-splash-letter ${
                                    isRevealed ? "letter-revealed" : "letter-hidden"
                                } ${isCurrent ? "letter-current-pop" : ""} ${
                                    item.isAccent ? "letter-accent-terracotta" : "letter-navy"
                                }`}
                            >
                                {item.char}
                            </span>
                        );
                    })}
                </h1>
            </div>
        </div>
    );
}
