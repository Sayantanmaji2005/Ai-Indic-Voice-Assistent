import { NextResponse } from "next/server";
export async function GET() {
    const providers = {
        search: Boolean(process.env.TAVILY_API_KEY) ? "tavily" : "multi-engine-preview",
        ai: Boolean(process.env.GROQ_API_KEY)
            ? `groq (${process.env.GROQ_MODEL || "openai/gpt-oss-120b"})`
            : Boolean(process.env.OPENAI_API_KEY)
                ? `openai (${process.env.OPENAI_MODEL || "gpt-4o-mini"})`
                : "local-synthesizer",
        tts: Boolean(process.env.ELEVENLABS_API_KEY) ? "elevenlabs-multilingual" : "browser-speech-api",
    };
    return NextResponse.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "0.1.0",
        providers,
        uptime: process.uptime(),
    });
}
