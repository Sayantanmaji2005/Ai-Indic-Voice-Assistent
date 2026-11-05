import { NextResponse } from "next/server";
import { performSearch } from "@/lib/search/service";
const validModes = ["ai", "web", "images", "news", "deep"];
export async function POST(request) {
    try {
        const body = await request.json();
        let query = body.query?.trim() || "";
        if (!query && body.file) {
            query = "Please analyze and describe this uploaded image or document in thorough detail.";
        }
        if (!query && !body.file) {
            return NextResponse.json({ success: false, message: "Enter a search query or upload a file", error: { code: "INVALID_QUERY" } }, { status: 400 });
        }
        const mode = validModes.includes(body.mode ?? "ai") ? body.mode ?? "ai" : "ai";
        const data = await performSearch(query, mode, body.language, body.file);
        return NextResponse.json({ success: true, message: "Search completed successfully", data });
    }
    catch (error) {
        console.error("Search failed", error);
        return NextResponse.json({ success: false, message: "Unable to process search request", error: { code: "SEARCH_FAILED" } }, { status: 500 });
    }
}
