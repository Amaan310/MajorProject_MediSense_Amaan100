import React, { useState, useRef, useEffect, useCallback } from "react";
import { API, useAuth } from "../context/AuthContext";
import {
  Send, Bot, User, Sparkles, Copy, Check,
  X, MessageSquare, Maximize2, Minimize2, RefreshCw
} from "lucide-react";

// ── Inline formatting ──────────────────────────────────────────────────────
function Inline({ text }) {
  const tokens = text.split(
    /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|==.+?==|~~.+?~~|\[[^\]]+\]\([^)]+\))/g
  );
  return (
    <>
      {tokens.map((t, i) => {
        if (t.startsWith("**") && t.endsWith("**"))
          return <strong key={i} style={{ color: "var(--text)", fontWeight: 700 }}>{t.slice(2, -2)}</strong>;
        if (t.startsWith("*") && t.endsWith("*") && !t.startsWith("**"))
          return <em key={i}>{t.slice(1, -1)}</em>;
        if (t.startsWith("`") && t.endsWith("`"))
          return (
            <code key={i} style={{
              background: "var(--bg3)", border: "1px solid var(--border-strong)",
              borderRadius: 4, padding: "1px 6px", fontSize: "0.87em",
              fontFamily: "'JetBrains Mono', monospace", color: "var(--brand)"
            }}>{t.slice(1, -1)}</code>
          );
        if (t.startsWith("==") && t.endsWith("=="))
          return <mark key={i} style={{ background: "rgba(250,204,21,0.38)", color: "var(--text)", borderRadius: 3, padding: "0 3px" }}>{t.slice(2, -2)}</mark>;
        if (t.startsWith("~~") && t.endsWith("~~"))
          return <s key={i} style={{ color: "var(--text-3)" }}>{t.slice(2, -2)}</s>;
        const link = t.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link)
          return <a key={i} href={link[2]} target="_blank" rel="noreferrer" style={{ color: "var(--brand)", textDecoration: "underline", textUnderlineOffset: 2 }}>{link[1]}</a>;
        return <span key={i}>{t}</span>;
      })}
    </>
  );
}

// ── Code block ────────────────────────────────────────────────────────────
function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ background: "var(--bg3)", border: "1px solid var(--border-strong)", borderRadius: 10, overflow: "hidden", margin: "10px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 12px", borderBottom: "1px solid var(--border)", background: "var(--bg2)" }}>
        <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "monospace" }}>{lang || "code"}</span>
        <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--text-3)", padding: "2px 6px", borderRadius: 4 }}>
          {copied ? <><Check size={11} color="var(--brand)" /> Copied</> : <><Copy size={11} /> Copy</>}
        </button>
      </div>
      <pre style={{ margin: 0, padding: "12px 14px", overflowX: "auto", fontSize: 12.5, lineHeight: 1.6, color: "var(--text)", fontFamily: "'JetBrains Mono', monospace" }}>{code}</pre>
    </div>
  );
}

// ── Markdown table ────────────────────────────────────────────────────────
function MdTable({ rows }) {
  if (rows.length < 2) return null;
  const headers = rows[0];
  const body = rows.slice(2);
  return (
    <div style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch", margin: "12px 0", borderRadius: 10, border: "1px solid var(--border-strong)" }}>
      <table style={{ width: "max-content", minWidth: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "var(--brand)" }}>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, fontSize: 12, color: "white", whiteSpace: "nowrap", letterSpacing: "0.02em", borderRight: i < headers.length - 1 ? "1px solid rgba(255,255,255,0.15)" : "none" }}>
                {h.trim()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? "var(--surface)" : "var(--bg2)", borderBottom: "1px solid var(--border)" }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: "9px 14px", color: "var(--text-2)", fontSize: 13, lineHeight: 1.5, whiteSpace: "normal", minWidth: 80, borderRight: ci < row.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <Inline text={cell.trim()} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Callout blocks ────────────────────────────────────────────────────────
function Callout({ type, text }) {
  const map = {
    note:    { bg: "rgba(59,130,246,0.07)",  border: "#3b82f6", icon: "💡" },
    warning: { bg: "rgba(245,158,11,0.07)",  border: "#f59e0b", icon: "⚠️" },
    danger:  { bg: "rgba(239,68,68,0.07)",   border: "#ef4444", icon: "🚨" },
    success: { bg: "rgba(22,163,74,0.07)",   border: "#16a34a", icon: "✅" },
    tip:     { bg: "rgba(139,92,246,0.07)",  border: "#8b5cf6", icon: "🩺" },
  };
  const s = map[type] || map.note;
  return (
    <div style={{ background: s.bg, borderLeft: `3px solid ${s.border}`, borderRadius: 8, padding: "10px 14px", margin: "10px 0", display: "flex", gap: 8, alignItems: "flex-start" }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>{s.icon}</span>
      <span style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6 }}><Inline text={text} /></span>
    </div>
  );
}

// ── Full markdown renderer ────────────────────────────────────────────────
function MessageContent({ content }) {
  const lines = content.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { codeLines.push(lines[i]); i++; }
      elements.push(<CodeBlock key={`cb${i}`} code={codeLines.join("\n")} lang={lang} />);
      i++; continue;
    }

    if (line.match(/^[-*_]{3,}$/)) {
      elements.push(<hr key={`hr${i}`} style={{ border: "none", borderTop: "1px solid var(--border)", margin: "12px 0" }} />);
      i++; continue;
    }

    const hm = line.match(/^(#{1,3})\s+(.+)/);
    if (hm) {
      const lvl = hm[1].length;
      const sizes = [17, 15, 13.5];
      elements.push(
        <div key={`h${i}`} style={{ fontWeight: 700, fontSize: sizes[lvl - 1], color: "var(--text)", margin: `${lvl === 1 ? 14 : 10}px 0 ${lvl === 1 ? 6 : 3}px`, borderBottom: lvl <= 2 ? "1px solid var(--border)" : "none", paddingBottom: lvl <= 2 ? 5 : 0, fontFamily: "'Clash Display', sans-serif", letterSpacing: "-0.01em" }}>
          <Inline text={hm[2]} />
        </div>
      );
      i++; continue;
    }

    if (line.trim().startsWith(">")) {
      const qLines = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        qLines.push(lines[i].trim().replace(/^>\s*/, ""));
        i++;
      }
      const firstLine = qLines[0];
      const cm = firstLine.match(/^\[!(NOTE|WARNING|DANGER|SUCCESS|TIP)\]\s*(.*)/i);
      if (cm) {
        const rest = [cm[2], ...qLines.slice(1)].filter(Boolean);
        elements.push(<Callout key={`cal${i}`} type={cm[1].toLowerCase()} text={rest.join(" ")} />);
      } else {
        elements.push(
          <blockquote key={`bq${i}`} style={{ borderLeft: "3px solid var(--brand)", margin: "10px 0", paddingLeft: 14, color: "var(--text-2)", fontStyle: "italic" }}>
            {qLines.map((q, qi) => <p key={qi} style={{ margin: "3px 0", fontSize: 13.5, lineHeight: 1.6 }}><Inline text={q} /></p>)}
          </blockquote>
        );
      }
      continue;
    }

    if (line.includes("|") && line.trim().startsWith("|")) {
      const tLines = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) { tLines.push(lines[i]); i++; }
      const rows = tLines.map(tl => tl.trim().replace(/^\||\|$/g, "").split("|"));
      elements.push(<MdTable key={`tbl${i}`} rows={rows} />);
      continue;
    }

    if (line.match(/^(\s*)[-*•]\s+/)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^(\s*)[-*•]\s+/)) {
        const indent = (lines[i].match(/^(\s*)/)?.[1]?.length || 0) >= 2;
        items.push({ text: lines[i].replace(/^(\s*)[-*•]\s+/, ""), indent });
        i++;
      }
      elements.push(
        <ul key={`ul${i}`} style={{ margin: "6px 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
          {items.map((item, j) => (
            <li key={j} style={{ display: "flex", gap: 9, alignItems: "flex-start", paddingLeft: item.indent ? 18 : 0 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand)", flexShrink: 0, marginTop: 7 }} />
              <span style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.65 }}><Inline text={item.text} /></span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (line.match(/^\d+\.\s+/)) {
      const items = [];
      let n = 1;
      while (i < lines.length && lines[i].match(/^\d+\.\s+/)) {
        items.push({ text: lines[i].replace(/^\d+\.\s+/, ""), num: n++ });
        i++;
      }
      elements.push(
        <ol key={`ol${i}`} style={{ margin: "6px 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
          {items.map((item, j) => (
            <li key={j} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ minWidth: 22, height: 22, borderRadius: "50%", background: "var(--brand-light)", color: "var(--brand)", fontWeight: 700, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, border: "1px solid rgba(22,163,74,0.2)" }}>{item.num}</span>
              <span style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.65 }}><Inline text={item.text} /></span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    elements.push(
      <p key={`p${i}`} style={{ margin: "4px 0", fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.72 }}>
        <Inline text={line} />
      </p>
    );
    i++;
  }

  return <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>{elements}</div>;
}

// ── Typing indicator ──────────────────────────────────────────────────────
function TypingIndicator({ text = "" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 7, height: 7, borderRadius: "50%", background: "var(--brand)",
            display: "inline-block",
            animation: "typingBounce 1.2s infinite ease-in-out",
            animationDelay: `${i * 0.2}s`,
            opacity: 0.7,
          }} />
        ))}
      </div>
      {text && <span style={{ fontSize: 12, color: "var(--text-3)", fontStyle: "italic" }}>{text}</span>}
    </div>
  );
}

// ── Quick-reply chips config ──────────────────────────────────────────────
const QUICK_REPLIES_GENERIC = [
  "What can you do?",
  "What diseases do you detect?",
  "Is my data safe?",
  "How do I upload a report?",
];
const QUICK_REPLIES_LOGGEDIN = [
  "What reports can I upload?",
  "What diseases are detected?",
  "How do I get started?",
  "How accurate is the AI?",
];
const QUICK_REPLIES_CONTEXT = (ctx) => [
  `Give me a 7-day diet table for ${ctx}`,
  "What do my lab values mean?",
  "List safe exercises for me",
  "What are the emergency warning signs?",
];

// ── Main AIChat component ─────────────────────────────────────────────────
export default function AIChat() {
  const { authHeader } = useAuth();
  const isLoggedIn = !!authHeader;

  const [isOpen, setIsOpen]                   = useState(false);
  const [isMaximized, setIsMaximized]         = useState(false);
  const [activePredictionId, setActivePredictionId] = useState(0);
  const [activeDiseaseContext, setActiveDiseaseContext] = useState("");
  const [messages, setMessages]               = useState([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming]         = useState(false);
  const [streamingPhase, setStreamingPhase]   = useState("");
  const [input, setInput]                     = useState("");
  const [quickReplies, setQuickReplies]       = useState([]);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const getGreeting = useCallback((loggedIn, context) => {
    if (!loggedIn) return "Hi! I'm **MediSense AI**.\n\nPlease log in to start analyzing your health reports and get personalized insights.";
    if (!context)  return "Hi! I'm your **MediSense AI** assistant.\n\nUpload a lab report or enter your health parameters on the Analyze page to get started!";
    return `Hi! I'm your **MediSense AI** assistant.\n\nI can answer questions about your **${context}** results. I can also:\n\n- Create **weekly diet tables**\n- List **safe exercises**\n- Explain **lab values** in simple language\n\nJust ask anything!`;
  }, []);

  // Initialise messages + quick replies
  useEffect(() => {
    setMessages([{ role: "ai", content: getGreeting(isLoggedIn, activeDiseaseContext) }]);
    setShowQuickReplies(true);
    if (!isLoggedIn)           setQuickReplies(QUICK_REPLIES_GENERIC);
    else if (activeDiseaseContext) setQuickReplies(QUICK_REPLIES_CONTEXT(activeDiseaseContext));
    else                       setQuickReplies(QUICK_REPLIES_LOGGEDIN);
  }, [isLoggedIn, activeDiseaseContext, getGreeting]);

  // Listen for context from AnalyzePage
  useEffect(() => {
    const handler = (e) => {
      const { predictionId, diseaseContext } = e.detail;
      setActivePredictionId(predictionId);
      setActiveDiseaseContext(diseaseContext);
      setMessages(prev => [...prev, {
        role: "ai",
        content: `I've received your **${diseaseContext}** report. What would you like to know about your results?`
      }]);
      setQuickReplies(QUICK_REPLIES_CONTEXT(diseaseContext));
      setShowQuickReplies(true);
      setIsOpen(true);
    };
    window.addEventListener("medisense-open-chat", handler);
    return () => window.removeEventListener("medisense-open-chat", handler);
  }, []);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, isStreaming]);

  // Focus on open
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 120);
  }, [isOpen]);

  const send = async (overrideText) => {
    const msg = (overrideText ?? input).trim();
    if (!msg || isStreaming) return;

    setInput("");
    setShowQuickReplies(false);  // hide chips once user starts chatting
    setMessages(prev => [...prev, { role: "user", content: msg }]);

    // Non-logged-in fallback
    if (!isLoggedIn) {
      setIsStreaming(true);
      setStreamingPhase("thinking");
      await new Promise(r => setTimeout(r, 600));
      setStreamingPhase("writing");
      const reply = "Please **log in** to unlock full AI analysis and personalized health insights.";
      let built = "";
      for (const char of reply) {
        built += char;
        setStreamingContent(built);
        await new Promise(r => setTimeout(r, 12));
      }
      setMessages(prev => [...prev, { role: "ai", content: built }]);
      setStreamingContent("");
      setIsStreaming(false);
      setStreamingPhase("");
      return;
    }

    setIsStreaming(true);
    setStreamingPhase("thinking");
    setStreamingContent("");

    try {
      const history = messages.map(m => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.content
      }));
      const authHeaders = authHeader || {};
      const token = authHeaders["Authorization"]?.replace("Bearer ", "") || "";

      const response = await fetch(`${API}/api/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          prediction_id: activePredictionId,
          message: msg,
          history,
          disease_context: activeDiseaseContext
        })
      });

      if (!response.ok) throw new Error("Stream failed");

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText   = "";
      let firstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          if (data.startsWith("[ERROR]")) { fullText += "\n\nSorry, something went wrong. Please try again."; break; }
          if (firstChunk) { setStreamingPhase("writing"); firstChunk = false; }
          const text = data.replace(/\\n/g, "\n");
          fullText += text;
          setStreamingContent(fullText);
        }
      }
      setMessages(prev => [...prev, { role: "ai", content: fullText }]);
    } catch (err) {
      try {
        const { default: axios } = await import("axios");
        const history = messages.map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content }));
        const res = await axios.post(`${API}/api/chat`, {
          prediction_id: activePredictionId,
          message: msg,
          history,
          disease_context: activeDiseaseContext
        }, { headers: authHeader });
        setMessages(prev => [...prev, { role: "ai", content: res.data.response }]);
      } catch {
        setMessages(prev => [...prev, { role: "ai", content: "Sorry, something went wrong. Please try again." }]);
      }
    } finally {
      setStreamingContent("");
      setIsStreaming(false);
      setStreamingPhase("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  return (
    <>
      {/* FAB */}
      <button
        className={`ai-fab-button ${isOpen ? "hidden" : ""}`}
        onClick={() => setIsOpen(true)}
        title="Ask MediSense AI"
      >
        <MessageSquare size={22} color="white" />
      </button>

      {/* Widget */}
      <div className={`ai-floating-widget ${isOpen ? "open" : ""} ${isMaximized ? "maximized" : ""}`}>

        {/* Header */}
        <div className="ai-chat-header widget-header">
          <div className="ai-chat-avatar">
            <Sparkles size={15} color="var(--brand)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--text)", display: "flex", alignItems: "center", gap: 7 }}>
              MediSense AI
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand)", display: "inline-block", animation: "pulse-dot 2s infinite" }} />
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {activeDiseaseContext ? `Context: ${activeDiseaseContext}` : "General Health Assistant"}
            </div>
          </div>
          <div className="widget-controls">
            <button onClick={() => {
              setMessages([{ role: "ai", content: getGreeting(isLoggedIn, activeDiseaseContext) }]);
              setStreamingContent("");
              setShowQuickReplies(true);
            }} title="Clear chat">
              <RefreshCw size={14} />
            </button>
            <button onClick={() => setIsMaximized(!isMaximized)} title={isMaximized ? "Minimize" : "Expand"}>
              {isMaximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
            <button onClick={() => setIsOpen(false)} title="Close">
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="widget-messages ai-chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message-row ${msg.role === "user" ? "user" : "ai"}`}>
              <div className={`message-icon ${msg.role}`}>
                {msg.role === "ai"
                  ? <Bot size={12} color="var(--brand)" />
                  : <User size={12} color="var(--text-3)" />}
              </div>
              <div className={`message-bubble ${msg.role}`} style={{ maxWidth: isMaximized ? "85%" : "80%", overflowX: "hidden" }}>
                {msg.role === "ai"
                  ? <MessageContent content={msg.content} />
                  : <span style={{ fontSize: 13.5, lineHeight: 1.6 }}>{msg.content}</span>}
              </div>
            </div>
          ))}

          {/* Streaming message */}
          {isStreaming && (
            <div className="message-row ai">
              <div className="message-icon ai"><Bot size={12} color="var(--brand)" /></div>
              <div className="message-bubble ai" style={{ maxWidth: isMaximized ? "85%" : "80%", overflowX: "hidden" }}>
                {streamingPhase === "thinking" && !streamingContent ? (
                  <TypingIndicator text="MediSense AI is thinking..." />
                ) : streamingContent ? (
                  <>
                    <MessageContent content={streamingContent} />
                    <span style={{ display: "inline-block", width: 2, height: 14, background: "var(--brand)", borderRadius: 1, marginLeft: 2, verticalAlign: "middle", animation: "blink 1s infinite" }} />
                  </>
                ) : (
                  <TypingIndicator />
                )}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Quick-reply chips ── */}
        {showQuickReplies && messages.length === 1 && !isStreaming && (
          <div style={{
            padding: "8px 12px 4px",
            borderTop: "1px solid var(--border)",
            display: "flex", flexWrap: "wrap", gap: 6,
          }}>
            {quickReplies.map(chip => (
              <button
                key={chip}
                onClick={() => send(chip)}
                style={{
                  fontSize: 11.5, fontWeight: 500,
                  padding: "5px 11px", borderRadius: 20,
                  border: "1px solid var(--border-strong)",
                  background: "var(--bg2)", color: "var(--text-2)",
                  cursor: "pointer", transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "var(--brand)";
                  e.currentTarget.style.color = "white";
                  e.currentTarget.style.borderColor = "var(--brand)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "var(--bg2)";
                  e.currentTarget.style.color = "var(--text-2)";
                  e.currentTarget.style.borderColor = "var(--border-strong)";
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Input row */}
        <div className="widget-input ai-chat-input-row">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && !isStreaming && send()}
            placeholder={isStreaming ? "MediSense AI is responding..." : "Ask anything — tables, diet plans, explanations..."}
            className="input-field ai-input"
            disabled={isStreaming}
            maxLength={2000}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || isStreaming}
            className="send-btn"
            title="Send"
          >
            {isStreaming
              ? <span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
              : <Send size={13} />}
          </button>
        </div>
      </div>
    </>
  );
}
