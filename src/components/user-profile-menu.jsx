"use client";
import React, { useState, useRef, useEffect } from "react";
import { History, LogOut, MoreHorizontal, Sparkles, Trash2, } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
export function UserProfileMenu({ variant = "topbar", onSelectHistory, }) {
    const { user, isAuthenticated, openAuthModal, logout, history, clearHistory, deleteHistoryItem } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        setAvatarError(false);
    }, [user?.avatar]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    if (!isAuthenticated || !user) {
        if (variant === "sidebar") {
            return (<div className="gpt-user-footer gpt-user-logged-out" onClick={openAuthModal} role="button" tabIndex={0} title="Sign in with Google">
          <div className="gpt-user-left">
            <div className="gpt-logged-out-avatar">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
            </div>
            <div className="gpt-user-info">
              <span className="gpt-user-name">Sign In</span>
              <span className="gpt-user-sub">Google Account</span>
            </div>
          </div>
          <Sparkles size={14} style={{ color: "#d35b37", flexShrink: 0 }}/>
        </div>);
        }
        return (<button className="google-top-signin-btn" onClick={openAuthModal}>
        <svg className="google-icon-sm" viewBox="0 0 24 24" width="16" height="16">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
        </svg>
        <span>Sign in with Google</span>
      </button>);
    }
    const initials = (user.name || "User")
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase() || "U";
    return (<div className="profile-menu-container" ref={menuRef}>
      {variant === "sidebar" ? (<div className="gpt-user-footer profile-mini" onClick={() => setIsOpen(!isOpen)} role="button" tabIndex={0} aria-expanded={isOpen}>
          <div className="gpt-user-left">
            {user.avatar && !avatarError ? (
              <img
                src={user.avatar}
                alt={user.name}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={() => setAvatarError(true)}
                className="gpt-user-avatar"
              />
            ) : (
              <div className="gpt-user-avatar-fallback">{initials}</div>
            )}
            <div className="gpt-user-info">
              <strong>{user.name.toUpperCase()}</strong>
              <small>Personal workspace</small>
            </div>
          </div>
          <MoreHorizontal size={17} strokeWidth={1.75} style={{ color: "#71717a", flexShrink: 0 }}/>
        </div>) : (<button className="avatar-btn" onClick={() => setIsOpen(!isOpen)} aria-label="User profile menu" aria-expanded={isOpen}>
          {user.avatar && !avatarError ? (
            <img
              src={user.avatar}
              alt={user.name}
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              onError={() => setAvatarError(true)}
              className="avatar-img-top"
            />
          ) : (
            <span className="avatar-initials-top">{initials}</span>
          )}
        </button>)}

      {isOpen && (<div className={`user-dropdown ${variant === "sidebar" ? "dropdown-sidebar" : "dropdown-topbar"}`}>
          <div className="dropdown-user-header">
            {user.avatar && !avatarError ? (
              <img
                src={user.avatar}
                alt={user.name}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={() => setAvatarError(true)}
                className="dropdown-avatar"
              />
            ) : (
              <span className="dropdown-avatar-initials">{initials}</span>
            )}
            <div className="dropdown-user-details">
              <strong>{user.name}</strong>
              <span>{user.email}</span>
              <div className="google-badge">
                <svg viewBox="0 0 24 24" width="12" height="12">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Google Verified</span>
              </div>
            </div>
          </div>

          <div className="dropdown-divider"/>

          <button className="dropdown-item logout-item" onClick={() => {
                logout();
                setIsOpen(false);
            }}>
            <LogOut size={15}/>
            <span>Sign Out</span>
          </button>
        </div>)}

      {showHistoryModal && (<div className="auth-modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="history-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="history-header">
              <div className="history-title-block">
                <History size={18}/>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16 }}>Search History</h3>
                  <small style={{ color: "#5a7266", fontSize: "11px", display: "block", marginTop: 2 }}>
                    {user?.email ? `Account: ${user.email}` : "Guest Session"}
                  </small>
                </div>
              </div>
              <div className="history-header-actions">
                {history.length > 0 && (<button className="clear-history-btn" onClick={clearHistory}>
                    <Trash2 size={13}/> Clear account history
                  </button>)}
                <button className="auth-modal-close" onClick={() => setShowHistoryModal(false)}>
                  ✕
                </button>
              </div>
            </div>

            <div className="history-list">
              {history.length === 0 ? (<div className="history-empty">
                  <p>No search history yet. Try searching in any Indian language!</p>
                </div>) : (history.map((item) => (<div key={item.id} className="history-row">
                    <div className="history-query-content" onClick={() => {
                    setShowHistoryModal(false);
                    onSelectHistory?.(item.query, item.language, item.mode);
                }}>
                      <span className="history-lang-tag">{item.language.toUpperCase()}</span>
                      <strong className="history-text">{item.query}</strong>
                      <small className="history-time">{new Date(item.timestamp).toLocaleDateString()}</small>
                    </div>
                    <button className="history-delete-item" onClick={(e) => {
                    e.stopPropagation();
                    deleteHistoryItem(item.id);
                }} title="Delete entry">
                      <Trash2 size={13}/>
                    </button>
                  </div>)))}
            </div>
          </div>
        </div>)}
    </div>);
}
