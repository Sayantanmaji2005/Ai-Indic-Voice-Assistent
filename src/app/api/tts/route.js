import { NextResponse } from "next/server";
import { ServerTtsService } from "@/lib/server/tts-service";
export async function POST(request) {
    try {
        const { text, language, voiceId } = (await request.json());
        if (!text || !text.trim()) {
            return NextResponse.json({ success: false, message: "No text provided" }, { status: 400 });
        }
        const audioBuffer = await ServerTtsService.synthesize(text, language, voiceId);
        if (!audioBuffer) {
            return NextResponse.json({ success: false, fallback: true, message: "TTS not available or failed" });
        }
        return new Response(audioBuffer, {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "Cache-Control": "public, max-age=3600",
            },
        });
    }
    catch (error) {
        console.error("TTS generation error:", error);
        return NextResponse.json({ success: false, fallback: true, message: "TTS failed" }, { status: 500 });
    }
}
