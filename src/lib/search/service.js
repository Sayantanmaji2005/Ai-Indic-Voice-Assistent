import { detectLanguage } from "@/lib/languages";
import { RetrievalFirstAiProvider, TavilySearchProvider } from "./providers";
export async function performSearch(query, mode, preferredLanguage = "auto", file) {
    const language = detectLanguage(query, preferredLanguage);
    const searchProvider = new TavilySearchProvider();
    // Parallel multi-engine search with live images (run search unless it's a pure photo describe with default query)
    const isGenericImagePrompt = file && (!query || query.includes("analyze and describe this uploaded image"));
    const { sources, images } = isGenericImagePrompt
        ? { sources: [], images: [] }
        : await searchProvider.searchWithImages(query, mode);
    const aiProvider = new RetrievalFirstAiProvider();
    const summary = await aiProvider.summarize({ query, language, preferredLanguage, sources, file });
    const detectedLang = summary.detectedLanguage;
    // Prioritize LLM-detected native language when in auto mode
    let resolvedLanguage = language;
    if (preferredLanguage === "auto") {
        if (detectedLang && detectedLang !== "auto" && detectedLang.length >= 2) {
            resolvedLanguage = detectedLang.toLowerCase().trim();
        }
    }
    else {
        resolvedLanguage = preferredLanguage;
    }
    return {
        ...summary,
        query,
        language: resolvedLanguage,
        mode,
        sources,
        images: images || [],
        usedLiveSources: Boolean(process.env.TAVILY_API_KEY) && sources.length > 0,
        attachedFile: file ? { name: file.name, type: file.type, data: file.data } : undefined,
    };
}
