import { NextResponse } from "next/server";
import { detectLanguage, languageByCode } from "@/lib/languages";
import { TavilySearchProvider } from "@/lib/search/providers";
import { getVoiceAgentForLanguage } from "@/lib/agents/indic-voice-agents";

// Questions or queries that benefit from live web search grounding
const FACTUAL_SEARCH_INDICATORS = /(?:(?:what|who|where|when|why|how|which|tell me|weather|price|gold|news|stock|match|score|train|flight|history|capital|meaning|recipe)\b)|(?:(?:কি|কী|কে|কোথায়|কখন|কেন|কিভাবে|কত|দাম|আবহাওয়া|খবর|ইতিহাস|রাজধানী)\b)|(?:(?:क्या|कौन|कहाँ|कब|क्यों|कैसे|कितना|भाव|मौसम|समाचार|इतिहास|राजधानी)\b)/i;

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

        // 1. Precise Language Detection & Dedicated AI Voice Agent Resolution
        const detectedLang = detectLanguage(message, language);
        const resolvedLang = (language && language !== "auto") ? language : detectedLang;
        const langInfo = languageByCode(resolvedLang);
        const agent = getVoiceAgentForLanguage(resolvedLang);

        // 2. Real-Time Search Grounding via Tavily Search Engine
        let searchSources = [];
        let sourceContext = "";

        // Check if query seeks real-time / factual information
        const isFactualQuery = FACTUAL_SEARCH_INDICATORS.test(message) || message.trim().length > 6;
        if (isFactualQuery) {
            try {
                const searchProvider = new TavilySearchProvider();
                const searchResult = await searchProvider.searchWithImages(message, "ai");
                if (searchResult && Array.isArray(searchResult.sources) && searchResult.sources.length > 0) {
                    searchSources = searchResult.sources.slice(0, 4);
                    sourceContext = searchSources
                        .map((s, idx) => `[Source ${idx + 1}] (${s.publisher}): ${s.title} - ${s.snippet}`)
                        .join("\n\n");
                }
            } catch (searchErr) {
                console.warn("Live chat search grounding notice:", searchErr);
            }
        }

        // 3. Dedicated Language AI Agent System Prompt
        const systemPrompt = `You are INDICA (${agent.nativeName}), the ${agent.role}.
YOUR ONLY IDENTITY IS INDICA. NEVER CALL YOURSELF ANY OTHER NAME.

========================================================================
CONVERSATIONAL & ENERGETIC DELIVERY DIRECTIVES
========================================================================
${agent.systemDirectives}

Current Language: ${langInfo.label} (${langInfo.nativeLabel}, code: "${resolvedLang}").
Voice Engine: Native Indic Neural (${agent.neuralVoice}).

========================================================================
CRITICAL RULE #1: STRICT & 100% LANGUAGE FIDELITY
========================================================================
You MUST respond 100% in ${langInfo.label} (${langInfo.nativeLabel}).
- If user speaks Bengali, answer 100% in pure natural Bengali.
- If user speaks Hindi, answer 100% in natural confident Hindi.
- If user speaks Marathi, answer 100% in pure authentic Marathi.
- If user speaks English, answer 100% in natural Indian English.
- Do NOT mix languages.

========================================================================
CRITICAL RULE #2: SPOKEN CONVERSATIONAL DELIVERY
========================================================================
- Sound energetic, intelligent, lively, and warm.
- Keep replies conversational and direct (typically 2 to 3 spoken sentences).
- ABSOLUTELY NO MARKDOWN: Never use asterisks (*, **), headers (#), bullet dashes (-), numbered lists, brackets ([1]), or URL links.

${sourceContext ? `========================================================================
LIVE SEARCH GROUNDING EVIDENCE (REAL-TIME WEB INFORMATION):
========================================================================
${sourceContext}

Use the live search facts above to give a 100% accurate, up-to-date answer in ${langInfo.label}.` : ""}`;

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

        // 4. Try Groq Llama-3.3-70b-versatile for ultra-fast response
        if (groqKey) {
            const models = [
                "llama-3.3-70b-versatile",
                "llama-3.1-8b-instant",
                process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
            ];

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
                            temperature: 0.5,
                            max_tokens: 300,
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
                        max_tokens: 300,
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
