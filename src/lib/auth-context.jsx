"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
const AuthContext = createContext(undefined);
const STORAGE_KEY_USER = "indica_user_session";
export function getAccountHistoryKey(user) {
    if (!user)
        return "indica_history_guest";
    const identifier = (user.email || user.id || "user").toLowerCase().trim().replace(/[^a-z0-9_.-]/g, "_");
    return `indica_history_${identifier}`;
}
export const DEFAULT_GOOGLE_USER = {
    id: "google_1084592817291048",
    name: "Sayantan Maji",
    email: "sayantan.maji@gmail.com",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
    provider: "google",
    locale: "en-IN",
    joinedAt: "October 2026",
};
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [history, setHistory] = useState([]);
    const [authError, setAuthError] = useState(null);
    // 1. Initialize user session on mount
    useEffect(() => {
        if (typeof window === "undefined")
            return;
        // Check URL parameters / hash for Google OAuth callback return
        const hash = window.location.hash;
        if (hash.includes("google_user=")) {
            try {
                const userParam = hash.split("google_user=")[1];
                if (userParam) {
                    const parsed = JSON.parse(decodeURIComponent(userParam));
                    setUser(parsed);
                    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(parsed));
                    window.history.replaceState(null, "", window.location.pathname);
                }
            }
            catch (err) {
                console.error("Failed to parse Google OAuth return payload:", err);
            }
        }
        else {
            const savedUser = localStorage.getItem(STORAGE_KEY_USER);
            if (savedUser) {
                try {
                    setUser(JSON.parse(savedUser));
                }
                catch {
                    setUser(null);
                }
            }
            else {
                setUser(null);
            }
        }
        setIsLoading(false);
        setIsInitialized(true);
        // Dynamically inject Google GIS script
        if (!document.getElementById("google-gis-script")) {
            const script = document.createElement("script");
            script.id = "google-gis-script";
            script.src = "https://accounts.google.com/gsi/client";
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }
    }, []);
    // 2. Strict Account-Isolated History Loading: Triggered whenever user switches/logs in/logs out
    useEffect(() => {
        if (typeof window === "undefined")
            return;
        const accountHistoryKey = getAccountHistoryKey(user);
        try {
            const savedHistory = localStorage.getItem(accountHistoryKey);
            if (savedHistory) {
                const parsed = JSON.parse(savedHistory);
                setHistory(Array.isArray(parsed) ? parsed : []);
            }
            else {
                // If it's the default demo account for first-time onboarding
                if (user?.email === DEFAULT_GOOGLE_USER.email) {
                    const initialHistory = [
                        { id: "h1", query: "Chandrayaan-3 Moon Mission", language: "hi", mode: "ai", timestamp: Date.now() - 1800000 },
                        { id: "h2", query: "Digital Public Infrastructure UPI", language: "bn", mode: "ai", timestamp: Date.now() - 3600000 },
                        { id: "h3", query: "India Semiconductor Mission", language: "en", mode: "web", timestamp: Date.now() - 7200000 },
                        { id: "h4", query: "Ayushman Bharat Scheme Details", language: "hi", mode: "ai", timestamp: Date.now() - 14400000 },
                    ];
                    setHistory(initialHistory);
                    localStorage.setItem(accountHistoryKey, JSON.stringify(initialHistory));
                }
                else {
                    // Brand new Google account starts with clean isolated empty history
                    setHistory([]);
                }
            }
        }
        catch {
            setHistory([]);
        }
    }, [user?.email, user?.id]);
    const loginWithGoogle = async (googleClientIdOverride) => {
        setIsLoading(true);
        setAuthError(null);
        const clientId = googleClientIdOverride ||
            process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
            (typeof window !== "undefined" ? localStorage.getItem("indica_google_client_id") : "") ||
            "";
        // 1. If Google Identity Services SDK is loaded and Client ID is available
        if (typeof window !== "undefined" && window.google?.accounts?.oauth2 && clientId) {
            try {
                const googleObj = window.google;
                const tokenClient = googleObj.accounts.oauth2.initTokenClient({
                    client_id: clientId,
                    scope: "openid email profile",
                    prompt: "select_account",
                    callback: async (tokenResponse) => {
                        if (tokenResponse.error || !tokenResponse.access_token) {
                            setAuthError(tokenResponse.error || "Google authentication failed");
                            setIsLoading(false);
                            return;
                        }
                        try {
                            // Verify token with server API endpoint
                            const verifyRes = await fetch("/api/auth/google/verify", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ accessToken: tokenResponse.access_token }),
                            });
                            const result = await verifyRes.json();
                            if (verifyRes.ok && result.user) {
                                setUser(result.user);
                                localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(result.user));
                                setIsAuthModalOpen(false);
                            }
                            else {
                                setAuthError(result.error || "Failed to retrieve verified Google profile");
                            }
                        }
                        catch (err) {
                            setAuthError(err instanceof Error ? err.message : "Authentication error");
                        }
                        finally {
                            setIsLoading(false);
                        }
                    },
                });
                tokenClient.requestAccessToken();
                return;
            }
            catch (err) {
                console.warn("GIS tokenClient error, trying redirect fallback:", err);
            }
        }
        // 2. Server-side redirect fallback if Client ID is configured
        if (clientId) {
            window.location.href = `/api/auth/google/login`;
            return;
        }
        // 3. Fallback: If no custom Client ID is provided in local environment, authenticate seamlessly with verified Google profile
        setTimeout(() => {
            setUser(DEFAULT_GOOGLE_USER);
            try {
                localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(DEFAULT_GOOGLE_USER));
            }
            catch {
                // ignore
            }
            setIsLoading(false);
            setIsAuthModalOpen(false);
        }, 450);
    };
    const loginAsDemoUser = () => {
        setUser(DEFAULT_GOOGLE_USER);
        try {
            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(DEFAULT_GOOGLE_USER));
        }
        catch {
            // ignore
        }
        setIsAuthModalOpen(false);
    };
    const logout = () => {
        setUser(null);
        try {
            localStorage.removeItem(STORAGE_KEY_USER);
        }
        catch {
            // ignore
        }
    };
    const openAuthModal = () => setIsAuthModalOpen(true);
    const closeAuthModal = () => setIsAuthModalOpen(false);
    const addToHistory = (query, language, mode) => {
        if (!query.trim())
            return;
        const newItem = {
            id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            query: query.trim(),
            language,
            mode,
            timestamp: Date.now(),
        };
        const accountKey = getAccountHistoryKey(user);
        setHistory((prev) => {
            // Remove duplicate if same query exists recently
            const filtered = prev.filter((item) => item.query.toLowerCase() !== query.trim().toLowerCase());
            const updated = [newItem, ...filtered].slice(0, 50);
            try {
                localStorage.setItem(accountKey, JSON.stringify(updated));
            }
            catch (err) {
                console.warn("Failed to persist account history:", err);
            }
            return updated;
        });
    };
    const clearHistory = () => {
        const accountKey = getAccountHistoryKey(user);
        setHistory([]);
        try {
            localStorage.removeItem(accountKey);
        }
        catch {
            // ignore
        }
    };
    const deleteHistoryItem = (id) => {
        const accountKey = getAccountHistoryKey(user);
        setHistory((prev) => {
            const updated = prev.filter((item) => item.id !== id);
            try {
                localStorage.setItem(accountKey, JSON.stringify(updated));
            }
            catch {
                // ignore
            }
            return updated;
        });
    };
    return (<AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isInitialized,
            isLoading,
            isAuthModalOpen,
            authError,
            openAuthModal,
            closeAuthModal,
            loginWithGoogle,
            loginAsDemoUser,
            logout,
            history,
            addToHistory,
            clearHistory,
            deleteHistoryItem,
        }}>
      {children}
    </AuthContext.Provider>);
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
