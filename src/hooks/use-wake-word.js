"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Multi-lingual & phonetic wake patterns for Indica
const WAKE_PATTERNS = [
    // English & Spoken Hindi/Bengali Phonetic Variations (e.g. "hay indica", "hey indica", "hi indica", "ok indica", "hey india", etc.)
    /(?:^|\b)(?:hey|hay|he|hi|hai|hello|hallo|ok|okay|listen|sun|suno|shun|shuno|bolo|bolun|namaste|nomoshkar|ei|oye|ay|ai|are)?\s*(?:indica|indika|endica|endika|indico|indiga|india|indira|in\s*the\s*car|indicator|indeca|endeca)(?:\b|$)/i,
    // Bengali (বাংলা)
    /(?:^|\b)(?:হে|হাই|হ্যালো|শোনো|শুনুন|বলো|বলুন|নমস্কার)?\s*(?:ইন্ডিকা|ইন্দিকা|ইনডিকা)(?:\b|$)/i,
    // Hindi & Marathi (हिन्दी / मराठी)
    /(?:^|\b)(?:हे|हाय|हेलो|सुनो|सुनिए|बोलो|बोलिए|नमस्ते|नमस्कार)?\s*(?:इंडिका|इन्डिका)(?:\b|$)/i,
    // Telugu & Tamil
    /(?:^|\b)(?:హే|నమస్కారం)?\s*ఇండికా(?:\b|$)/i,
    /(?:^|\b)(?:ஹே|வணக்கம்)?\s*இண்டிகா(?:\b|$)/i,
];

const DIRECT_WAKE_WORDS = [
    "indica",
    "indika",
    "endica",
    "endika",
    "indico",
    "indicator",
    "indeca",
    "endeca",
    "ইন্ডিকা",
    "ইন্দিকা",
    "ইনডিকা",
    "इंडिका",
    "इन्डिका",
    "ఇండికా",
    "இண்டிகா",
];

// Cheerful 2-tone chime sound when wake word is triggered
function playWakeChime() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
        osc.start();
        osc.stop(ctx.currentTime + 0.32);
    } catch {
        // ignore
    }
}

export function useWakeWord({
    enabled = true,
    onWakeWord,
    language = "en-IN",
}) {
    const [isListeningForWakeWord, setIsListeningForWakeWord] = useState(false);
    const [wakeWordDetected, setWakeWordDetected] = useState(false);
    const [hasMicPermission, setHasMicPermission] = useState(false);

    const recognitionRef = useRef(null);
    const restartTimeoutRef = useRef(null);
    const isExplicitlyStoppedRef = useRef(false);
    const isBlockedByPermissionRef = useRef(false);
    const enabledRef = useRef(enabled);
    const onWakeWordRef = useRef(onWakeWord);
    const isStartingRef = useRef(false);

    useEffect(() => {
        onWakeWordRef.current = onWakeWord;
    }, [onWakeWord]);

    const checkTranscriptForWakeWord = useCallback((transcript) => {
        if (!transcript) return false;
        const normalized = transcript
            .toLowerCase()
            .replace(/[.,!?;:।]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        console.log("[Indica WakeWord Heard]:", normalized);

        // 1. Direct includes match (e.g. "hay indica", "hey indica", "indica", etc.)
        if (DIRECT_WAKE_WORDS.some((w) => normalized.includes(w))) {
            return true;
        }

        // 2. Regex pattern matching
        for (const pattern of WAKE_PATTERNS) {
            if (pattern.test(normalized)) {
                return true;
            }
        }

        // 3. Indian accent acoustic phonetic variations (e.g. "hey india", "hay indira")
        if (/(?:hey|hay|hi|hai|hello|oye|ei|sun|suno)\s+(?:india|indira|in\s*the\s*car|integra|indicator)/i.test(normalized)) {
            return true;
        }

        return false;
    }, []);

    const stopWakeWordListener = useCallback(() => {
        isExplicitlyStoppedRef.current = true;
        enabledRef.current = false;
        if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current);
            restartTimeoutRef.current = null;
        }
        if (recognitionRef.current) {
            try {
                recognitionRef.current.onend = null;
                recognitionRef.current.onerror = null;
                recognitionRef.current.abort();
            } catch {
                // ignore
            }
            recognitionRef.current = null;
        }
        setIsListeningForWakeWord(false);
        isStartingRef.current = false;
    }, []);

    const initSpeechRecognition = useCallback(() => {
        if (typeof window === "undefined" || !enabledRef.current || isExplicitlyStoppedRef.current) {
            return;
        }

        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Recognition) {
            console.warn("SpeechRecognition not supported in this browser.");
            return;
        }

        if (recognitionRef.current) {
            try {
                recognitionRef.current.onend = null;
                recognitionRef.current.onerror = null;
                recognitionRef.current.abort();
            } catch {
                // ignore
            }
            recognitionRef.current = null;
        }

        try {
            isStartingRef.current = true;
            const recognition = new Recognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = language || "en-IN";
            recognition.maxAlternatives = 3;

            recognition.onstart = () => {
                isStartingRef.current = false;
                isBlockedByPermissionRef.current = false;
                setIsListeningForWakeWord(true);
                setHasMicPermission(true);
                console.log("[Indica WakeWord Active]: Listening for 'Hay Indica' / 'Hey Indica'...");
            };

            recognition.onresult = (event) => {
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    for (let j = 0; j < result.length; j++) {
                        const transcript = result[j].transcript;
                        if (checkTranscriptForWakeWord(transcript)) {
                            console.log("🎯 WAKE WORD TRIGGERED:", transcript);
                            playWakeChime();
                            setWakeWordDetected(true);
                            if (onWakeWordRef.current) {
                                onWakeWordRef.current(transcript);
                            }
                            setTimeout(() => setWakeWordDetected(false), 2000);
                            return;
                        }
                    }
                }
            };

            recognition.onerror = (event) => {
                isStartingRef.current = false;
                if (event.error === "aborted" || event.error === "no-speech") {
                    return;
                }
                console.warn("[Indica WakeWord Notice]:", event.error);
                if (event.error === "not-allowed" || event.error === "service-not-allowed") {
                    isBlockedByPermissionRef.current = true;
                    setIsListeningForWakeWord(false);
                    setHasMicPermission(false);
                    recognitionRef.current = null;
                }
            };

            recognition.onend = () => {
                isStartingRef.current = false;
                setIsListeningForWakeWord(false);
                recognitionRef.current = null;

                // Seamlessly restart continuous wake-word listening unless blocked by permission or stopped
                if (enabledRef.current && !isExplicitlyStoppedRef.current && !isBlockedByPermissionRef.current) {
                    if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
                    restartTimeoutRef.current = setTimeout(() => {
                        if (enabledRef.current && !isExplicitlyStoppedRef.current && !isBlockedByPermissionRef.current) {
                            initSpeechRecognition();
                        }
                    }, 400);
                }
            };

            recognitionRef.current = recognition;
            recognition.start();
        } catch (err) {
            isStartingRef.current = false;
            setIsListeningForWakeWord(false);
            recognitionRef.current = null;
            console.warn("SpeechRecognition start notice:", err);
        }
    }, [checkTranscriptForWakeWord, language]);

    const startWakeWordListener = useCallback(async () => {
        if (typeof window === "undefined" || !enabledRef.current || isExplicitlyStoppedRef.current || isStartingRef.current) {
            return;
        }

        // Under user interaction or explicit call: request mic permission once to guarantee prompt
        if (navigator.mediaDevices?.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                // Immediately stop stream to release the mic hardware for SpeechRecognition
                stream.getTracks().forEach((track) => track.stop());
                setHasMicPermission(true);
                isBlockedByPermissionRef.current = false;
            } catch (e) {
                console.warn("Wake word mic permission request notice:", e);
                // Even if getUserMedia caught an error, SpeechRecognition might still be allowed
            }
        }

        initSpeechRecognition();
    }, [initSpeechRecognition]);

    useEffect(() => {
        enabledRef.current = enabled;
        if (!enabled) {
            stopWakeWordListener();
        } else {
            isExplicitlyStoppedRef.current = false;
            isBlockedByPermissionRef.current = false;
            const t = setTimeout(() => {
                if (enabledRef.current) {
                    initSpeechRecognition();
                }
            }, 300);
            return () => clearTimeout(t);
        }
    }, [enabled, initSpeechRecognition, stopWakeWordListener]);

    // User gesture handler: Automatically activate microphone on first user interaction if blocked by autoplay
    useEffect(() => {
        if (!enabled) return;

        const handleUserGesture = () => {
            if (enabledRef.current && !isListeningForWakeWord && !recognitionRef.current) {
                isBlockedByPermissionRef.current = false;
                startWakeWordListener();
            }
        };

        window.addEventListener("click", handleUserGesture, { passive: true, once: false });
        window.addEventListener("touchstart", handleUserGesture, { passive: true, once: false });
        window.addEventListener("keydown", handleUserGesture, { passive: true, once: false });

        return () => {
            window.removeEventListener("click", handleUserGesture);
            window.removeEventListener("touchstart", handleUserGesture);
            window.removeEventListener("keydown", handleUserGesture);
        };
    }, [enabled, isListeningForWakeWord, startWakeWordListener]);

    return {
        isListeningForWakeWord,
        wakeWordDetected,
        hasMicPermission,
        startWakeWordListener,
        stopWakeWordListener,
    };
}
