import { detectLanguage } from "@/lib/languages";
import { RetrievalFirstAiProvider, TavilySearchProvider } from "./providers";

/**
 * Intelligent Visual Need Detector
 * Automatically determines whether supporting reference photos/images are genuinely needed and helpful.
 * - Places, tourism, monuments, nature, animals, birds, food, recipes, gadgets, vehicles, celebrities -> TRUE
 * - Math, equations, code, grammar, casual greeting, private medical/blood reports, invoices -> FALSE
 */
export function shouldIncludeVisualPhotos(query = "", file = null, documentCategory = "") {
    // 1. If a private document or report is attached (medical report, bill, id card)
    if (file && (
        documentCategory === "medical_report" ||
        documentCategory === "prescription" ||
        documentCategory === "invoice_bill" ||
        documentCategory === "id_document" ||
        documentCategory === "academic_marksheet"
    )) {
        return false;
    }

    const q = (query || "").toLowerCase().trim();
    if (!q) return false;

    // 2. Definite Negative Visual Intent (NEVER SHOW WEB STOCK PHOTOS)
    const noVisualRegex = /(?:\b(?:calculate|solve|equation|percentage|derivative|integral|algebra|formula|compound interest|profit and loss|x\^|if price increased|multiply|divide|subtraction|addition)\b)|(?:\b(?:function|python|javascript|typescript|react|html|css|sql|npm|git|syntax|debug|error code|regex|database|backend|api)\b)|(?:\b(?:translate|meaning of|synonym|antonym|definition of|grammar|tense|idiom|spelling)\b)|(?:\b(?:hello|hi|hey|who are you|how are you|kemon acho|kaise ho|good morning|thanks|thank you|namaste)\b)|(?:\b(?:blood test|hemoglobin|creatinine|cbc|platelet|urine test|thyroid tsh|lipid profile|sgpt|sgot|bilirubin)\b)/i;
    if (noVisualRegex.test(q)) {
        return false;
    }

    // 3. High Positive Visual Intent (ALWAYS PRESENT RELEVANT HIGH-DEFINITION PHOTOS)
    const positiveVisualRegex = /(?:\b(?:photo|photos|picture|pictures|image|images|pic|pics|chobi|tasveer|kaisa dikhta|kemon dekhte|look like|looks like|appearance|gallery|wallpaper|view)\b)|(?:\b(?:taj mahal|qutub minar|red fort|india gate|charminar|kedarnath|himalayas|darjeeling|goa|kashmir|jaipur|temple|monument|fort|waterfall|beach|lake|palace|museum|statue|hills|mountain|sunset)\b)|(?:\b(?:biryani|dosa|samosa|paneer|curry|roti|pizza|burger|pasta|recipe|dish|cuisine|mithai|sweet|cake|ice cream|dessert|snack)\b)|(?:\b(?:tiger|lion|elephant|peacock|leopard|deer|bird|flower|rose|lotus|tree|plant|snake|fish|dog|cat|horse|wildlife|animal|species|insect)\b)|(?:\b(?:iphone|samsung|pixel|oneplus|laptop|macbook|gaming laptop|car|bike|motorcycle|tesla|bullet|thar|scorpio|watch|smartwatch|sneakers|shoes|dress|fashion|price in indian market)\b)|(?:\b(?:virat kohli|rohit sharma|dhoni|sachin|narendra modi|shah rukh khan|salman|amitabh|rabindranath tagore|subhas chandra bose|apj abdul kalam|cricketer|actor|actress)\b)|(?:\b(?:planet|solar system|mars|moon|earth|galaxy|nebula|universe|anatomy|human body|skeleton|heart diagram)\b)/i;

    if (positiveVisualRegex.test(q)) {
        return true;
    }

    return false;
}

export async function performSearch(query, mode, preferredLanguage = "auto", file) {
    const language = detectLanguage(query, preferredLanguage);
    const searchProvider = new TavilySearchProvider();

    // Check if query is generic file analyze prompt
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
    } else {
        resolvedLanguage = preferredLanguage;
    }

    // Intelligent Visual Need Determination:
    // Automatically decide whether reference photos should be presented or withheld
    const shouldShowImages = mode === "images" || shouldIncludeVisualPhotos(query, file, summary.documentCategory);
    const finalImages = shouldShowImages ? (images || []).slice(0, 6) : [];

    return {
        ...summary,
        query,
        language: resolvedLanguage,
        mode,
        sources,
        images: finalImages,
        usedLiveSources: Boolean(process.env.TAVILY_API_KEY) && sources.length > 0,
        attachedFile: file ? { name: file.name, type: file.type, data: file.data } : undefined,
    };
}
