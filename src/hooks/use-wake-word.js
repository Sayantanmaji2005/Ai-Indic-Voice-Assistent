"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Multi-lingual & phonetic wake patterns for Indica
const WAKE_PATTERNS = [
    // English & Spoken Hindi/Bengali Phonetic Variations
    /(?:\b|^)(?:hey|hay|he|hi|hai|hello|ok|okay|listen|sun|suno|shun|shuno|bolo|bolun|namaste|nomoshkar)?\s*(?:indica|indika|endica|endika|indico|indiga|india|indira|in\s*the\s*car|indicator)(?:\b|$)/i,
    // Bengali (বাংলা)
    /(?:\b|^)(?:হে|হাই|হ্যালো|শোনো|শুনুন|বলো|বলুন|নমস্কার)?\s*(?:ইন্ডিকা|ইন্দিকা|ইনডিকা)(?:\b|$)/i,
    // Hindi & Marathi (हिन्दी / मराठी)
    /(?:\b|^)(?:हे|हाय|हेलो|सुनो|सुनिए|बोलो|बोलिए|नमस्ते|नमस्कार)?\s*(?:इंडिका|इन्डिका)(?:\b|$)/i,
    // Telugu & Tamil
    /(?:\b|^)(?:హే|నమస్కారం)?\s*ఇండికా(?:\b|$)/i,
    /(?:\b|^)(?:ஹே|வணக்கம்)?\s*இண்டிகா(?:\b|$)/i,
];

const DIRECT_WAKE_WORDS = [
    "indica",
    "indika",
    "endica",
    "endika",
    "indico",
    "indicator",
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
    const micStreamRef = useRef(null);
    const restartTimeoutRef = useRef(null);
    const isExplicitlyStoppedRef = useRef(false);
    const enabledRef = useRef(enabled);
    const onWakeWordRef = useRef(onWakeWord);
    const isStartingRef = useRef(false);

    useEffect(() => {
        enabledRef.current = enabled;
        if (!enabled) {
            stopWakeWordListener();
        } else {
            isExplicitlyStoppedRef.current = false;
            const t = setTimeout(() => {
                if (enabledRef.current) {
                    startWakeWordListener();
                }
            }, 300);
            return () => clearTimeout(t);
        }
    }, [enabled]);

    useEffect(() => {
        onWakeWordRef.current = onWakeWord;
    }, [onWakeWord]);

    const checkTranscriptForWakeWord = useCallback((transcript) => {
        if (!transcript) return false;
        console.log("[Indica WakeWord Listener Heard]:", transcript);

        const normalized = transcript
            .toLowerCase()
            .replace(/[.,!?;:।]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        // 1. Regex pattern matching
        for (const pattern of WAKE_PATTERNS) {
            if (pattern.test(normalized)) {
                return true;
            }
        }

        // 2. Direct keyword check
        const words = normalized.split(/\s+/);
        if (words.some((w) => DIRECT_WAKE_WORDS.includes(w))) {
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
        if (micStreamRef.current) {
            try {
                micStreamRef.current.getTracks().forEach((track) => track.stop());
            } catch {
                // ignore
            }
            micStreamRef.current = null;
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
                setIsListeningForWakeWord(true);
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
                    setIsListeningForWakeWord(false);
                    setHasMicPermission(false);
                }
            };

            recognition.onend = () => {
                isStartingRef.current = false;
                setIsListeningForWakeWord(false);

                // Seamlessly restart continuous wake-word listening
                if (enabledRef.current && !isExplicitlyStoppedRef.current) {
                    if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
                    restartTimeoutRef.current = setTimeout(() => {
                        if (enabledRef.current && !isExplicitlyStoppedRef.current) {
                            initSpeechRecognition();
                        }
                    }, 350);
                }
            };

            recognitionRef.current = recognition;
            recognition.start();
        } catch (err) {
            isStartingRef.current = false;
            setIsListeningForWakeWord(false);
            console.warn("SpeechRecognition start notice:", err);
        }
    }, [checkTranscriptForWakeWord, language]);

    const startWakeWordListener = useCallback(async () => {
        if (typeof window === "undefined" || !enabledRef.current || isExplicitlyStoppedRef.current || isStartingRef.current) {
            return;
        }

        // Request user microphone permission if not already acquired
        if (navigator.mediaDevices?.getUserMedia && !micStreamRef.current) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                micStreamRef.current = stream;
                setHasMicPermission(true);
            } catch (e) {
                console.warn("Wake word mic permission request notice:", e);
            }
        }

        initSpeechRecognition();
    }, [initSpeechRecognition]);

    // User gesture handler: Ensure microphone is activated on first user interaction
    useEffect(() => {
        if (!enabled) return;

        const handleUserGesture = () => {
            if (enabledRef.current && !isListeningForWakeWord && !recognitionRef.current) {
                startWakeWordListener();
            }
        };

        window.addEventListener("click", handleUserGesture, { passive: true });
        window.addEventListener("touchstart", handleUserGesture, { passive: true });
        window.addEventListener("keydown", handleUserGesture, { passive: true });

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
