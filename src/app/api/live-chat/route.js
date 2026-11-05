import { NextResponse } from "next/server";
import { detectLanguage, languageByCode } from "@/lib/languages";
import { TavilySearchProvider } from "@/lib/search/providers";
import { getVoiceAgentForLanguage } from "@/lib/agents/indic-voice-agents";

// Casual greetings and identity inquiries that must respond immediately without web search delay
const CASUAL_OR_IDENTITY_QUERY = /^(?:(?:hello|hi|hey|hallo|namaste|namaskar|kemon\s+acho|kemon\s+achen|kaise\s+ho|kya\s+haal|tumi\s+ke|aap\s+kaun\s+ho|tum\s+kaun\s+ho|who\s+are\s+you|what\s+is\s+your\s+name|apnar\s+naam\s+ki|tomar\s+naam\s+ki|kya\s+naam\s+hai|shunte\s+pachho|sun\s+rahe\s+ho|good\s+morning|good\s+evening|good\s+night|shuvo\s+sokal|suprabhat|thanks|thank\s+you|dhanyawad|dhonnobad|how\s+are\s+you|what\s+can\s+you\s+do|ki\s+korte\s+paro|kya\s+kar\s+sakte\s+ho|bhalo\s+achi|theek\s+hoon|aur\s+batao|bolun|shunun)\b)/i;

// Strict indicators that actually require real-time web grounding
const REALTIME_SEARCH_INDICATORS = /(?:\b(?:weather|temperature|forecast|score|match|vs|stock|sensex|nifty|gold\s+price|petrol|diesel|breaking\s+news|today's\s+news|latest\s+news|current\s+price|exchange\s+rate|cricket|election|who\s+won|president\s+of|prime\s+minister\s+of)\b)|(?:\b(?:আবহাওয়া|তাপমাত্রা|আজকের\s+খবর|সোনার\s+দাম|বর্তমান\s+প্রধানমন্ত্রী|বর্তমান\s+রাষ্ট্রপতি)\b)|(?:\b(?:मौसम|तापमान|आज\s+की\s+ताज़ा\s+खबर|सोने\s+का\s+भाव|पेट्रोल\s+का\s+दाम|वर्तमान\s+प्रधानमंत्री|वर्तमान\s+राष्ट्रपति)\b)/i;

export async function POST(request) {
    try {
        const { message, history = [], language = "auto" } = await request.json();

        if (!message || !message.trim()) {
            return NextResponse.json(
                { success: false, message: "No input message provided" },
                { status: 400 }
            );
        }

        const groqKey = process.env.GROQ_API_KEY;
        const openAiKey = process.env.OPENAI_API_KEY;

        // 1. Precise Initial Language Detection & Dedicated AI Voice Agent Resolution
        const cleanMsg = message.trim();
        const detectedLang = detectLanguage(cleanMsg, language);
        let resolvedLang = (language && language !== "auto") ? language : detectedLang;
        let langInfo = languageByCode(resolvedLang);
        let agent = getVoiceAgentForLanguage(resolvedLang);

        // 2. Real-Time Search Grounding (Only for genuine real-time facts, never for greetings)
        let searchSources = [];
        let sourceContext = "";

        const isCasual = CASUAL_OR_IDENTITY_QUERY.test(cleanMsg);
        const isFactualQuery = !isCasual && REALTIME_SEARCH_INDICATORS.test(cleanMsg);

        if (isFactualQuery) {
            try {
                const searchPromise = (new TavilySearchProvider()).searchWithImages(cleanMsg, "ai");
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Search timeout")), 1200));
                const searchResult = await Promise.race([searchPromise, timeoutPromise]);
                if (searchResult && Array.isArray(searchResult.sources) && searchResult.sources.length > 0) {
                    searchSources = searchResult.sources.slice(0, 3);
                    sourceContext = searchSources
                        .map((s, idx) => `[Source ${idx + 1}] (${s.publisher}): ${s.title} - ${s.snippet}`)
                        .join("\n\n");
                }
            } catch (searchErr) {
                console.warn("Live chat search grounding notice:", searchErr);
            }
        }

        // 3. Dedicated Language AI Agent System Prompt
        const systemPrompt = `You are INDICA, an ultra-intelligent, deeply knowledgeable, articulate, and warm conversational AI companion.
YOUR ONLY IDENTITY IS INDICA.

========================================================================
DIRECT, INTELLIGENT & CONVERSATIONAL ANSWER DIRECTIVE (CRITICAL)
========================================================================
- If user asks ANY question or prompt (e.g., science, history, facts, code, advice, stories):
  JUMP STRAIGHT INTO THE ACCURATE, INTELLIGENT ANSWER.
  DO NOT introduce yourself. NEVER say "I am Indica" or "How can I help you" when answering a question. Answer directly with clarity and high intellect.
- Only greet or introduce yourself if the user explicitly greets first (e.g., "Hello", "Hi", "Who are you").
- Response Length: Typically 2 to 3 engaging, conversational spoken sentences.
- Natural Human Follow-Up: At the end of your answer, warmly ask if they have any other query (e.g. In Bengali: "...আর কিছু জানতে চান?", In Hindi: "...क्या कोई और सवाल है आपका?", In English: "...Do you have any other questions on this?").
- ABSOLUTELY NO MARKDOWN: Never use asterisks (*, **), hash tags (#), bullet dashes (-), numbered lists, emojis, brackets ([1]), or links. Speak pure natural prose.

========================================================================
AUTHENTIC INDIC LANGUAGE FIDELITY (STRICT)
========================================================================
The user's spoken language has been identified as: ${langInfo.label} (${langInfo.nativeLabel}, code: "${resolvedLang}").
- If Bengali: Respond 100% in natural, fluent, sweet Bengali (বাংলা লিপি).
- If Hindi: Respond 100% in confident, natural, fluent Hindi (हिन्दी).
- If Marathi: Respond 100% in pure authentic Marathi (मराठी).
- If Tamil / Telugu / Gujarati / Punjabi / Kannada / Malayalam / Odia: Respond authentically in that tongue.
- If English: Respond in natural, fluent Indian English.
Do NOT mix languages or switch to English unless user spoke English.
${sourceContext ? `\nFACTS FROM REAL-TIME SEARCH:\n${sourceContext}\nUse these real-time facts naturally in your spoken answer.` : ""}`;

        // Build conversational messages
        const conversationMessages = [
            { role: "system", content: systemPrompt },
        ];

        // Append recent history for conversational continuity
        if (Array.isArray(history)) {
            const recentHistory = history.slice(-4);
            for (const h of recentHistory) {
                if (h.role && h.content) {
                    conversationMessages.push({
                        role: h.role === "assistant" ? "assistant" : "user",
                        content: String(h.content).slice(0, 350),
                    });
                }
            }
        }

        // Add current user message
        conversationMessages.push({ role: "user", content: message.trim() });

        let replyText = "";

        // 4. Try Groq Multilingual Models for ultra-fast, high-intelligence response
        if (groqKey) {
            const models = [
                process.env.GROQ_MODEL,
                "qwen/qwen3.8-27b",
                "openai/gpt-oss-120b",
                "allam-2-7b",
            ].filter(Boolean);

            for (const model of models) {
                try {
                    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${groqKey}`,
                        },
                        body: JSON.stringify({
                            model,
                            messages: conversationMessages,
                            temperature: 0.6,
                            max_tokens: 180,
                        }),
                    });

                    if (res.ok) {
                        const data = await res.json();
                        const content = data.choices?.[0]?.message?.content?.trim();
                        if (content) {
                            replyText = content;
                            break;
                        }
                    }
                } catch (e) {
                    console.warn(`Groq live chat ${model} notice:`, e);
                }
            }
        }

        // 5. Fallback to OpenAI if Groq unavailable
        if (!replyText && openAiKey) {
            try {
                const res = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${openAiKey}`,
                    },
                    body: JSON.stringify({
                        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
                        messages: conversationMessages,
                        temperature: 0.5,
                        max_tokens: 140,
                    }),
                });

                if (res.ok) {
                    const data = await res.json();
                    replyText = data.choices?.[0]?.message?.content?.trim() || "";
                }
            } catch (e) {
                console.warn("OpenAI live chat notice:", e);
            }
        }

        // 6. Graceful dedicated agent fallbacks
        if (!replyText) {
            replyText = agent.greeting;
        }

        // Clean any residual markdown artifacts
        replyText = replyText
            .replace(/[*#_~`]/g, "")
            .replace(/\[\d+\]/g, "")
            .replace(/\s+/g, " ")
            .trim();

        // 7. Dynamically anchor final language & agent to the actual script of replyText
        if (/[\u0980-\u09FF]/.test(replyText)) {
            resolvedLang = "bn";
        } else if (/[\u0900-\u097F]/.test(replyText)) {
            if (replyText.includes("आहे") || replyText.includes("नाही") || replyText.includes("काय") || replyText.includes("कसा")) {
                resolvedLang = "mr";
            } else {
                resolvedLang = "hi";
            }
        } else if (/[\u0B80-\u0BFF]/.test(replyText)) {
            resolvedLang = "ta";
        } else if (/[\u0C00-\u0C7F]/.test(replyText)) {
            resolvedLang = "te";
        } else if (/[\u0A80-\u0AFF]/.test(replyText)) {
            resolvedLang = "gu";
        } else if (/[\u0C80-\u0CFF]/.test(replyText)) {
            resolvedLang = "kn";
        } else if (/[\u0D00-\u0D7F]/.test(replyText)) {
            resolvedLang = "ml";
        } else if (/[\u0A00-\u0A7F]/.test(replyText)) {
            resolvedLang = "pa";
        } else if (/[\u0B00-\u0B7F]/.test(replyText)) {
            resolvedLang = "or";
        }
        agent = getVoiceAgentForLanguage(resolvedLang);

        return NextResponse.json({
            success: true,
            reply: replyText,
            language: resolvedLang,
            detectedLanguage: detectedLang,
            agent: {
                id: agent.id,
                name: agent.name,
                nativeName: agent.nativeName,
                badge: agent.badge,
                role: agent.role,
                avatarColor: agent.avatarColor,
                neuralVoice: agent.neuralVoice,
            },
            query: message,
            sources: searchSources.map((s) => ({
                id: s.id,
                title: s.title,
                publisher: s.publisher,
                url: s.url,
                snippet: s.snippet,
            })),
        });
    } catch (error) {
        console.error("Live chat route error:", error);
        return NextResponse.json(
            { success: false, message: "Live conversation error" },
            { status: 500 }
        );
    }
}
