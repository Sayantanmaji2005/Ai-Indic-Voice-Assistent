"use client";
import React from "react";
import Image from "next/image";
import { CheckCircle2, Globe2, LoaderCircle, Lock, ShieldCheck, X, Zap, } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
export function GoogleAuthModal() {
    const { isAuthModalOpen, closeAuthModal, loginWithGoogle, isLoading, authError } = useAuth();
    if (!isAuthModalOpen)
        return null;
    const handleGoogleSignIn = () => {
        void loginWithGoogle();
    };
    return (<div className="enterprise-auth-overlay" onClick={closeAuthModal}>
      {/* Ambient Warm Sunset Aura Glow */}
      <div className="enterprise-auth-glow-aura"/>

      {/* Main Luxury Modal Card */}
      <div className="enterprise-auth-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button type="button" className="enterprise-modal-close" onClick={closeAuthModal} aria-label="Close modal">
          <X size={17}/>
        </button>

        {/* Brand Header */}
        <div className="enterprise-auth-header">
          <div className="enterprise-brand-pill">
            <div className="enterprise-brand-emblem-wrap">
              <Image src="/indica-symbol.png" alt="Indica Emblem" width={28} height={28} className="enterprise-brand-emblem" priority/>
              <span className="enterprise-emblem-glow"/>
            </div>
            <div className="enterprise-brand-title">
              <span className="brand-navy">Indic</span>
              <span className="brand-terracotta">a</span>
              <span className="enterprise-badge-tag">ENTERPRISE</span>
            </div>
          </div>

          <h2 className="enterprise-auth-title">
            Sign in to <span className="title-highlight">Indica</span>
          </h2>
          <p className="enterprise-auth-subtitle">
            Experience next-generation neural voice intelligence, personal search memory, and dialect synthesis across 13+ Indian languages.
          </p>
        </div>

        {/* Enterprise Value Matrix */}
        <div className="enterprise-benefits-grid">
          <div className="enterprise-benefit-card">
            <div className="benefit-icon-box icon-orange">
              <Zap size={14}/>
            </div>
            <div className="benefit-text">
              <strong>Sub-200ms Neural Speech</strong>
              <span>Bilingual real-time TTS with regional inflection</span>
            </div>
          </div>

          <div className="enterprise-benefit-card">
            <div className="benefit-icon-box icon-teal">
              <ShieldCheck size={14}/>
            </div>
            <div className="benefit-text">
              <strong>Zero-Trace RAM Privacy</strong>
              <span>Ephemeral audio processing, zero stored voice</span>
            </div>
          </div>

          <div className="enterprise-benefit-card">
            <div className="benefit-icon-box icon-purple">
              <Globe2 size={14}/>
            </div>
            <div className="benefit-text">
              <strong>Unified Workspace Memory</strong>
              <span>Encrypted search threads and dialect preferences</span>
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {authError && (<div className="enterprise-auth-error">
            <span className="error-dot"/>
            <span>{authError}</span>
          </div>)}

        {/* Auth Action Button */}
        <div className="enterprise-auth-actions">
          {/* Primary: Continue with Google */}
          <button type="button" className="enterprise-google-btn" onClick={handleGoogleSignIn} disabled={isLoading}>
            {isLoading ? (<LoaderCircle className="spin" size={20}/>) : (<svg className="google-vector-icon" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>)}
            <span className="btn-label">Continue with Google</span>
          </button>
        </div>

        {/* Security & Compliance Footer */}
        <div className="enterprise-auth-footer">
          <div className="compliance-badges">
            <span className="compliance-item">
              <Lock size={11}/> 256-Bit TLS
            </span>
            <span className="compliance-dot">•</span>
            <span className="compliance-item">
              <ShieldCheck size={11}/> Google OAuth 2.0
            </span>
            <span className="compliance-dot">•</span>
            <span className="compliance-item">
              <CheckCircle2 size={11}/> Zero Retention
            </span>
          </div>

          <p className="enterprise-legal-note">
            By continuing, you agree to Indica’s{" "}
            <a href="#privacy" onClick={(e) => { e.preventDefault(); closeAuthModal(); }}>
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#privacy" onClick={(e) => { e.preventDefault(); closeAuthModal(); }}>
              Privacy Principles
            </a>
            .
          </p>
        </div>
      </div>
    </div>);
}
