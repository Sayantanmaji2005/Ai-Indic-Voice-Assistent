export class IndicaApiClient {
    /**
     * Sends search query from browser client to server backend API (/api/search)
     */
    static async search(params, signal) {
        const response = await fetch("/api/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params),
            signal,
        });
        const payload = (await response.json());
        if (!response.ok || !payload.success || !payload.data) {
            throw new Error(payload.message || "Failed to retrieve search results from server");
        }
        return payload.data;
    }
    /**
     * Requests audio stream from backend TTS API (/api/tts)
     * Supports custom cloned voice IDs and acoustic matching
     */
    static async generateSpeechAudio(text, language, voiceId, signal) {
        try {
            const response = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, language, voiceId }),
                signal,
            });
            const contentType = response.headers.get("content-type") || "";
            if (response.ok && contentType.includes("audio/mpeg")) {
                return await response.blob();
            }
            return null;
        }
        catch {
            return null;
        }
    }
    /**
     * High-Tech Voice Cloning API (/api/voice-clone)
     * Uploads user's voice sample to clone acoustic profile or instant clone via ElevenLabs
     */
    static async cloneVoice(audioBlob, name) {
        try {
            const formData = new FormData();
            formData.append("file", audioBlob, "user_voice.webm");
            if (name)
                formData.append("name", name);
            const response = await fetch("/api/voice-clone", {
                method: "POST",
                body: formData,
            });
            if (response.ok) {
                return await response.json();
            }
            return null;
        }
        catch {
            return null;
        }
    }
    /**
     * Transcribes microphone audio via Whisper Large v3 (/api/stt)
     * Automatically identifies spoken language with neural accuracy.
     */
    static async transcribeAudio(audioBlob, preferredLanguage = "auto", signal) {
        try {
            const formData = new FormData();
            formData.append("file", audioBlob, "speech.webm");
            formData.append("language", preferredLanguage);
            const response = await fetch("/api/stt", {
                method: "POST",
                body: formData,
                signal,
            });
            if (!response.ok)
                return null;
            const data = (await response.json());
            if (data.success && data.text) {
                return {
                    text: data.text,
                    detectedLanguage: data.detectedLanguage || (preferredLanguage !== "auto" ? preferredLanguage : "en"),
                };
            }
            return null;
        }
        catch (err) {
            console.warn("Audio transcription request failed:", err);
            return null;
        }
    }
    /**
     * Checks server system health
     */
    static async getHealth() {
        const res = await fetch("/api/health");
        return await res.json();
    }
}
// Backward compatibility alias
export const BhaashaApiClient = IndicaApiClient;
