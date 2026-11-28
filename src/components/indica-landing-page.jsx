"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  Mic,
  Pause,
  Play,
  Plus,
  Radio,
  ShieldCheck,
  Zap,
  Sparkles,
  Globe2,
  FileText,
  AudioWaveform,
  Cpu,
  Layers,
  Compass,
  MessageSquareQuote,
  Activity,
  ScanLine,
  Lock,
  Workflow,
  Sparkle,
  Code2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useAudioPlayer } from "@/hooks/use-audio-player";

const SAMPLE_PROMPTS = [
  {
    text: "Plan my day around the weather and meetings.",
    lang: "en",
    label: "English",
    region: "Pan-India / Global",
    audioResponse:
      "Good morning! Expect clear skies with a pleasant 24 degrees in Delhi-NCR. I have spaced your afternoon meetings so you can take a walk.",
    category: "Daily Productivity",
  },
  {
    text: "आज सोने का भाव और बाजार की स्थिति क्या है?",
    lang: "hi",
    label: "हिन्दी",
    region: "North & Central India",
    audioResponse:
      "आज 24 कैरेट सोने का भाव लगभग 76 हजार 450 रुपये प्रति 10 ग्राम पर स्थिर बना हुआ है। शेयर बाजार आज 320 अंक ऊपर कारोबार कर रहा है।",
    category: "Financial Markets",
  },
  {
    text: "কলকাতার বর্তমান প্রধান খবর এবং আবহাওয়া বলো।",
    lang: "bn",
    label: "বাংলা",
    region: "West Bengal & Tripura",
    audioResponse:
      "কলকাতায় আজ আংশিক মেঘলা আকাশ। সর্বোচ্চ তাপমাত্রা থাকবে প্রায় 31 ডিগ্রি সেলসিয়াস। ভিক্টোরিয়া ও পার্ক স্ট্রিটে হালকা ট্রাফিক রয়েছে।",
    category: "City & News",
  },
  {
    text: "இன்றைய வானிலை மற்றும் முக்கிய செய்திகள் என்ன?",
    lang: "ta",
    label: "தமிழ்",
    region: "Tamil Nadu",
    audioResponse:
      "சென்னையில் இன்று லேசான மழைக்கு வாய்ப்புள்ளது. வெப்பநிலை 30 டிகிரியாக இருக்கும். மெட்ரோ பணிகள் காரணமாக அண்ணா சாலையில் மாற்றம் உள்ளது.",
    category: "Real-time Digest",
  },
  {
    text: "హైదరాబాద్‌లో ఈరోజు తాజా వাতావరణం ఎలా ఉంది?",
    lang: "te",
    label: "తెలుగు",
    region: "Telangana & AP",
    audioResponse:
      "హైదరాబాద్‌లో నేడు వాతావరణం ఆహ్లాదకరంగా ఉంటుంది. హైటెక్ సిటీ మరియు గచ్చిబౌలి మార్గంలో సాయంత్రం వేళల్లో సాధారణ ట్రాఫిక్ ఉండే అవకాశం ఉంది.",
    category: "Commute & Transit",
  },
  {
    text: "मुंबईतील आजचे हवामान आणि लोकल ट्रेनचे अपडेट काय आहे?",
    lang: "mr",
    label: "मराठी",
    region: "Maharashtra",
    audioResponse:
      "मुंबईत आज हवामान उष्ण व दमট राहील. वेस्टर्न आणि सेंट्रल लोकल सेवा सर्वसाधारण वेळापत्रकानुसार सुरळीत सुरू आहेत.",
    category: "Metropolitan Life",
  },
];

const BENTO_FEATURES = [
  {
    icon: Globe2,
    tag: "NATIVE LINGUISTICS",
    title: "Dialects & Code-Switching,",
    titleItalic: "zero friction.",
    description:
      "From colloquial Delhi Hinglish to pure rural Bengali and Tanglish, Indica's acoustic models eliminate accent penalties and awkward mishears.",
    badge: "99.4% Accuracy",
    visualType: "dialects",
  },
  {
    icon: ScanLine,
    tag: "MULTIMODAL REASONING",
    title: "Smart Document & OCR Scanner,",
    titleItalic: "human insight.",
    description:
      "Upload medical lab reports, resumes, bills, or handwriting. Indica extracts every detail and speaks a compassionate explanation in your language.",
    badge: "100% Offline OCR",
    visualType: "multimodal",
  },
  {
    icon: AudioWaveform,
    tag: "ACOUSTIC INTELLIGENCE",
    title: "Instant Neural Speech,",
    titleItalic: "human cadence.",
    description:
      "Zero robot stutter. Ultra-low latency voice synthesis that responds in under 180ms with natural breathing pauses and comforting intonation.",
    badge: "< 180ms Latency",
    visualType: "latency",
  },
  {
    icon: ShieldCheck,
    tag: "EPHEMERAL PRIVACY",
    title: "Zero Data Retention,",
    titleItalic: "RAM-only vault.",
    description:
      "Audio is processed in encrypted memory buffers and wiped instantly. Your personal medical reports, resumes, and voiceprints are never retained.",
    badge: "Zero Retention",
    visualType: "shield",
  },
  {
    icon: Zap,
    tag: "REAL-TIME GROUNDING",
    title: "Live Web Evidence,",
    titleItalic: "zero hallucination.",
    description:
      "Autonomous multi-engine search cross-references live news, weather, cricket scores, and market prices with verified source citations.",
    badge: "Live Web Engine",
    visualType: "grounding",
  },
  {
    icon: Workflow,
    tag: "HANDS-FREE ACTIONS",
    title: "Natural Voice Workflows,",
    titleItalic: "real results.",
    description:
      "Manage daily reminders, draft bilingual emails, inspect technical specs, and summarize long papers entirely through spoken conversation.",
    badge: "Full Automation",
    visualType: "actions",
  },
];

const METRICS_LIST = [
  { value: "13+", label: "Scheduled Indian Languages", hint: "Native accents, zero transliteration lag" },
  { value: "<180ms", label: "Streaming Audio Latency", hint: "Faster than human turn-taking" },
  { value: "100%", label: "Private Ephemeral RAM", hint: "Zero voice retention or public training" },
  { value: "99.4%", label: "Hinglish & Dialect Accuracy", hint: "Trained on authentic colloquial speech" },
];

const CODE_EXAMPLES = {
  python: `import indica

# Initialize high-speed Indic Voice client
client = indica.VoiceClient(api_key="ind_live_...")

# Stream natural Hindi or Bengali response in <180ms
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

// Realtime Indic Voice interaction session
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
    quote:
      "Having an AI that effortlessly understands spoken Bengali and analyzes my medical reports without breaking cadence feels like true magic.",
    author: "Dr. Ananya Roy",
    role: "Senior AI Researcher",
    location: "Kolkata, WB",
    initials: "AR",
    tag: "Linguistics & Healthcare",
  },
  {
    quote:
      "Indica is the first voice assistant where our grandparents in Varanasi can speak fluent Awadhi and Hindi without ever touching a screen keyboard.",
    author: "Vikramaditya Sharma",
    role: "Founder, BharatStack",
    location: "New Delhi",
    initials: "VS",
    tag: "Elderly Accessibility",
  },
  {
    quote:
      "The latency is under 200 milliseconds. The Tamil pronunciation has zero Americanized accent—it sounds like talking to an educated friend.",
    author: "Karthik Subramanian",
    role: "Product Director",
    location: "Chennai, TN",
    initials: "KS",
    tag: "Enterprise Engineering",
  },
];

const FAQS = [
  {
    question: "How does Indica understand Hinglish and mixed-language sentences?",
    answer:
      "Indica uses proprietary dual-token acoustic and semantic decoders trained specifically on multilingual Indic speech. When you blend English technical words with Hindi or Bengali grammar ('Meeting schedule kar do for tomorrow morning'), Indica understands the semantic intent without getting confused by code-switching.",
  },
  {
    question: "How does the Multimodal OCR & Document Scanner work?",
    answer:
      "You can upload or photograph medical lab reports, doctor prescriptions, invoices, or resumes. Indica uses high-precision local OCR and multimodal neural reasoning to extract tables and metrics, detect the document type, and explain everything warmly in your native language via voice.",
  },
  {
    question: "Do I need to pay or enter credit card details to use Indica?",
    answer:
      "Indica provides enterprise single sign-on via Google OAuth 2.0 without entering passwords or credit cards. Sign in to synchronize your multilingual voice history, custom prompts, and workspaces across devices securely.",
  },
  {
    question: "Is my voice or uploaded medical data stored on company servers?",
    answer:
      "Privacy is our founding principle. Real-time audio streams and uploaded documents are processed in temporary encrypted RAM buffers and wiped immediately after transcription and analysis. We do not store or sell your raw voice recordings.",
  },
  {
    question: "Which Indic languages are supported currently?",
    answer:
      "Indica currently provides end-to-end speech recognition and voice synthesis for 13+ languages: English, Hindi (हिन्दी), Bengali (বাংলা), Tamil (தமிழ்), Telugu (తెలుగు), Marathi (मराठी), Gujarati (ગુજરાતી), Kannada (ಕನ್ನಡ), Malayalam (മലയാളം), Punjabi (ਪੰਜਾਬੀ), Odia (ଓଡ଼ିଆ), Assamese, and Urdu.",
  },
  {
    question: "How is Indica different from Google Assistant, Siri, or Alexa?",
    answer:
      "Generic global voice assistants were built with English-first acoustics and treated Indic languages as secondary translations. Indica was engineered ground-up for Bharat—supporting rich regional colloquialisms, dialect nuances, multi-turn reasoning, and sub-200ms real-time audio playback.",
  },
];

export function IndicaLandingPage({ onLaunchApp, onLaunchLiveAssistant }) {
  const { openAuthModal, isAuthenticated } = useAuth();
  const { isSpeaking: isPlayingAudio, speak, stopAudio } = useAudioPlayer();

  const [selectedPromptIdx, setSelectedPromptIdx] = useState(0);
  const [activeCodeTab, setActiveCodeTab] = useState("python");
  const [copiedCode, setCopiedCode] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState(0);
  const [activeDayRoutine, setActiveDayRoutine] = useState("morning");

  const containerRef = useRef(null);
  const currentPrompt = SAMPLE_PROMPTS[selectedPromptIdx];

  // Auth Gate: unauthenticated users open auth modal first
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

  const handleScrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // High-performance 120 FPS Native IntersectionObserver for smooth scroll animations
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const revealElements = container.querySelectorAll(".reveal-on-scroll");
    if (!revealElements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
          }
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -60px 0px",
        threshold: 0.12,
      }
    );

    revealElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      stopAudio();
    } else {
      void speak(currentPrompt.audioResponse, currentPrompt.lang);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(CODE_EXAMPLES[activeCodeTab]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="aesthetic-landing-page modern-theme" ref={containerRef}>
      {/* =========================================================================
          TOP NAVIGATION BAR (FROSTED GLASSMORPHISM)
          ========================================================================= */}
      <header className="aesthetic-header modern-header">
        <div className="aesthetic-header-content">
          {/* Brand Corner */}
          <div
            className="aesthetic-brand-corner"
            onClick={handleScrollToTop}
            role="button"
            tabIndex={0}
            title="Indica AI - Click to scroll to top"
          >
            <div className="aesthetic-brand-emblem-wrap">
              <Image
                src="/indica-symbol.png"
                alt="Indica Emblem"
                width={36}
                height={36}
                className="aesthetic-brand-logo-img"
                priority
              />
              <span className="aesthetic-brand-glow-ring" />
            </div>
            <div className="aesthetic-brand-text-lockup">
              <span className="aesthetic-brand-title">
                <span className="brand-navy">Indic</span>
                <span className="brand-terracotta">a</span>
              </span>
              <span className="aesthetic-brand-badge">AI VOICE ASSISTANT</span>
            </div>
          </div>

          {/* Center Links with Outline Icons */}
          <nav className="aesthetic-nav-links modern-nav">
            <a
              href="#capabilities"
              onClick={(e) => handleNavClick(e, "capabilities")}
              className="aesthetic-nav-item"
            >
              <Cpu size={14} className="nav-icon" />
              <span>Capabilities</span>
            </a>
            <a
              href="#playground"
              onClick={(e) => handleNavClick(e, "playground")}
              className="aesthetic-nav-item"
            >
              <AudioWaveform size={14} className="nav-icon" />
              <span>Voice Studio</span>
            </a>
            <a
              href="#routine"
              onClick={(e) => handleNavClick(e, "routine")}
              className="aesthetic-nav-item"
            >
              <Workflow size={14} className="nav-icon" />
              <span>Workflow</span>
            </a>
            <a
              href="#developer"
              onClick={(e) => handleNavClick(e, "developer")}
              className="aesthetic-nav-item"
            >
              <Code2 size={14} className="nav-icon" />
              <span>Developers</span>
            </a>
            <a
              href="#faq"
              onClick={(e) => handleNavClick(e, "faq")}
              className="aesthetic-nav-item"
            >
              <FileText size={14} className="nav-icon" />
              <span>FAQ</span>
            </a>
          </nav>

          {/* Right Header Actions */}
          <div className="aesthetic-header-actions">
            <button
              type="button"
              className="aesthetic-waitlist-btn modern-action-btn"
              onClick={() => handleLaunchWithAuth()}
            >
              <Mic size={15} className="btn-icon" />
              <span>Talk to Indica</span>
              <span className="live-pill-dot" />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          HERO SECTION (RECONSTRUCTED WITH MODERN OUTLINE ACCENTS & AMBIENT GLOW)
          ========================================================================= */}
      <section className="aesthetic-hero-section modern-hero" style={{ position: "relative" }}>
        {/* Subtle Architectural Dot Matrix & Registration Crosshairs */}
        <div className="aesthetic-2d-dot-grid modern-grid" />
        <span className="aesthetic-2d-crosshair crosshair-top-left">+</span>
        <span className="aesthetic-2d-crosshair crosshair-top-right">+</span>
        <span className="aesthetic-2d-crosshair crosshair-bottom-left">+</span>
        <span className="aesthetic-2d-crosshair crosshair-bottom-right">+</span>

        <div className="aesthetic-hero-container" style={{ position: "relative", zIndex: 2 }}>
          {/* Left Column: Typography & CTAs */}
          <div className="aesthetic-hero-text hero-animate-in">
            {/* Live Indicator Pill */}
            <div className="aesthetic-eyebrow-tag modern-pill">
              <span className="live-sparkle-dot">
                <Sparkles size={13} className="text-amber-500 animate-spin-slow" />
              </span>
              <span>NEXT-GEN INDIC AI • VOICE & MULTIMODAL INTELLIGENCE</span>
            </div>

            {/* Reconstructed Headline */}
            <h1 className="aesthetic-headline modern-headline">
              The Voice of Bharat,
              <br />
              <span className="aesthetic-serif-italic hero-gradient-serif">reimagined for you.</span>
            </h1>

            {/* Subtitle */}
            <p className="aesthetic-subheading modern-subheading">
              Meet Indica, the thoughtful AI companion that speaks 13+ native Indian languages,
              reads and explains medical reports & resumes, and powers your everyday life hands-free.
            </p>

            {/* Action Buttons Row */}
            <div className="aesthetic-hero-actions-row modern-hero-actions">
              <button
                type="button"
                className="aesthetic-talk-btn modern-primary-btn"
                onClick={() => handleLaunchWithAuth()}
              >
                <div className="aesthetic-mic-circle modern-mic-circle">
                  <Mic size={16} />
                  <span className="hero-mic-pulse" />
                </div>
                <span>Talk to Indica Live</span>
                <ArrowRight size={15} className="ml-1" />
              </button>

              <button
                type="button"
                className="aesthetic-see-more-btn modern-secondary-btn"
                onClick={() => {
                  stopAudio();
                  const nextIdx = (selectedPromptIdx + 1) % SAMPLE_PROMPTS.length;
                  setSelectedPromptIdx(nextIdx);
                  void speak(SAMPLE_PROMPTS[nextIdx].audioResponse, SAMPLE_PROMPTS[nextIdx].lang);
                }}
              >
                <Play size={14} fill="currentColor" />
                <span>Hear Voice Sample</span>
                <span className="hero-sample-badge">{currentPrompt.label}</span>
              </button>
            </div>

            {/* Social Proof & Trust Badges */}
            <div className="aesthetic-social-proof modern-proof">
              <div className="aesthetic-avatar-group">
                <div className="aesthetic-avatar av-1" />
                <div className="aesthetic-avatar av-2" />
                <div className="aesthetic-avatar av-3" />
                <div className="aesthetic-avatar av-plus">
                  <span>5k+</span>
                </div>
              </div>
              <div className="modern-proof-copy">
                <div className="proof-stars">★★★★★</div>
                <span className="aesthetic-proof-text">
                  Loved across 13+ Indian languages with zero accent penalty
                </span>
              </div>
            </div>

            {/* Acoustic Pipeline Strip */}
            <div className="aesthetic-2d-waveform-strip modern-pipeline-strip">
              <span className="pipeline-dot" />
              <div className="wave-mini-bars">
                <span className="wave-line h-2" />
                <span className="wave-line h-4" />
                <span className="wave-line h-6" />
                <span className="wave-line h-3" />
                <span className="wave-line h-5" />
              </div>
              <span className="pipeline-text">
                Active Neural Pipeline: <strong>Sub-180ms Turn-Taking</strong>
              </span>
            </div>
          </div>

          {/* Right Column: Glowing Sonic Orb & 3D Interactive Floating Cards */}
          <div className="aesthetic-hero-visual hero-animate-in-delayed">
            <div className="aesthetic-orb-stage modern-orb-stage">
              {/* Floating Technical Feature Badges */}
              <div className="aesthetic-2d-badge badge-top-right modern-card-float-1">
                <div className="badge-row">
                  <span className="badge-icon icon-teal">
                    <Zap size={14} strokeWidth={2} />
                  </span>
                  <span className="badge-title">Sub-180ms Latency</span>
                </div>
                <span className="badge-sub">Ultra-Fast Voice Streaming</span>
              </div>

              <div className="aesthetic-2d-badge badge-bottom-left modern-card-float-2">
                <div className="badge-row">
                  <span className="badge-icon icon-indigo">
                    <ScanLine size={14} strokeWidth={2} />
                  </span>
                  <span className="badge-title">Multimodal OCR</span>
                </div>
                <span className="badge-sub">Medical & Document Vision</span>
              </div>

              {/* Floating Top-Left Tag */}
              <div className="aesthetic-floating-chip chip-top-left modern-chip">
                <span className="chip-dot-pulse" />
                <span>13+ Scheduled Languages Live</span>
              </div>

              {/* Concentric Ambient Energy Rings */}
              <div className="aesthetic-ambient-ring ring-outer">
                <span className="satellite-node node-1" />
              </div>
              <div className="aesthetic-ambient-ring ring-mid">
                <span className="satellite-node node-2" />
              </div>

              {/* Glowing Sunset Interactive Sonic Orb */}
              <div
                className={`aesthetic-sonic-orb modern-sonic-orb ${isPlayingAudio ? "is-pulsing" : ""}`}
                onClick={handleToggleAudio}
                title="Click to hear Indica neural voice"
                role="button"
                tabIndex={0}
              >
                {/* 9 Equalizer Audio Bars */}
                <div className="aesthetic-soundwave-center">
                  {[32, 55, 75, 48, 92, 58, 80, 45, 30].map((h, i) => (
                    <span
                      key={i}
                      className={`aesthetic-bar ${isPlayingAudio ? "bar-active" : "bar-idle"}`}
                      style={{
                        height: isPlayingAudio ? `${h}%` : `${24 + (i % 3) * 12}%`,
                        animationDelay: `${i * 0.08}s`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Floating Interactive "TRY SAYING" Badge */}
              <div
                className="aesthetic-try-saying-badge modern-try-badge"
                onClick={() => handleLaunchWithAuth(currentPrompt.text, currentPrompt.lang)}
                role="button"
                tabIndex={0}
                title="Click to speak this in Indica"
              >
                <div className="try-saying-label">
                  <Sparkles size={12} className="text-amber-600" />
                  <span>TRY ASKING IN YOUR LANGUAGE</span>
                </div>
                <div className="try-saying-quote">&ldquo;{currentPrompt.text}&rdquo;</div>
                <div className="try-saying-sub">
                  <span>
                    {currentPrompt.label} • {currentPrompt.region}
                  </span>
                  <ArrowRight size={13} className="try-arrow" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          METRICS & TRUST BANNER (HIGH-IMPACT MODERN STATS)
          ========================================================================= */}
      <section className="modern-metrics-section reveal-on-scroll">
        <div className="modern-metrics-container">
          {METRICS_LIST.map((metric, i) => (
            <div key={i} className="modern-metric-card">
              <strong className="metric-val">{metric.value}</strong>
              <span className="metric-title">{metric.label}</span>
              <small className="metric-desc">{metric.hint}</small>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          RECONSTRUCTED BENTO CAPABILITIES GRID 2.0 (MODERN CARDS & OUTLINE ICONS)
          ========================================================================= */}
      <section id="capabilities" className="aesthetic-bento-section modern-bento-section">
        <div className="aesthetic-bento-container">
          <div className="aesthetic-section-header text-center reveal-on-scroll">
            <span className="aesthetic-pill-tag modern-section-tag">
              <Cpu size={13} />
              <span>COGNITIVE CAPABILITIES</span>
            </span>
            <h2 className="aesthetic-section-title">
              Crafted for India’s diversity,
              <br />
              <span className="aesthetic-serif-italic">engineered with global excellence.</span>
            </h2>
            <p className="aesthetic-section-subtitle">
              Every acoustic layer is tuned to capture colloquial rhythms, bilingual code-switching,
              medical documents, and deep contextual reasoning.
            </p>
          </div>

          <div className="aesthetic-bento-grid modern-grid-bento">
            {BENTO_FEATURES.map((bento, i) => {
              const IconComp = bento.icon;
              return (
                <div
                  key={i}
                  className={`aesthetic-bento-card modern-bento-card bento-card-${i + 1} reveal-on-scroll reveal-delay-${(i % 3) + 1}`}
                >
                  <div className="bento-top-row">
                    <div className="bento-icon-wrapper">
                      <IconComp size={18} strokeWidth={2} />
                    </div>
                    <span className="bento-badge-pill">{bento.badge}</span>
                  </div>

                  <span className="bento-tag">{bento.tag}</span>

                  <h3 className="bento-title">
                    {bento.title}{" "}
                    {bento.titleItalic && (
                      <span className="aesthetic-serif-italic bento-italic">
                        {bento.titleItalic}
                      </span>
                    )}
                  </h3>

                  <p className="bento-desc">{bento.description}</p>

                  {/* Micro Visual Renderers */}
                  {bento.visualType === "dialects" && (
                    <div className="bento-visual-dialects modern-visual">
                      <span className="dialect-pill">Hinglish</span>
                      <span className="dialect-pill">Benglish</span>
                      <span className="dialect-pill">Tanglish</span>
                      <span className="dialect-pill">Shuddh Hindi</span>
                      <span className="dialect-pill highlight">99.4% Acc</span>
                    </div>
                  )}

                  {bento.visualType === "multimodal" && (
                    <div className="bento-visual-doc modern-visual">
                      <div className="doc-pill-chip">
                        <FileText size={13} className="text-emerald-700" />
                        <span>Medical Lab Reports</span>
                      </div>
                      <div className="doc-pill-chip">
                        <ScanLine size={13} className="text-indigo-700" />
                        <span>Resumes & CVs</span>
                      </div>
                      <div className="doc-pill-chip">
                        <Zap size={13} className="text-amber-700" />
                        <span>Invoices & Bills</span>
                      </div>
                    </div>
                  )}

                  {bento.visualType === "latency" && (
                    <div className="bento-visual-latency modern-visual">
                      <div className="latency-bar-wrap">
                        <div className="latency-bar active" />
                      </div>
                      <div className="latency-numbers">
                        <span>Standard Global APIs (850ms)</span>
                        <strong className="text-terracotta">Indica Voice (178ms)</strong>
                      </div>
                    </div>
                  )}

                  {bento.visualType === "shield" && (
                    <div className="bento-visual-shield modern-visual">
                      <div className="shield-chip">
                        <ShieldCheck size={14} className="text-emerald-700" />
                        <span>Ephemeral RAM Only</span>
                      </div>
                      <div className="shield-chip">
                        <Lock size={14} className="text-teal-700" />
                        <span>Zero Voice Retention</span>
                      </div>
                    </div>
                  )}

                  {bento.visualType === "grounding" && (
                    <div className="bento-visual-grounding modern-visual">
                      <span className="ground-tag">Wikipedia</span>
                      <span className="ground-tag">DuckDuckGo</span>
                      <span className="ground-tag">Tavily Web</span>
                      <span className="ground-tag highlight">100% Verified</span>
                    </div>
                  )}

                  {bento.visualType === "actions" && (
                    <div className="bento-visual-actions modern-visual">
                      <span className="action-tag">Web Research</span>
                      <span className="action-tag">Calendar Sync</span>
                      <span className="action-tag">Email Drafts</span>
                      <span className="action-tag">Document Readout</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          INTERACTIVE VOICE STUDIO & DIALECT PLAYGROUND
          ========================================================================= */}
      <section id="playground" className="aesthetic-studio-section modern-studio">
        <div className="aesthetic-studio-container">
          <div className="aesthetic-section-header text-center reveal-on-scroll">
            <span className="aesthetic-pill-tag modern-section-tag">
              <AudioWaveform size={13} />
              <span>VOICE & DIALECT STUDIO</span>
            </span>
            <h2 className="aesthetic-section-title">
              Hear India in its
              <span className="aesthetic-serif-italic"> true accents.</span>
            </h2>
            <p className="aesthetic-section-subtitle">
              Switch languages and tap the speaker to hear Indica’s low-latency natural voice synthesis.
            </p>
          </div>

          {/* Interactive Dialect Chips */}
          <div className="aesthetic-studio-tabs modern-tabs">
            {SAMPLE_PROMPTS.map((p, idx) => (
              <button
                key={p.lang}
                type="button"
                className={`aesthetic-studio-tab modern-tab ${selectedPromptIdx === idx ? "is-active" : ""}`}
                onClick={() => {
                  const wasPlaying = isPlayingAudio;
                  stopAudio();
                  setSelectedPromptIdx(idx);
                  if (wasPlaying) {
                    void speak(p.audioResponse, p.lang);
                  }
                }}
              >
                <span className="tab-lang-label">{p.label}</span>
                <span className="tab-region-hint">{p.lang.toUpperCase()}</span>
              </button>
            ))}
          </div>

          {/* Interactive Voice Player Glass Card */}
          <div className="aesthetic-voice-card modern-voice-card reveal-on-scroll">
            <div className="aesthetic-voice-card-top">
              <div className="aesthetic-voice-meta">
                <span className="meta-badge">
                  <Globe2 size={13} />
                  {currentPrompt.label} ({currentPrompt.region})
                </span>
                <span className="meta-speed">
                  <Zap size={13} className="text-amber-600" />
                  Neural Latency: <strong>178ms</strong>
                </span>
              </div>
              <button
                type="button"
                className={`aesthetic-voice-play-trigger modern-play-trigger ${isPlayingAudio ? "is-playing" : ""}`}
                onClick={handleToggleAudio}
              >
                {isPlayingAudio ? (
                  <Pause size={17} />
                ) : (
                  <Play size={17} className="translate-x-[1px]" fill="currentColor" />
                )}
                <span>{isPlayingAudio ? "Pause Audio" : "Listen to Response"}</span>
              </button>
            </div>

            <div className="aesthetic-voice-prompt-box">
              <span className="prompt-label">Spoken Query:</span>
              <p className="prompt-content">&ldquo;{currentPrompt.text}&rdquo;</p>
            </div>

            <div className="aesthetic-voice-response-box">
              <div className="response-header">
                <span className="response-badge">Indica Multilingual Synthesis</span>
                {isPlayingAudio && (
                  <span className="response-live-indicator">
                    <span className="live-dot" /> Streaming Live Neural Audio
                  </span>
                )}
              </div>
              <p className="response-text">{currentPrompt.audioResponse}</p>

              {/* Live Audio Equalizer Waveform */}
              <div className="aesthetic-waveform-visualizer">
                {Array.from({ length: 22 }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`waveform-bar ${isPlayingAudio ? "is-active" : "is-idle"}`}
                    style={{
                      animationDelay: `${idx * 0.04}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Launch In Workspace CTA */}
            <div className="aesthetic-voice-card-footer">
              <span className="voice-tip">✨ Try this exact question in the live assistant:</span>
              <button
                type="button"
                className="aesthetic-try-query-btn modern-try-btn"
                onClick={() => handleLaunchWithAuth(currentPrompt.text, currentPrompt.lang)}
              >
                <span>Ask Indica in {currentPrompt.label}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION: INTERACTIVE WORKFLOW SHOWCASE ("DAY IN THE LIFE")
          ========================================================================= */}
      <section id="routine" className="aesthetic-routine-section modern-routine">
        <div className="aesthetic-routine-container">
          <div className="aesthetic-section-header light-text text-center reveal-on-scroll">
            <span className="aesthetic-pill-tag tag-dark">
              <Workflow size={13} />
              <span>SEAMLESS DAILY FLOW</span>
            </span>
            <h2 className="aesthetic-section-title">
              From morning tea
              <span className="aesthetic-serif-italic dark-serif"> to evening unwinding.</span>
            </h2>
            <p className="aesthetic-section-subtitle dark-sub">
              Tap through each part of your day to see how natural voice assistance changes your routine.
            </p>
          </div>

          {/* Routine Switcher Tabs */}
          <div className="aesthetic-routine-tabs modern-routine-tabs">
            {[
              { id: "morning", label: "01 / Morning Awakening", time: "07:00 – 09:30 AM" },
              { id: "work", label: "02 / Focused Workday", time: "10:00 – 05:30 PM" },
              { id: "evening", label: "03 / Evening Recharge", time: "06:00 – 10:30 PM" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`routine-tab-btn modern-r-btn ${activeDayRoutine === tab.id ? "is-active" : ""}`}
                onClick={() => setActiveDayRoutine(tab.id)}
              >
                <span className="routine-tab-name">{tab.label}</span>
                <span className="routine-tab-time">{tab.time}</span>
              </button>
            ))}
          </div>

          {/* Routine Showcase Panel */}
          <div className="aesthetic-routine-panel modern-r-panel reveal-on-scroll">
            {activeDayRoutine === "morning" && (
              <div className="routine-content-grid">
                <div className="routine-text-col">
                  <span className="routine-step-num">01 / MORNING</span>
                  <h3 className="routine-panel-title">
                    Start your day without
                    <span className="aesthetic-serif-italic dark-serif"> staring at blue light.</span>
                  </h3>
                  <p className="routine-panel-desc">
                    Wake up, ask for the morning briefing while making tea, and hear your commute traffic, regional headlines, and calendar agenda read aloud.
                  </p>
                  <div className="routine-quote-bubble">
                    &ldquo;Indica, aaj subah ka weather aur 10 baje ki meeting ka status batao.&rdquo;
                  </div>
                  <button
                    type="button"
                    className="routine-cta-btn modern-r-cta"
                    onClick={() =>
                      handleLaunchWithAuth(
                        "Aaj subah ka weather aur meri 10 baje ki meeting ka status batao",
                        "hi"
                      )
                    }
                  >
                    <span>Try Morning Briefing</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
                <div className="routine-card-col">
                  <div className="routine-widget-card modern-r-card">
                    <div className="widget-row">
                      <span className="widget-dot orange-dot" />
                      <div>
                        <strong>Weather & Air Quality</strong>
                        <p>24°C • AQI 118 (Moderate) • Clear skies</p>
                      </div>
                    </div>
                    <div className="widget-row">
                      <span className="widget-dot purple-dot" />
                      <div>
                        <strong>Bilingual Commute Alert</strong>
                        <p>Outer Ring Road traffic moving slowly (+12 mins)</p>
                      </div>
                    </div>
                    <div className="widget-row">
                      <span className="widget-dot teal-dot" />
                      <div>
                        <strong>Daily Agenda</strong>
                        <p>3 meetings scheduled • First sync at 10:30 AM</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeDayRoutine === "work" && (
              <div className="routine-content-grid">
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
                  <button
                    type="button"
                    className="routine-cta-btn modern-r-cta"
                    onClick={() =>
                      handleLaunchWithAuth("Summarize this document and draft a quick response", "en")
                    }
                  >
                    <span>Try Work Assistant</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
                <div className="routine-card-col">
                  <div className="routine-widget-card modern-r-card">
                    <div className="widget-row">
                      <span className="widget-dot purple-dot" />
                      <div>
                        <strong>Hands-Free Dictation</strong>
                        <p>Transcribed 420 words in Hinglish with perfect punctuation</p>
                      </div>
                    </div>
                    <div className="widget-row">
                      <span className="widget-dot orange-dot" />
                      <div>
                        <strong>Instant Indic Translation</strong>
                        <p>English product spec translated to Bengali & Telugu</p>
                      </div>
                    </div>
                    <div className="widget-row">
                      <span className="widget-dot teal-dot" />
                      <div>
                        <strong>Document OCR & Resume Review</strong>
                        <p>Instant breakdown of parameters & strengths</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeDayRoutine === "evening" && (
              <div className="routine-content-grid">
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
                    &ldquo;Indica, call Mum reminder and tell me today&apos;s cricket match summary.&rdquo;
                  </div>
                  <button
                    type="button"
                    className="routine-cta-btn modern-r-cta"
                    onClick={() =>
                      handleLaunchWithAuth("Cricket match summary aur kal subah ka reminder", "hi")
                    }
                  >
                    <span>Try Evening Unwind</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
                <div className="routine-card-col">
                  <div className="routine-widget-card modern-r-card">
                    <div className="widget-row">
                      <span className="widget-dot teal-dot" />
                      <div>
                        <strong>Family Call Reminder</strong>
                        <p>Gentle notification triggered at 6:15 PM</p>
                      </div>
                    </div>
                    <div className="widget-row">
                      <span className="widget-dot orange-dot" />
                      <div>
                        <strong>Sports & Local Digest</strong>
                        <p>Scores summarized in 45 seconds</p>
                      </div>
                    </div>
                    <div className="widget-row">
                      <span className="widget-dot purple-dot" />
                      <div>
                        <strong>Screen-Free Relaxation</strong>
                        <p>Soothing bedtime audio in Marathi or Hindi</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          DEVELOPER API & SDK TERMINAL PLAYGROUND
          ========================================================================= */}
      <section id="developer" className="aesthetic-developer-section modern-dev">
        <div className="aesthetic-developer-container">
          <div className="aesthetic-section-header reveal-on-scroll">
            <span className="aesthetic-pill-tag modern-section-tag">
              <Code2 size={13} />
              <span>DEVELOPER API</span>
            </span>
            <h2 className="aesthetic-section-title">
              Power your applications with
              <span className="aesthetic-serif-italic"> Indic voice intelligence.</span>
            </h2>
            <p className="aesthetic-section-subtitle">
              Add sub-180ms voice recognition and natural speech synthesis in 13+ languages using simple SDKs.
            </p>
          </div>

          <div className="aesthetic-terminal-card modern-terminal reveal-on-scroll">
            {/* Terminal Header */}
            <div className="terminal-header">
              <div className="terminal-dots">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
              </div>

              {/* Language Tabs */}
              <div className="terminal-tabs">
                <button
                  type="button"
                  className={`terminal-tab ${activeCodeTab === "python" ? "is-active" : ""}`}
                  onClick={() => setActiveCodeTab("python")}
                >
                  python (indica-py)
                </button>
                <button
                  type="button"
                  className={`terminal-tab ${activeCodeTab === "node" ? "is-active" : ""}`}
                  onClick={() => setActiveCodeTab("node")}
                >
                  node.js (@indica/ai)
                </button>
                <button
                  type="button"
                  className={`terminal-tab ${activeCodeTab === "curl" ? "is-active" : ""}`}
                  onClick={() => setActiveCodeTab("curl")}
                >
                  cURL / REST
                </button>
              </div>

              {/* Copy Code */}
              <button
                type="button"
                className="terminal-copy-btn"
                onClick={handleCopyCode}
                title="Copy code snippet"
              >
                {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
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
                <Radio size={14} className="text-emerald-400 animate-pulse" />
                <span>REST API v1.4 & WebSocket Live Streaming Ready</span>
              </div>
              <button
                type="button"
                className="terminal-docs-btn"
                onClick={() => handleLaunchWithAuth()}
              >
                <span>Explore Developer Sandbox</span>
                <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          TESTIMONIALS (REGIONAL EXPERIENCES & VOICES)
          ========================================================================= */}
      <section className="aesthetic-testimonials-section modern-testimonials">
        <div className="aesthetic-testimonials-container">
          <div className="aesthetic-section-header text-center reveal-on-scroll">
            <span className="aesthetic-pill-tag modern-section-tag">
              <MessageSquareQuote size={13} />
              <span>USER EXPERIENCES</span>
            </span>
            <h2 className="aesthetic-section-title">
              Trusted by creators & families
              <br />
              <span className="aesthetic-serif-italic">from Bangalore to Banaras.</span>
            </h2>
          </div>

          <div className="aesthetic-testimonials-grid">
            {TESTIMONIALS.map((t, idx) => (
              <div
                key={idx}
                className={`aesthetic-testimonial-card modern-testimonial-card reveal-on-scroll reveal-delay-${(idx % 3) + 1}`}
              >
                <div className="testimonial-tag">{t.tag}</div>
                <p className="testimonial-quote">&ldquo;{t.quote}&rdquo;</p>
                <div className="testimonial-author-row">
                  <div className="testimonial-avatar" style={{ backgroundColor: "#1e1d1a", color: "#ffffff" }}>
                    <span>{t.initials}</span>
                  </div>
                  <div>
                    <h4 className="testimonial-author-name">{t.author}</h4>
                    <span className="testimonial-author-role">
                      {t.role} • <em>{t.location}</em>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          INTERACTIVE FAQ ACCORDION
          ========================================================================= */}
      <section id="faq" className="aesthetic-faq-section modern-faq">
        <div className="aesthetic-faq-container">
          <div className="aesthetic-section-header text-center reveal-on-scroll">
            <span className="aesthetic-pill-tag modern-section-tag">
              <FileText size={13} />
              <span>FREQUENTLY ASKED</span>
            </span>
            <h2 className="aesthetic-section-title">
              Everything you wanted to know
              <span className="aesthetic-serif-italic"> about Indica.</span>
            </h2>
          </div>

          <div className="aesthetic-faq-accordion modern-faq-accordion">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div key={idx} className={`aesthetic-faq-item modern-faq-item ${isOpen ? "is-open" : ""}`}>
                  <button
                    type="button"
                    className="faq-question-btn"
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    <ChevronDown size={18} className={`faq-icon ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="faq-answer-pane">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          HIGH-CONVERSION CALL TO ACTION BANNER
          ========================================================================= */}
      <section id="privacy" className="aesthetic-bottom-section modern-bottom-cta">
        <div className="aesthetic-bottom-container reveal-on-scroll">
          <span className="aesthetic-bottom-eyebrow">
            <ShieldCheck size={14} className="inline mr-1" />
            PRIVATE BY DESIGN
          </span>

          <h2 className="aesthetic-bottom-title modern-cta-title">
            Your voice belongs to you.
            <br />
            <span className="aesthetic-serif-italic hero-gradient-serif">Experience it today.</span>
          </h2>

          <p className="aesthetic-bottom-desc modern-cta-desc">
            Clear controls, transparent ephemeral memory, and zero tracking. Speak naturally with the assistant designed for Bharat.
          </p>

          <button
            type="button"
            className="aesthetic-bottom-cta-btn modern-launch-btn"
            onClick={() => {
              stopAudio();
              if (onLaunchLiveAssistant) {
                onLaunchLiveAssistant();
              } else {
                handleLaunchWithAuth();
              }
            }}
          >
            <Mic size={16} />
            <span>Launch Indica Voice Assistant</span>
            <ArrowRight size={15} />
          </button>

          <div className="modern-supported-chips">
            <span>हिन्दी</span>
            <span>বাংলা</span>
            <span>English</span>
            <span>தமிழ்</span>
            <span>తెలుగు</span>
            <span>मराठी</span>
            <span>ગુજરાતી</span>
            <span>ಕನ್ನಡ</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          RICH MODERN FOOTER
          ========================================================================= */}
      <footer id="about" className="aesthetic-footer modern-footer">
        <div className="aesthetic-footer-content">
          <div className="footer-top-grid">
            <div className="footer-col-brand">
              <div
                className="aesthetic-brand-corner footer-brand"
                onClick={handleScrollToTop}
                role="button"
                tabIndex={0}
                title="Scroll to top"
              >
                <div className="aesthetic-brand-emblem-wrap">
                  <Image
                    src="/indica-symbol.png"
                    alt="Indica Emblem"
                    width={38}
                    height={38}
                    className="aesthetic-brand-logo-img"
                  />
                  <span className="aesthetic-brand-glow-ring" />
                </div>
                <div className="aesthetic-brand-text-lockup">
                  <span className="aesthetic-brand-title light">
                    <span className="brand-navy-light">Indic</span>
                    <span className="brand-terracotta">a</span>
                  </span>
                  <span className="aesthetic-brand-badge light">AI VOICE ASSISTANT</span>
                </div>
              </div>
              <p className="footer-brand-bio">
                Thoughtful AI companion built for India’s rich linguistic heritage.
                Natural conversational intelligence across 13+ native languages.
              </p>
              <div className="footer-status-pill">
                <span className="status-dot-pulse" />
                <span>All 13 Indic Voice Nodes Operational (99.98% Uptime)</span>
              </div>
            </div>

            <div className="footer-col-links">
              <h4>Product</h4>
              <button type="button" onClick={() => handleLaunchWithAuth()}>
                Launch Voice Studio
              </button>
              <a href="#capabilities">Capabilities</a>
              <a href="#playground">Voice Studio</a>
              <a href="#routine">Daily Workflow</a>
              <a href="#developer">Developer API</a>
            </div>

            <div className="footer-col-links">
              <h4>Languages</h4>
              <span>Hindi (हिन्दी)</span>
              <span>Bengali (বাংলা)</span>
              <span>Tamil (தமிழ்)</span>
              <span>Telugu (తెలుగు)</span>
              <span>Marathi (मराठी)</span>
              <span>Gujarati (ગુજરાતી)</span>
            </div>

            <div className="footer-col-links">
              <h4>Account & Access</h4>
              <button type="button" onClick={openAuthModal}>
                Sign in with Google
              </button>
              <a href="#privacy">Enterprise Privacy</a>
              <a href="#privacy">Terms of Service</a>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <p className="aesthetic-footer-tagline">
              Thoughtful technology for everyday life. © {new Date().getFullYear()} Indica AI Inc.
            </p>
            <div className="aesthetic-footer-actions">
              <button type="button" onClick={openAuthModal}>
                Sign in with Google
              </button>
              <span>•</span>
              <a href="#privacy">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
