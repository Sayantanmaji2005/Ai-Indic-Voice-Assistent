"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Compass, Globe2, Languages, Search, Sparkles, X, Radio } from "lucide-react";
import { languages } from "@/lib/languages";

const regionTabs = [
    { id: "all", label: "All Languages (25)" },
    { id: "popular", label: "Top 10 Major" },
    { id: "north", label: "North & Central" },
    { id: "south", label: "South India" },
    { id: "east", label: "East & North-East" },
    { id: "west", label: "West & Coastal" },
];

export function LanguageSelectDropdown({
    value,
    onChange,
    disabled = false,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const searchInputRef = useRef(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const selected = useMemo(() => {
        return languages.find((l) => l.code === value) ?? languages[0];
    }, [value]);

    // Handle ESC key to close modal
    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key === "Escape" && isOpen) {
                setIsOpen(false);
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    // Focus search input on open
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const filteredLanguages = useMemo(() => {
        const q = search.trim().toLowerCase();
        let list = languages.filter((l) => l.code !== "auto");
        if (activeTab !== "all") {
            list = list.filter(
                (l) => l.region === activeTab || (activeTab === "popular" && l.region === "popular")
            );
        }
        if (!q) return list;
        return list.filter(
            (l) =>
                l.label.toLowerCase().includes(q) ||
                l.nativeLabel.toLowerCase().includes(q) ||
                l.code.toLowerCase().includes(q) ||
                l.script.toLowerCase().includes(q)
        );
    }, [search, activeTab]);

    const modalContent = isOpen && mounted ? (
        <div className="pro-lang-backdrop" onClick={() => setIsOpen(false)} role="presentation">
            <div
                className="pro-lang-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="pro-lang-title"
            >
                {/* Modern Studio Header */}
                <div className="pro-lang-head">
                    <div className="pro-lang-head-content">
                        <div className="pro-lang-badge-icon">
                            <Languages size={18} strokeWidth={2} />
                        </div>
                        <div>
                            <div className="pro-lang-title-row">
                                <h2 id="pro-lang-title" className="pro-lang-title">
                                    Select Voice & Search Language
                                </h2>
                                <span className="pro-lang-pill-count">25 Languages</span>
                            </div>
                            <p className="pro-lang-subtitle">
                                Choose your preferred Indic voice dialect or keep AI Auto-Detect active.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="pro-lang-close"
                        onClick={() => setIsOpen(false)}
                        aria-label="Close dialog"
                    >
                        <X size={16} strokeWidth={2.2} />
                    </button>
                </div>

                {/* Minimalist Search Box */}
                <div className="pro-lang-search-container">
                    <div className="pro-lang-search-box">
                        <Search size={16} className="pro-lang-search-glass" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, script or code (e.g. Hindi, বাংলা, தமிழ், Telugu)..."
                            className="pro-lang-search-field"
                        />
                        {search && (
                            <button
                                type="button"
                                className="pro-lang-clear-btn"
                                onClick={() => setSearch("")}
                                aria-label="Clear search"
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Modern Segmented Control Filter Tabs */}
                <div className="pro-lang-tabs-wrapper">
                    <div className="pro-lang-tabs-bar">
                        {regionTabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                className={`pro-lang-tab ${activeTab === tab.id ? "active" : ""}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Scrollable Language Area */}
                <div className="pro-lang-scroll-area">
                    {/* Featured Luxury Obsidian Auto-Detect Card */}
                    {(!search ||
                        "auto detect".includes(search.toLowerCase()) ||
                        "swachalit".includes(search.toLowerCase())) && (
                        <div className="pro-auto-card-wrapper">
                            <button
                                type="button"
                                className={`pro-auto-card ${selected.code === "auto" ? "selected" : ""}`}
                                onClick={() => {
                                    onChange("auto");
                                    setIsOpen(false);
                                }}
                            >
                                <div className="pro-auto-left">
                                    <div className="pro-auto-sparkle">
                                        <Radio size={16} className="pro-radio-icon" />
                                    </div>
                                    <div className="pro-auto-info">
                                        <div className="pro-auto-title-row">
                                            <strong className="pro-auto-title">Auto-Detect Language (स्वचालित)</strong>
                                            <span className="pro-auto-ai-tag">Sub-200ms Neural</span>
                                        </div>
                                        <p className="pro-auto-desc">
                                            Automatically decodes Bengali, Hindi, Hinglish, Tamil, Telugu, Marathi & responds in authentic tongue.
                                        </p>
                                    </div>
                                </div>
                                {selected.code === "auto" ? (
                                    <div className="pro-check-ring">
                                        <Check size={14} strokeWidth={2.5} />
                                    </div>
                                ) : (
                                    <span className="pro-select-cta">Select Default</span>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Section Header */}
                    <div className="pro-grid-heading">
                        <span>Indian Scheduled Languages & Regional Dialects</span>
                        <small>{filteredLanguages.length} Available</small>
                    </div>

                    {filteredLanguages.length === 0 ? (
                        <div className="pro-empty-state">
                            <Compass size={28} className="pro-empty-icon" />
                            <h4>No matching language found for &ldquo;{search}&rdquo;</h4>
                            <p>Try searching in English or native script</p>
                        </div>
                    ) : (
                        <div className="pro-lang-grid">
                            {filteredLanguages.map((item) => {
                                const isSelected = item.code === selected.code;
                                return (
                                    <button
                                        key={item.code}
                                        type="button"
                                        className={`pro-card ${isSelected ? "selected" : ""}`}
                                        onClick={() => {
                                            onChange(item.code);
                                            setIsOpen(false);
                                        }}
                                    >
                                        <div className="pro-card-header">
                                            <span className="pro-card-native">{item.nativeLabel}</span>
                                            {isSelected ? (
                                                <span className="pro-card-check">
                                                    <Check size={13} strokeWidth={2.5} />
                                                </span>
                                            ) : (
                                                <span className="pro-card-code">{item.code.toUpperCase()}</span>
                                            )}
                                        </div>

                                        <div className="pro-card-body">
                                            <span className="pro-card-label">{item.label}</span>
                                            <div className="pro-card-footer">
                                                <span className="pro-script-badge">{item.script}</span>
                                                {item.speakers && (
                                                    <span className="pro-speaker-badge">{item.speakers}</span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Minimalist Bottom Status Bar */}
                <div className="pro-lang-bottom-bar">
                    <div className="pro-bottom-left">
                        <span className="pro-status-dot-active" />
                        <span>Powered by ElevenLabs & Studio Indic Acoustic Grounding</span>
                    </div>
                    <div className="pro-bottom-right">
                        <kbd className="pro-key-hint">ESC</kbd>
                    </div>
                </div>
            </div>
        </div>
    ) : null;

    return (
        <>
            {/* Search Bar Language Trigger Button */}
            <button
                type="button"
                className="pro-lang-trigger"
                onClick={() => {
                    if (!disabled) {
                        setIsOpen(true);
                        setSearch("");
                        setActiveTab("all");
                    }
                }}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                title="Change language / voice dialect"
            >
                <div className="pro-lang-trigger-glow" />
                <Languages size={14} strokeWidth={1.8} className="pro-lang-icon" />
                <span className="pro-lang-text">
                    {selected.code === "auto" ? "Auto Detect" : selected.nativeLabel}
                </span>
                <ChevronDown size={13} strokeWidth={1.8} className="pro-lang-chevron" />
            </button>

            {/* Screen-Centered Modal Dialog rendered into document.body */}
            {mounted && createPortal(modalContent, document.body)}
        </>
    );
}
