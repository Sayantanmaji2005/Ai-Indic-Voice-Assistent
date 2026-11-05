/**
 * Language-specific acoustic profiling:
 * Captures the unique vocal tone, pitch variation, emotional warmth,
 * and conversational cadence of each Indian language and English.
 */
const LANGUAGE_ACOUSTIC_PROFILES = {
    bn: {
        // Bengali: Lively, sweet, cheerful, natural ElevenLabs cadence
        stability: 0.35,
        similarity_boost: 0.80,
        style: 0.38,
        use_speaker_boost: true,
        currencyWord: "টাকা",
        percentWord: "শতাংশ",
        preferredVoice: "cgSgspJ2msm6clMCkdW9",
    },
    hi: {
        // Hindi: Energetic, enthusiastic, confident and natural human tone
        stability: 0.35,
        similarity_boost: 0.80,
        style: 0.40,
        use_speaker_boost: true,
        currencyWord: "रुपये",
        percentWord: "प्रतिशत",
        preferredVoice: "cgSgspJ2msm6clMCkdW9",
    },
    ta: {
        // Tamil: Soft, articulate, pleasant, warm and gentle cadence
        stability: 0.44,
        similarity_boost: 0.82,
        style: 0.18,
        use_speaker_boost: true,
        currencyWord: "ரூபாய்",
        percentWord: "சதவீதம்",
        preferredVoice: "cgSgspJ2msm6clMCkdW9",
    },
    te: {
        // Telugu: Soft, sweet, melodic, gentle and comforting cadence
        stability: 0.44,
        similarity_boost: 0.82,
        style: 0.18,
        use_speaker_boost: true,
        currencyWord: "రూపాయలు",
        percentWord: "శాతం",
        preferredVoice: "cgSgspJ2msm6clMCkdW9",
    },
    mr: {
        // Marathi: Soft, polite, warm, gentle and respectful cadence
        stability: 0.44,
        similarity_boost: 0.82,
        style: 0.18,
        use_speaker_boost: true,
        currencyWord: "रुपये",
        percentWord: "टक्के",
        preferredVoice: "cgSgspJ2msm6clMCkdW9",
    },
    gu: {
        // Gujarati: Sweet, gentle, soft, welcoming and friendly cadence
        stability: 0.44,
        similarity_boost: 0.82,
        style: 0.18,
        use_speaker_boost: true,
        currencyWord: "રૂપિયા",
        percentWord: "ટકા",
        preferredVoice: "cgSgspJ2msm6clMCkdW9",
    },
    pa: {
        // Punjabi: Warm, polite, gentle, affectionate and respectful cadence
        stability: 0.44,
        similarity_boost: 0.82,
        style: 0.18,
        use_speaker_boost: true,
        currencyWord: "ਰੁਪਏ",
        percentWord: "ਫੀਸਦੀ",
        preferredVoice: "cgSgspJ2msm6clMCkdW9",
    },
    kn: {
        // Kannada: Gentle, soft, peaceful, friendly and articulate cadence
        stability: 0.44,
        similarity_boost: 0.82,
        style: 0.18,
        use_speaker_boost: true,
        currencyWord: "ರೂಪಾಯಿ",
        percentWord: "ಪ್ರತಿಶತ",
        preferredVoice: "cgSgspJ2msm6clMCkdW9",
    },
    ml: {
        // Malayalam: Gentle, smooth, pleasant, articulate and soothing cadence
        stability: 0.44,
        similarity_boost: 0.82,
        style: 0.18,
        use_speaker_boost: true,
        currencyWord: "രൂപ",
        percentWord: "ശതമാനം",
        preferredVoice: "cgSgspJ2msm6clMCkdW9",
    },
    or: {
        // Odia: Gentle, sweet, polite, soft and melodic cadence
        stability: 0.44,
        similarity_boost: 0.82,
        style: 0.18,
        use_speaker_boost: true,
        currencyWord: "ଟଙ୍କା",
        percentWord: "ପ୍ରତିଶତ",
        preferredVoice: "cgSgspJ2msm6clMCkdW9",
    },
    ur: {
        // Urdu: Refined, elegant, gentle, soft and courteous conversational warmth
        stability: 0.44,
        similarity_boost: 0.82,
        style: 0.18,
        use_speaker_boost: true,
        currencyWord: "روپے",
        percentWord: "فیصد",
        preferredVoice: "cgSgspJ2msm6clMCkdW9",
    },
    en: {
        // English: Soft, warm, conversational, calm, gentle peer voice
        stability: 0.44,
        similarity_boost: 0.82,
        style: 0.18,
        use_speaker_boost: true,
        currencyWord: "rupees",
        percentWord: "percent",
        preferredVoice: "cgSgspJ2msm6clMCkdW9",
    },
};
const NATIVE_INDIC_NEURAL_VOICES = {
    bn: "bn-IN-TanishaaNeural",      // Authentic Bengali Female (Warm, sweet, natural colloquial cadence)
    hi: "hi-IN-SwaraNeural",         // Authentic Hindi Female (ChatGPT / Gemini grade human cadence)
    en: "en-IN-NeerjaNeural",        // Authentic Indian English Female (Fluent, clear, warm)
    ta: "ta-IN-PallaviNeural",       // Authentic Tamil Female
    te: "te-IN-ShrutiNeural",        // Authentic Telugu Female
    mr: "mr-IN-AarohiNeural",        // Authentic Marathi Female
    gu: "gu-IN-DhwaniNeural",        // Authentic Gujarati Female
    kn: "kn-IN-SapnaNeural",         // Authentic Kannada Female
    ml: "ml-IN-SobhanaNeural",       // Authentic Malayalam Female
    pa: "pa-IN-OjasNeural",          // Authentic Punjabi Male
    ur: "ur-IN-GulNeural",           // Authentic Urdu Female
    or: "bn-IN-TanishaaNeural",      // Odia closest high-fidelity sibling
    as: "bn-IN-TanishaaNeural",      // Assamese closest high-fidelity sibling
};

export class ServerTtsService {
    /**
     * Prepares clean, natural spoken text for lifelike human voice synthesis
     * with language-specific prosody, natural breath pauses, and colloquial rhythm.
     */
    static sanitizeTextForSpeech(rawText, langCode = "hi") {
        if (!rawText)
            return "";
        const profile = LANGUAGE_ACOUSTIC_PROFILES[langCode] || LANGUAGE_ACOUSTIC_PROFILES.hi;
        return (rawText
            // Remove markdown headers, bold, italics, code blocks
            .replace(/#{1,6}\s+/g, "")
            .replace(/\*\*([^*]+)\*\*/g, "$1")
            .replace(/\*([^*]+)\*/g, "$1")
            .replace(/`([^`]+)`/g, "$1")
            // Remove citations like [1], [2], [Source 1], (1)
            .replace(/\[\d+\]/g, "")
            .replace(/\[Source\s+\d+\]/gi, "")
            // Convert parenthesized clarifications into natural spoken clause pauses
            .replace(/\(([^)]+)\)/g, ", $1, ")
            // Remove remaining isolated citation parentheses
            .replace(/\(\d+\)/g, "")
            // Remove URLs
            .replace(/https?:\/\/\S+/g, "")
            // Clean bullet symbols to natural pauses
            .replace(/^[\s*•-]+\s*/gm, "")
            // Clean units and abbreviations for natural speech
            .replace(/\bkm\/h\b/gi, langCode === "bn" ? "কিলোমিটার প্রতি ঘণ্টা" : langCode === "hi" ? "किलोमीटर प्रति घंटा" : "kilometer per hour")
            .replace(/\bkm\/hr\b/gi, langCode === "bn" ? "কিলোমিটার প্রতি ঘণ্টা" : langCode === "hi" ? "किलोमीटर प्रति घंटा" : "kilometer per hour")
            .replace(/(\d+)\s*°C/gi, langCode === "bn" ? "$1 ডিগ্রি সেলসিয়াস" : langCode === "hi" ? "$1 डिग्री सेल्सियस" : "$1 degrees Celsius")
            .replace(/(\d+)\s*kg\b/gi, langCode === "bn" ? "$1 কেজি" : langCode === "hi" ? "$1 किलो" : "$1 kilograms")
            .replace(/(\d+)\s*km\b/gi, langCode === "bn" ? "$1 কিলোমিটার" : langCode === "hi" ? "$1 किलोमीटर" : "$1 kilometers")
            // Convert dash pauses to comma pauses for natural prosody
            .replace(/\s+[—–-]\s+/g, ", ")
            // Convert colons and semicolons before explanations into gentle pauses
            .replace(/:\s+/g, ", ")
            .replace(/;\s+/g, ", ")
            // Convert currency symbols to natural spoken words in the target language
            .replace(/₹\s*(\d[\d,.]*)/g, `$1 ${profile.currencyWord}`)
            .replace(/(\d+)\s*%/g, `$1 ${profile.percentWord}`)
            // Normalize danda (।) with breath pause
            .replace(/([।])\s*/g, "$1 ")
            // Replace multiple newlines with a natural breath pause
            .replace(/\n{2,}/g, ". ")
            .replace(/\n/g, ", ")
            // Remove emojis and decorative symbols that cause vocal stutter
            .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
            // Normalize multiple spaces and punctuation
            .replace(/\s+/g, " ")
            .replace(/,\s*,/g, ",")
            .replace(/\.\s*\./g, ".")
            .trim()
            .slice(0, 1800));
    }
    /**
     * Generates authentic, colloquial native speech via Google Indic Neural TTS.
     * Provides genuine native pronunciation with zero foreign accent.
     * Supports: bn (Bengali), hi (Hindi), ta (Tamil), te (Telugu), mr (Marathi),
     * gu (Gujarati), kn (Kannada), ml (Malayalam), pa (Punjabi), or (Odia), ur (Urdu), en (English).
     */
    static async synthesizeNativeIndic(text, langCode) {
        try {
            // Split into bite-sized spoken phrases by punctuation (।, ., ?, !, ,, ;)
            const rawSentences = text
                .split(/(?<=[।\.\?\!\,\;])\s+/)
                .map((s) => s.trim())
                .filter((s) => s.length > 0);
            // Group phrases into chunks under 180 chars for TTS endpoint
            const chunks = [];
            let current = "";
            for (const sentence of rawSentences) {
                if ((current + " " + sentence).length <= 180) {
                    current = current ? current + " " + sentence : sentence;
                }
                else {
                    if (current)
                        chunks.push(current);
                    if (sentence.length > 180) {
                        const parts = sentence.match(/.{1,160}(\s|$)/g) || [sentence];
                        for (const p of parts) {
                            if (p.trim())
                                chunks.push(p.trim());
                        }
                        current = "";
                    }
                    else {
                        current = sentence;
                    }
                }
            }
            if (current)
                chunks.push(current);
            if (chunks.length === 0)
                return null;
            const audioBuffers = [];
            for (const chunk of chunks) {
                const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${encodeURIComponent(langCode)}&client=tw-ob`;
                const res = await fetch(url, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                    },
                    cache: "no-store",
                });
                if (res.ok) {
                    const buf = Buffer.from(await res.arrayBuffer());
                    audioBuffers.push(buf);
                }
            }
            if (audioBuffers.length === 0)
                return null;
            const combined = Buffer.concat(audioBuffers);
            return combined.buffer.slice(combined.byteOffset, combined.byteOffset + combined.byteLength);
        }
        catch (err) {
            console.warn("Native Indic TTS failed:", err);
            return null;
        }
    }
    /**
     * Generates ultra-realistic human audio buffer via ElevenLabs API
     * dynamically tuned with language-specific acoustic tone, pitch stability, and conversational expressiveness.
     */
    static async synthesizeElevenLabs(text, langCode, customVoiceId) {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey)
            return null;
        const profile = LANGUAGE_ACOUSTIC_PROFILES[langCode] || LANGUAGE_ACOUSTIC_PROFILES.hi;
        const voiceId = customVoiceId || process.env.ELEVENLABS_VOICE_ID || profile.preferredVoice || "cgSgspJ2msm6clMCkdW9";
        try {
            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?optimize_streaming_latency=2&output_format=mp3_44100_128`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "xi-api-key": apiKey,
                    Accept: "audio/mpeg",
                },
                body: JSON.stringify({
                    text,
                    model_id: "eleven_multilingual_v2",
                    voice_settings: {
                        stability: profile.stability,
                        similarity_boost: profile.similarity_boost,
                        style: profile.style,
                        use_speaker_boost: profile.use_speaker_boost,
                    },
                }),
            });
            if (!response.ok)
                return null;
            return await response.arrayBuffer();
        }
        catch {
            return null;
        }
    }
    /**
     * Generates genuine native human speech using studio-grade Indic Neural Models.
     * Provides authentic pronunciation, sweet cadence, and natural Indian vocal inflection
     * (Tanishaa for Bengali, Swara for Hindi, Neerja for Indian English, etc.).
     */
    static async synthesizeEdgeNeural(text, langCode) {
        try {
            const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");
            const voice = NATIVE_INDIC_NEURAL_VOICES[langCode] || NATIVE_INDIC_NEURAL_VOICES.hi;
            const tts = new MsEdgeTTS();
            await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
            const { audioStream } = await tts.toStream(text, { pitch: "+0Hz", rate: "+5%", volume: "+0%" });
            const chunks = [];
            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    resolve(null);
                }, 8000);
                audioStream.on("data", (chunk) => chunks.push(chunk));
                audioStream.on("end", () => {
                    clearTimeout(timeout);
                    if (!chunks.length) return resolve(null);
                    const buf = Buffer.concat(chunks);
                    resolve(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
                });
                audioStream.on("error", (err) => {
                    clearTimeout(timeout);
                    console.warn("Edge neural stream error:", err);
                    resolve(null);
                });
            });
        } catch (err) {
            console.warn("Edge neural synthesis init error:", err);
            return null;
        }
    }

    /**
     * Main synthesis router:
     * - Tier 1: True Native Indic Neural Voices (Tanishaa for Bengali, Swara for Hindi, Neerja for English, etc.)
     *          Provides 100% natural, human-grade conversational voice matching ChatGPT / Gemini Live quality.
     * - Tier 2: ElevenLabs Multilingual (for user's custom cloned voice ID or fallback)
     * - Tier 3: Google Indic Neural Speech fallback
     */
    static async synthesize(text, language = "hi", customVoiceId) {
        const normLang = (language || "hi").toLowerCase().trim();
        const speechText = this.sanitizeTextForSpeech(text, normLang);
        if (!speechText)
            return null;

        // 1. If user provided a specific custom voice ID (e.g. cloned voice): use ElevenLabs first
        if (customVoiceId) {
            const customAudio = await this.synthesizeElevenLabs(speechText, normLang, customVoiceId);
            if (customAudio && customAudio.byteLength > 0) {
                return customAudio;
            }
        }

        // 2. PRIMARY: Dedicated Native Indic Neural Voices (Tanishaa for Bengali, Swara for Hindi, Aarohi for Marathi, Neerja for Indian English, etc.)
        // Provides 100% authentic, human-grade conversational speech with true native phonetics and zero foreign accent.
        const nativeNeuralAudio = await this.synthesizeEdgeNeural(speechText, normLang);
        if (nativeNeuralAudio && nativeNeuralAudio.byteLength > 0) {
            return nativeNeuralAudio;
        }

        // 3. ElevenLabs Multilingual v2 Fallback
        const elevenAudio = await this.synthesizeElevenLabs(speechText, normLang, customVoiceId);
        if (elevenAudio && elevenAudio.byteLength > 0) {
            return elevenAudio;
        }

        // 4. Google Indic Neural Speech Fallback
        const nativeAudio = await this.synthesizeNativeIndic(speechText, normLang === "en" ? "en-IN" : normLang);
        if (nativeAudio && nativeAudio.byteLength > 0) {
            return nativeAudio;
        }

        return null;
    }
}
