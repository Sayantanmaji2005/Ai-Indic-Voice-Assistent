"use client";

import { useState, useCallback } from "react";
import { Mic } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { SearchWorkspace } from "@/components/search-workspace";
import { IndicaLandingPage } from "@/components/indica-landing-page";
import { IndicaSplashLoader } from "@/components/indica-splash-loader";
import { IndicaLiveAssistant } from "@/components/indica-live-assistant";
import { useWakeWord } from "@/hooks/use-wake-word";

export default function HomePage() {
    const { isAuthenticated, isInitialized, openAuthModal } = useAuth();
    const [initialLaunchQuery, setInitialLaunchQuery] = useState(undefined);
    const [initialLaunchLang, setInitialLaunchLang] = useState(undefined);
    const [showSplash, setShowSplash] = useState(true);
    const [currentView, setCurrentView] = useState("workspace");
    const [isLiveOpen, setIsLiveOpen] = useState(false);

    // Global "Hey Indica" / "Hay Indica" wake-word activation
    const handleWakeWordTrigger = useCallback((transcript) => {
        console.log("Wake word triggered:", transcript);
        setIsLiveOpen(true);
    }, []);

    const {
        isListeningForWakeWord,
        wakeWordDetected,
        startWakeWordListener,
    } = useWakeWord({
        enabled: !isLiveOpen, // Pause wake-word listening while live mode is active
        onWakeWord: handleWakeWordTrigger,
    });

    const handleLaunchLiveAssistant = useCallback(() => {
        setIsLiveOpen(true);
    }, []);

    // If user is NOT authenticated with Google, clicking any app launch prompt opens Google Sign-In
    const handleLaunchApp = useCallback((query, language) => {
        if (!isAuthenticated) {
            openAuthModal();
            return;
        }
        setInitialLaunchQuery(query);
        setInitialLaunchLang(language);
        setCurrentView("workspace");
    }, [isAuthenticated, openAuthModal]);

    const handleOpenInWorkspace = useCallback((query, language) => {
        setIsLiveOpen(false);
        if (!isAuthenticated) {
            openAuthModal();
            return;
        }
        setInitialLaunchQuery(query);
        setInitialLaunchLang(language);
        setCurrentView("workspace");
    }, [isAuthenticated, openAuthModal]);

    const handleSplashComplete = useCallback(() => {
        setShowSplash(false);
    }, []);

    const handleReturnHome = useCallback(() => {
        setInitialLaunchQuery(undefined);
        setInitialLaunchLang(undefined);
        setCurrentView("landing");
    }, []);

    return (
        <>
            {/* Live Voice Assistant Fullscreen Overlay (Gemini Live & ChatGPT Voice duplex mode) */}
            {isLiveOpen && (
                <IndicaLiveAssistant
                    isOpen={isLiveOpen}
                    onClose={() => setIsLiveOpen(false)}
                    initialLanguage={initialLaunchLang || "auto"}
                    onOpenInWorkspace={handleOpenInWorkspace}
                />
            )}

            {/* 1. Authenticated users in workspace view go straight to SearchWorkspace */}
            {isInitialized && isAuthenticated && currentView === "workspace" ? (
                <SearchWorkspace
                    initialQuery={initialLaunchQuery}
                    initialLanguage={initialLaunchLang}
                    onReturnHome={handleReturnHome}
                    onLaunchLiveAssistant={handleLaunchLiveAssistant}
                />
            ) : (
                /* 2. Unauthenticated landing page OR user clicked Home */
                <>
                    {showSplash && <IndicaSplashLoader onComplete={handleSplashComplete} />}
                    <IndicaLandingPage
                        onLaunchApp={handleLaunchApp}
                        onLaunchLiveAssistant={handleLaunchLiveAssistant}
                    />
                </>
            )}

            {/* Single Unified Floating Voice Assistant Launcher */}
            {!isLiveOpen && (
                <div className="aesthetic-floating-corner-launcher">
                    <button
                        type="button"
                        className={`floating-launcher-btn ${wakeWordDetected ? "is-triggered" : ""}`}
                        onClick={() => {
                            if (!isListeningForWakeWord) {
                                startWakeWordListener();
                            }
                            handleLaunchLiveAssistant();
                        }}
                        title={
                            isListeningForWakeWord
                                ? "Say 'Hay Indica' or click to talk"
                                : "Click to talk to Indica Voice Assistant"
                        }
                    >
                        <div className="floating-mic-circle">
                            <Mic size={15} />
                            <span className={`mic-pulse-ring ${isListeningForWakeWord ? "active" : ""}`} />
                        </div>
                        <div className="floating-launcher-content">
                            <span className="launcher-text">
                                {wakeWordDetected ? "Launching Indica..." : "Talk to Indica"}
                            </span>
                            <span className="launcher-wake-hint">
                                <span className={`wake-hint-dot ${isListeningForWakeWord ? "online" : "ready"}`} />
                                {wakeWordDetected
                                    ? "Wake word detected"
                                    : isListeningForWakeWord
                                    ? "Say 'Hay Indica'"
                                    : "Tap to speak"}
                            </span>
                        </div>
                    </button>
                </div>
            )}
        </>
    );
}
