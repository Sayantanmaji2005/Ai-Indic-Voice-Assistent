"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { Mic, MicOff, PhoneOff, X, ChevronDown, Check, MessageSquare, ArrowUpRight, Globe, Sparkles } from "lucide-react";
import { languages, languageByCode } from "@/lib/languages";
import { getVoiceAgentForLanguage, INDIC_VOICE_AGENTS } from "@/lib/agents/indic-voice-agents";

// 16-bar natural acoustic wave envelope with peaks and valleys (px)
const BASE_WAVE_ENVELOPE = [6, 8, 12, 18, 28, 42, 54, 46, 32, 22, 32, 44, 30, 18, 10, 6];

export function IndicaLiveAssistant({
    isOpen = true,
    onClose,
    initialLanguage = "auto",
    onOpenInWorkspace,
}) {
    const [state, setState] = useState("listening"); // 'listening' | 'thinking' | 'speaking' | 'idle'
    const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage);
    const [activeAgent, setActiveAgent] = useState(() => getVoiceAgentForLanguage(initialLanguage === "auto" ? "hi" : initialLanguage));
    const [langDropdownOpen, setLangDropdownOpen] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [audioVolume, setAudioVolume] = useState(0); // 0.0 to 1.0

    // Dynamic wave heights for 16 bars on each side
    const [leftBarHeights, setLeftBarHeights] = useState(() => [...BASE_WAVE_ENVELOPE]);
    const [rightBarHeights, setRightBarHeights] = useState(() => [...BASE_WAVE_ENVELOPE]);

    const [showTranscript, setShowTranscript] = useState(true);
    const [currentUserText, setCurrentUserText] = useState("");
    const [currentAiText, setCurrentAiText] = useState("");
    const [conversationHistory, setConversationHistory] = useState([]);

    // Live search grounding states
    const [liveSearchSources, setLiveSearchSources] = useState([]);
    const [lastSearchQuery, setLastSearchQuery] = useState("");

    // References
    const recognitionRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const micStreamRef = useRef(null);
    const micSourceNodeRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const animationFrameRef = useRef(null);
    const currentAudioRef = useRef(null);
    const isMutedRef = useRef(false);
    const silenceTimerRef = useRef(null);
    const stateRef = useRef(state);
    const selectedLanguageRef = useRef(selectedLanguage);
    const isProcessingTurnRef = useRef(false);
    const isStartingRef = useRef(false);
    const userSpokeRef = useRef(false);
    const liveTextRef = useRef("");
    const detectedLanguageRef = useRef(null);
    const startListeningRef = useRef(null);

    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    useEffect(() => {
        isMutedRef.current = isMuted;
    }, [isMuted]);

    useEffect(() => {
        selectedLanguageRef.current = selectedLanguage;
    }, [selectedLanguage]);

    // Resolve valid BCP-47 speech recognition locale (Never pass "auto" to Web Speech API!)
    const getResolvedSpeechLocale = useCallback((langCode) => {
        if (!langCode || langCode === "auto") {
            // If user has already spoken and we auto-detected their active language, use that locale:
            if (detectedLanguageRef.current && detectedLanguageRef.current !== "auto") {
                const info = languageByCode(detectedLanguageRef.current);
                return info.speechCode || "en-IN";
            }
            if (typeof navigator !== "undefined") {
                const navLang = (navigator.languages?.[0] || navigator.language || "").toLowerCase();
                if (navLang.startsWith("bn")) return "bn-IN";
                if (navLang.startsWith("hi")) return "hi-IN";
                if (navLang.startsWith("ta")) return "ta-IN";
                if (navLang.startsWith("te")) return "te-IN";
                if (navLang.startsWith("mr")) return "mr-IN";
                if (navLang.startsWith("gu")) return "gu-IN";
                if (navLang.startsWith("pa")) return "pa-IN";
                if (navLang.startsWith("kn")) return "kn-IN";
                if (navLang.startsWith("ml")) return "ml-IN";
                if (navLang.startsWith("en")) return "en-IN";
            }
            return "en-IN";
        }
        const langInfo = languageByCode(langCode);
        return langInfo.speechCode || "hi-IN";
    }, []);

    // Initialize Web Audio Context for visualizer
    const initAudioContext = useCallback(() => {
        if (typeof window === "undefined") return;
        if (!audioContextRef.current) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                const ctx = new AudioCtx();
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 64;
                analyser.smoothingTimeConstant = 0.7;
                audioContextRef.current = ctx;
                analyserRef.current = analyser;
            }
        }
    }, []);

    // Connect user mic stream to frequency analyser (NEVER CONNECT TO DESTINATION!)
    const connectMicToAnalyser = useCallback(async (stream) => {
        try {
            initAudioContext();
            if (!audioContextRef.current || !analyserRef.current) return;
            if (audioContextRef.current.state === "suspended") {
                await audioContextRef.current.resume();
            }
            if (micSourceNodeRef.current) {
                try {
                    micSourceNodeRef.current.disconnect();
                } catch {
                    // ignore
                }
            }
            const source = audioContextRef.current.createMediaStreamSource(stream);
            micSourceNodeRef.current = source;
            source.connect(analyserRef.current);
            // CRITICAL: We NEVER connect source or analyser to audioContext.destination!
            // This 100% guarantees the user will NEVER hear their own voice echoing back!
        } catch (err) {
            console.warn("Mic analyser notice:", err);
        }
    }, [initAudioContext]);

    // =========================================================================
    // 60FPS Flowing Undulating Audio Wave ("Laharata Hua") Animation
    // =========================================================================
    useEffect(() => {
        let isRunning = true;
        const dataArray = new Uint8Array(32);

        const animateWaveform = () => {
            if (!isRunning) return;

            let currentLevel = 0;
            if (stateRef.current === "listening" && analyserRef.current) {
                analyserRef.current.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 2; i < 20; i++) {
                    sum += dataArray[i];
                }
                const avg = sum / 18;
                currentLevel = Math.min(1, Math.max(0, avg / 120));

                if (currentLevel > 0.08) {
                    userSpokeRef.current = true;
                }
            } else if (stateRef.current === "speaking") {
                // Energetic speaking modulation when Indica is talking
                const time = Date.now() / 90;
                currentLevel = 0.45 + 0.35 * Math.sin(time);
            } else if (stateRef.current === "thinking") {
                currentLevel = 0.35;
            }

            setAudioVolume((prev) => prev * 0.4 + currentLevel * 0.6);

            // Flowing wave time variable
            const time = Date.now() / 220;

            // Generate flowing wave heights for Left Bars
            const newLeft = BASE_WAVE_ENVELOPE.map((baseH, i) => {
                const wavePhase = time + i * 0.42;
                const waveUndulation = Math.sin(wavePhase) * (6 + currentLevel * 20);
                const voiceSurge = currentLevel * 32 * Math.sin((i / 16) * Math.PI);
                const computed = baseH * (0.65 + currentLevel * 1.35) + waveUndulation + voiceSurge;
                return Math.max(4, Math.min(76, Math.round(computed)));
            });

            // Generate flowing wave heights for Right Bars
            const newRight = BASE_WAVE_ENVELOPE.map((baseH, i) => {
                const wavePhase = time - i * 0.42;
                const waveUndulation = Math.sin(wavePhase) * (6 + currentLevel * 20);
                const voiceSurge = currentLevel * 32 * Math.sin((i / 16) * Math.PI);
                const computed = baseH * (0.65 + currentLevel * 1.35) + waveUndulation + voiceSurge;
                return Math.max(4, Math.min(76, Math.round(computed)));
            });

            setLeftBarHeights(newLeft);
            setRightBarHeights(newRight);

            animationFrameRef.current = requestAnimationFrame(animateWaveform);
        };

        animationFrameRef.current = requestAnimationFrame(animateWaveform);

        return () => {
            isRunning = false;
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, []);

    // Stop currently playing AI audio
    const stopAiSpeech = useCallback(() => {
        if (currentAudioRef.current) {
            try {
                currentAudioRef.current.pause();
                currentAudioRef.current.currentTime = 0;
            } catch {
                // ignore
            }
            currentAudioRef.current = null;
        }
        if (typeof window !== "undefined" && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }, []);

    // Fallback SpeechSynthesis
    const fallbackBrowserSpeech = useCallback((text, lang) => {
        if (typeof window === "undefined" || !window.speechSynthesis) {
            isProcessingTurnRef.current = false;
            setState("listening");
            startListeningRef.current?.();
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        const langInfo = languageByCode(lang || "en");
        utterance.lang = langInfo.speechCode || "en-IN";
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const matchingVoice = voices.find((v) =>
            v.lang.toLowerCase().startsWith(langInfo.code.toLowerCase())
        );
        if (matchingVoice) utterance.voice = matchingVoice;

        utterance.onend = () => {
            isProcessingTurnRef.current = false;
            if (!isMutedRef.current) {
                setState("listening");
                startListeningRef.current?.();
            } else {
                setState("idle");
            }
        };

        utterance.onerror = () => {
            isProcessingTurnRef.current = false;
            setState("listening");
            startListeningRef.current?.();
        };

        window.speechSynthesis.speak(utterance);
    }, []);

    // Synthesize voice and play
    const playAiSpokenResponse = useCallback(async (text, lang) => {
        stopAiSpeech();

        // Halt mic recognition while Indica is speaking to eliminate voice feedback loop & stutter
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
            const ttsRes = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text,
                    language: lang,
                }),
            });

            if (ttsRes.ok) {
                const blob = await ttsRes.blob();
                if (blob.size > 200) {
                    const audioUrl = URL.createObjectURL(blob);
                    const audio = new Audio(audioUrl);
                    currentAudioRef.current = audio;

                    audio.onended = () => {
                        URL.revokeObjectURL(audioUrl);
                        currentAudioRef.current = null;
                        isProcessingTurnRef.current = false;
                        if (!isMutedRef.current) {
                            setState("listening");
                            // 250ms room clearance buffer before reactivating microphone
                            setTimeout(() => {
                                if (stateRef.current === "listening" && !isMutedRef.current) {
                                    startListeningRef.current?.();
                                }
                            }, 250);
                        } else {
                            setState("idle");
                        }
                    };

                    audio.onerror = () => {
                        URL.revokeObjectURL(audioUrl);
                        fallbackBrowserSpeech(text, lang);
                    };

                    await audio.play();
                    return;
                }
            }
        } catch (e) {
            console.warn("TTS fetch attempt notice:", e);
        }

        fallbackBrowserSpeech(text, lang);
    }, [stopAiSpeech, fallbackBrowserSpeech]);

    // Process user spoken query -> Live AI chat -> Voice playback
    const processUserSpokenTurn = useCallback(async (spokenText) => {
        const text = spokenText?.trim();
        if (!text || isProcessingTurnRef.current) return;

        isProcessingTurnRef.current = true;
        setState("thinking");
        setCurrentUserText(text);
        setLastSearchQuery(text);

        const newHistory = [...conversationHistory, { role: "user", content: text }];
        setConversationHistory(newHistory);

        try {
            const res = await fetch("/api/live-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text,
                    history: newHistory,
                    language: selectedLanguageRef.current,
                }),
            });

            const data = await res.json();
            const reply = data.reply || (selectedLanguageRef.current === "bn" ? "আমি আপনার কথা শুনেছি।" : "I hear you clearly.");
            const replyLang = data.language || selectedLanguageRef.current;

            if (data.language) {
                detectedLanguageRef.current = data.language;
            }

            if (data.agent) {
                setActiveAgent(data.agent);
            } else if (replyLang) {
                setActiveAgent(getVoiceAgentForLanguage(replyLang));
            }

            setCurrentAiText(reply);
            setConversationHistory((prev) => [...prev, { role: "assistant", content: reply }]);

            // Store search sources if live search was used
            if (data.sources && Array.isArray(data.sources) && data.sources.length > 0) {
                setLiveSearchSources(data.sources);
            } else {
                setLiveSearchSources([]);
            }

            // Synthesize voice and speak
            setState("speaking");
            await playAiSpokenResponse(reply, replyLang);
        } catch (err) {
            console.error("Live turn processing error:", err);
            isProcessingTurnRef.current = false;
            setState("listening");
            startListeningRef.current?.();
        }
    }, [conversationHistory, playAiSpokenResponse]);

    // Fallback: Transcribe audio using server Whisper if Web Speech API produced nothing
    const transcribeWithServerWhisper = useCallback(async () => {
        if (!audioChunksRef.current.length || isProcessingTurnRef.current) return;
        try {
            setState("thinking");
            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            audioChunksRef.current = [];

            const formData = new FormData();
            formData.append("file", audioBlob, "speech.webm");
            if (selectedLanguageRef.current && selectedLanguageRef.current !== "auto") {
                formData.append("language", selectedLanguageRef.current);
            }

            const res = await fetch("/api/stt", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success && data.text?.trim()) {
                    processUserSpokenTurn(data.text.trim());
                    return;
                }
            }
        } catch (e) {
            console.warn("Server STT backup notice:", e);
        }

        setState("listening");
        startListeningRef.current?.();
    }, [processUserSpokenTurn]);

    // Start speech recognition listening with singleton safety
    const startListening = useCallback(async () => {
        if (typeof window === "undefined" || isMutedRef.current || isStartingRef.current) return;
        isStartingRef.current = true;

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

        liveTextRef.current = "";
        userSpokeRef.current = false;

        // 1. Microphone Audio Stream
        try {
            if (!micStreamRef.current && navigator.mediaDevices?.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                });
                micStreamRef.current = stream;
                connectMicToAnalyser(stream);

                if (typeof MediaRecorder !== "undefined") {
                    audioChunksRef.current = [];
                    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                        ? "audio/webm;codecs=opus"
                        : "audio/webm";
                    const recorder = new MediaRecorder(stream, { mimeType });
                    recorder.ondataavailable = (e) => {
                        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
                    };
                    recorder.start(250);
                    mediaRecorderRef.current = recorder;
                }
            }
        } catch (err) {
            console.warn("Mic getUserMedia notice:", err);
        }

        // 2. SpeechRecognition Engine
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Recognition) {
            isStartingRef.current = false;
            return;
        }

        try {
            const recognition = new Recognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = getResolvedSpeechLocale(selectedLanguageRef.current);

            recognition.onstart = () => {
                setState("listening");
                isStartingRef.current = false;
            };

            recognition.onresult = (event) => {
                let finalTranscript = "";
                let interimTranscript = "";
                for (let i = 0; i < event.results.length; i++) {
                    const textPiece = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += textPiece + " ";
                    } else {
                        interimTranscript += textPiece;
                    }
                }

                const liveText = (finalTranscript + interimTranscript).trim();
                if (liveText) {
                    liveTextRef.current = liveText;
                    userSpokeRef.current = true;
                    setCurrentUserText(liveText);

                    // Adaptive turn-taking pause detection (1.8s - 2.0s based on phrase length)
                    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                    const wordCount = liveText.split(/\s+/).length;
                    const pauseThreshold = wordCount > 4 ? 1800 : 2000;

                    silenceTimerRef.current = setTimeout(() => {
                        if (stateRef.current === "listening" && liveText.length > 0) {
                            try {
                                recognition.stop();
                            } catch {
                                // ignore
                            }
                            processUserSpokenTurn(liveText);
                        }
                    }, pauseThreshold);
                }
            };

            recognition.onerror = (event) => {
                if (event.error === "aborted" || event.error === "no-speech") return;
                console.warn("Speech recognition notice:", event.error);
            };

            recognition.onend = () => {
                isStartingRef.current = false;

                // Fallback to Whisper if mic was active but Web Speech missed the transcript
                if (userSpokeRef.current && !liveTextRef.current && audioChunksRef.current.length > 0) {
                    transcribeWithServerWhisper();
                    return;
                }

                if (stateRef.current === "listening" && !isMutedRef.current && !isProcessingTurnRef.current) {
                    setTimeout(() => {
                        if (stateRef.current === "listening" && !isMutedRef.current && !isProcessingTurnRef.current) {
                            startListeningRef.current?.();
                        }
                    }, 300);
                }
            };

            recognitionRef.current = recognition;
            recognition.start();
        } catch {
            isStartingRef.current = false;
        }
    }, [connectMicToAnalyser, getResolvedSpeechLocale, processUserSpokenTurn, transcribeWithServerWhisper]);

    // Keep startListeningRef updated immediately on render & in effect
    startListeningRef.current = startListening;
    useEffect(() => {
        startListeningRef.current = startListening;
    }, [startListening]);

    // Mount Lifecycle with 300ms clean handover
    useEffect(() => {
        let timer = null;
        if (isOpen) {
            initAudioContext();
            timer = setTimeout(() => {
                startListeningRef.current?.();
            }, 300);
        }

        return () => {
            if (timer) clearTimeout(timer);
            stopAiSpeech();
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
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
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                try {
                    mediaRecorderRef.current.stop();
                } catch {
                    // ignore
                }
            }
            if (micStreamRef.current) {
                micStreamRef.current.getTracks().forEach((track) => track.stop());
                micStreamRef.current = null;
            }
        };
    }, [isOpen, initAudioContext, stopAiSpeech]);

    // Handle Language Change from dropdown
    const handleSelectLanguage = (code) => {
        setSelectedLanguage(code);
        setLangDropdownOpen(false);
        const agent = getVoiceAgentForLanguage(code === "auto" ? "hi" : code);
        setActiveAgent(agent);
        stopAiSpeech();
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (recognitionRef.current) {
            try {
                recognitionRef.current.onend = null;
                recognitionRef.current.abort();
            } catch {
                // ignore
            }
            recognitionRef.current = null;
        }
        setTimeout(() => {
            if (!isMutedRef.current) {
                startListeningRef.current?.();
            }
        }, 150);
    };

    // Handle Orb Click: Interrupt or Manual Send Turn
    const handleOrbClick = () => {
        if (state === "speaking") {
            stopAiSpeech();
            setState("listening");
            startListeningRef.current?.();
        } else if (state === "listening") {
            if (liveTextRef.current.trim()) {
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                if (recognitionRef.current) {
                    try {
                        recognitionRef.current.stop();
                    } catch {
                        // ignore
                    }
                }
                processUserSpokenTurn(liveTextRef.current);
            } else if (audioChunksRef.current.length > 0) {
                transcribeWithServerWhisper();
            }
        } else if (state === "idle" || isMuted) {
            setIsMuted(false);
            setState("listening");
            startListeningRef.current?.();
        }
    };

    // Toggle Mute
    const handleToggleMute = () => {
        if (isMuted) {
            setIsMuted(false);
            setState("listening");
            startListeningRef.current?.();
        } else {
            setIsMuted(true);
            stopAiSpeech();
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.onend = null;
                    recognitionRef.current.abort();
                } catch {
                    // ignore
                }
                recognitionRef.current = null;
            }
            setState("idle");
        }
    };

    if (!isOpen) return null;

    const coreScale = 1 + audioVolume * 0.22;
    const haloSpread = 25 + audioVolume * 45;

    let heroTitle = "Indica is Listening...";
    let heroSubtitle = selectedLanguage === "auto"
        ? "Speak now in Bengali (বাংলা), Hindi (हिन्दी), Marathi or any language — I'm ready."
        : `Speak now in ${activeAgent.language} (${activeAgent.nativeLanguage}) — I'm ready.`;

    if (state === "thinking") {
        heroTitle = "Indica is Thinking...";
        heroSubtitle = "Formulating a natural, intelligent response...";
    } else if (state === "speaking") {
        heroTitle = "Indica is Speaking";
        heroSubtitle = "Tap the glowing circle or speak to interrupt.";
    } else if (isMuted) {
        heroTitle = "Microphone Muted";
        heroSubtitle = "Tap the microphone below to resume conversation.";
    }

    return (
        <div className="indica-live-aesthetic-wrapper">
            {/* Top-Left Soft Cyan Wave Ribbon */}
            <svg
                className="indica-bg-wave-top-left"
                viewBox="0 0 700 450"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
            >
                <path
                    d="M-50,0 C150,180 320,80 520,160 C640,210 700,280 720,340 L720,0 Z"
                    fill="url(#topWaveGrad)"
                    opacity="0.65"
                />
                <path
                    d="M-50,0 C120,240 280,140 460,220 C580,270 650,330 680,410 L680,0 Z"
                    fill="url(#topWaveGrad2)"
                    opacity="0.35"
                />
                <defs>
                    <linearGradient id="topWaveGrad" x1="0" y1="0" x2="600" y2="300" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#bae6fd" stopOpacity="0.8" />
                        <stop offset="1" stopColor="#e0f2fe" stopOpacity="0.05" />
                    </linearGradient>
                    <linearGradient id="topWaveGrad2" x1="0" y1="0" x2="600" y2="400" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#7dd3fc" stopOpacity="0.6" />
                        <stop offset="1" stopColor="#f0f9ff" stopOpacity="0" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Bottom-Right Navy Ribbon Waves with Golden Line Accent */}
            <svg
                className="indica-bg-wave-bottom-right"
                viewBox="0 0 900 450"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
            >
                <path
                    d="M0,450 C320,380 480,440 640,320 C760,230 840,160 920,120"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.9"
                />
                <path
                    d="M0,450 C320,380 480,440 640,320 C760,230 840,160 920,120 L920,450 Z"
                    fill="url(#bottomWaveGrad1)"
                />
                <path
                    d="M120,450 C400,420 540,460 700,380 C800,320 860,260 920,220 L920,450 Z"
                    fill="url(#bottomWaveGrad2)"
                    opacity="0.95"
                />
                <defs>
                    <linearGradient id="bottomWaveGrad1" x1="500" y1="200" x2="900" y2="450" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#0284c7" />
                        <stop offset="0.5" stopColor="#0c4a6e" />
                        <stop offset="1" stopColor="#082f49" />
                    </linearGradient>
                    <linearGradient id="bottomWaveGrad2" x1="600" y1="300" x2="900" y2="450" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#075985" />
                        <stop offset="1" stopColor="#0a2540" />
                    </linearGradient>
                </defs>
            </svg>

            {/* TOP BAR */}
            <header className="indica-live-aesthetic-header">
                {/* Top-Left Floating Pill Card */}
                <div className="indica-live-ref-card">
                    <div className="indica-live-ref-logo-wrap">
                        <Image
                            src="/indica-symbol.png"
                            alt="Indica AI"
                            width={36}
                            height={36}
                            className="indica-live-ref-logo-img"
                            priority
                        />
                    </div>
                    <div className="indica-live-ref-text-col">
                        <div className="indica-live-ref-brand-name">
                            <span className="brand-navy">Indic</span>
                            <span className="brand-gold">a</span>
                        </div>
                        <span className="indica-live-ref-brand-sub">AI VOICE ASSISTANT</span>
                    </div>
                </div>

                {/* Top-Right Controls */}
                <div className="indica-live-top-actions">
                    <div className="indica-live-lang-dropdown-anchor">
                        <button
                            type="button"
                            className="indica-live-aesthetic-lang-btn"
                            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                            title="Choose Spoken Language"
                        >
                            <span>{languageByCode(selectedLanguage).nativeLabel || "Auto Detect"}</span>
                            <ChevronDown size={14} className={langDropdownOpen ? "rotate-180 transition-transform" : "transition-transform"} />
                        </button>

                        {langDropdownOpen && (
                            <div className="indica-live-aesthetic-lang-popover">
                                <button
                                    type="button"
                                    className={`indica-live-aesthetic-lang-item ${selectedLanguage === "auto" ? "active" : ""}`}
                                    onClick={() => handleSelectLanguage("auto")}
                                >
                                    <span>✨ Auto Detect (Adaptive Voice Tuning)</span>
                                    {selectedLanguage === "auto" && <Check size={14} />}
                                </button>
                                {languages.filter((l) => l.code !== "auto").map((l) => (
                                    <button
                                        key={l.code}
                                        type="button"
                                        className={`indica-live-aesthetic-lang-item ${selectedLanguage === l.code ? "active" : ""}`}
                                        onClick={() => handleSelectLanguage(l.code)}
                                    >
                                        <div className="flex items-center justify-between w-full pr-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-semibold text-slate-800">{l.nativeLabel}</span>
                                                <span className="text-xs text-slate-500">({l.label})</span>
                                            </div>
                                            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-100">
                                                {l.script}
                                            </span>
                                        </div>
                                        {selectedLanguage === l.code && <Check size={14} className="text-emerald-600 shrink-0 ml-1.5" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="indica-live-aesthetic-close-btn"
                        title="Close Live Assistant"
                        aria-label="Close"
                    >
                        <X size={18} strokeWidth={2.2} />
                    </button>
                </div>
            </header>

            {/* CENTER STAGE */}
            <main className="indica-live-aesthetic-center">
                <div className="indica-live-soundstage-row">
                    {/* LEFT FLOWING AUDIO WAVE */}
                    <div className="indica-equalizer-cluster left">
                        {leftBarHeights.map((h, idx) => {
                            const isDot = h <= 6;
                            return (
                                <span
                                    key={`left-${idx}`}
                                    className={`indica-sound-bar ${isDot ? "bar-dot" : ""}`}
                                    style={{
                                        height: `${h}px`,
                                        opacity: Math.max(0.5, 0.45 + (h / 76) * 0.55),
                                    }}
                                />
                            );
                        })}
                    </div>

                    {/* CENTRAL LIVING GLOWING ORB */}
                    <div
                        className="indica-live-orb-button-wrap"
                        onClick={handleOrbClick}
                        role="button"
                        tabIndex={0}
                        title={state === "speaking" ? "Tap to interrupt" : "Tap to speak / send"}
                    >
                        {/* Outer Soft Cyan Ambient Glow Halo */}
                        <div
                            className="indica-orb-ambient-halo"
                            style={{
                                transform: `scale(${1 + audioVolume * 0.35})`,
                                boxShadow: `0 0 ${haloSpread}px 14px rgba(56, 189, 248, ${0.35 + audioVolume * 0.45})`,
                            }}
                        />

                        {/* Beveled Outer Ring */}
                        <div className="indica-orb-bevel-ring">
                            {/* Inner Cyan Glowing Neon Rim */}
                            <div className="indica-orb-neon-ring">
                                {/* Deep Navy Gradient Core Sphere */}
                                <div
                                    className={`indica-orb-navy-core ${state === "speaking" ? "is-speaking" : ""}`}
                                    style={{
                                        transform: `scale(${coreScale})`,
                                    }}
                                >
                                    <Mic size={38} strokeWidth={2.4} className="indica-core-mic-icon" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT FLOWING AUDIO WAVE */}
                    <div className="indica-equalizer-cluster right">
                        {rightBarHeights.map((h, idx) => {
                            const isDot = h <= 6;
                            return (
                                <span
                                    key={`right-${idx}`}
                                    className={`indica-sound-bar ${isDot ? "bar-dot" : ""}`}
                                    style={{
                                        height: `${h}px`,
                                        opacity: Math.max(0.5, 0.45 + (h / 76) * 0.55),
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* ACTIVE DEDICATED AI VOICE AGENT PILL */}
                <div className="indica-live-agent-pill" title={`Indica - ${activeAgent.language} Voice Companion`}>
                    <span className="indica-agent-dot" style={{ backgroundColor: activeAgent.avatarColor || "#0284c7" }} />
                    <span className="indica-agent-name">Indica</span>
                    <span className="indica-agent-sep">•</span>
                    <span className="indica-agent-lang">{activeAgent.nativeLanguage} Voice</span>
                </div>

                {/* TYPOGRAPHY HEADINGS */}
                <div className="indica-live-text-stack">
                    <h2 className="indica-live-hero-title">{heroTitle}</h2>
                    <p className="indica-live-hero-subtitle">{heroSubtitle}</p>
                </div>

                {/* LIVE SPOKEN DIALOGUE SUBTITLES + LIVE SEARCH GROUNDING CARD */}
                {showTranscript && (currentUserText || currentAiText) && (
                    <div className="indica-live-speech-card">
                        {state === "speaking" && currentAiText && (
                            <div className="indica-speech-ai-row">
                                <span className="indica-speech-tag-ai">
                                    Indica
                                </span>
                                <p className="indica-speech-text-ai">{currentAiText}</p>
                            </div>
                        )}
                        {(state === "listening" || state === "thinking") && currentUserText && (
                            <div className="indica-speech-user-row">
                                <span className="indica-speech-tag-user">You</span>
                                <p className="indica-speech-text-user">{currentUserText}</p>
                            </div>
                        )}

                        {/* Live Search Engine Grounding & Chat Workspace Integration */}
                        {liveSearchSources.length > 0 && (
                            <div className="indica-live-grounding-row">
                                <div className="indica-live-source-pill">
                                    <Globe size={13} className="text-sky-500" />
                                    <span>Grounded with {liveSearchSources.length} Live Web Sources</span>
                                </div>
                                <button
                                    type="button"
                                    className="indica-live-workspace-jump-btn"
                                    onClick={() => onOpenInWorkspace && onOpenInWorkspace(lastSearchQuery || currentUserText, selectedLanguage)}
                                    title="Explore comprehensive multi-source citations and visual evidence in chat workspace"
                                >
                                    <span>Open in Chat Workspace</span>
                                    <ArrowUpRight size={13} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* BOTTOM FLOATING CONTROLS DOCK */}
            <footer className="indica-live-aesthetic-footer">
                <div className="indica-live-floating-dock">
                    <button
                        type="button"
                        className={`indica-live-dock-btn ${showTranscript ? "active" : ""}`}
                        onClick={() => setShowTranscript(!showTranscript)}
                        title={showTranscript ? "Hide subtitles" : "Show subtitles"}
                    >
                        <MessageSquare size={18} />
                    </button>

                    <button
                        type="button"
                        className={`indica-live-dock-btn mic-action ${isMuted ? "muted" : "active"}`}
                        onClick={handleToggleMute}
                        title={isMuted ? "Unmute microphone" : "Mute microphone"}
                    >
                        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>

                    <button
                        type="button"
                        className="indica-live-dock-btn end-call"
                        onClick={onClose}
                        title="End Live Conversation"
                    >
                        <PhoneOff size={18} />
                    </button>
                </div>
            </footer>
        </div>
    );
}
