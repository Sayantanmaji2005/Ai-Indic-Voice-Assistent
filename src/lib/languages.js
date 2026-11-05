export const languages = [
    { code: "auto", speechCode: "auto", label: "Auto Detect", nativeLabel: "✨ Auto Detect", region: "all", script: "Universal AI Detection", speakers: "All 1.4B+ Voices" },
    { code: "hi", speechCode: "hi-IN", label: "Hindi", nativeLabel: "हिन्दी", region: "popular", script: "Devanagari", speakers: "600M+ Speakers" },
    { code: "bn", speechCode: "bn-IN", label: "Bengali", nativeLabel: "বাংলা", region: "popular", script: "Bengali", speakers: "300M+ Speakers" },
    { code: "te", speechCode: "te-IN", label: "Telugu", nativeLabel: "తెలుగు", region: "popular", script: "Telugu", speakers: "95M+ Speakers" },
    { code: "mr", speechCode: "mr-IN", label: "Marathi", nativeLabel: "मराठी", region: "popular", script: "Devanagari", speakers: "90M+ Speakers" },
    { code: "ta", speechCode: "ta-IN", label: "Tamil", nativeLabel: "தமிழ்", region: "popular", script: "Tamil", speakers: "85M+ Speakers" },
    { code: "gu", speechCode: "gu-IN", label: "Gujarati", nativeLabel: "ગુજરાતી", region: "popular", script: "Gujarati", speakers: "60M+ Speakers" },
    { code: "kn", speechCode: "kn-IN", label: "Kannada", nativeLabel: "ಕನ್ನಡ", region: "popular", script: "Kannada", speakers: "50M+ Speakers" },
    { code: "ml", speechCode: "ml-IN", label: "Malayalam", nativeLabel: "മലയാളം", region: "popular", script: "Malayalam", speakers: "38M+ Speakers" },
    { code: "pa", speechCode: "pa-IN", label: "Punjabi", nativeLabel: "ਪੰਜਾਬੀ", region: "popular", script: "Gurmukhi", speakers: "35M+ Speakers" },
    { code: "or", speechCode: "or-IN", label: "Odia", nativeLabel: "ଓଡ଼ିଆ", region: "east", script: "Odia", speakers: "40M+ Speakers" },
    { code: "as", speechCode: "as-IN", label: "Assamese", nativeLabel: "অসমীয়া", region: "east", script: "Bengali-Assamese", speakers: "25M+ Speakers" },
    { code: "ur", speechCode: "ur-IN", label: "Urdu", nativeLabel: "اردو", region: "north", script: "Perso-Arabic", speakers: "70M+ Speakers", direction: "rtl" },
    { code: "sa", speechCode: "sa-IN", label: "Sanskrit", nativeLabel: "संस्कृतम्", region: "north", script: "Devanagari", speakers: "Classical" },
    { code: "bho", speechCode: "hi-IN", label: "Bhojpuri", nativeLabel: "भोजपुरी", region: "north", script: "Devanagari", speakers: "55M+ Speakers" },
    { code: "mai", speechCode: "hi-IN", label: "Maithili", nativeLabel: "मैथिली", region: "north", script: "Devanagari", speakers: "35M+ Speakers" },
    { code: "ks", speechCode: "ks-IN", label: "Kashmiri", nativeLabel: "कॉशुर / کٲشُر", region: "north", script: "Perso-Arabic", speakers: "7M+ Speakers", direction: "rtl" },
    { code: "ne", speechCode: "ne-NP", label: "Nepali", nativeLabel: "नेपाली", region: "north", script: "Devanagari", speakers: "16M+ Speakers" },
    { code: "kok", speechCode: "kok-IN", label: "Konkani", nativeLabel: "कोंकणी", region: "west", script: "Devanagari", speakers: "8M+ Speakers" },
    { code: "sd", speechCode: "sd-IN", label: "Sindhi", nativeLabel: "سنڌي / सिंधी", region: "west", script: "Perso-Arabic", speakers: "3M+ Speakers", direction: "rtl" },
    { code: "doi", speechCode: "hi-IN", label: "Dogri", nativeLabel: "डोगरी", region: "north", script: "Devanagari", speakers: "4M+ Speakers" },
    { code: "sat", speechCode: "hi-IN", label: "Santali", nativeLabel: "ᱥᱟᱱᱛᱟᱲᱤ", region: "east", script: "Ol Chiki", speakers: "7M+ Speakers" },
    { code: "mni", speechCode: "bn-IN", label: "Manipuri (Meitei)", nativeLabel: "মৈতৈলোন্", region: "east", script: "Meetei Mayek", speakers: "2M+ Speakers" },
    { code: "brx", speechCode: "hi-IN", label: "Bodo", nativeLabel: "बड़ो", region: "east", script: "Devanagari", speakers: "1.5M+ Speakers" },
    { code: "en", speechCode: "en-IN", label: "English", nativeLabel: "English", region: "popular", script: "Latin (Indian Accents)", speakers: "Global / Pan-India" },
];
const scriptMatchers = [
    { pattern: /\p{Script=Devanagari}/u, defaultLang: "hi", compatible: ["hi", "mr", "sa", "bho", "mai", "ne", "kok", "doi", "brx"] },
    { pattern: /\p{Script=Bengali}/u, defaultLang: "bn", compatible: ["bn", "as", "mni"] },
    { pattern: /\p{Script=Telugu}/u, defaultLang: "te", compatible: ["te"] },
    { pattern: /\p{Script=Tamil}/u, defaultLang: "ta", compatible: ["ta"] },
    { pattern: /\p{Script=Gujarati}/u, defaultLang: "gu", compatible: ["gu"] },
    { pattern: /\p{Script=Kannada}/u, defaultLang: "kn", compatible: ["kn"] },
    { pattern: /\p{Script=Malayalam}/u, defaultLang: "ml", compatible: ["ml"] },
    { pattern: /\p{Script=Gurmukhi}/u, defaultLang: "pa", compatible: ["pa"] },
    { pattern: /\p{Script=Oriya}/u, defaultLang: "or", compatible: ["or"] },
    { pattern: /\p{Script=Arabic}/u, defaultLang: "ur", compatible: ["ur", "ks", "sd"] },
    { pattern: /\p{Script=Ol_Chiki}/u, defaultLang: "sat", compatible: ["sat"] },
    { pattern: /\p{Script=Meetei_Mayek}/u, defaultLang: "mni", compatible: ["mni"] },
];
// Helper to detect Bengali speech phonetics transcribed into Devanagari script by Whisper
export function isBengaliPhoneticsInDevanagari(text) {
    const bengaliDevanagariMarkers = [
        "भारतर", "परधामंत्रीर", "प्रधानमंत्रीर", "कोलकातार", "देशर", "आमार", "तोमार", "तार", "सबार", "बांगलार", "राज्यर",
        "नाम की", "की नाम", "की आछे", "की हवे", "की होबे", "की कोरे", "की भावे", "कीभावे", "की कोर्छो", "की कोरछो", "की कोरते",
        "कतो", "कोतो", "केमोन", "कोथाय", "कोनटा", "केनो", "बर्तमान", "खबोर", "खोबोर", "आबहावा", "आबाहावा", "किछु", "एखन",
        "आछे", "आछेन", "होबे", "हवे", "कोरेछे", "कोरेछेन", "कोरछे", "कोरते", "कोरबो", "आमाके", "तोमाके", "काछे", "थाके",
        "बोलो", "बोलुन", "बोलछे", "बोलते", "जानी", "जानते", "जाबो", "नेई", "नाई", "भाबछी", "पाब", "पारबो",
        "गॉल्पो", "गोल्पो", "भालो", "एकटा", "दूटो", "कोतो गुली", "कतो गुली", "स्टेट आछे", "राज्य आछे", "टाका", "टका", "दाम कतो", "दाम कोतो"
    ];
    return bengaliDevanagariMarkers.some((w) => text.includes(w));
}
// Helper to detect Marathi words in Devanagari
export function isMarathiPhoneticsInDevanagari(text) {
    const marathiMarkers = ["आहे", "आहेत", "नाही", "काय", "झाला", "केला", "होता", "कसा", "कशी", "कुठे", "कधी", "सांगा", "माहिती", "तुम्ही", "आम्ही"];
    return marathiMarkers.some((w) => text.includes(w));
}
const romanizedIndicPatterns = [
    // Banglish / Bengali keywords (distinctive spoken Romanized Bengali)
    {
        pattern: /(?:\b|_)(?:kemon|kothay|kokhon|keno|bolun|ache|achen|achho|achhen|achis|hobe|dhonnobad|namaskar|amra|amader|amar|tumi|tomar|tomake|apni|apnar|apnake|korun|holo|kore|bhalo|shunun|shuncho|jani|kichu|ekhon|khobor|songe|parbo|chai|thik|dekho|shunchen|dada|shob|sobai|shobai|eto|sheta|eta|konte|kisher|noy|nei|thake|bolte|parbe|jante|ashun|kolkatar|dhakar|kolkatai|kolkatate|uttor|shotti|bujhte|bujhlen|bujhecho|bolchi|korchi|jachhi|khub|baje|shundor|bortoman|prodhan\s+montri|abishkar|aviscar|coleche|koreche|koto\s+guli|somoy|tarikh|ajke|ajker|dekhao|shunao|golpo|ekta|duto|ki\s+khobor|ki\s+obostha|bhalo\s+achi|ami\s+bolchi|shunte\s+pachho|shunte\s+paccho|shunte\s+pachhen|shuno|bhai|bhaia|apnar\s+naam|tomar\s+naam|naam\s+ki|ki\s+naam|kothao|konodin|kono)(?:\b|_)/i,
        lang: "bn",
    },
    // Hinglish / Hindi keywords (distinctive spoken Romanized Hindi)
    {
        pattern: /(?:\b|_)(?:kya|kaise|kaun|kab|kahan|kyu|kyun|batao|bataiye|hai|hain|hota|hoti|hoga|hogi|shukriya|namaste|dhanyawad|aap|aapka|aapko|mera|meri|hum|humko|hamara|mein|kijiye|karna|chahiye|sunao|khabar|saath|sakta|sakti|sakte|sunie|itna|yeh|woh|kaunsa|kiska|kiski|nahi|nahin|raha|rahi|rahe|kahani|batayein|samjhao|kaise\s+ho|kya\s+haal|kya\s+chal|sun\s+rahe\s+ho|sun\s+rahi\s+ho|tum\s+kaun\s+ho|aap\s+kaun\s+hain|tumhara\s+naam|kya\s+naam\s+hai|theek\s+ho|badhiya|accha|achha|batao\s+na|kuch\s+batao|kaisa\s+chal|namashkar)(?:\b|_)/i,
        lang: "hi",
    },
    // Telugish / Telugu keywords
    {
        pattern: /(?:\b|_)(?:ela|ekkada|eppudu|enduku|cheppandi|cheyandi|undi|unnaru|unnara|enti|evaru|meeru|nenu|chudandi|telugu|hyderabad|andhra|bavunnara|dhanyavadalu|namaskaram|ippudu|roju|epudu|cheppu|ledu)(?:\b|_)/i,
        lang: "te",
    },
    // Tanglish / Tamil keywords
    {
        pattern: /(?:\b|_)(?:eppadi|enga|eppo|yen|sollunga|pannunga|irukku|irukkanga|vanakkam|nandri|neenga|naan|enna|yaar|epdi|theriyuma|parunga|tamil|chennai|inniku|nalaiki|illai|venum|solla)(?:\b|_)/i,
        lang: "ta",
    },
    // Marathi keywords
    {
        pattern: /(?:\b|_)(?:kasa|kashi|kuthe|kadhi|saanga|aahe|ahet|kay|jhala|kela|hota|hoti|kara|tumhi|aamhi|namaskar|dhanyavad|mahiti|aaj|kal|kiti|sang|kasaa|sangaa)(?:\b|_)/i,
        lang: "mr",
    },
    // Gujarati keywords
    {
        pattern: /(?:\b|_)(?:kem|kya|kyare|kaho|chhe|nathi|shu|kon|tame|ame|karo|aabhar|namaste|aaje|kal|gujarat|su|kevu|mane)(?:\b|_)/i,
        lang: "gu",
    },
    // Kannada keywords
    {
        pattern: /(?:\b|_)(?:hege|yelli|yaavaga|yaake|heli|maadi|ide|idare|illa|enu|yaaru|neevu|naanu|nodi|karnataka|bengaluru|namaskara|dhanyavada|ivattu|hegidira|gotta)(?:\b|_)/i,
        lang: "kn",
    },
    // Malayalam keywords
    {
        pattern: /(?:\b|_)(?:engane|evide|eppol|enthukondu|parayoo|cheyyoo|undu|undallo|illa|entha|aara|ningal|njan|nanni|namaskaram|kerala|innu|nale|engotta|ariyaamo)(?:\b|_)/i,
        lang: "ml",
    },
    // Punjabi keywords
    {
        pattern: /(?:\b|_)(?:kivein|kithe|kadon|kyun|dasso|dhanwad|punjab|kidaan|haal|sat-sri-akal)(?:\b|_)/i,
        lang: "pa",
    },
    // Odia keywords
    {
        pattern: /(?:\b|_)(?:kemiti|kouthi|ketebele|kahinki|kuhantu|karantu|achhi|achhanti|nahin|kana|kie|apana|dhanyabad|odisha)(?:\b|_)/i,
        lang: "or",
    },
    // Urdu keywords
    {
        pattern: /(?:\b|_)(?:kahan|kyun|bataiye|kijiye|adaab|assalam|janab|kahiye|maloom)(?:\b|_)/i,
        lang: "ur",
    },
    // Assamese keywords
    {
        pattern: /(?:\b|_)(?:kene|kot|ketiya|kio|kora|ase|hobo|nohoy|apuni|moi|dhonyobad|asom)(?:\b|_)/i,
        lang: "as",
    },
];

const ENGLISH_QUERY_INDICATORS = /(?:^(?:who|what|where|when|why|how|which|is|are|was|were|can|could|would|should|do|does|did|tell|show|explain|describe|give|define|calculate|please|hello|hi|hey)\b)|(?:\b(?:who|what|where|when|why|how|which|tell me|show me|explain to me|in english|weather in|price of|meaning of)\b)/i;

export function detectLanguage(query, preferred = "auto") {
    if (!query || typeof query !== "string")
        return preferred === "auto" ? "en" : preferred;
    const text = query.trim();

    // 1. Script-based Unicode detection (Bengali, Devanagari, Telugu, Tamil, Gujarati, etc.)
    if (/[\u0980-\u09FF]/.test(text))
        return "bn"; // Pure Bengali script

    if (/[\u0900-\u097F]/.test(text)) {
        // If Devanagari contains Bengali phonetics, it is Bengali speech mis-transcribed into Devanagari by Whisper
        if (isBengaliPhoneticsInDevanagari(text))
            return "bn";
        // Check for Marathi markers
        if (isMarathiPhoneticsInDevanagari(text))
            return "mr";
        if (preferred && preferred !== "auto" && ["hi", "mr", "sa", "bho", "mai", "ne"].includes(preferred)) {
            return preferred;
        }
        return "hi";
    }

    for (const matcher of scriptMatchers) {
        if (matcher.pattern.test(text)) {
            if (preferred && preferred !== "auto" && matcher.compatible.includes(preferred)) {
                return preferred;
            }
            return matcher.defaultLang;
        }
    }

    // 2. Romanized Indic (Banglish / Hinglish / etc.) detection
    for (const roman of romanizedIndicPatterns) {
        if (roman.pattern.test(text)) {
            return roman.lang;
        }
    }

    // 3. Clear English indicators
    if (ENGLISH_QUERY_INDICATORS.test(text)) {
        return "en";
    }

    // 4. Respect user's preferred language dropdown if selected
    if (preferred && preferred !== "auto") {
        return preferred;
    }

    // 5. Default Latin text with no Indic markers to English ("en")
    return "en";
}

export function languageByCode(code) {
    if (!code || code === "auto") {
        return languages[0]; // Auto Detect
    }
    return languages.find((language) => language.code === code) ?? languages.find((l) => l.code === "en") ?? languages[0];
}
