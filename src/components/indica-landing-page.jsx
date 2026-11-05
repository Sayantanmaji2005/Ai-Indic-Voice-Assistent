"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Copy, Mic, Pause, Play, Plus, Radio, ShieldCheck, Zap, } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useAudioPlayer } from "@/hooks/use-audio-player";
const SAMPLE_PROMPTS = [
    {
        text: "Plan my day around the weather.",
        lang: "en",
        label: "English",
        region: "Pan-India / Global",
        audioResponse: "Good morning! Expect clear skies with a pleasant 24 degrees in Delhi-NCR. I have spaced your afternoon meetings so you can take a walk.",
    },
    {
        text: "आज सोने का भाव और बाजार की स्थिति क्या है?",
        lang: "hi",
        label: "हिन्दी",
        region: "North & Central India",
        audioResponse: "आज 24 कैरेट सोने का भाव लगभग 76 हजार 450 रुपये प्रति 10 ग्राम पर स्थिर बना हुआ है। शेयर बाजार आज 320 अंक ऊपर कारोबार कर रहा है।",
    },
    {
        text: "কলকাতার বর্তমান প্রধান খবর এবং আবহাওয়া বলো।",
        lang: "bn",
        label: "বাংলা",
        region: "West Bengal & Tripura",
        audioResponse: "কলকাতায় আজ আংশিক মেঘলা আকাশ। সর্বোচ্চ তাপমাত্রা থাকবে প্রায় 31 ডিগ্রি সেলসিয়াস। ভিক্টোরিয়া ও পার্ক স্ট্রিটে হালকা ট্রাফিক রয়েছে।",
    },
    {
        text: "இன்றைய வானிலை மற்றும் முக்கிய செய்திகள் என்ன?",
        lang: "ta",
        label: "தமிழ்",
        region: "Tamil Nadu",
        audioResponse: "சென்னையில் இன்று லேசான மழைக்கு வாய்ப்புள்ளது. வெப்பநிலை 30 டிகிரியாக இருக்கும். மெட்ரோ பணிகள் காரணமாக அண்ணா சாலையில் மாற்றம் உள்ளது.",
    },
    {
        text: "హైదరాబాద్‌లో ఈరోజు తాజా వాతావరణం మరియు ట్రాఫిక్ ఎలా ఉంది?",
        lang: "te",
        label: "తెలుగు",
        region: "Telangana & Andhra Pradesh",
        audioResponse: "హైదరాబాద్‌లో నేడు వాతావరణం ఆహ్లాదకరంగా ఉంటుంది. హైటెక్ సిటీ మరియు గచ్చిబౌలి మార్గంలో సాయంత్రం వేళల్లో సాధారణ ట్రాఫిక్ ఉండే అవకాశం ఉంది.",
    },
    {
        text: "मुंबईतील आजचे हवामान आणि लोकल ट्रेनचे अपडेट काय आहे?",
        lang: "mr",
        label: "मराठी",
        region: "Maharashtra",
        audioResponse: "मुंबईत आज हवामान उष्ण व दमट राहील. वेस्टर्न आणि सेंट्रल लोकल सेवा सर्वसाधारण वेळापत्रकानुसार सुरळीत सुरू आहेत.",
    },
];
const BENTO_FEATURES = [
    {
        tag: "ZERO ACCENT FRICTION",
        title: "Dialects & Hinglish,",
        titleItalic: "natively decoded.",
        description: "From colloquial Delhi slang to pure rural Bengali and Tanglish, Indica's acoustic models eliminate accent penalties and awkward mishears.",
        visualType: "dialects",
    },
    {
        tag: "SUB-200MS STREAMING",
        title: "Instant Neural Speech,",
        titleItalic: "human cadence.",
        description: "Zero robot stutter. Ultra-low latency voice synthesis that responds faster than human turn-taking, complete with natural pauses and warm intonation.",
        visualType: "latency",
    },
    {
        tag: "ENTERPRISE PRIVACY",
        title: "Zero retention,",
        titleItalic: "local memory vault.",
        description: "Audio is processed in ephemeral encrypted buffers. Your private schedules, personal notes, and voiceprints never train public models.",
        visualType: "shield",
    },
    {
        tag: "AUTONOMOUS ACTIONS",
        title: "Hands-free workflows,",
        titleItalic: "real results.",
        description: "Search the live web, draft bilingual emails, manage your calendar, and summarize documents—all through natural conversational commands.",
        visualType: "routine",
    },
];
const CODE_EXAMPLES = {
    python: `import indica

# Initialize high-speed Indic Voice client
client = indica.VoiceClient(api_key="ind_live_...")

# Stream natural Hindi response in <180ms
stream = client.speak(
    prompt="आज शाम के 5 बजे राहुल से मीटिंग सेट कर दो",
    language="hi-IN",
    voice="arjun-warm",
    stream=True
)

for audio_chunk in stream:
    audio_player.play(audio_chunk)`,
    node: `import { IndicaClient } from "@indica/ai";

const indica = new IndicaClient({ apiKey: process.env.INDICA_API_KEY });

// Realtime Indic Voice interaction
const session = await indica.voice.startSession({
  language: "bn-IN", // Bengali
  mode: "hands-free",
  onTranscription: (text) => console.log("User said:", text),
  onSpeech: (audio) => playSpeaker(audio),
});`,
    curl: `curl https://api.indica.ai/v1/voice/converse \\
  -H "Authorization: Bearer ind_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "இன்றைய செய்தி சுருக்கம்",
    "language": "ta-IN",
    "return_audio": true
  }'`,
};
const TESTIMONIALS = [
    {
        quote: "Having an AI that effortlessly understands spoken Bengali and answers complex research queries without breaking cadence feels like true magic.",
        author: "Dr. Ananya Roy",
        role: "Senior AI Researcher",
        location: "Kolkata, WB",
        initials: "AR",
        bg: "#e4ddd1",
    },
    {
        quote: "Indica is the first voice assistant where our grandparents in Varanasi can speak fluent Awadhi and Hindi without ever touching a screen keyboard.",
        author: "Vikramaditya Sharma",
        role: "Founder, BharatStack",
        location: "New Delhi",
        initials: "VS",
        bg: "#dcd6c8",
    },
    {
        quote: "The latency is under 200 milliseconds. The Tamil pronunciation has zero Americanized accent—it sounds like talking to a friend on the phone.",
        author: "Karthik Subramanian",
        role: "Product Director",
        location: "Chennai, TN",
        initials: "KS",
        bg: "#e7e2d9",
    },
];
const FAQS = [
    {
        question: "How does Indica understand Hinglish and mixed-language sentences?",
        answer: "Indica uses proprietary dual-token acoustic and semantic decoders trained specifically on multilingual Indic speech. When you blend English technical words with Hindi or Bengali grammar ('Meeting schedule kar do for tomorrow morning'), Indica understands the semantic intent without getting confused by code-switching.",
    },
    {
        question: "Do I need to create an account or pay to use Indica?",
        answer: "Indica provides enterprise single sign-on via Google OAuth 2.0 without entering passwords or credit cards. Sign in to synchronize your multilingual voice history, custom prompts, and workspaces across devices securely.",
    },
    {
        question: "Is my voice recorded or stored on company servers?",
        answer: "Privacy is our founding principle. Real-time audio streams are processed in temporary encrypted RAM buffers and wiped immediately after transcription. We do not store or sell your raw voice recordings.",
    },
    {
        question: "Which Indic languages are supported currently?",
        answer: "Indica currently provides end-to-end speech recognition and voice synthesis for 13+ languages: English, Hindi (हिन्दी), Bengali (বাংলা), Tamil (தமிழ்), Telugu (తెలుగు), Marathi (मराठी), Gujarati (ગુજરાતી), Kannada (ಕನ್ನಡ), Malayalam (മലയാളം), Punjabi (ਪੰਜਾਬੀ), Odia (ଓଡ଼ିଆ), Assamese, and Urdu.",
    },
    {
        question: "How is Indica different from Google Assistant, Siri, or Alexa?",
        answer: "Generic global voice assistants were built with English-first acoustics and treated Indic languages as secondary translations. Indica was engineered ground-up for Bharat—supporting rich regional colloquialisms, dialect nuances, multi-turn reasoning, and sub-200ms real-time audio playback.",
    },
];
// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function IndicaLandingPage({ onLaunchApp, onLaunchLiveAssistant }) {
    const { openAuthModal, isAuthenticated } = useAuth();
    const { isSpeaking: isPlayingAudio, speak, stopAudio } = useAudioPlayer();
    const [selectedPromptIdx, setSelectedPromptIdx] = useState(0);
    const [activeCodeTab, setActiveCodeTab] = useState("python");
    const [copiedCode, setCopiedCode] = useState(false);
    const [openFaqIdx, setOpenFaqIdx] = useState(0);
    const [activeDayRoutine, setActiveDayRoutine] = useState("morning");
    // Authentication gate: unauthenticated users cannot open the assistant workspace
    const handleLaunchWithAuth = (query, language) => {
        stopAudio();
        if (!isAuthenticated) {
            openAuthModal();
            return;
        }
        if (onLaunchApp) {
            onLaunchApp(query, language);
        }
    };
    const containerRef = useRef(null);
    const currentPrompt = SAMPLE_PROMPTS[selectedPromptIdx];
    // Scroll to top smooth handler when clicking the corner brand logo
    const handleScrollToTop = () => {
        if (containerRef.current) {
            containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }
        if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };
    // Smooth scroll to target section when clicking nav items
    const handleNavClick = (e, targetId) => {
        e.preventDefault();
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
            targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };
    // 120 FPS Native IntersectionObserver for zero-lag, zero-flicker scroll reveals
    useEffect(() => {
        const container = containerRef.current;
        if (!container)
            return;
        const revealElements = container.querySelectorAll(".reveal-on-scroll");
        if (!revealElements.length)
            return;
        // Reveal elements immediately in initial viewport to avoid flicker
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-revealed");
                }
            });
        }, {
            root: null, // viewport root
            rootMargin: "0px 0px -40px 0px",
            threshold: 0.1,
        });
        revealElements.forEach((el) => observer.observe(el));
        return () => {
            observer.disconnect();
        };
    }, []);
    // High-fidelity Neural Indica Voice playback
    const handleToggleAudio = () => {
        if (isPlayingAudio) {
            stopAudio();
        }
        else {
            void speak(currentPrompt.audioResponse, currentPrompt.lang);
        }
    };
    const handleCopyCode = () => {
        navigator.clipboard.writeText(CODE_EXAMPLES[activeCodeTab]);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };
    return (<div className="aesthetic-landing-page" ref={containerRef}>
      {/* =========================================================================
            TOP NAVIGATION BAR
            ========================================================================= */}
      <header className="aesthetic-header">
        <div className="aesthetic-header-content">
          {/* Brand Logo Corner with Official Emblem and Typography - Click to Scroll to Top */}
          <div className="aesthetic-brand-corner" onClick={handleScrollToTop} role="button" tabIndex={0} title="Indica AI - Click to scroll to top">
            <div className="aesthetic-brand-emblem-wrap">
              <Image src="/indica-symbol.png" alt="Indica Emblem" width={36} height={36} className="aesthetic-brand-logo-img" priority/>
              <span className="aesthetic-brand-glow-ring"/>
            </div>
            <div className="aesthetic-brand-text-lockup">
              <span className="aesthetic-brand-title">
                <span className="brand-navy">Indic</span><span className="brand-terracotta">a</span>
              </span>
              <span className="aesthetic-brand-badge">AI VOICE ASSISTANT</span>
            </div>
          </div>

          {/* Center Links with Smooth Scroll */}
          <nav className="aesthetic-nav-links">
            <a href="#possibilities" onClick={(e) => handleNavClick(e, "possibilities")} className="aesthetic-nav-item">Possibilities</a>
            <a href="#playground" onClick={(e) => handleNavClick(e, "playground")} className="aesthetic-nav-item">Voice Studio</a>
            <a href="#developer" onClick={(e) => handleNavClick(e, "developer")} className="aesthetic-nav-item">Developers</a>
            <a href="#privacy" onClick={(e) => handleNavClick(e, "privacy")} className="aesthetic-nav-item">Privacy</a>
            <a href="#faq" onClick={(e) => handleNavClick(e, "faq")} className="aesthetic-nav-item">FAQ</a>
          </nav>

          {/* Right Controls */}
          <div className="aesthetic-header-actions">
            {/* Launch / Talk button */}
            <button type="button" className="aesthetic-waitlist-btn" onClick={() => handleLaunchWithAuth()}>
              <span>Talk to Indica</span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
            HERO SECTION (WARM SAND / ALABASTER BEIGE WITH 2D ARCHITECTURAL ACCENTS)
            ========================================================================= */}
      <section className="aesthetic-hero-section" style={{ position: "relative" }}>
        {/* 2D Architectural Dot Grid & Corner Registration Crosshairs */}
        <div className="aesthetic-2d-dot-grid"/>
        <span className="aesthetic-2d-crosshair crosshair-top-left">+</span>
        <span className="aesthetic-2d-crosshair crosshair-top-right">+</span>
        <span className="aesthetic-2d-crosshair crosshair-bottom-left">+</span>
        <span className="aesthetic-2d-crosshair crosshair-bottom-right">+</span>

        <div className="aesthetic-hero-container" style={{ position: "relative", zIndex: 2 }}>
          {/* Left Column: Typography & CTAs */}
          <div className="aesthetic-hero-text hero-animate-in">
            {/* Terracotta/Orange Pill Tag */}
            <div className="aesthetic-eyebrow-tag">
              <span className="aesthetic-star-icon">✦</span>
              <span>YOUR EVERYDAY VOICE COMPANION</span>
            </div>

            {/* Aesthetic Dual-Font Headline */}
            <h1 className="aesthetic-headline">
              Life, simply
              <br />
              <span className="aesthetic-serif-italic">spoken.</span>
            </h1>

            {/* Subtitle */}
            <p className="aesthetic-subheading">
              Meet Indica, the thoughtful AI assistant that listens, understands,
              and helps you move through your day—hands free.
            </p>

            {/* Action Buttons Row */}
            <div className="aesthetic-hero-actions-row">
              <button type="button" className="aesthetic-talk-btn" onClick={() => handleLaunchWithAuth()}>
                <div className="aesthetic-mic-circle">
                  <Mic size={14}/>
                </div>
                <span>Talk to Indica</span>
              </button>

              <button type="button" className="aesthetic-see-more-btn" onClick={() => {
            stopAudio();
            const nextIdx = (selectedPromptIdx + 1) % SAMPLE_PROMPTS.length;
            setSelectedPromptIdx(nextIdx);
            void speak(SAMPLE_PROMPTS[nextIdx].audioResponse, SAMPLE_PROMPTS[nextIdx].lang);
        }}>
                <span>See what Indica can do</span>
                <span className="aesthetic-arrow-icon">→</span>
              </button>
            </div>

            {/* Social Proof Avatars */}
            <div className="aesthetic-social-proof">
              <div className="aesthetic-avatar-group">
                <div className="aesthetic-avatar av-1"/>
                <div className="aesthetic-avatar av-2"/>
                <div className="aesthetic-avatar av-3"/>
              </div>
              <span className="aesthetic-proof-text">
                Designed with 5,000+ early listeners across 13+ languages
              </span>
            </div>

            {/* 2D Vector Voice Wave Ribbon */}
            <div className="aesthetic-2d-waveform-strip" style={{ marginTop: "16px", width: "fit-content" }}>
              <span className="wave-line" style={{ height: "10px", animationDelay: "0.1s" }}/>
              <span className="wave-line" style={{ height: "18px", animationDelay: "0.3s" }}/>
              <span className="wave-line" style={{ height: "26px", animationDelay: "0.2s" }}/>
              <span className="wave-line" style={{ height: "14px", animationDelay: "0.4s" }}/>
              <span className="wave-line" style={{ height: "22px", animationDelay: "0.15s" }}/>
              <span className="wave-line" style={{ height: "12px", animationDelay: "0.35s" }}/>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#161614", marginLeft: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Active Acoustic Neural Pipeline
              </span>
            </div>
          </div>

          {/* Right Column: 3D Iridescent Sunset Sonic Sphere + 2D Floating Badges */}
          <div className="aesthetic-hero-visual hero-animate-in-delayed">
            <div className="aesthetic-orb-stage">
              {/* 2D Floating Technical Badges */}
              <div className="aesthetic-2d-badge badge-top-right badge-float-1" style={{ top: "-18px", right: "8px" }}>
                <div className="badge-row">
                  <span className="badge-icon"><Zap size={13} strokeWidth={1.75} className="black-outline-icon"/></span>
                  <span className="badge-title">Sub-200ms Latency</span>
                </div>
                <span className="badge-sub">Real-Time Synthesis</span>
              </div>

              <div className="aesthetic-2d-badge badge-bottom-left badge-float-2" style={{ top: "36%", left: "-100px", zIndex: 12 }}>
                <div className="badge-row">
                  <span className="badge-icon"><ShieldCheck size={13} strokeWidth={1.75} className="black-outline-icon"/></span>
                  <span className="badge-title">100% On-Device RAM</span>
                </div>
                <span className="badge-sub">Zero Audio Kept</span>
              </div>

              {/* Floating Top-Left Tag */}
              <div className="aesthetic-floating-chip chip-top-left">
                <span className="chip-dot-pulse"/>
                <span>13+ Indic Languages Live</span>
              </div>

              {/* Concentric ambient background rings with orbital satellites */}
              <div className="aesthetic-ambient-ring ring-outer">
                <span className="satellite-node node-1"/>
              </div>
              <div className="aesthetic-ambient-ring ring-mid">
                <span className="satellite-node node-2"/>
              </div>

              {/* The Glowing Sunset Orb */}
              <div className={`aesthetic-sonic-orb ${isPlayingAudio ? "is-pulsing" : ""}`} onClick={handleToggleAudio} title="Click to hear Indica voice" role="button" tabIndex={0}>
                {/* Center Audio Soundwave Bars (9 bars with dynamic animations) */}
                <div className="aesthetic-soundwave-center">
                  {[32, 55, 75, 48, 92, 58, 80, 45, 30].map((h, i) => (<span key={i} className={`aesthetic-bar ${isPlayingAudio ? "bar-active" : "bar-idle"}`} style={{
                height: isPlayingAudio ? `${h}%` : `${24 + (i % 3) * 12}%`,
                animationDelay: `${i * 0.1}s`,
            }}/>))}
                </div>
              </div>

              {/* Floating "TRY SAYING" Badge */}
              <div className="aesthetic-try-saying-badge" onClick={() => handleLaunchWithAuth(currentPrompt.text, currentPrompt.lang)} role="button" tabIndex={0} title="Click to try in Indica">
                <div className="try-saying-label">
                  <span className="try-mic-icon">✦</span> TRY SAYING
                </div>
                <div className="try-saying-quote">
                  &ldquo;{currentPrompt.text}&rdquo;
                </div>
                <div className="try-saying-sub">
                  <span>{currentPrompt.label} • {currentPrompt.region}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
            MIDDLE SECTION (WARM CHARCOAL / ESPRESSO BLACK)
            ========================================================================= */}
      <section id="possibilities" className="aesthetic-dark-band">
        <div className="aesthetic-dark-container">
          {/* Left Text */}
          <div className="aesthetic-dark-left reveal-on-scroll">
            <span className="aesthetic-dark-eyebrow">ONE VOICE. A LIGHTER DAY.</span>
            <h2 className="aesthetic-dark-heading">
              Less tapping.
              <br />
              <span className="aesthetic-serif-italic dark-serif">More living.</span>
            </h2>
            <p className="aesthetic-dark-desc">
              Indica turns natural conversation into action, so technology finally feels less like a tool and more like help.
            </p>
          </div>

          {/* Right Assistant Schedule Interface */}
          <div className="aesthetic-dark-right reveal-on-scroll reveal-delay-1">
            <div className="aesthetic-schedule-card">
              <div className="aesthetic-schedule-header">
                <div>
                  <span className="schedule-greeting">Good morning, Alex.</span>
                  <h3 className="schedule-title">Here&apos;s your day</h3>
                </div>
                <button type="button" className="schedule-add-btn" onClick={() => handleLaunchWithAuth()} title="Ask Indica">
                  <Plus size={16}/>
                </button>
              </div>

              <div className="aesthetic-schedule-list">
                {/* Item 1 */}
                <div className="aesthetic-schedule-item" onClick={() => handleLaunchWithAuth("What's on my daily briefing?", "en")}>
                  <span className="schedule-time">08:00</span>
                  <div className="schedule-line line-orange"/>
                  <div className="schedule-details">
                    <strong>Daily briefing</strong>
                    <span>Weather, calendar and commute</span>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="aesthetic-schedule-item" onClick={() => handleLaunchWithAuth("Remind me to focus on product presentation", "en")}>
                  <span className="schedule-time">11:30</span>
                  <div className="schedule-line line-purple"/>
                  <div className="schedule-details">
                    <strong>Focus reminder</strong>
                    <span>Prepare product presentation</span>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="aesthetic-schedule-item" onClick={() => handleLaunchWithAuth("A gentle reminder after work to call Mum", "en")}>
                  <span className="schedule-time">16:15</span>
                  <div className="schedule-line line-teal"/>
                  <div className="schedule-details">
                    <strong>Call Mum</strong>
                    <span>A gentle reminder after work</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
            SECTION: INTERACTIVE INDIC VOICE STUDIO (WARM SAND)
            ========================================================================= */}
      <section id="playground" className="aesthetic-studio-section">
        <div className="aesthetic-studio-container">
          <div className="aesthetic-section-header text-center reveal-on-scroll">
            <span className="aesthetic-pill-tag">VOICE & DIALECT STUDIO</span>
            <h2 className="aesthetic-section-title">
              Hear India in its
              <span className="aesthetic-serif-italic"> true accents.</span>
            </h2>
            <p className="aesthetic-section-subtitle">
              Switch languages and tap the speaker to hear Indica’s low-latency natural voice synthesis.
            </p>
          </div>

          {/* Interactive Dialect Chips */}
          <div className="aesthetic-studio-tabs">
            {SAMPLE_PROMPTS.map((p, idx) => (<button key={p.lang} type="button" className={`aesthetic-studio-tab ${selectedPromptIdx === idx ? "is-active" : ""}`} onClick={() => {
                const wasPlaying = isPlayingAudio;
                stopAudio();
                setSelectedPromptIdx(idx);
                if (wasPlaying) {
                    void speak(p.audioResponse, p.lang);
                }
            }}>
                <span className="tab-lang-label">{p.label}</span>
                <span className="tab-region-hint">{p.lang.toUpperCase()}</span>
              </button>))}
          </div>

          {/* Interactive Voice Player Card */}
          <div className="aesthetic-voice-card">
            <div className="aesthetic-voice-card-top">
              <div className="aesthetic-voice-meta">
                <span className="meta-badge">{currentPrompt.label} ({currentPrompt.region})</span>
                <span className="meta-speed">Acoustic Latency: <strong>178ms</strong></span>
              </div>
              <button type="button" className={`aesthetic-voice-play-trigger ${isPlayingAudio ? "is-playing" : ""}`} onClick={handleToggleAudio}>
                {isPlayingAudio ? <Pause size={18}/> : <Play size={18} className="translate-x-[1px]"/>}
                <span>{isPlayingAudio ? "Pause Audio" : "Listen to Response"}</span>
              </button>
            </div>

            <div className="aesthetic-voice-prompt-box">
              <span className="prompt-label">Spoken Query:</span>
              <p className="prompt-content">&ldquo;{currentPrompt.text}&rdquo;</p>
            </div>

            <div className="aesthetic-voice-response-box">
              <div className="response-header">
                <span className="response-badge">Indica Synthesis</span>
                {isPlayingAudio && <span className="response-live-indicator">● Streaming Live Audio</span>}
              </div>
              <p className="response-text">{currentPrompt.audioResponse}</p>

              {/* Live Audio Visualizer Equalizer */}
              <div className="aesthetic-waveform-visualizer">
                {Array.from({ length: 18 }).map((_, idx) => (<span key={idx} className={`waveform-bar ${isPlayingAudio ? "is-active" : "is-idle"}`} style={{
                animationDelay: `${idx * 0.05}s`,
            }}/>))}
              </div>
            </div>

            {/* Launch In Workspace CTA */}
            <div className="aesthetic-voice-card-footer">
              <span className="voice-tip">✨ Try this exact question in the live assistant:</span>
              <button type="button" className="aesthetic-try-query-btn" onClick={() => onLaunchApp(currentPrompt.text, currentPrompt.lang)}>
                <span>Ask Indica in {currentPrompt.label}</span>
                <ArrowRight size={14}/>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
            SECTION: BENTO CAPABILITIES GRID (WARM SAND / SOFT IVORY)
            ========================================================================= */}
      <section className="aesthetic-bento-section">
        <div className="aesthetic-bento-container">
          <div className="aesthetic-section-header reveal-on-scroll">
            <span className="aesthetic-pill-tag">ENGINEERED FOR BHARAT</span>
            <h2 className="aesthetic-section-title">
              Crafted with care,
              <br />
              <span className="aesthetic-serif-italic">down to the syllable.</span>
            </h2>
            <p className="aesthetic-section-subtitle">
              Every acoustic layer is tuned to capture colloquial rhythms, bilingual code-switching, and cultural context.
            </p>
          </div>

          <div className="aesthetic-bento-grid">
            {BENTO_FEATURES.map((bento, i) => (<div key={i} className={`aesthetic-bento-card bento-card-${i + 1} reveal-on-scroll reveal-delay-${(i % 2) + 1}`}>
                <div className="bento-header">
                  <span className="bento-tag">{bento.tag}</span>
                </div>
                <h3 className="bento-title">
                  {bento.title}{" "}
                  {bento.titleItalic && (<span className="aesthetic-serif-italic bento-italic">{bento.titleItalic}</span>)}
                </h3>
                <p className="bento-desc">{bento.description}</p>

                {/* Card-specific micro-visuals */}
                {bento.visualType === "dialects" && (<div className="bento-visual-dialects">
                    <span className="dialect-pill">Hinglish</span>
                    <span className="dialect-pill">Benglish</span>
                    <span className="dialect-pill">Tanglish</span>
                    <span className="dialect-pill">Shuddh Hindi</span>
                    <span className="dialect-pill highlight">98.4% Acc</span>
                  </div>)}

                {bento.visualType === "latency" && (<div className="bento-visual-latency">
                    <div className="latency-bar-wrap">
                      <div className="latency-bar"/>
                    </div>
                    <div className="latency-numbers">
                      <span>Global Models (950ms)</span>
                      <strong className="text-terracotta">Indica (180ms)</strong>
                    </div>
                  </div>)}

                {bento.visualType === "shield" && (<div className="bento-visual-shield">
                    <div className="shield-chip">
                      <ShieldCheck size={16} className="text-emerald-700"/>
                      <span>Zero Voice Storage Policy</span>
                    </div>
                    <div className="shield-chip">
                      <Zap size={16} className="text-amber-700"/>
                      <span>Ephemerally Encrypted RAM</span>
                    </div>
                  </div>)}

                {bento.visualType === "routine" && (<div className="bento-visual-actions">
                    <span className="action-tag">Web Search</span>
                    <span className="action-tag">Calendar Sync</span>
                    <span className="action-tag">Email Drafts</span>
                    <span className="action-tag">Document Readout</span>
                  </div>)}
              </div>))}
          </div>
        </div>
      </section>

      {/* =========================================================================
            SECTION: INTERACTIVE "DAY IN THE LIFE" (DEEP ESPRESSO / CHARCOAL)
            ========================================================================= */}
      <section className="aesthetic-routine-section">
        <div className="aesthetic-routine-container">
          <div className="aesthetic-section-header light-text text-center reveal-on-scroll">
            <span className="aesthetic-pill-tag tag-dark">EXPERIENCE INDICA</span>
            <h2 className="aesthetic-section-title">
              From first tea
              <span className="aesthetic-serif-italic dark-serif"> to evening unwinding.</span>
            </h2>
            <p className="aesthetic-section-subtitle dark-sub">
              Tap through each part of your day to see how natural voice assistance changes your routine.
            </p>
          </div>

          {/* Routine Switcher Tabs */}
          <div className="aesthetic-routine-tabs">
            {[
            { id: "morning", label: "Morning Awakening", time: "07:00 – 09:30" },
            { id: "work", label: "Focused Workday", time: "10:00 – 17:30" },
            { id: "evening", label: "Evening Recharge", time: "18:00 – 22:30" },
        ].map((tab) => (<button key={tab.id} type="button" className={`routine-tab-btn ${activeDayRoutine === tab.id ? "is-active" : ""}`} onClick={() => setActiveDayRoutine(tab.id)}>
                <span className="routine-tab-name">{tab.label}</span>
                <span className="routine-tab-time">{tab.time}</span>
              </button>))}
          </div>

          {/* Routine Showcase Panel */}
          <div className="aesthetic-routine-panel">
            {activeDayRoutine === "morning" && (<div className="routine-content-grid">
                <div className="routine-text-col">
                  <span className="routine-step-num">01 / MORNING</span>
                  <h3 className="routine-panel-title">
                    Start without looking at
                    <span className="aesthetic-serif-italic dark-serif"> blue light.</span>
                  </h3>
                  <p className="routine-panel-desc">
                    Wake up, ask for the morning briefing while making tea, and hear your commute traffic, regional headlines, and calendar agenda read aloud.
                  </p>
                  <div className="routine-quote-bubble">
                    &ldquo;Indica, aaj subah ka weather aur 10 baje ki meeting ka status batao.&rdquo;
                  </div>
                  <button type="button" className="routine-cta-btn" onClick={() => handleLaunchWithAuth("Aaj subah ka weather aur meri 10 baje ki meeting ka status batao", "hi")}>
                    <span>Try Morning Briefing</span>
                    <ArrowRight size={14}/>
                  </button>
                </div>
                <div className="routine-card-col">
                  <div className="routine-widget-card">
                    <div className="widget-row">
                      <span className="widget-dot orange-dot"/>
                      <div>
                        <strong>Weather & Air Quality</strong>
                        <p>24°C • AQI 118 (Moderate) • Clear skies</p>
                      </div>
                    </div>
                    <div className="widget-row">
                      <span className="widget-dot purple-dot"/>
                      <div>
                        <strong>Bilingual Commute Alert</strong>
                        <p>Outer Ring Road traffic moving slowly (+12 mins)</p>
                      </div>
                    </div>
                    <div className="widget-row">
                      <span className="widget-dot teal-dot"/>
                      <div>
                        <strong>Daily Agenda</strong>
                        <p>3 meetings scheduled • First sync at 10:30 AM</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>)}

            {activeDayRoutine === "work" && (<div className="routine-content-grid">
                <div className="routine-text-col">
                  <span className="routine-step-num">02 / WORKDAY</span>
                  <h3 className="routine-panel-title">
                    Deep focus,
                    <span className="aesthetic-serif-italic dark-serif"> zero context switching.</span>
                  </h3>
                  <p className="routine-panel-desc">
                    Dictate complex emails, cross-translate client notes between English and regional languages, and summarize 20-page research documents instantly.
                  </p>
                  <div className="routine-quote-bubble">
                    &ldquo;Indica, translate this client summary to formal Tamil and draft a follow-up email.&rdquo;
                  </div>
                  <button type="button" className="routine-cta-btn" onClick={() => handleLaunchWithAuth("Summarize this document and draft a quick response", "en")}>
                    <span>Try Work Assistant</span>
                    <ArrowRight size={14}/>
                  </button>
                </div>
                <div className="routine-card-col">
                  <div className="routine-widget-card">
                    <div className="widget-row">
                      <span className="widget-dot purple-dot"/>
                      <div>
                        <strong>Hands-Free Dictation</strong>
                        <p>Transcribed 420 words in Hinglish with perfect punctuation</p>
                      </div>
                    </div>
                    <div className="widget-row">
                      <span className="widget-dot orange-dot"/>
                      <div>
                        <strong>Instant Indic Translation</strong>
                        <p>English product spec translated to Bengali & Telugu</p>
                      </div>
                    </div>
                    <div className="widget-row">
                      <span className="widget-dot teal-dot"/>
                      <div>
                        <strong>Focus Protection</strong>
                        <p>Notifications silented until 1:00 PM lunch block</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>)}

            {activeDayRoutine === "evening" && (<div className="routine-content-grid">
                <div className="routine-text-col">
                  <span className="routine-step-num">03 / EVENING</span>
                  <h3 className="routine-panel-title">
                    Wind down with
                    <span className="aesthetic-serif-italic dark-serif"> gentle care.</span>
                  </h3>
                  <p className="routine-panel-desc">
                    Gentle reminders to call family, regional cricket scores, or a bedtime story in your native language so you can put your phone away.
                  </p>
                  <div className="routine-quote-bubble">
                    &ldquo;Indica, call Mum reminder and tell me today's IPL match summary.&rdquo;
                  </div>
                  <button type="button" className="routine-cta-btn" onClick={() => handleLaunchWithAuth("IPL match summary aur kal subah ka reminder", "hi")}>
                    <span>Try Evening Unwind</span>
                    <ArrowRight size={14}/>
                  </button>
                </div>
                <div className="routine-card-col">
                  <div className="routine-widget-card">
                    <div className="widget-row">
                      <span className="widget-dot teal-dot"/>
                      <div>
                        <strong>Family Call Reminder</strong>
                        <p>Gentle notification triggered at 6:15 PM</p>
                      </div>
                    </div>
                    <div className="widget-row">
                      <span className="widget-dot orange-dot"/>
                      <div>
                        <strong>Sports & Local Digest</strong>
                        <p>Scores summarized in 45 seconds</p>
                      </div>
                    </div>
                    <div className="widget-row">
                      <span className="widget-dot purple-dot"/>
                      <div>
                        <strong>Screen-Free Relaxation</strong>
                        <p>Soothing bedtime audio in Marathi or Hindi</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>)}
          </div>
        </div>
      </section>

      {/* =========================================================================
            SECTION: DEVELOPER API & SDK TERMINAL (WARM SAND)
            ========================================================================= */}
      <section id="developer" className="aesthetic-developer-section">
        <div className="aesthetic-developer-container">
          <div className="aesthetic-section-header reveal-on-scroll">
            <span className="aesthetic-pill-tag">DEVELOPER API</span>
            <h2 className="aesthetic-section-title">
              Power your apps with
              <span className="aesthetic-serif-italic"> Indic voice intelligence.</span>
            </h2>
            <p className="aesthetic-section-subtitle">
              Add sub-200ms voice recognition and natural speech synthesis in 13+ languages using simple SDKs.
            </p>
          </div>

          <div className="aesthetic-terminal-card">
            {/* Terminal Header */}
            <div className="terminal-header">
              <div className="terminal-dots">
                <span className="dot dot-red"/>
                <span className="dot dot-yellow"/>
                <span className="dot dot-green"/>
              </div>

              {/* Language Tabs */}
              <div className="terminal-tabs">
                <button type="button" className={`terminal-tab ${activeCodeTab === "python" ? "is-active" : ""}`} onClick={() => setActiveCodeTab("python")}>
                  python (indica-py)
                </button>
                <button type="button" className={`terminal-tab ${activeCodeTab === "node" ? "is-active" : ""}`} onClick={() => setActiveCodeTab("node")}>
                  node.js (@indica/ai)
                </button>
                <button type="button" className={`terminal-tab ${activeCodeTab === "curl" ? "is-active" : ""}`} onClick={() => setActiveCodeTab("curl")}>
                  cURL / REST
                </button>
              </div>

              {/* Copy Code */}
              <button type="button" className="terminal-copy-btn" onClick={handleCopyCode} title="Copy code snippet">
                {copiedCode ? <Check size={14} className="text-emerald-400"/> : <Copy size={14}/>}
                <span>{copiedCode ? "Copied" : "Copy"}</span>
              </button>
            </div>

            {/* Terminal Code Body */}
            <div className="terminal-body">
              <pre>
                <code>{CODE_EXAMPLES[activeCodeTab]}</code>
              </pre>
            </div>

            {/* Terminal Footer Bar */}
            <div className="terminal-footer">
              <div className="terminal-badge">
                <Radio size={14} className="text-emerald-400 animate-pulse"/>
                <span>REST API v1.4 & WebSocket Live Streaming Ready</span>
              </div>
              <button type="button" className="terminal-docs-btn" onClick={() => onLaunchApp()}>
                <span>Explore Developer Sandbox</span>
                <ArrowUpRight size={14}/>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
            SECTION: TESTIMONIALS / REGIONAL VOICES (WARM SAND)
            ========================================================================= */}
      <section className="aesthetic-testimonials-section">
        <div className="aesthetic-testimonials-container">
          <div className="aesthetic-section-header text-center reveal-on-scroll">
            <span className="aesthetic-pill-tag">USER EXPERIENCES</span>
            <h2 className="aesthetic-section-title">
              Trusted by creators & families
              <br />
              <span className="aesthetic-serif-italic">from Bangalore to Banaras.</span>
            </h2>
          </div>

          <div className="aesthetic-testimonials-grid">
            {TESTIMONIALS.map((t, idx) => (<div key={idx} className={`aesthetic-testimonial-card reveal-on-scroll reveal-delay-${(idx % 3) + 1}`}>
                <p className="testimonial-quote">&ldquo;{t.quote}&rdquo;</p>
                <div className="testimonial-author-row">
                  <div className="testimonial-avatar" style={{ backgroundColor: t.bg }}>
                    <span>{t.initials}</span>
                  </div>
                  <div>
                    <h4 className="testimonial-author-name">{t.author}</h4>
                    <span className="testimonial-author-role">
                      {t.role} • <em>{t.location}</em>
                    </span>
                  </div>
                </div>
              </div>))}
          </div>
        </div>
      </section>

      {/* =========================================================================
            SECTION: INTERACTIVE FAQ (WARM SAND / SOFT IVORY)
            ========================================================================= */}
      <section id="faq" className="aesthetic-faq-section">
        <div className="aesthetic-faq-container">
          <div className="aesthetic-section-header text-center reveal-on-scroll">
            <span className="aesthetic-pill-tag">FREQUENTLY ASKED</span>
            <h2 className="aesthetic-section-title">
              Everything you wanted to know
              <span className="aesthetic-serif-italic"> about Indica.</span>
            </h2>
          </div>

          <div className="aesthetic-faq-accordion">
            {FAQS.map((faq, idx) => {
            const isOpen = openFaqIdx === idx;
            return (<div key={idx} className={`aesthetic-faq-item ${isOpen ? "is-open" : ""}`}>
                  <button type="button" className="faq-question-btn" onClick={() => setOpenFaqIdx(isOpen ? null : idx)} aria-expanded={isOpen}>
                    <span>{faq.question}</span>
                    <ChevronDown size={18} className={`faq-icon ${isOpen ? "rotate-180" : ""}`}/>
                  </button>
                  {isOpen && (<div className="faq-answer-pane">
                      <p>{faq.answer}</p>
                    </div>)}
                </div>);
        })}
          </div>
        </div>
      </section>

      {/* =========================================================================
            BOTTOM SECTION (WARM SAND / ALABASTER BEIGE)
            ========================================================================= */}
      <section id="privacy" className="aesthetic-bottom-section">
        <div className="aesthetic-bottom-container reveal-on-scroll">
          <span className="aesthetic-bottom-eyebrow">PRIVATE BY DESIGN</span>

          <h2 className="aesthetic-bottom-title">
            Your voice belongs to you.
          </h2>

          <p className="aesthetic-bottom-desc">
            Clear controls, transparent memory, and privacy choices you can understand—without reading the fine print.
          </p>

          <button
            type="button"
            className="aesthetic-bottom-cta-btn"
            onClick={() => {
              stopAudio();
              if (onLaunchLiveAssistant) {
                onLaunchLiveAssistant();
              } else {
                handleLaunchWithAuth();
              }
            }}
          >
            <span>Launch Indica Assistant</span>
            <ArrowRight size={15}/>
          </button>

          <p className="aesthetic-lang-supported-note">
            Available in English, हिन्दी, বাংলা, தமிழ், తెలుగు and मराठी
          </p>
        </div>
      </section>

      {/* =========================================================================
            RICH LUXURY FOOTER (WARM ESPRESSO / CHARCOAL)
            ========================================================================= */}
      <footer id="about" className="aesthetic-footer">
        <div className="aesthetic-footer-content">
          <div className="footer-top-grid">
            <div className="footer-col-brand">
              <div className="aesthetic-brand-corner footer-brand" onClick={handleScrollToTop} role="button" tabIndex={0} title="Scroll to top">
                <div className="aesthetic-brand-emblem-wrap">
                  <Image src="/indica-symbol.png" alt="Indica Emblem" width={38} height={38} className="aesthetic-brand-logo-img"/>
                  <span className="aesthetic-brand-glow-ring"/>
                </div>
                <div className="aesthetic-brand-text-lockup">
                  <span className="aesthetic-brand-title light">
                    <span className="brand-navy-light">Indic</span><span className="brand-terracotta">a</span>
                  </span>
                  <span className="aesthetic-brand-badge light">AI VOICE ASSISTANT</span>
                </div>
              </div>
              <p className="footer-brand-bio">
                Thoughtful AI companion built for India’s rich linguistic heritage.
                Natural conversational intelligence across 13+ native languages.
              </p>
              <div className="footer-status-pill">
                <span className="status-dot-pulse"/>
                <span>All 13 Indic Voice Nodes Operational</span>
              </div>
            </div>

            <div className="footer-col-links">
              <h4>Product</h4>
              <button type="button" onClick={() => handleLaunchWithAuth()}>Launch Web App</button>
              <a href="#playground">Voice Studio</a>
              <a href="#possibilities">Possibilities</a>
              <a href="#developer">Developer API</a>
            </div>

            <div className="footer-col-links">
              <h4>Languages</h4>
              <span>Hindi (हिन्दी)</span>
              <span>Bengali (বাংলা)</span>
              <span>Tamil (தமிழ்)</span>
              <span>Telugu (తెలుగు)</span>
              <span>Marathi (मराठी)</span>
            </div>

            <div className="footer-col-links">
              <h4>Account & Access</h4>
              <button type="button" onClick={openAuthModal}>Sign in with Google</button>
              <a href="#privacy">Enterprise Privacy</a>
              <a href="#terms">Terms of Service</a>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <p className="aesthetic-footer-tagline">
              Thoughtful technology for everyday life. © {new Date().getFullYear()} Indica AI Inc.
            </p>
            <div className="aesthetic-footer-actions">
              <button type="button" onClick={openAuthModal}>Sign in with Google</button>
              <span>•</span>
              <a href="#privacy">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Corner Quick-Launcher */}
      <div className="aesthetic-floating-corner-launcher">
        <button type="button" className="floating-launcher-btn" onClick={() => handleLaunchWithAuth()} title="Talk to Indica Voice Assistant">
          <div className="floating-mic-circle">
            <Mic size={15}/>
            <span className="mic-pulse-ring"/>
          </div>
          <span className="launcher-text">Talk to Indica</span>
        </button>
      </div>
    </div>);
}
