"use client";
import { useEffect, useRef, useState } from "react";
import { BhaashaApiClient } from "@/lib/api-client";
import { languageByCode } from "@/lib/languages";
function cleanForSpeech(raw) {
    return raw
        .replace(/#{1,6}\s+/g, "")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\[\d+\]/g, "")
        .replace(/\[Source\s+\d+\]/gi, "")
        .replace(/\(\d+\)/g, "")
        .replace(/https?:\/\/\S+/g, "")
        .replace(/^[\s*•-]+\s*/gm, "")
        .replace(/\n{2,}/g, ". ")
        .replace(/\n/g, ", ")
        .replace(/\s+/g, " ")
        .trim();
}
export function useAudioPlayer() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const audioRef = useRef(null);
    const currentSpeedRef = useRef(1.0);
    function stopAudio() {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        if (typeof window !== "undefined" && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
    }
    function setSpeed(speed) {
        currentSpeedRef.current = speed;
        if (audioRef.current) {
            audioRef.current.playbackRate = speed;
        }
    }
    async function speak(text, language, voiceId, speed = 1.0) {
        if (!text || typeof window === "undefined")
            return;
        if (isSpeaking) {
            stopAudio();
            return;
        }
        stopAudio();
        setIsSpeaking(true);
        currentSpeedRef.current = speed;
        const spokenText = cleanForSpeech(text);
        try {
            // 1. Try server-side ElevenLabs High-Quality Human Audio Stream (supports cloned voices)
            const audioBlob = await BhaashaApiClient.generateSpeechAudio(spokenText, language, voiceId);
            if (audioBlob) {
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                // Soft, gentle and natural human speaking cadence
                audio.playbackRate = currentSpeedRef.current * 1.0;
                audioRef.current = audio;
                audio.onended = () => {
                    setIsSpeaking(false);
                    audioRef.current = null;
                    URL.revokeObjectURL(audioUrl);
                };
                audio.onerror = () => {
                    setIsSpeaking(false);
                    audioRef.current = null;
                    URL.revokeObjectURL(audioUrl);
                };
                await audio.play();
                return;
            }
        }
        catch {
            // Fall through to browser speech synthesis below
        }
        // 2. Fallback to client browser SpeechSynthesis with best natural voice
        if (window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(spokenText);
            const langInfo = languageByCode(language);
            utterance.lang = langInfo.speechCode;
            // Soft, calm conversational tempo & natural gentle pitch
            utterance.rate = 1.0 * (speed || 1.0);
            utterance.pitch = 1.0;
            // Tiered priority: Online Natural (Studio quality) -> Microsoft Neural -> Google Cloud -> Native
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                const targetCode = langInfo.speechCode.toLowerCase();
                const shortCode = langInfo.code.toLowerCase();
                const matchingVoice =
                    voices.find((v) => v.lang.toLowerCase() === targetCode && (v.name.includes("Online (Natural)") || v.name.includes("Neural"))) ||
                    voices.find((v) => (v.lang.toLowerCase() === targetCode || v.lang.toLowerCase().startsWith(shortCode)) &&
                        (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Microsoft") || v.name.includes("Neural") || v.name.includes("Swara") || v.name.includes("Tanishaa") || v.name.includes("Neerja"))) ||
                    voices.find((v) => v.lang.toLowerCase() === targetCode) ||
                    voices.find((v) => v.lang.toLowerCase().startsWith(shortCode));
                if (matchingVoice) {
                    utterance.voice = matchingVoice;
                }
            }
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
        }
        else {
            setIsSpeaking(false);
        }
    }
    useEffect(() => {
        if (typeof window !== "undefined" && window.speechSynthesis) {
            window.speechSynthesis.getVoices();
            const handleVoices = () => {
                window.speechSynthesis.getVoices();
            };
            window.speechSynthesis.addEventListener("voiceschanged", handleVoices);
            return () => {
                stopAudio();
                window.speechSynthesis.removeEventListener("voiceschanged", handleVoices);
            };
        }
        return () => {
            stopAudio();
        };
    }, []);
    return {
        isSpeaking,
        speak,
        stopAudio,
        setSpeed,
    };
}
