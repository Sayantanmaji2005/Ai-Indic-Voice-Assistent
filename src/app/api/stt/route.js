import { NextResponse } from "next/server";
import { detectLanguage, isBengaliPhoneticsInDevanagari, isMarathiPhoneticsInDevanagari } from "@/lib/languages";
const WHISPER_INDIAN_PROMPT = "বাংলা, हिन्दी, English, தமிழ், తెలుగు, मराठी, ગુજરાતી, ಕನ್ನಡ, മലയാളം, ਪੰਜਾਬੀ, ଓଡ଼ିଆ, اردو. Everyday Indian conversational speech, weather, news, recipes, trains, gold price, technology, health, daily questions, Hinglish, Banglish, Tanglish. High accuracy multilingual transcription.";
const NATIVE_INDIC_PROMPTS = {
    bn: {
        regex: /[\u0980-\u09FF]/,
        prompt: "বাংলা স্বাভাবিক কথ্য ভাষা, আবহাওয়া কেমন, আজকের খবর, সোনার দাম, ট্রেনের টিকিট, রান্নার রেসিপি, ডাক্তার ও ওষুধ, প্রতিদিনের সাহায্য",
    },
    ta: {
        regex: /[\u0B80-\u0BFF]/,
        prompt: "தமிழ் உரையாடல், இன்றைய வானிலை, முக்கிய செய்திகள், தங்கம் விலை, ரயில் நேரம், சமையல் குறிப்புகள், அன்றாட வாழ்க்கைத் தகவல்கள்",
    },
    te: {
        regex: /[\u0C00-\u0C7F]/,
        prompt: "తెలుగు సంభాషణ, నేటి వాతావరణం, తాజా వార్తలు, బంగారం ధర, రైలు సమయాలు, వంటల సమాచారం, రోజువారీ వివరాలు",
    },
    mr: {
        regex: /(?:आहे|नाही|काय|झाला|केला|होता|कसा)/,
        prompt: "मराठी संभाषण, आजचे हवामान, ताज्या बातम्या, सोन्याचे भाव, लोकल ट्रेन अपडेट, रोजच्या कामाची माहिती, रेसिपी",
    },
    gu: {
        regex: /[\u0A80-\u0AFF]/,
        prompt: "ગુજરાતી ભાષા, ભારતના વર્તમાન વડાપ્રધાન કોણ છે, આજનું હવામાન કેવું છે",
    },
    kn: {
        regex: /[\u0C80-\u0CFF]/,
        prompt: "ಕನ್ನಡ ಭಾಷೆ, ಭಾರತದ ಪ್ರಸ್ತುತ ಪ್ರಧಾನ ಮಂತ್ರಿ ಯಾರು, ಇಂದಿನ ಹವಾಮಾನ",
    },
    ml: {
        regex: /[\u0D00-\u0D7F]/,
        prompt: "മലയാള ഭാഷ, ഭാരതത്തിന്റെ ഇപ്പോഴത്തെ പ്രധാനമന്ത്രി ആരാണ്, ഇന്നത്തെ കാലാവസ്ഥ",
    },
    pa: {
        regex: /[\u0A00-\u0A7F]/,
        prompt: "ਪੰਜਾਬੀ ਭਾਸ਼ਾ, ਭਾਰਤ ਦੇ ਮੌਜੂਦਾ ਪ੍ਰਧਾਨ ਮੰਤਰੀ ਕੌਣ ਹਨ, ਅੱਜ ਦਾ ਮੌਸਮ ਕਿਹੋ ਜਿਹਾ ਹੈ",
    },
    or: {
        regex: /[\u0B00-\u0B7F]/,
        prompt: "ଓଡ଼ିଆ ଭାଷା, ଭାରତର ବର୍ତ୍ତମାନର ପ୍ରଧାନମନ୍ତ୍ରୀ କିଏ, ଆଜିର ପାଣିପାଗ",
    },
    ur: {
        regex: /[\u0600-\u06FF]/,
        prompt: "اردو زبان، بھارت کے موجودہ وزیر اعظم کون ہیں، آج کا موسم کیسا ہے",
    },
    as: {
        regex: /[\u0980-\u09FF]/,
        prompt: "অসমীয়া ভাষা, ভাৰতৰ বৰ্তমান প্ৰধানমন্ত্ৰী কোন, আজিৰ বতৰ কেনেকুৱা",
    },
};
// Language code mapping from Whisper language names to Indica language codes
const whisperLanguageMap = {
    bengali: "bn",
    bangla: "bn",
    hindi: "hi",
    english: "en",
    telugu: "te",
    tamil: "ta",
    marathi: "mr",
    gujarati: "gu",
    kannada: "kn",
    malayalam: "ml",
    punjabi: "pa",
    odia: "or",
    oriya: "or",
    urdu: "ur",
    assamese: "as",
    nepali: "ne",
    sanskrit: "sa",
};
function refineSpokenLanguage(text, whisperDetectedLang, preferredLang) {
    if (preferredLang && preferredLang !== "auto") {
        return preferredLang;
    }
    // 1. High-precision Bengali script check
    if (/[\u0980-\u09FF]/.test(text))
        return "bn";
    // 2. Check if Devanagari contains Bengali speech phonetics
    if (isBengaliPhoneticsInDevanagari(text))
        return "bn";
    // 3. Check for Marathi in Devanagari
    if (isMarathiPhoneticsInDevanagari(text))
        return "mr";
    // 4. Pure Hindi Devanagari
    if (/[\u0900-\u097F]/.test(text)) {
        return "hi";
    }
    // 5. Other Dravidian and Regional scripts
    if (/[\u0B80-\u0BFF]/.test(text))
        return "ta"; // Tamil
    if (/[\u0C00-\u0C7F]/.test(text))
        return "te"; // Telugu
    if (/[\u0D00-\u0D7F]/.test(text))
        return "ml"; // Malayalam
    if (/[\u0C80-\u0CFF]/.test(text))
        return "kn"; // Kannada
    if (/[\u0A80-\u0AFF]/.test(text))
        return "gu"; // Gujarati
    if (/[\u0A00-\u0A7F]/.test(text))
        return "pa"; // Punjabi
    if (/[\u0B00-\u0B7F]/.test(text))
        return "or"; // Odia
    if (/[\u0600-\u06FF]/.test(text))
        return "ur"; // Urdu
    // 6. Romanized vocabulary detection (Banglish, Hinglish, etc.)
    const detectedByVocabulary = detectLanguage(text, "auto");
    if (detectedByVocabulary && detectedByVocabulary !== "auto" && detectedByVocabulary !== "en") {
        return detectedByVocabulary;
    }
    // 7. Fallback to Whisper's mapped language
    if (whisperDetectedLang && whisperDetectedLang !== "auto" && whisperDetectedLang !== "en") {
        return whisperDetectedLang;
    }
    return detectedByVocabulary || "en";
}
export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file");
        const preferredLanguage = formData.get("language") || "auto";
        if (!file || file.size === 0) {
            return NextResponse.json({ success: false, message: "No audio file provided" }, { status: 400 });
        }
        const groqKey = process.env.GROQ_API_KEY;
        const openAiKey = process.env.OPENAI_API_KEY;
        // 1. Try Groq Whisper Large v3 (Free, ultra-fast 300ms neural transcription + auto-language detection)
        if (groqKey) {
            const groqWhisperModels = ["whisper-large-v3", "whisper-large-v3-turbo"];
            for (const model of groqWhisperModels) {
                try {
                    const groqForm = new FormData();
                    groqForm.append("file", file, "audio.webm");
                    groqForm.append("model", model);
                    groqForm.append("response_format", "verbose_json");
                    groqForm.append("prompt", WHISPER_INDIAN_PROMPT);
                    groqForm.append("temperature", "0");
                    if (preferredLanguage && preferredLanguage !== "auto" && preferredLanguage !== "en") {
                        groqForm.append("language", preferredLanguage);
                    }
                    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${groqKey}`,
                        },
                        body: groqForm,
                    });
                    if (res.ok) {
                        const data = (await res.json());
                        let rawText = (data.text || "").trim();
                        const rawLang = (data.language || "").toLowerCase().trim();
                        const whisperMapped = whisperLanguageMap[rawLang] || rawLang;
                        let finalLanguage = refineSpokenLanguage(rawText, whisperMapped, preferredLanguage);
                        // Universal Indic Refinement: If an Indic language was detected but transcribed
                        // into Devanagari or Latin characters, re-run Whisper with its native language code and prompt
                        const indicInfo = NATIVE_INDIC_PROMPTS[finalLanguage];
                        if (indicInfo && !indicInfo.regex.test(rawText) && file) {
                            try {
                                const refineForm = new FormData();
                                refineForm.append("file", file, "audio.webm");
                                refineForm.append("model", model);
                                refineForm.append("response_format", "verbose_json");
                                refineForm.append("language", finalLanguage);
                                refineForm.append("prompt", indicInfo.prompt);
                                refineForm.append("temperature", "0");
                                const refineRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
                                    method: "POST",
                                    headers: {
                                        Authorization: `Bearer ${groqKey}`,
                                    },
                                    body: refineForm,
                                });
                                if (refineRes.ok) {
                                    const refineData = (await refineRes.json());
                                    if (refineData.text && refineData.text.trim()) {
                                        rawText = refineData.text.trim();
                                    }
                                }
                            }
                            catch (refineErr) {
                                console.warn(`${finalLanguage} refinement pass notice:`, refineErr);
                            }
                        }
                        if (rawText) {
                            return NextResponse.json({
                                success: true,
                                text: rawText,
                                detectedLanguage: finalLanguage,
                                engine: `groq-${model}`,
                            });
                        }
                    }
                    else {
                        const errText = await res.text();
                        console.warn(`Groq Whisper (${model}) error response:`, errText);
                    }
                }
                catch (groqErr) {
                    console.warn(`Groq Whisper (${model}) transcription exception:`, groqErr);
                }
            }
        }
        // 2. Fallback to OpenAI Whisper (whisper-1)
        if (openAiKey) {
            try {
                const openAiForm = new FormData();
                openAiForm.append("file", file, "audio.webm");
                openAiForm.append("model", "whisper-1");
                openAiForm.append("response_format", "verbose_json");
                openAiForm.append("prompt", WHISPER_INDIAN_PROMPT);
                openAiForm.append("temperature", "0");
                if (preferredLanguage && preferredLanguage !== "auto" && preferredLanguage !== "en") {
                    openAiForm.append("language", preferredLanguage);
                }
                const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${openAiKey}`,
                    },
                    body: openAiForm,
                });
                if (res.ok) {
                    const data = (await res.json());
                    const rawText = (data.text || "").trim();
                    const rawLang = (data.language || "").toLowerCase().trim();
                    const whisperMapped = whisperLanguageMap[rawLang] || rawLang;
                    const finalLanguage = refineSpokenLanguage(rawText, whisperMapped, preferredLanguage);
                    if (rawText) {
                        return NextResponse.json({
                            success: true,
                            text: rawText,
                            detectedLanguage: finalLanguage,
                            engine: "openai-whisper-1",
                        });
                    }
                }
            }
            catch (openAiErr) {
                console.warn("OpenAI Whisper fallback exception:", openAiErr);
            }
        }
        return NextResponse.json({ success: false, message: "Could not transcribe audio using server whisper engines" }, { status: 502 });
    }
    catch (error) {
        console.error("STT route error:", error);
        return NextResponse.json({ success: false, message: "Internal server error during speech transcription" }, { status: 500 });
    }
}
