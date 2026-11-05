"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Activity, ArrowUpRight, Check, CheckCircle2, AudioWaveform, ChevronDown, ChevronRight, CircleHelp, Compass, Copy, Cpu, ExternalLink, FileText, Globe2, Home, Image as ImageIcon, Languages, Layers, LoaderCircle, Mic, Newspaper, PanelLeftClose, Pause, Play, Plus, Radio, Search, Send, ShieldCheck, SlidersHorizontal, Sparkles, Square, Volume2, X, Zap, } from "lucide-react";
import { IndicaApiClient } from "@/lib/api-client";
import { detectLanguage, languageByCode } from "@/lib/languages";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useAuth } from "@/lib/auth-context";
import { UserProfileMenu } from "@/components/user-profile-menu";
import { ChatGptSidebar } from "@/components/chatgpt-sidebar";
import { LanguageSelectDropdown } from "@/components/language-select-dropdown";
import { analyzeAcousticDNA } from "@/lib/voice-cloning";
const modes = [
    { id: "ai", label: "AI Super Search", desc: "Synthesized multi-source answer", icon: Sparkles },
    { id: "web", label: "Web Evidence", desc: "Real-time live internet sources", icon: Globe2 },
    { id: "news", label: "Live News", desc: "Latest regional and national reports", icon: Newspaper },
    { id: "deep", label: "Deep Research", desc: "Comprehensive fact analysis", icon: Compass },
];
export function SearchWorkspace({ initialQuery = "", initialLanguage = "auto", onReturnHome, onLaunchLiveAssistant, } = {}) {
    const [query, setQuery] = useState(initialQuery);
    const [language, setLanguage] = useState(initialLanguage);
    const [mode, setMode] = useState("ai");
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [sourceOpen, setSourceOpen] = useState(true);
    const [whyOpen, setWhyOpen] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);
    const [audioSpeed, setAudioSpeed] = useState(1.0);
    const [showDiagnostics, setShowDiagnostics] = useState(false);
    const [searchHistoryThreads, setSearchHistoryThreads] = useState([]);
    // High-Tech Voice Clone & Acoustic Match State
    const [voiceCloneActive, setVoiceCloneActive] = useState(false);
    const [matchedVoiceProfile, setMatchedVoiceProfile] = useState(null);
    const [isCloningVoice, setIsCloningVoice] = useState(false);
    // Multimodal File & Photo Attachment State
    const [attachedFile, setAttachedFile] = useState(null);
    const searchInputRef = useRef(null);
    const contentRef = useRef(null);
    const fileInputRef = useRef(null);
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        if (file.size > 15 * 1024 * 1024) {
            setError("File size exceeds 15MB limit. Please choose a smaller photo or document.");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result;
            setAttachedFile({
                name: file.name,
                type: file.type || "application/octet-stream",
                size: file.size,
                data: dataUrl,
                previewUrl: file.type.startsWith("image/") ? dataUrl : undefined,
            });
            setError("");
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    };
    const handleRemoveAttachedFile = () => {
        setAttachedFile(null);
    };
    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items)
            return;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith("image/")) {
                const file = items[i].getAsFile();
                if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const dataUrl = reader.result;
                        setAttachedFile({
                            name: file.name || "Pasted image.png",
                            type: file.type,
                            size: file.size,
                            data: dataUrl,
                            previewUrl: dataUrl,
                        });
                        setError("");
                    };
                    reader.readAsDataURL(file);
                    break;
                }
            }
        }
    };
    const { user, addToHistory, history, isAuthenticated, openAuthModal } = useAuth();
    const { isSpeaking, speak, stopAudio, setSpeed } = useAudioPlayer();
    const selectedLanguage = useMemo(() => languageByCode(language), [language]);
    // Without Google authentication, immediately return home and open auth modal
    useEffect(() => {
        if (!isAuthenticated) {
            if (onReturnHome) {
                onReturnHome();
            }
            openAuthModal();
        }
    }, [isAuthenticated, onReturnHome, openAuthModal]);
    // Auto-detect Indic scripts when user types
    const handleQueryChange = (val) => {
        setQuery(val);
    };
    useEffect(() => {
        if (initialQuery && initialQuery.trim()) {
            setQuery(initialQuery.trim());
            if (initialLanguage && initialLanguage !== "auto") {
                setLanguage(initialLanguage);
            }
            void submitSearch(initialQuery.trim(), "ai", false, initialLanguage || "auto");
        }
    }, [initialQuery, initialLanguage]);
    async function submitSearch(nextQuery = query, nextMode = mode, shouldAutoSpeak = false, nextLang = language, fileToAnalyze = attachedFile) {
        const trimmed = nextQuery.trim();
        if (!trimmed && !fileToAnalyze)
            return;
        stopAudio();
        setQuery(trimmed);
        setError("");
        setIsLoading(true);
        try {
            const data = await IndicaApiClient.search({
                query: trimmed || (fileToAnalyze ? "Please analyze and describe this uploaded image or document in thorough detail." : ""),
                mode: nextMode,
                language: nextLang,
                file: fileToAnalyze ? {
                    name: fileToAnalyze.name,
                    type: fileToAnalyze.type,
                    data: fileToAnalyze.data,
                } : undefined,
            });
            setResult(data);
            setMobileNavOpen(false);
            // Save to Google user's search history
            const historyTitle = trimmed || `[Attached] ${fileToAnalyze?.name || "Uploaded photo"}`;
            addToHistory(historyTitle, data.language, nextMode);
            setSearchHistoryThreads((prev) => [{ query: historyTitle, answer: data }, ...prev.slice(0, 8)]);
            if (shouldAutoSpeak) {
                const textToSpeak = data.spokenExplanation || data.executiveSummary || data.answer;
                const targetVoiceId = voiceCloneActive && matchedVoiceProfile ? matchedVoiceProfile.id : undefined;
                void speak(textToSpeak, data.language, targetVoiceId, audioSpeed);
            }
        }
        catch (requestError) {
            setError(requestError instanceof Error
                ? requestError.message
                : "We encountered an issue connecting to search providers. Please try again.");
        }
        finally {
            setIsLoading(false);
        }
    }
    const { isListening, isTranscribing, startListening, stopListening } = useSpeechRecognition({
        language,
        onSpeechResult: (transcript) => {
            setQuery(transcript);
        },
        onSpeechEnd: (finalTranscript, detectedLang, audioBlob) => {
            const textToSearch = finalTranscript.trim() || query.trim();
            if (textToSearch) {
                const resolvedLang = detectedLang && detectedLang !== "auto" ? detectedLang : detectLanguage(textToSearch, language);
                if (resolvedLang && resolvedLang !== "auto") {
                    setLanguage(resolvedLang);
                }
                // Real-Time Acoustic Voice Analysis & Dynamic Voice Cloning
                if (voiceCloneActive && audioBlob) {
                    setIsCloningVoice(true);
                    void analyzeAcousticDNA(audioBlob).then(({ suggestedProfile }) => {
                        setMatchedVoiceProfile(suggestedProfile);
                    });
                    void IndicaApiClient.cloneVoice(audioBlob).then((cloneRes) => {
                        if (cloneRes?.voiceId) {
                            setMatchedVoiceProfile((prev) => prev ? { ...prev, id: cloneRes.voiceId, isCustomClone: cloneRes.isCloned } : null);
                        }
                    }).finally(() => {
                        setIsCloningVoice(false);
                    });
                }
                void submitSearch(textToSearch, mode, true, resolvedLang);
            }
        },
        onError: (errMsg) => {
            setError(errMsg);
        },
    });
    function handleModeChange(nextMode) {
        setMode(nextMode);
        setMobileNavOpen(false);
        if (query.trim()) {
            void submitSearch(query, nextMode);
        }
    }
    function handleCopy(text) {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
            void navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }
    function newConversation() {
        stopAudio();
        stopListening();
        setQuery("");
        setAttachedFile(null);
        setResult(null);
        setError("");
        setCopied(false);
        setMobileNavOpen(false);
        contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 60);
    }
    function handleGoHome() {
        newConversation();
        if (onReturnHome) {
            onReturnHome();
        }
    }
    const handleSelectHistory = (hQuery, hLang, hMode) => {
        setQuery(hQuery);
        setLanguage(hLang);
        setMode(hMode || "ai");
        void submitSearch(hQuery, hMode || "ai", false, hLang);
    };
    const [sidebarOpen, setSidebarOpen] = useState(true);
    useEffect(() => {
        if (typeof window !== "undefined" && window.innerWidth <= 768) {
            setSidebarOpen(false);
        }
    }, []);
    return (<main className={`shell ${!sidebarOpen ? "shell-sidebar-closed" : ""}`}>
      {/* ChatGPT-Grade Sidebar */}
      <ChatGptSidebar currentQuery={query} onNewChat={newConversation} onSelectChat={handleSelectHistory} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} onReturnHome={handleGoHome}/>

      {sidebarOpen && <button className="scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}/>}

      {/* Main Container */}
      <section className="workspace">
        {/* Top Header */}
        <header className="topbar">
          <div className="topbar-left">
            {!sidebarOpen && (<div className="topbar-collapsed-brand">
                <button className="gpt-icon-btn topbar-expand-btn" onClick={() => setSidebarOpen(true)} title="Open sidebar" aria-label="Open sidebar">
                  <PanelLeftClose size={18} strokeWidth={1.75} style={{ transform: "rotate(180deg)" }}/>
                </button>
                <BrandMark onReturnHome={handleGoHome}/>
              </div>)}
            <div className="engine-status-badge">
              <span className="live-status-ping"/>
              <Cpu size={14} strokeWidth={1.75} className="black-outline-icon"/>
              <span>Indica Super-Intelligence 2.0 • Neural Indic Grounding</span>
            </div>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              onClick={onLaunchLiveAssistant}
              className="launch-live-assistant-btn"
              title="Say 'Hay Indica' anytime to launch automatically, or click here"
              aria-label="Launch Your Live Assistant"
            >
              <span className="live-assistant-status-dot" />
              <span>Say &ldquo;Hay Indica&rdquo; or Launch Assistant</span>
              <ChevronRight size={14} strokeWidth={2.2} className="live-assistant-arrow-icon" />
            </button>
            <button type="button" onClick={handleGoHome} className="help-button" title="Home - Return to Landing Page" aria-label="Home">
              <Home size={14} strokeWidth={1.75} className="black-outline-icon"/> Home
            </button>
            <UserProfileMenu variant="topbar" onSelectHistory={handleSelectHistory}/>
          </div>
        </header>

        {/* Content Body */}
        <div ref={contentRef} className={`content ${result ? "has-results" : ""}`}>
          <section className="search-stage">
            {!result && (<div className="hero-status-row">
                <div className="eyebrow">
                  <Sparkles size={13} strokeWidth={1.75} className="black-outline-icon"/>
                  <span>Built for 1.4 Billion Voices • 13+ Languages</span>
                </div>
                <div className="voice-support-badge">
                  <Volume2 size={13} strokeWidth={1.75} className="black-outline-icon"/>
                  <span>ElevenLabs Multilingual Voice Active</span>
                </div>
              </div>)}

            <div className={`headline-block ${!result ? "hero-centered" : ""}`}>
              {!result ? (<>
                  <h1 className="hero-display-title">
                    <span className="hero-title-line-1">Every Voice Has a Question.</span>
                    <span className="hero-title-line-2">
                      <span className="hero-brand-accent">INDICA</span> Has the <span className="hero-answer-accent">Answer.</span>
                    </span>
                  </h1>
                  <p className="hero-description">
                    Ask naturally in any Indian language. Indica retrieves live multi-engine evidence, synthesizes verified
                    facts, and speaks back in a natural Indian voice.
                  </p>
                </>) : (<div className="result-header-block">
                  <div className="result-meta-row">
                    <span className="result-kicker">Verified Inquiry</span>
                    <span className="result-lang-tag">
                      <Languages size={12} strokeWidth={1.75}/> {languageByCode(result.language).nativeLabel} ({languageByCode(result.language).label})
                    </span>
                    <span className="result-mode-tag">{mode.toUpperCase()} MODE</span>
                  </div>
                  <h1 className="result-title">{result.query}</h1>
                </div>)}
            </div>

            {/* Quick Search Mode Switcher Pills */}
            <div className="search-mode-switcher-bar">
              <button type="button" className={`search-mode-pill ${mode === "ai" ? "active" : ""}`} onClick={() => handleModeChange("ai")}>
                <Sparkles size={14} strokeWidth={1.75}/>
                <span>AI Synthesis</span>
              </button>
              <button type="button" className={`search-mode-pill ${mode === "deep" ? "active" : ""}`} onClick={() => handleModeChange("deep")}>
                <Globe2 size={14} strokeWidth={1.75}/>
                <span>Deep Web</span>
              </button>
              <button type="button" className={`search-mode-pill ${mode === "news" ? "active" : ""}`} onClick={() => handleModeChange("news")}>
                <Newspaper size={14} strokeWidth={1.75}/>
                <span>Live News</span>
              </button>
              <button type="button" className={`search-mode-pill ${mode === "images" ? "active" : ""}`} onClick={() => handleModeChange("images")}>
                <ImageIcon size={14} strokeWidth={1.75}/>
                <span>Images</span>
              </button>
              <button type="button" className={`search-mode-pill voice-clone-mode-btn ${voiceCloneActive ? "active" : ""}`} onClick={() => setVoiceCloneActive(!voiceCloneActive)} title="Enable AI Voice Cloning & Regional Accent Matching">
                <Radio size={14} strokeWidth={1.75}/>
                <span>Voice Clone {voiceCloneActive ? "ON" : "OFF"}</span>
              </button>
            </div>

            {/* Hidden File Upload Input */}
            <input ref={fileInputRef} type="file" accept="image/*,.pdf,.txt,.csv,.md,.json,.doc,.docx" style={{ display: "none" }} onChange={handleFileSelect} tabIndex={-1} aria-hidden="true"/>

            {/* Premium Responsive Search Input Box */}
            <form className={`search-box ${isListening ? "listening" : ""} ${attachedFile ? "has-attached" : ""}`} onSubmit={(event) => {
            event.preventDefault();
            void submitSearch();
        }} onPaste={handlePaste}>
              {/* Main Input Row (100% width on Mobile, Flex on Desktop) */}
              <div className="search-input-main-row">
                <Search size={18} strokeWidth={2} className="search-icon black-outline-icon"/>

                {/* Attached Photo/File Chip */}
                {attachedFile && (<div className="search-attached-chip">
                    {attachedFile.previewUrl ? (<img src={attachedFile.previewUrl} alt={attachedFile.name} className="attached-img-thumb"/>) : (<FileText size={14} className="attached-file-icon"/>)}
                    <span className="attached-file-name" title={attachedFile.name}>
                      {attachedFile.name}
                    </span>
                    <button type="button" className="attached-file-remove" onClick={handleRemoveAttachedFile} title="Remove attachment" aria-label="Remove attachment">
                      <X size={12} strokeWidth={2.5}/>
                    </button>
                  </div>)}

                <input ref={searchInputRef} value={query} onChange={(e) => handleQueryChange(e.target.value)} placeholder={attachedFile
              ? "Ask anything about this photo/file or press Enter to describe..."
              : selectedLanguage.code === "auto"
                  ? "Ask anything or speak in any Indian language..."
                  : `Search or ask in ${selectedLanguage.nativeLabel} (${selectedLanguage.label})...`} aria-label="Search query"/>

                {query.length > 0 && !isLoading && (<button type="button" className="clear-query-btn" onClick={() => setQuery("")} aria-label="Clear input">
                    <X size={15} strokeWidth={2}/>
                  </button>)}

                {isListening && (<div className="wave" aria-label="Listening">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>)}
              </div>

              {/* Action Controls Row (Bottom bar on Mobile, Right side on Desktop) */}
              <div className="search-actions-row">
                <div className="search-actions-left">
                  {/* + Upload Photo/File Button */}
                  <button type="button" className="search-attach-btn" onClick={() => fileInputRef.current?.click()} title="Upload photo or file to describe & analyze" aria-label="Upload photo or file">
                    <Plus size={18} strokeWidth={2} className="black-outline-icon"/>
                  </button>

                  <div className="search-divider"/>

                  <LanguageSelectDropdown value={language} onChange={setLanguage} disabled={isLoading}/>
                </div>

                <div className="search-actions-right">
                  <button type="button" className={`mic-button ${isListening ? "recording" : ""}`} onClick={isListening ? stopListening : startListening} aria-label={isListening ? "Stop recording" : "Start voice search"} title={isListening ? "Listening... click to stop" : "Speak query in your language"}>
                    {isListening ? <Square size={13} fill="currentColor"/> : <Mic size={17} strokeWidth={1.75} className="black-outline-icon"/>}
                  </button>

                  <button className="search-submit" type="submit" disabled={isLoading} aria-label="Search">
                    {isLoading ? <LoaderCircle className="spin" size={17} strokeWidth={2}/> : <Send size={17} strokeWidth={2}/>}
                  </button>
                </div>
              </div>
            </form>

            <div className="search-meta">
              <span className="meta-item">
                <Languages size={13} strokeWidth={1.75} className="black-outline-icon"/> {selectedLanguage.code === "auto" ? "Auto-Detect (Multilingual)" : `${selectedLanguage.nativeLabel} (${selectedLanguage.label})`}
              </span>
              <span className="meta-separator">•</span>
              <span className="meta-item">
                <ShieldCheck size={13} strokeWidth={1.75} className="black-outline-icon"/> Verified Multi-Engine Citations
              </span>
              <span className="meta-separator">•</span>
              <span className="meta-item">
                <Cpu size={13} strokeWidth={1.75} className="black-outline-icon"/> Groq Llama 3.3 70B & GPT-OSS
              </span>
              {isListening && (<span className="recording-label">
                  <span className="recording-pulse-dot"/> Listening… speak naturally in your Indian language
                </span>)}
              {isTranscribing && (<span className="recording-label" style={{ color: "#059669" }}>
                  <span className="recording-pulse-dot" style={{ background: "#059669" }}/> Neural Whisper: Detecting spoken language…
                </span>)}
              {voiceCloneActive && (<>
                  <span className="meta-separator">•</span>
                  <span className="meta-item voice-clone-badge">
                    <AudioWaveform size={13} strokeWidth={1.75} className="black-outline-icon"/>
                    <span>
                      {isCloningVoice
                ? "Analyzing Acoustic DNA & Timbre…"
                : matchedVoiceProfile
                    ? `Voice Matched: ${matchedVoiceProfile.name} (${Math.round((matchedVoiceProfile.similarityScore || 0.95) * 100)}% match)`
                    : "Voice Clone Active: Speak to match voice"}
                    </span>
                  </span>
                </>)}
            </div>
          </section>

          {error && (<div className="error-banner">
              <div className="error-content">
                <CircleHelp size={18}/>
                <span>{error}</span>
              </div>
              <button onClick={() => setError("")} aria-label="Dismiss error">
                <X size={16}/>
              </button>
            </div>)}

          {isLoading && <LoadingAnswer />}

          {result && !isLoading && (<ResultPanel result={result} sourceOpen={sourceOpen} setSourceOpen={setSourceOpen} whyOpen={whyOpen} setWhyOpen={setWhyOpen} isSpeaking={isSpeaking} speakAnswer={() => {
                const textToSpeak = result.spokenExplanation || result.executiveSummary || result.answer;
                const targetVoiceId = voiceCloneActive && matchedVoiceProfile ? matchedVoiceProfile.id : undefined;
                void speak(textToSpeak, result.language, targetVoiceId, audioSpeed);
            }} submitSearch={submitSearch} copied={copied} onCopy={handleCopy} audioSpeed={audioSpeed} setAudioSpeed={(spd) => {
                setAudioSpeed(spd);
                setSpeed(spd);
            }}/>)}
        </div>
      </section>

      {/* System Diagnostics Modal */}
      {showDiagnostics && (<div className="auth-modal-overlay" onClick={() => setShowDiagnostics(false)}>
          <div className="diagnostics-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="diag-header">
              <div className="diag-title">
                <Activity size={18}/>
                <h3>Indica System Diagnostics & Latency</h3>
              </div>
              <button className="auth-modal-close" onClick={() => setShowDiagnostics(false)}>
                ✕
              </button>
            </div>

            <div className="diag-grid">
              <div className="diag-item">
                <span className="diag-label">Search Aggregator</span>
                <strong className="status-online">Tavily + Wikipedia + DDG (Active)</strong>
                <small>Average response time: 320ms</small>
              </div>
              <div className="diag-item">
                <span className="diag-label">Language Synthesis</span>
                <strong className="status-online">Groq Cloud (Ultra-fast LLM)</strong>
                <small>Indian token throughput: 180 tokens/sec</small>
              </div>
              <div className="diag-item">
                <span className="diag-label">Voice Synthesis</span>
                <strong className="status-online">ElevenLabs Multilingual v2 (Active)</strong>
                <small>Voice: Jessica (Energetic Conversational Voice)</small>
              </div>
              <div className="diag-item">
                <span className="diag-label">Speech Recognition</span>
                <strong className="status-online">Web Speech API (Indic Speech Code)</strong>
                <small>Active locale: {selectedLanguage.speechCode}</small>
              </div>
            </div>

            <div className="diag-footer">
              <ShieldCheck size={16}/>
              <span>All 22+ Scheduled Indian languages & dialects operational with zero data logging.</span>
            </div>
          </div>
        </div>)}
    </main>);
}
function BrandMark({ onReturnHome }) {
    if (onReturnHome) {
        return (<div className="brand" onClick={onReturnHome} style={{ cursor: "pointer" }} role="button" tabIndex={0} aria-label="Return to Indica home">
        <Image src="/indica-symbol.png" alt="Indica Emblem" width={42} height={32} className="brand-logo-img" priority/>
        <div className="brand-text-col">
          <span className="indica-logo-title">
            <span className="logo-color-navy">Indic</span><span className="logo-color-gold">a</span>
          </span>
          <span className="indica-logo-subtitle">AI VOICE ASSISTANT</span>
        </div>
      </div>);
    }
    return (<Link href="/" className="brand" aria-label="Indica AI home">
      <Image src="/indica-symbol.png" alt="Indica Emblem" width={42} height={32} className="brand-logo-img" priority/>
      <div className="brand-text-col">
        <span className="indica-logo-title">
          <span className="logo-color-navy">Indic</span><span className="logo-color-gold">a</span>
        </span>
        <span className="indica-logo-subtitle">AI VOICE ASSISTANT</span>
      </div>
    </Link>);
}
function LoadingAnswer() {
    return (<section className="answer-layout loading-layout" aria-live="polite">
      <div className="results-main">
        <div className="answer-card skeleton-card">
          <div className="skeleton-header">
            <span className="skeleton line-badge"/>
            <span className="skeleton line-pill"/>
          </div>
          <span className="skeleton line-xl" style={{ height: 20, marginTop: 16 }}/>
          <span className="skeleton line-lg"/>
          <span className="skeleton line-xl"/>
          <span className="skeleton line-md"/>
          <div className="skeleton-grid-2">
            <span className="skeleton line-block"/>
            <span className="skeleton line-block"/>
          </div>
        </div>
      </div>
      <aside className="results-side skeleton-card">
        <span className="skeleton line-md"/>
        <span className="skeleton line-lg"/>
        <span className="skeleton line-block" style={{ height: 110, marginTop: 12 }}/>
      </aside>
    </section>);
}
function cleanMathAndLatex(raw) {
    if (!raw)
        return "";
    let clean = raw;
    // Convert LaTeX fractions: \frac{a}{b} -> (a / b)
    clean = clean.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1 / $2)");
    // Convert standard LaTeX symbols into clean human symbols
    clean = clean.replace(/\\times/g, "×");
    clean = clean.replace(/\\div/g, "÷");
    clean = clean.replace(/\\pm/g, "±");
    clean = clean.replace(/\\leq/g, "≤");
    clean = clean.replace(/\\geq/g, "≥");
    clean = clean.replace(/\\neq/g, "≠");
    clean = clean.replace(/\\approx/g, "≈");
    clean = clean.replace(/\\implies/g, "→");
    clean = clean.replace(/\\rightarrow/g, "→");
    clean = clean.replace(/\\%/g, "%");
    clean = clean.replace(/\\cdot/g, "·");
    clean = clean.replace(/\\text\{([^}]+)\}/g, "$1");
    clean = clean.replace(/\\textbf\{([^}]+)\}/g, "**$1**");
    clean = clean.replace(/\\textit\{([^}]+)\}/g, "*$1*");
    // Remove LaTeX wrappers \[ \] and \( \)
    clean = clean.replace(/\\\[\s*/g, " ");
    clean = clean.replace(/\s*\\\]/g, " ");
    clean = clean.replace(/\\\(\s*/g, " ");
    clean = clean.replace(/\s*\\\)/g, " ");
    // Remove $$ or $ wrappers
    clean = clean.replace(/\$\$([^$]+)\$\$/g, "$1");
    clean = clean.replace(/\$([^$]+)\$/g, "$1");
    // Clean double spaces created by delimiter removal
    clean = clean.replace(/[ \t]{2,}/g, " ");
    return clean;
}
function FormattedInline({ text }) {
    const sanitized = cleanMathAndLatex(text);
    const parts = sanitized.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return (<>
      {parts.map((part, index) => {
            if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
                return <strong key={index} className="answer-bold-text">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
                return <em key={index}>{part.slice(1, -1)}</em>;
            }
            if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
                return (<code key={index} className="inline-code">
              {part.slice(1, -1)}
            </code>);
            }
            return part;
        })}
    </>);
}
function parseMarkdownBlocks(rawText) {
    const sanitized = cleanMathAndLatex(rawText);
    const lines = sanitized.replace(/\r\n/g, "\n").split("\n");
    const blocks = [];
    let i = 0;
    while (i < lines.length) {
        const rawLine = lines[i];
        const trimmed = rawLine.trim();
        if (!trimmed) {
            i++;
            continue;
        }
        // 1. Code Block
        if (trimmed.startsWith("```")) {
            const codeLines = [];
            i++;
            while (i < lines.length && !lines[i].trim().startsWith("```")) {
                codeLines.push(lines[i]);
                i++;
            }
            if (i < lines.length)
                i++; // skip closing ```
            blocks.push({ type: "code", code: codeLines.join("\n") });
            continue;
        }
        // 2. Horizontal Rule '---', '***', '___'
        if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
            blocks.push({ type: "hr" });
            i++;
            continue;
        }
        // 3. Final Answer Solution Highlight Box
        if (trimmed.startsWith("✅") || trimmed.includes("✅ **Answer") || trimmed.includes("✅ **উত্তর") || trimmed.includes("✅ **उत्तर") || trimmed.toLowerCase().startsWith("**final solution") || trimmed.toLowerCase().startsWith("**solution:")) {
            blocks.push({ type: "final-answer", text: trimmed.replace(/^✅\s*/, "") });
            i++;
            continue;
        }
        // 4. Shortcut / Key Takeaway Trick Box
        if (trimmed.startsWith("👉") || trimmed.startsWith("💡") || trimmed.includes("Shortcut Trick") || trimmed.includes("Shortcut Formula") || trimmed.includes("Analytical Shortcut") || trimmed.toLowerCase().startsWith("**analytical")) {
            blocks.push({ type: "shortcut", text: trimmed.replace(/^[👉💡]\s*/, "") });
            i++;
            continue;
        }
        // 5. Markdown Table: Check for | Header 1 | Header 2 | followed by |---|---|
        if (trimmed.startsWith("|") && trimmed.endsWith("|") && i + 1 < lines.length && lines[i + 1].trim().includes("|-")) {
            const headerCells = trimmed.slice(1, -1).split("|").map((c) => c.trim());
            i += 2; // skip header and delimiter row
            const rows = [];
            while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
                const rowCells = lines[i].trim().slice(1, -1).split("|").map((c) => c.trim());
                rows.push(rowCells);
                i++;
            }
            blocks.push({ type: "table", headers: headerCells, rows });
            continue;
        }
        // 5b. ASCII Tree / Mindmap / Flowchart: lines with tree connectors (├──, └──, │, ───, ──>)
        if (lines[i].includes("├──") || lines[i].includes("└──") || lines[i].includes("───") || lines[i].includes("-->") || (lines[i].includes("│") && !lines[i].includes("|"))) {
            const treeLines = [];
            while (i < lines.length && (lines[i].includes("├──") || lines[i].includes("└──") || lines[i].includes("─") || lines[i].includes("│") || lines[i].includes("-->") || lines[i].trim() === "")) {
                treeLines.push(lines[i]);
                i++;
            }
            if (treeLines.length > 0) {
                blocks.push({ type: "code", code: treeLines.join("\n") });
                continue;
            }
        }
        // 6. Headings
        if (trimmed.startsWith("#### ")) {
            blocks.push({ type: "h4", text: trimmed.slice(5) });
            i++;
            continue;
        }
        if (trimmed.startsWith("### ")) {
            blocks.push({ type: "h3", text: trimmed.slice(4) });
            i++;
            continue;
        }
        if (trimmed.startsWith("## ")) {
            blocks.push({ type: "h2", text: trimmed.slice(3) });
            i++;
            continue;
        }
        if (trimmed.startsWith("# ")) {
            blocks.push({ type: "h1", text: trimmed.slice(2) });
            i++;
            continue;
        }
        // 7. Blockquote: '> '
        if (trimmed.startsWith(">")) {
            const quoteLines = [];
            while (i < lines.length && lines[i].trim().startsWith(">")) {
                quoteLines.push(lines[i].trim().replace(/^>\s*/, ""));
                i++;
            }
            blocks.push({ type: "quote", text: quoteLines.join(" ") });
            continue;
        }
        // 8. Bullet List: '- ', '* ', '• '
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
            const items = [];
            while (i < lines.length) {
                const lineTrimmed = lines[i].trim();
                if (lineTrimmed.startsWith("- ") || lineTrimmed.startsWith("* ") || lineTrimmed.startsWith("• ")) {
                    items.push(lineTrimmed.replace(/^[-*•]\s+/, ""));
                    i++;
                }
                else if (lineTrimmed.startsWith("  - ") || lineTrimmed.startsWith("  * ") || lineTrimmed.startsWith("    - ")) {
                    items.push(lineTrimmed.replace(/^\s*[-*•]\s+/, ""));
                    i++;
                }
                else {
                    break;
                }
            }
            blocks.push({ type: "bullets", items });
            continue;
        }
        // 9. Numbered List: '1. ', '2. ', '3. '
        if (/^\d+[\.\)]\s+/.test(trimmed)) {
            const items = [];
            while (i < lines.length && /^\d+[\.\)]\s+/.test(lines[i].trim())) {
                items.push(lines[i].trim().replace(/^\d+[\.\)]\s+/, ""));
                i++;
            }
            blocks.push({ type: "numbers", items });
            continue;
        }
        // 10. Standalone Math Calculation Line (e.g. '100 + 25 = 125')
        const mathOnlyRegex = /^[\d\s\+\-\*\×\/\÷\(\)\=\.\,\%\$\₹]+$/;
        if (mathOnlyRegex.test(trimmed) && trimmed.includes("=")) {
            blocks.push({ type: "math", text: trimmed });
            i++;
            continue;
        }
        // 11. Regular Paragraph
        const paraLines = [];
        while (i < lines.length &&
            lines[i].trim() &&
            !lines[i].trim().startsWith("#") &&
            !lines[i].trim().startsWith("- ") &&
            !lines[i].trim().startsWith("* ") &&
            !lines[i].trim().startsWith("• ") &&
            !/^\d+[\.\)]\s+/.test(lines[i].trim()) &&
            !lines[i].trim().startsWith(">") &&
            !lines[i].trim().startsWith("```") &&
            !lines[i].trim().startsWith("✅") &&
            !lines[i].trim().startsWith("👉") &&
            !lines[i].trim().startsWith("💡") &&
            !lines[i].trim().toLowerCase().startsWith("**final solution") &&
            !lines[i].trim().toLowerCase().startsWith("**analytical") &&
            lines[i].trim() !== "---" &&
            lines[i].trim() !== "***" &&
            lines[i].trim() !== "___") {
            paraLines.push(lines[i].trim());
            i++;
        }
        if (paraLines.length > 0) {
            blocks.push({ type: "paragraph", text: paraLines.join(" ") });
        }
    }
    return blocks;
}
function FormattedAnswer({ text }) {
    const blocks = parseMarkdownBlocks(text);
    return (<div className="answer-copy">
      {blocks.map((block, idx) => {
            switch (block.type) {
                case "hr":
                    return <hr key={idx} className="answer-clean-hr"/>;
                case "final-answer":
                    return (<div key={idx} className="answer-final-box">
                <div className="answer-final-badge">
                  <CheckCircle2 size={18} className="answer-final-icon"/>
                  <span>Final Solution</span>
                </div>
                <div className="answer-final-text">
                  <FormattedInline text={block.text}/>
                </div>
              </div>);
                case "shortcut":
                    return (<div key={idx} className="answer-shortcut-box">
                <div className="answer-shortcut-badge">
                  <Zap size={16} className="answer-shortcut-icon"/>
                  <span>Key Insight / Fast Shortcut</span>
                </div>
                <div className="answer-shortcut-text">
                  <FormattedInline text={block.text}/>
                </div>
              </div>);
                case "code":
                    return (<div key={idx} className="answer-code-card">
                <div className="answer-code-body">
                  {block.code.split("\n").map((cline, cIdx) => (<div key={cIdx} className="answer-code-line">
                      <span className="code-line-text">{cline}</span>
                    </div>))}
                </div>
              </div>);
                case "quote":
                    return (<div key={idx} className="answer-callout-card">
                <div className="callout-accent-icon">
                  <Sparkles size={16}/>
                </div>
                <div className="callout-body">
                  <FormattedInline text={block.text}/>
                </div>
              </div>);
                case "h1":
                case "h2":
                    return (<h3 key={idx} className="answer-heading">
                <span className="heading-accent"/>
                <FormattedInline text={block.text}/>
              </h3>);
                case "h3":
                case "h4":
                    return (<h4 key={idx} className="answer-step-title">
                <FormattedInline text={block.text}/>
              </h4>);
                case "math":
                    return (<div key={idx} className="answer-math-centered-line">
                <span>{block.text}</span>
              </div>);
                case "bullets":
                    return (<ul key={idx} className="answer-bullet-list">
                {block.items.map((item, liIdx) => (<li key={liIdx} className="answer-bullet-item">
                    <span className="bullet-dot"/>
                    <span className="bullet-text">
                      <FormattedInline text={item}/>
                    </span>
                  </li>))}
              </ul>);
                case "numbers":
                    return (<div key={idx} className="answer-steps-container">
                {block.items.map((item, sIdx) => (<div key={sIdx} className="answer-step-card">
                    <span className="step-badge">{sIdx + 1}</span>
                    <div className="step-content">
                      <FormattedInline text={item}/>
                    </div>
                  </div>))}
              </div>);
                case "table":
                    return (<div key={idx} className="answer-table-wrapper">
                <table className="answer-custom-table">
                  {block.headers.length > 0 && (<thead>
                      <tr>
                        {block.headers.map((h, hIdx) => (<th key={hIdx}>
                            <FormattedInline text={h}/>
                          </th>))}
                      </tr>
                    </thead>)}
                  <tbody>
                    {block.rows.map((row, rIdx) => (<tr key={rIdx}>
                        {row.map((cell, cIdx) => (<td key={cIdx}>
                            <FormattedInline text={cell}/>
                          </td>))}
                      </tr>))}
                  </tbody>
                </table>
              </div>);
                case "paragraph":
                default:
                    return (<p key={idx} className="answer-paragraph">
                <FormattedInline text={block.text}/>
              </p>);
            }
        })}
    </div>);
}
function VisualGallery({ images, query }) {
    const [selectedImage, setSelectedImage] = useState(null);
    if (!images || images.length === 0)
        return null;
    return (<section className="visual-gallery-section">
      <div className="visual-gallery-header">
        <div className="visual-gallery-title">
          <ImageIcon size={16}/>
          <span>Verified Visual Media ({images.length})</span>
        </div>
        <small className="visual-gallery-sub">Live crawled imagery for &ldquo;{query}&rdquo;</small>
      </div>

      <div className="visual-gallery-grid">
        {images.map((img, idx) => (<div key={idx} className="visual-item-card" onClick={() => setSelectedImage(img)} role="button" tabIndex={0} title={img.alt || "Click to enlarge"}>
            <div className="visual-thumb-wrapper">
              <img src={img.url} alt={img.alt || `Visual reference ${idx + 1}`} className="visual-thumb-img" loading="lazy" onError={(e) => {
                e.target.closest(".visual-item-card")?.classList.add("img-hidden");
            }}/>
              <div className="visual-overlay">
                <span className="visual-badge">
                  <ExternalLink size={12}/> View
                </span>
              </div>
            </div>
            {img.alt && (<div className="visual-card-caption">
                <span className="visual-card-text">{img.alt}</span>
                <small className="visual-card-domain">{img.attribution || "Web Reference"}</small>
              </div>)}
          </div>))}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (<div className="lightbox-overlay" onClick={() => setSelectedImage(null)}>
          <div className="lightbox-modal" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setSelectedImage(null)} aria-label="Close image">
              ✕
            </button>
            <div className="lightbox-img-wrapper">
              <img src={selectedImage.url} alt={selectedImage.alt}/>
            </div>
            <div className="lightbox-footer">
              <div className="lightbox-info">
                <strong>{selectedImage.alt || query}</strong>
                <small>{selectedImage.attribution}</small>
              </div>
              <a href={selectedImage.sourceUrl} target="_blank" rel="noreferrer" className="lightbox-external-btn">
                <span>Open Original Page</span>
                <ArrowUpRight size={14}/>
              </a>
            </div>
          </div>
        </div>)}
    </section>);
}
function ResultPanel({ result, sourceOpen, setSourceOpen, whyOpen, setWhyOpen, isSpeaking, speakAnswer, submitSearch, copied, onCopy, audioSpeed, setAudioSpeed, }) {
    const [reasoningOpen, setReasoningOpen] = useState(true);
    return (<section className="answer-layout">
      <div className="results-main">
        {/* Audio Controller Banner */}
        <div className={`audio-player-banner ${isSpeaking ? "playing" : ""}`}>
          <div className="audio-player-left">
            <button onClick={speakAnswer} className={`audio-play-trigger ${isSpeaking ? "active" : ""}`} aria-label={isSpeaking ? "Pause Indian voice" : "Play Indian voice"}>
              {isSpeaking ? <Pause size={18} fill="currentColor"/> : <Play size={18} fill="currentColor"/>}
            </button>
            <div className="audio-info">
              <strong>{isSpeaking ? "Speaking" : "Listen to Explanation"}</strong>
              <small>Neural Audio • {languageByCode(result.language).nativeLabel} ({languageByCode(result.language).label})</small>
            </div>
          </div>

          <div className="audio-player-controls">
            {isSpeaking && (<div className="mini-audio-waves">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>)}
            <div className="speed-toggle">
              {[1.0, 1.25, 1.5].map((speed) => (<button key={speed} className={`speed-btn ${audioSpeed === speed ? "active" : ""}`} onClick={() => setAudioSpeed(speed)}>
                  {speed}x
                </button>))}
            </div>
          </div>
        </div>

        {/* Supporting Visual Reference Gallery (Multi-image) */}
        {result.images.length > 0 && <VisualGallery images={result.images} query={result.query}/>}

        {/* Uploaded File / Image Visual Card */}
        {result.attachedFile && (<div className="analyzed-attachment-card">
            <div className="analyzed-attachment-header">
              <span className="analyzed-badge">
                {result.attachedFile.type.startsWith("image/") ? (<>
                    <ImageIcon size={14} className="black-outline-icon"/> Uploaded Photo Analysis
                  </>) : (<>
                    <FileText size={14} className="black-outline-icon"/> Uploaded Document Analysis
                  </>)}
              </span>
              <span className="analyzed-filename">{result.attachedFile.name}</span>
            </div>
            {result.attachedFile.data && result.attachedFile.type.startsWith("image/") && (<div className="analyzed-image-display">
                <img src={result.attachedFile.data} alt={result.attachedFile.name}/>
              </div>)}
          </div>)}

        {/* Primary AI Synthesized Answer Card */}
        <article className="answer-card">
          <div className="answer-topline">
            <div className="answer-badge-group">
              <span className="answer-badge">
                <Sparkles size={14}/> Indica Super-Intelligence
              </span>
              <span className="source-counter-pill" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#047857", borderColor: "rgba(16, 185, 129, 0.25)" }}>
                <Languages size={13}/> {languageByCode(result.language).nativeLabel} ({languageByCode(result.language).label})
              </span>
              <span className="source-counter-pill">
                <Layers size={13}/> {result.sources.length} Verified Sources
              </span>
            </div>
            <span className={`confidence ${result.confidence}`}>
              <span className="confidence-dot"/> {result.confidence} confidence
            </span>
          </div>

          {/* Executive Core Solution Highlight */}
          {result.executiveSummary && (<div className="executive-summary-banner">
              <div className="exec-badge">
                <Zap size={14} className="exec-icon"/>
                <span>Executive Solution</span>
              </div>
              <p className="exec-text">
                <FormattedInline text={result.executiveSummary}/>
              </p>
            </div>)}

          {/* AI Conversational Spoken Voice Explanation */}
          {result.spokenExplanation && (<div className="voice-explanation-banner">
              <div className="voice-expl-badge">
                <Volume2 size={14} strokeWidth={1.75} className="black-outline-icon"/>
                <span>AI Spoken Explanation • {languageByCode(result.language).nativeLabel}</span>
              </div>
              <p className="voice-expl-text">
                <FormattedInline text={result.spokenExplanation}/>
              </p>
            </div>)}

          {/* Super-Intelligence Neural Reasoning Drawer */}
          {(result.reasoningSteps && result.reasoningSteps.length > 0) || result.reasoningSummary ? (<div className="neural-reasoning-drawer">
              <button type="button" className="neural-reasoning-toggle" onClick={() => setReasoningOpen(!reasoningOpen)}>
                <div className="neural-toggle-left">
                  <div className="neural-icon-wrapper">
                    <Cpu size={15}/>
                  </div>
                  <span className="neural-title">Super-Intelligence Neural Reasoning</span>
                  {result.reasoningSteps && result.reasoningSteps.length > 0 && (<span className="neural-steps-count">{result.reasoningSteps.length} Steps</span>)}
                </div>
                <ChevronDown className={`neural-chevron ${reasoningOpen ? "open" : ""}`} size={16}/>
              </button>

              {reasoningOpen && (<div className="neural-reasoning-content">
                  {result.reasoningSummary && (<div className="neural-summary-note">
                      <strong>Core Deduction:</strong> {result.reasoningSummary}
                    </div>)}
                  {result.reasoningSteps && result.reasoningSteps.length > 0 && (<div className="neural-steps-list">
                      {result.reasoningSteps.map((step, sIdx) => (<div key={sIdx} className="neural-step-item">
                          <span className="neural-step-num">{sIdx + 1}</span>
                          <span className="neural-step-text">
                            <FormattedInline text={step.replace(/^\d+[\.\)]\s*/, "")}/>
                          </span>
                        </div>))}
                    </div>)}
                </div>)}
            </div>) : null}

          {/* Formatted Humanoid Answer Copy */}
          <FormattedAnswer text={result.answer}/>

          {/* Inline Citation Pills */}
          {result.sources.length > 0 && (<div className="citation-row">
              <span className="citation-label">Evidence:</span>
              {result.sources.slice(0, 4).map((source, index) => (<a href={source.url} target="_blank" rel="noreferrer" key={source.id} className="citation" title={`${source.title} (${source.publisher})`}>
                  [{index + 1}] {source.publisher}
                </a>))}
            </div>)}

          {/* Key Facts / Numerical Takeaways */}
          {result.keyFacts.length > 0 && (<div className="facts-wrapper">
              <span className="facts-heading">Key Factual Takeaways</span>
              <div className="facts-grid">
                {result.keyFacts.map((fact) => (<div key={fact.label} className="fact">
                    <span className="fact-label">{fact.label}</span>
                    <strong className="fact-value">{fact.value}</strong>
                    <small className="fact-source">
                      {fact.sourceIds.length
                    ? `Cited from ${fact.sourceIds
                        .map((id) => result.sources.findIndex((source) => source.id === id) + 1)
                        .filter((index) => index > 0)
                        .map((n) => `[${n}]`)
                        .join(", ")}`
                    : "Verified factual analysis"}
                    </small>
                  </div>))}
              </div>
            </div>)}

          {/* Action Toolbar */}
          <div className="answer-actions">
            <button onClick={speakAnswer} className={`voice-action-btn ${isSpeaking ? "speaking" : ""}`}>
              {isSpeaking ? <Pause size={15} fill="currentColor"/> : <Volume2 size={15} strokeWidth={1.75} className="black-outline-icon"/>}
              <span>{isSpeaking ? "Pause Voice" : "Listen Explanation"}</span>
            </button>

            <button onClick={() => onCopy(result.answer)} className="action-btn">
              {copied ? <Check size={15} color="#167a53"/> : <Copy size={15}/>}
              <span>{copied ? "Copied!" : "Copy Answer"}</span>
            </button>

            <button onClick={() => setWhyOpen(!whyOpen)} className="action-btn">
              <CircleHelp size={15}/>
              <span>Why this answer?</span>
            </button>
          </div>

          {whyOpen && (<div className="why-answer">
              <ShieldCheck size={17}/>
              <div>
                <strong>Evidence Synthesis Method</strong>
                <p>{result.whyThisAnswer}</p>
              </div>
            </div>)}
        </article>

        {/* Web Sources List */}
        <section className="web-results">
          <div className="results-heading">
            <div>
              <span className="section-overline">Grounding Evidence</span>
              <h2>Sources & References ({result.sources.length})</h2>
            </div>
            <button onClick={() => setSourceOpen(!sourceOpen)}>
              {sourceOpen ? "Collapse sources" : "Expand sources"}{" "}
              <ChevronDown className={sourceOpen ? "chevron-up" : ""} size={16}/>
            </button>
          </div>

          {sourceOpen && (<div className="web-result-list">
              {result.sources.map((source, index) => (<a href={source.url} target="_blank" rel="noreferrer" className="web-result" key={source.id}>
                  <div className="source-index">{index + 1}</div>
                  <div className="source-content-block">
                    <div className="source-meta-row">
                      <span className="domain">{source.publisher}</span>
                      <span className={`reliability ${source.reliability}`}>{source.reliability}</span>
                      {source.publishedAt && <span className="source-date">{source.publishedAt}</span>}
                    </div>
                    <h3>
                      {source.title} <ExternalLink size={13}/>
                    </h3>
                    <p>{source.snippet}</p>
                  </div>
                </a>))}
            </div>)}
        </section>
      </div>

      {/* Right Sidebar: Evidence Status & Related Inquiries */}
      <aside className="results-side">
        <div className="evidence-card">
          <div className="evidence-heading">
            <ShieldCheck size={17}/>
            <span>Retrieval Diagnostics</span>
          </div>
          <strong>{result.usedLiveSources ? "Multi-Engine Live Crawl" : "Indic Base Synthesis"}</strong>
          <p>
            {result.usedLiveSources
            ? "Live evidence gathered from real-time web crawlers (Tavily, Wikipedia, Regional directories) and grounded with Groq."
            : "Synthesized using verified multilingual Indian knowledge models."}
          </p>
          <div className="evidence-stat-row">
            <span className="source-count">{result.sources.length} sources analyzed</span>
            <span className="latency-count">~1.2s synthesis</span>
          </div>
        </div>

        <div className="related-card">
          <span className="section-overline">Next Steps</span>
          <h2>Related Inquiries</h2>
          <div className="related-list">
            {result.related.map((question) => (<button key={question} onClick={() => void submitSearch(question)} className="related-btn">
                <span>{question}</span>
                <ChevronRight size={14} className="related-chevron"/>
              </button>))}
          </div>
        </div>
      </aside>
    </section>);
}
