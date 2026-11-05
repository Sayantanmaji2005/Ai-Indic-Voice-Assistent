"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, CheckCircle2, ChevronDown, Clock3, Globe2, Headphones, Languages, Mic, Radio, Search, ShieldCheck, Users, Zap, } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { UserProfileMenu } from "@/components/user-profile-menu";
export default function DashboardPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("overview");
    const [period, setPeriod] = useState("Last 30 days");
    const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
    const stats = [
        { label: "Total inquiries", value: "128,462", change: "+12.4%", icon: Search, tone: "green" },
        { label: "Voice synthesis", value: "38,904", change: "+8.1%", icon: Mic, tone: "orange" },
        { label: "Active Indian users", value: "14,280", change: "+5.7%", icon: Users, tone: "blue" },
        { label: "Avg. response time", value: "1.2s", change: "−0.4s", icon: Clock3, tone: "purple" },
    ];
    const languageData = [
        { name: "Hindi (हिन्दी)", share: "41.2%", count: "52,926", width: 82, growth: "+14%" },
        { name: "Bengali (বাংলা)", share: "18.6%", count: "23,894", width: 55, growth: "+11%" },
        { name: "English (Indian)", share: "15.4%", count: "19,783", width: 48, growth: "+6%" },
        { name: "Tamil (தமிழ்)", share: "9.2%", count: "11,818", width: 33, growth: "+9%" },
        { name: "Telugu (తెలుగు)", share: "7.1%", count: "9,120", width: 25, growth: "+8%" },
        { name: "Marathi (मराठी)", share: "4.8%", count: "6,166", width: 20, growth: "+12%" },
        { name: "Others (7 Dialects)", share: "3.7%", count: "4,755", width: 16, growth: "+5%" },
    ];
    const performanceMetrics = [
        { stage: "Speech Recognition (Web Speech API)", latency: "80ms", status: "Optimal", reliability: "98.8%" },
        { stage: "Multi-Engine Crawl (Tavily + Wiki + DDG)", latency: "340ms", status: "Optimal", reliability: "99.4%" },
        { stage: "Groq LLM Synthesis (Llama 3.3 70B)", latency: "260ms", status: "Ultra-Fast", reliability: "99.9%" },
        { stage: "ElevenLabs Indian Voice TTS", latency: "190ms", status: "Optimal", reliability: "99.1%" },
        { stage: "End-to-End User Audio Delivery", latency: "870ms", status: "Instant Stream", reliability: "99.2%" },
    ];
    const sourcesList = [
        { name: "Tavily Multi-Source Web Crawler", hits: "64,280", trust: "High Authority", uptime: "99.98%" },
        { name: "Wikipedia & Wikimedia Foundation", hits: "41,120", trust: "Established Archive", uptime: "100%" },
        { name: "PIB (Press Information Bureau India)", hits: "18,450", trust: "Official Govt Record", uptime: "99.9%" },
        { name: "DuckDuckGo Instant Index", hits: "14,310", trust: "General Web", uptime: "99.95%" },
    ];
    return (<main className="dashboard-page">
      {/* Top Header */}
      <header className="dashboard-top">
        <Link href="/" className="brand" aria-label="Indica AI home">
          <Image src="/indica-symbol.png" alt="Indica Emblem" width={42} height={32} className="brand-logo-img" priority/>
          <div className="brand-text-col">
            <span className="indica-logo-title">
              <span className="logo-color-navy">Indic</span><span className="logo-color-gold">a</span>
            </span>
            <span className="indica-logo-subtitle">AI VOICE ASSISTANT</span>
          </div>
        </Link>
        <div className="dash-user">
          <Link href="/" className="period" style={{ marginRight: 6 }}>
            <Search size={14}/> Back to Search
          </Link>
          <span className="live-dot"/> Live Multi-Engine Active
          <UserProfileMenu variant="topbar"/>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <section className="dash-shell">
        {/* Navigation Sidebar */}
        <aside className="dash-nav">
          <span className="nav-label">Analytics Workspace</span>
          <button className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>
            <BarChart3 size={17}/> Overview
          </button>
          <button className={activeTab === "languages" ? "active" : ""} onClick={() => setActiveTab("languages")}>
            <Languages size={17}/> Language Analytics
          </button>
          <button className={activeTab === "performance" ? "active" : ""} onClick={() => setActiveTab("performance")}>
            <Activity size={17}/> AI & Engine Latency
          </button>
          <button className={activeTab === "voice" ? "active" : ""} onClick={() => setActiveTab("voice")}>
            <Mic size={17}/> Voice Synthesis
          </button>
          <button className={activeTab === "sources" ? "active" : ""} onClick={() => setActiveTab("sources")}>
            <Globe2 size={17}/> Source Crawlers
          </button>

          <Link href="/" className="nav-item" style={{ marginTop: 12 }}>
            <Search size={17}/> Search Workspace
          </Link>

          <div>
            <ShieldCheck size={17}/>
            <span>
              <strong>Privacy-First Verification</strong>
              <small>Zero user query data logged</small>
            </span>
          </div>
        </aside>

        {/* Content Body */}
        <section className="dash-content">
          <div className="dash-heading">
            <div>
              <span className="section-overline">Real-Time Metrics</span>
              <h1>Welcome, {user?.name ? user.name.split(" ")[0] : "Sayantan"}</h1>
              <p>Live factual search & voice performance across 13 Indian languages.</p>
            </div>

            <div style={{ position: "relative" }}>
              <button className="period" onClick={() => setPeriodDropdownOpen(!periodDropdownOpen)}>
                {period} <ChevronDown size={15}/>
              </button>
              {periodDropdownOpen && (<div className="user-dropdown" style={{ top: 44, right: 0, width: 160 }}>
                  {["Last 7 days", "Last 30 days", "Last 90 days", "All time"].map((p) => (<button key={p} className="dropdown-item" onClick={() => {
                    setPeriod(p);
                    setPeriodDropdownOpen(false);
                }}>
                      {p}
                    </button>))}
                </div>)}
            </div>
          </div>

          {/* Key Stat Cards */}
          <div className="stat-grid">
            {stats.map(({ label, value, change, icon: Icon, tone }) => (<article key={label} className="stat-card">
                <div className={`stat-icon ${tone}`}>
                  <Icon size={18}/>
                </div>
                <span>{label}</span>
                <strong>{value}</strong>
                <small className={change.startsWith("−") ? "better" : ""}>
                  {change.startsWith("−") ? <ArrowDownRight size={12}/> : <ArrowUpRight size={12}/>}
                  {change} <i>vs prev. period</i>
                </small>
              </article>))}
          </div>

          {/* Tab 1: Overview */}
          {activeTab === "overview" && (<div className="analytics-grid">
              <article className="chart-card wide">
                <div className="card-title">
                  <div>
                    <span className="section-overline">Inquiry Velocity</span>
                    <h2>Daily Queries Over Time</h2>
                  </div>
                  <span className="chart-legend">
                    <i /> Real-time search volume
                  </span>
                </div>
                <div className="chart-wrap">
                  <div className="y-axis">
                    <span>6.5k</span>
                    <span>4.5k</span>
                    <span>2.0k</span>
                    <span>0</span>
                  </div>
                  <div className="line-chart">
                    <svg viewBox="0 0 720 200" preserveAspectRatio="none" aria-label="Rising search query trend">
                      <defs>
                        <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
                          <stop stopColor="#5fa888" stopOpacity=".25"/>
                          <stop offset="1" stopColor="#5fa888" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      <path d="M0,166 C35,152 48,165 78,144 S124,130 152,145 S191,115 226,126 S270,131 300,100 S346,107 378,96 S424,110 451,73 S497,90 528,61 S575,67 604,42 S654,52 680,29 S704,34 720,16 L720,200 L0,200Z" fill="url(#area)"/>
                      <path d="M0,166 C35,152 48,165 78,144 S124,130 152,145 S191,115 226,126 S270,131 300,100 S346,107 378,96 S424,110 451,73 S497,90 528,61 S575,67 604,42 S654,52 680,29 S704,34 720,16" fill="none" stroke="#2ea576" strokeWidth="3"/>
                    </svg>
                    <div className="x-axis">
                      <span>Day 1</span>
                      <span>Day 7</span>
                      <span>Day 14</span>
                      <span>Day 21</span>
                      <span>Day 30</span>
                    </div>
                  </div>
                </div>
              </article>

              <article className="chart-card">
                <div className="card-title">
                  <div>
                    <span className="section-overline">Grounding Accuracy</span>
                    <h2>Factual Verification Rate</h2>
                  </div>
                  <CheckCircle2 size={16} color="#259665"/>
                </div>
                <div className="score-ring">
                  <strong>
                    98.4<small>%</small>
                  </strong>
                  <span>verified factual grounding</span>
                </div>
                <div className="score-footer">
                  <span>
                    <i className="green-dot"/> Multi-source cited
                  </span>
                  <strong>126.4k</strong>
                </div>
              </article>

              <article className="chart-card">
                <div className="card-title">
                  <div>
                    <span className="section-overline">Language Share</span>
                    <h2>Most Spoken Indic Dialects</h2>
                  </div>
                  <button onClick={() => setActiveTab("languages")}>
                    View details <ArrowUpRight size={13}/>
                  </button>
                </div>
                <div className="language-bars">
                  {languageData.slice(0, 5).map((item) => (<div key={item.name}>
                      <span>{item.name.split(" ")[0]}</span>
                      <div>
                        <i style={{ width: `${item.width}%` }}/>
                      </div>
                      <strong>{item.share}</strong>
                    </div>))}
                </div>
              </article>

              <article className="chart-card">
                <div className="card-title">
                  <div>
                    <span className="section-overline">Input Modality</span>
                    <h2>Voice Adoption</h2>
                  </div>
                  <Radio size={16} color="#d97728"/>
                </div>
                <div className="voice-meter">
                  <div className="donut">
                    <span>
                      30<small>%</small>
                    </span>
                  </div>
                  <div>
                    <strong>Spoken Audio Inquiries</strong>
                    <p>38,904 queries were asked using natural Indian speech recognition.</p>
                    <span className="positive">
                      <ArrowUpRight size={13}/> +8.1% adoption
                    </span>
                  </div>
                </div>
              </article>
            </div>)}

          {/* Tab 2: Languages */}
          {activeTab === "languages" && (<div className="chart-card" style={{ padding: 24 }}>
              <div className="card-title" style={{ marginBottom: 18 }}>
                <div>
                  <span className="section-overline">Regional Footprint</span>
                  <h2>Language Breakdown Across India</h2>
                </div>
              </div>
              <div style={{ display: "grid", gap: 14 }}>
                {languageData.map((item) => (<div key={item.name} style={{
                    display: "grid",
                    gridTemplateColumns: "180px 1fr 100px 70px",
                    gap: 16,
                    alignItems: "center",
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "#f9fbf9",
                    border: "1px solid #e5ede7",
                }}>
                    <strong style={{ fontSize: 13.5, color: "#143226" }}>{item.name}</strong>
                    <div style={{ height: 8, borderRadius: 4, background: "#e2ece5", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${item.width}%`, background: "#22855f", borderRadius: 4 }}/>
                    </div>
                    <span style={{ fontSize: 12.5, color: "#54685e" }}>{item.count} queries</span>
                    <strong style={{ fontSize: 12.5, color: "#1e7a56", textAlign: "right" }}>{item.growth}</strong>
                  </div>))}
              </div>
            </div>)}

          {/* Tab 3: Performance & Latency */}
          {activeTab === "performance" && (<div className="chart-card" style={{ padding: 24 }}>
              <div className="card-title" style={{ marginBottom: 18 }}>
                <div>
                  <span className="section-overline">Sub-Second Processing</span>
                  <h2>Pipeline Latency & Reliability</h2>
                </div>
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                {performanceMetrics.map((item) => (<div key={item.stage} style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 18px",
                    borderRadius: 10,
                    background: "#f9fbf9",
                    border: "1px solid #e5ede7",
                }}>
                    <div>
                      <strong style={{ display: "block", fontSize: 14, color: "#123024" }}>{item.stage}</strong>
                      <small style={{ color: "#74887f", fontSize: 11.5 }}>Reliability rating: {item.reliability}</small>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span className="confidence high">{item.status}</span>
                      <strong style={{ fontSize: 16, color: "#16694b" }}>{item.latency}</strong>
                    </div>
                  </div>))}
              </div>
            </div>)}

          {/* Tab 4: Voice Synthesis */}
          {activeTab === "voice" && (<div className="chart-card" style={{ padding: 24 }}>
              <div className="card-title" style={{ marginBottom: 18 }}>
                <div>
                  <span className="section-overline">Speech Engine</span>
                  <h2>ElevenLabs Multilingual v2 Voice Performance</h2>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ padding: 18, borderRadius: 12, background: "#f9fbf9", border: "1px solid #e5ede7" }}>
                  <Headphones size={20} color="#1f7a57"/>
                  <strong style={{ display: "block", margin: "10px 0 4px", fontSize: 18, color: "#133528" }}>
                    Natural Indian Female Voice
                  </strong>
                  <p style={{ margin: 0, fontSize: 12.5, color: "#61736b", lineHeight: 1.5 }}>
                    Trained on authentic multilingual Indian accents with high conversational cadence and warmth.
                  </p>
                </div>
                <div style={{ padding: 18, borderRadius: 12, background: "#f9fbf9", border: "1px solid #e5ede7" }}>
                  <Zap size={20} color="#d97728"/>
                  <strong style={{ display: "block", margin: "10px 0 4px", fontSize: 18, color: "#133528" }}>
                    Instant Audio Streaming
                  </strong>
                  <p style={{ margin: 0, fontSize: 12.5, color: "#61736b", lineHeight: 1.5 }}>
                    First audio chunk generated in 190ms for seamless real-time spoken listening.
                  </p>
                </div>
              </div>
            </div>)}

          {/* Tab 5: Sources */}
          {activeTab === "sources" && (<div className="chart-card" style={{ padding: 24 }}>
              <div className="card-title" style={{ marginBottom: 18 }}>
                <div>
                  <span className="section-overline">Grounding Crawlers</span>
                  <h2>Active Live Search Providers</h2>
                </div>
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                {sourcesList.map((item) => (<div key={item.name} style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 18px",
                    borderRadius: 10,
                    background: "#f9fbf9",
                    border: "1px solid #e5ede7",
                }}>
                    <div>
                      <strong style={{ display: "block", fontSize: 14, color: "#123024" }}>{item.name}</strong>
                      <small style={{ color: "#74887f", fontSize: 11.5 }}>{item.trust}</small>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <span style={{ fontSize: 12.5, color: "#54685e" }}>{item.hits} documents</span>
                      <span className="confidence high">{item.uptime} Uptime</span>
                    </div>
                  </div>))}
              </div>
            </div>)}
        </section>
      </section>
    </main>);
}
