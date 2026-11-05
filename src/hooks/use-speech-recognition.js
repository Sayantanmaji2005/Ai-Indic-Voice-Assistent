"use client";
import { useEffect, useRef, useState } from "react";
import { IndicaApiClient } from "@/lib/api-client";
import { detectLanguage, languageByCode, languages } from "@/lib/languages";
export function useSpeechRecognition({ language, onSpeechResult, onSpeechEnd, onError, }) {
    const [isListening, setIsListening] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const recognitionRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const transcriptRef = useRef("");
    const mediaStreamRef = useRef(null);
    const silenceTimerRef = useRef(null);
    const isStoppingRef = useRef(false);
    const selectedLanguage = languageByCode(language);
    const resetSilenceTimer = (delayMs = 2800) => {
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
        }
        silenceTimerRef.current = setTimeout(() => {
            if (transcriptRef.current.trim().length > 0) {
                stopListening();
            }
        }, delayMs);
    };
    async function startListening() {
        if (typeof window === "undefined")
            return;
        transcriptRef.current = "";
        audioChunksRef.current = [];
        isStoppingRef.current = false;
        // 1. Start Studio-Grade Noise-Cancelled Audio Stream Recording
        let stream = null;
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        channelCount: 1,
                        sampleRate: 48000,
                    },
                });
                mediaStreamRef.current = stream;
                // Choose optimal supported mimeType
                let mimeType = "audio/webm";
                if (typeof MediaRecorder !== "undefined") {
                    if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
                        mimeType = "audio/webm;codecs=opus";
                    }
                    else if (MediaRecorder.isTypeSupported("audio/mp4")) {
                        mimeType = "audio/mp4";
                    }
                    const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128000 });
                    recorder.ondataavailable = (e) => {
                        if (e.data && e.data.size > 0) {
                            audioChunksRef.current.push(e.data);
                        }
                    };
                    recorder.start(100); // 100ms high-density slices
                    mediaRecorderRef.current = recorder;
                }
            }
        }
        catch (mediaErr) {
            console.warn("MediaRecorder mic access error:", mediaErr);
        }
        // 2. Start browser Web Speech API with CONTINUOUS mode to avoid abrupt cutoff
        const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
        if (Recognition) {
            try {
                const recognition = new Recognition();
                let speechLang = selectedLanguage.speechCode;
                if (language === "auto" || speechLang === "auto") {
                    let detectedLocale = "en-IN";
                    if (typeof navigator !== "undefined") {
                        const userLangs = navigator.languages?.length ? navigator.languages : [navigator.language];
                        for (const uLang of userLangs) {
                            if (!uLang)
                                continue;
                            const prefix = uLang.toLowerCase().split("-")[0];
                            const match = languages.find((l) => l.code === prefix && l.code !== "auto");
                            if (match) {
                                detectedLocale = match.speechCode;
                                break;
                            }
                        }
                    }
                    speechLang = detectedLocale;
                }
                recognition.lang = speechLang;
                recognition.continuous = true; // Continuous listening so the user is never cut off mid-thought
                recognition.interimResults = true;
                recognition.onresult = (event) => {
                    let interim = "";
                    let final = "";
                    for (let i = 0; i < (event.results.length || 0); i++) {
                        const item = event.results[i];
                        if (item?.isFinal) {
                            final += (item[0]?.transcript || "") + " ";
                        }
                        else if (item?.[0]) {
                            interim += item[0].transcript;
                        }
                    }
                    const currentText = (final.trim() || interim.trim() || event.results[0]?.[0]?.transcript || "").trim();
                    if (currentText) {
                        transcriptRef.current = currentText;
                        onSpeechResult?.(currentText, Boolean(final));
                        // ChatGPT / Gemini Voice style turn-taking:
                        // If sentence finalized, respond snappily in 1.5s; if still producing words, keep listening
                        const silenceWindow = Boolean(final) ? 1500 : 2600;
                        resetSilenceTimer(silenceWindow);
                    }
                };
                recognition.onerror = () => {
                    console.warn("Browser SpeechRecognition notice");
                };
                recognition.onend = () => {
                    if (!isStoppingRef.current) {
                        handleFinishListening();
                    }
                };
                recognitionRef.current = recognition;
                recognition.start();
            }
            catch {
                console.warn("Browser speech recognition could not start, relying on MediaRecorder");
            }
        }
        if (!stream && !Recognition) {
            onError?.("Microphone is not supported in this browser. Please use Chrome, Edge, or a modern browser.");
            return;
        }
        setIsListening(true);
        resetSilenceTimer(7000); // 7s initial allowance to start speaking
    }
    async function handleFinishListening() {
        if (isStoppingRef.current)
            return;
        isStoppingRef.current = true;
        setIsListening(false);
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
        // Stop MediaStream tracks
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track) => track.stop());
            mediaStreamRef.current = null;
        }
        // Stop MediaRecorder and grab audio chunks
        const recorder = mediaRecorderRef.current;
        mediaRecorderRef.current = null;
        if (recorder && recorder.state !== "inactive") {
            recorder.stop();
        }
        // Wait 120ms for final audio frames to flush
        await new Promise((r) => setTimeout(r, 120));
        const chunks = audioChunksRef.current;
        if (chunks.length > 0) {
            setIsTranscribing(true);
            const audioBlob = new Blob(chunks, { type: recorder?.mimeType || "audio/webm" });
            try {
                const whisperResult = await IndicaApiClient.transcribeAudio(audioBlob, language);
                if (whisperResult && whisperResult.text && whisperResult.text.trim()) {
                    const finalWhisperText = whisperResult.text.trim();
                    const finalDetectedLang = whisperResult.detectedLanguage || detectLanguage(finalWhisperText, language);
                    setIsTranscribing(false);
                    transcriptRef.current = finalWhisperText;
                    onSpeechResult?.(finalWhisperText, true);
                    onSpeechEnd?.(finalWhisperText, finalDetectedLang, audioBlob);
                    return;
                }
            }
            catch (whisperErr) {
                console.warn("Whisper transcription failed, falling back to browser transcript:", whisperErr);
            }
            finally {
                setIsTranscribing(false);
            }
        }
        // Fallback: Use browser recognition text if available
        const browserText = transcriptRef.current.trim();
        if (browserText) {
            const detected = detectLanguage(browserText, language);
            const fallbackBlob = audioChunksRef.current.length > 0 ? new Blob(audioChunksRef.current, { type: "audio/webm" }) : undefined;
            onSpeechEnd?.(browserText, detected, fallbackBlob);
        }
        else {
            onError?.("I couldn't hear clearly. Please check your microphone and speak again.");
        }
    }
    function stopListening() {
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            }
            catch { }
        }
        void handleFinishListening();
    }
    useEffect(() => {
        return () => {
            if (silenceTimerRef.current)
                clearTimeout(silenceTimerRef.current);
            recognitionRef.current?.stop();
            mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        };
    }, []);
    return {
        isListening,
        isTranscribing,
        startListening,
        stopListening,
    };
}
