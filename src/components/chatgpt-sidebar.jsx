"use client";
import React, { useState } from "react";
import Image from "next/image";
import { MessageSquare, PanelLeftClose, Search, SquarePen, Trash2, X, } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { UserProfileMenu } from "@/components/user-profile-menu";
export function ChatGptSidebar({ currentQuery, onNewChat, onSelectChat, isOpen, onToggle, onReturnHome, }) {
    const { user, history, deleteHistoryItem, openAuthModal } = useAuth();
    const [activeItem, setActiveItem] = useState("");
    const [filterSearch, setFilterSearch] = useState("");
    const [isSearchingHistory, setIsSearchingHistory] = useState(false);
    // Sync active history item when currentQuery changes or is cleared
    React.useEffect(() => {
        setActiveItem(currentQuery || "");
    }, [currentQuery]);
    const handleNewChat = () => {
        setActiveItem("");
        setFilterSearch("");
        setIsSearchingHistory(false);
        onNewChat();
        if (typeof window !== "undefined" && window.innerWidth <= 768 && onToggle) {
            onToggle();
        }
    };
    const topMenuItems = [
        { id: "new", label: "New chat", icon: SquarePen, action: handleNewChat },
    ];
    const filteredHistory = history.filter((item) => item.query.toLowerCase().includes(filterSearch.toLowerCase()));
    return (<aside className={`gpt-sidebar ${isOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
      {/* Top Header Row */}
      <div className="gpt-sidebar-header">
        <div className="gpt-brand-title" onClick={onReturnHome} style={{ cursor: onReturnHome ? "pointer" : "default" }} role="button" tabIndex={0} aria-label="Indica AI Voice Assistant">
          <Image src="/indica-symbol.png" alt="Indica Emblem" width={42} height={32} className="gpt-brand-icon" priority/>
          <div className="gpt-brand-text-block">
            <span className="indica-logo-title">
              <span className="logo-color-navy">Indic</span><span className="logo-color-gold">a</span>
            </span>
            <span className="indica-logo-subtitle">AI VOICE ASSISTANT</span>
          </div>
        </div>
        <div className="gpt-header-actions">
          <button className="gpt-icon-btn" onClick={() => setIsSearchingHistory(!isSearchingHistory)} title="Search chats" aria-label="Search chats">
            <Search size={17} strokeWidth={1.75}/>
          </button>
          <button className="gpt-icon-btn" onClick={onToggle} title="Close sidebar" aria-label="Toggle sidebar">
            <PanelLeftClose size={17} strokeWidth={1.75}/>
          </button>
        </div>
      </div>

      {isSearchingHistory && (<div className="gpt-history-search-bar">
          <Search size={14} strokeWidth={1.75} className="gpt-search-icon"/>
          <input type="text" placeholder="Search recent chats..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} autoFocus/>
          {filterSearch && (<button onClick={() => setFilterSearch("")}>
              <X size={13} strokeWidth={2}/>
            </button>)}
        </div>)}

      {/* New Chat Button */}
      <div className="gpt-nav-list">
        {topMenuItems.map((item) => (<button key={item.id} className="gpt-nav-item gpt-new-chat-btn" onClick={item.action}>
            <item.icon size={16} strokeWidth={1.75} className="gpt-nav-icon"/>
            <span>{item.label}</span>
          </button>))}
      </div>

      {/* Recents Section */}
      <div className="gpt-recents-section">
        <span className="gpt-recents-heading">Recents</span>
        <div className="gpt-recents-list">
          {filteredHistory.length === 0 ? (<div className="gpt-empty-recents">No recent chats</div>) : (filteredHistory.map((item) => {
            const isSelected = activeItem === item.query || currentQuery === item.query;
            return (<div key={item.id} className={`gpt-recent-item ${isSelected ? "active" : ""}`} onClick={() => {
                    setActiveItem(item.query);
                    onSelectChat(item.query, item.language, item.mode);
                    if (typeof window !== "undefined" && window.innerWidth <= 768 && onToggle) {
                        onToggle();
                    }
                }} title={item.query}>
                  <div className="gpt-recent-left">
                    <MessageSquare size={13} strokeWidth={1.75} className="gpt-recent-icon"/>
                    <span className="gpt-recent-text">{item.query}</span>
                  </div>
                  <button className="gpt-recent-delete" onClick={(e) => {
                    e.stopPropagation();
                    deleteHistoryItem(item.id);
                }} title="Delete chat">
                    <Trash2 size={13} strokeWidth={1.75}/>
                  </button>
                </div>);
        }))}
        </div>
      </div>

      {/* Bottom User Profile Section with Menu Dropdown */}
      <UserProfileMenu variant="sidebar" onSelectHistory={onSelectChat}/>
    </aside>);
}
