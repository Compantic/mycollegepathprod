"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatSidebar, type ChatContextData } from "./ChatSidebar";
import { Plus, Send, Sparkles, User, Pencil, Trash2 } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";
import {
  listChatSessions,
  createChatSession,
  updateChatSession,
  deleteChatSession,
} from "@/lib/firebase/firestore";
import { useToastOptional } from "@/components/ui/toast";

const CONSULTANT_NAME = "AI Consultant";
const LOCAL_BACKUP_KEY = (uid: string) => `chatLocalBackup_${uid}`;

function isLocalId(id: string): boolean {
  return id === "local" || id.startsWith("local-");
}

/** Renders simple markdown: **bold**, newlines, numbered lists. Safe for our own API content. */
function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br />");
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

const DEFAULT_TITLE = "New chat";

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.25 },
  }),
};

const SUGGESTIONS = [
  "What should I focus on for my top school?",
  "How can I improve my college list?",
  "Explain early decision vs early action",
  "What are good reach and safety schools for my profile?",
];

export function ChatLayout() {
  const { toast } = useToastOptional();
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [conversations, setConversations] = useState<
    Record<string, { title: string; messages: Message[] }>
  >({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarData, setSidebarData] = useState<ChatContextData | null>(null);
  const [typingVisibleLength, setTypingVisibleLength] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = (activeId ? conversations[activeId]?.messages : []) ?? [];
  const lastMessage = messages[messages.length - 1];
  const isLastAssistant = lastMessage?.role === "assistant";
  const fullLastLength = lastMessage?.content?.length ?? 0;

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setUserId(user?.uid ?? null);
      if (!user) {
        setConversations({});
        setActiveId(null);
        setSessionsLoading(false);
        return;
      }
      setSessionsLoading(true);
      listChatSessions(user.uid)
        .then((sessions) => {
          if (typeof window !== "undefined") try { localStorage.removeItem(LOCAL_BACKUP_KEY(user.uid)); } catch {}
          if (sessions.length === 0) {
            createChatSession(user.uid, DEFAULT_TITLE, [])
              .then((newId) => {
                setConversations({ [newId]: { title: DEFAULT_TITLE, messages: [] } });
                setActiveId(newId);
              })
              .catch(() => {
                toast({ description: "Sohbet Firestore'a kaydedilemiyor. Kalıcı kayıt için: firebase deploy --only firestore:rules", variant: "error" });
                setConversations({ local: { title: DEFAULT_TITLE, messages: [] } });
                setActiveId("local");
              })
              .finally(() => setSessionsLoading(false));
          } else {
            const map: Record<string, { title: string; messages: Message[] }> = {};
            sessions.forEach((s) => {
              map[s.id] = { title: s.title, messages: s.messages };
            });
            setConversations(map);
            setActiveId(sessions[0].id);
            setSessionsLoading(false);
          }
        })
        .catch(() => {
          if (typeof window !== "undefined") {
            try {
              const raw = localStorage.getItem(LOCAL_BACKUP_KEY(user.uid));
              if (raw) {
                const parsed = JSON.parse(raw) as Record<string, { title: string; messages: Message[] }>;
                if (Object.keys(parsed).length > 0) {
                  setConversations(parsed);
                  setActiveId(Object.keys(parsed)[0]);
                  setSessionsLoading(false);
                  toast({ description: "Sohbet geçmişi cihaz yedeğinden yüklendi. Kalıcı kayıt için Firestore kurallarını deploy edin.", variant: "info" });
                  return;
                }
              }
            } catch {}
          }
          toast({ description: "Chat geçmişi yüklenemedi. Kalıcı kayıt için: firebase deploy --only firestore:rules", variant: "error" });
          setConversations({ local: { title: DEFAULT_TITLE, messages: [] } });
          setActiveId("local");
          setSessionsLoading(false);
        });
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    const localEntries = Object.entries(conversations).filter(([id]) => isLocalId(id));
    if (localEntries.length === 0) return;
    try {
      const backup: Record<string, { title: string; messages: Message[] }> = {};
      localEntries.forEach(([id, c]) => { backup[id] = c; });
      localStorage.setItem(LOCAL_BACKUP_KEY(userId), JSON.stringify(backup));
    } catch {}
  }, [userId, conversations]);

  useEffect(() => {
    setTypingVisibleLength(0);
  }, [messages.length]);

  useEffect(() => {
    if (!isLastAssistant || typingVisibleLength >= fullLastLength) return;
    const step = Math.max(1, Math.floor(fullLastLength / 80));
    const interval = setInterval(() => {
      setTypingVisibleLength((prev) => Math.min(prev + step, fullLastLength));
    }, 28);
    return () => clearInterval(interval);
  }, [isLastAssistant, fullLastLength, typingVisibleLength]);

  useEffect(() => {
    fetch("/api/chat/context", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setSidebarData(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations[activeId ?? ""]?.messages]);

  async function handleSubmit(e: React.FormEvent, suggestedText?: string) {
    e.preventDefault();
    const text = (suggestedText ?? input).trim();
    if (!text || loading || !activeId || !userId) return;
    setInput("");
    const userMsg: Message = { role: "user", content: text };
    const newMessagesAfterUser = [...messages, userMsg];
    let sessionId = activeId;

    const isLocalSession = activeId === "local" || String(activeId).startsWith("local-");
    if (isLocalSession) {
      try {
        sessionId = await createChatSession(userId, DEFAULT_TITLE, []);
        setConversations((prev) => {
          const next = { ...prev };
          delete next[activeId];
          next[sessionId] = { title: DEFAULT_TITLE, messages: newMessagesAfterUser };
          return next;
        });
        setActiveId(sessionId);
      } catch {
        setConversations((prev) => ({
          ...prev,
          [activeId]: { ...prev[activeId], title: DEFAULT_TITLE, messages: newMessagesAfterUser },
        }));
        sessionId = activeId;
      }
    }
    if (!isLocalSession) {
      setConversations((prev) => ({
        ...prev,
        [activeId]: {
          ...prev[activeId],
          title: prev[activeId]?.title ?? DEFAULT_TITLE,
          messages: newMessagesAfterUser,
        },
      }));
      updateChatSession(userId, activeId, { messages: newMessagesAfterUser }).catch(() => {});
    }

    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessagesAfterUser.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      let data: { content?: string; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        data = { error: "Invalid response from server." };
      }
      const errorMsg = typeof data?.error === "string" ? data.error : "";
      const content = res.ok
        ? (typeof data?.content === "string" ? data.content : "") || "I couldn't generate a response. Please try again."
        : errorMsg || "Sorry, I couldn't respond. Please try again.";
      const fullMessages = [...newMessagesAfterUser, { role: "assistant" as const, content }];
      const currentSessionId = sessionId;
      setConversations((prev) => ({
        ...prev,
        [currentSessionId]: {
          title: prev[currentSessionId]?.title ?? DEFAULT_TITLE,
          messages: fullMessages,
        },
      }));
      const isLocal = currentSessionId === "local" || String(currentSessionId).startsWith("local-");
      if (!isLocal) updateChatSession(userId, currentSessionId, { messages: fullMessages }).catch(() => {});
    } catch (err) {
      const fallbackContent = err instanceof Error ? err.message : "Sorry, I couldn't respond. Please try again.";
      const fallback = [...newMessagesAfterUser, { role: "assistant" as const, content: fallbackContent }];
      const currentSessionId = sessionId;
      setConversations((prev) => ({
        ...prev,
        [currentSessionId]: {
          title: prev[currentSessionId]?.title ?? DEFAULT_TITLE,
          messages: fallback,
        },
      }));
      const isLocal = currentSessionId === "local" || String(currentSessionId).startsWith("local-");
      if (!isLocal) updateChatSession(userId, currentSessionId, { messages: fallback }).catch(() => {});
    } finally {
      setLoading(false);
    }
  }

  function sendSuggestion(text: string) {
    if (loading) return;
    const form = document.querySelector("form[data-chat-form]") as HTMLFormElement;
    if (form) {
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
      handleSubmit(fakeEvent, text);
    }
  }

  function addConversation() {
    if (!userId) return;
    createChatSession(userId, DEFAULT_TITLE, [])
      .then((newId) => {
        setConversations((prev) => ({ ...prev, [newId]: { title: DEFAULT_TITLE, messages: [] } }));
        setActiveId(newId);
      })
      .catch(() => {
        toast({ description: "Yeni sohbet kaydedilemiyor. firebase deploy --only firestore:rules çalıştırın.", variant: "error" });
        const localId = `local-${Date.now()}`;
        setConversations((prev) => ({ ...prev, [localId]: { title: DEFAULT_TITLE, messages: [] } }));
        setActiveId(localId);
      });
  }

  function renameConversation(id: string) {
    const current = conversations[id];
    if (!current || !userId) return;
    const suggested =
      current.title && current.title !== DEFAULT_TITLE
        ? current.title
        : current.messages[0]?.content?.slice(0, 36) ?? DEFAULT_TITLE;
    const next = window.prompt("New chat name", suggested);
    if (next == null) return;
    const trimmed = next.trim();
    const newTitle = trimmed || DEFAULT_TITLE;
    setConversations((prev) => ({
      ...prev,
      [id]: { ...prev[id], title: newTitle },
    }));
    updateChatSession(userId, id, { title: newTitle }).catch(() => {});
  }

  function deleteConversation(id: string) {
    if (!userId) return;
    const isLocal = id === "local" || id.startsWith("local-");
    if (!isLocal) deleteChatSession(userId, id).catch(() => {});
    setConversations((prev) => {
      const copy = { ...prev };
      delete copy[id];
      const remainingIds = Object.keys(copy);
      if (remainingIds.length === 0) {
        createChatSession(userId, DEFAULT_TITLE, [])
          .then((newId) => {
            setConversations({ [newId]: { title: DEFAULT_TITLE, messages: [] } });
            setActiveId(newId);
          })
          .catch(() => {
            setConversations({ local: { title: DEFAULT_TITLE, messages: [] } });
            setActiveId("local");
          });
        return {};
      }
      if (activeId === id) setActiveId(remainingIds[0]);
      return copy;
    });
  }

  const conversationList = Object.entries(conversations).map(([id, c]) => {
    const fallbackTitle =
      c.messages.length && c.messages[0].content
        ? c.messages[0].content.slice(0, 36) + (c.messages[0].content.length > 36 ? "…" : "")
        : DEFAULT_TITLE;
    return {
      id,
      title: c.title && c.title !== DEFAULT_TITLE ? c.title : fallbackTitle,
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col md:flex-row md:h-[calc(100vh-12rem)] min-h-[480px] overflow-y-auto md:overflow-hidden rounded-2xl border border-white/60 bg-white shadow-[0_8px_32px_rgba(15,23,42,0.08)]"
    >
      {/* Left: conversations */}
      <nav
        className="flex w-full md:w-56 shrink-0 flex-col border-b md:border-b-0 md:border-r border-slate-200/80 bg-gradient-to-b from-slate-50 to-white"
        aria-label="Conversations"
      >
        <div className="border-b border-slate-200/80 p-3">
          <motion.button
            type="button"
            onClick={addConversation}
            disabled={sessionsLoading || !userId}
            whileHover={!(sessionsLoading || !userId) ? { scale: 1.02 } : {}}
            whileTap={!(sessionsLoading || !userId) ? { scale: 0.98 } : {}}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-primary-500 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-500/20 transition-shadow hover:shadow-lg disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            New chat
          </motion.button>
        </div>
        <ul className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {sessionsLoading ? (
            [1, 2, 3].map((i) => (
              <li key={i} className="rounded-xl px-2 py-1.5">
                <div className="h-8 rounded-lg bg-slate-200/60 animate-pulse" />
              </li>
            ))
          ) : (
          conversationList.map(({ id, title }) => (
            <li key={id}>
              <div
                className={`flex items-center gap-1 rounded-xl px-2 py-1.5 text-sm transition-all ${
                  activeId === id
                    ? "bg-primary-500 text-white shadow-sm"
                    : "text-text-secondary hover:bg-slate-100 hover:text-text-primary"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveId(id)}
                  className="flex-1 text-left px-1 py-1 font-medium truncate"
                >
                  {title || DEFAULT_TITLE}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    renameConversation(id);
                  }}
                  className="p-1 rounded hover:bg-white/20"
                  aria-label="Rename chat"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(id);
                  }}
                  className="p-1 rounded hover:bg-white/20"
                  aria-label="Delete chat"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          )))}
        </ul>
      </nav>

      {/* Center: chat */}
      <div className="flex min-w-0 flex-1 flex-col bg-gradient-to-b from-white to-slate-50/30">
        <div className="flex-1 overflow-y-auto p-6">
          {sessionsLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-sm text-text-muted">
              Loading your conversations…
            </div>
          ) : messages.length === 0 && activeId ? (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <motion.div
                variants={itemVariants}
                custom={0}
                className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 via-primary-50 to-blue-50 text-primary-600 shadow-inner"
              >
                <Sparkles className="h-12 w-12" strokeWidth={1.5} />
              </motion.div>
              <motion.p variants={itemVariants} custom={1} className="mt-8 max-w-sm text-base font-medium text-text-primary">
                Hi! I&apos;m your {CONSULTANT_NAME}. Ask about colleges, applications, or your list.
              </motion.p>
              <motion.p variants={itemVariants} custom={2} className="mt-2 text-sm text-text-muted">
                Try one of these or type your own question:
              </motion.p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={i}
                    variants={itemVariants}
                    custom={i + 2}
                    type="button"
                    onClick={() => sendSuggestion(s)}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-text-primary shadow-sm transition-colors hover:border-primary-300 hover:bg-primary-50/50 hover:shadow"
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : null}
          <div className="space-y-5">
            <AnimatePresence initial={false}>
              {messages.map((m, i) => {
                const isLast = i === messages.length - 1;
                const isTypingThis = isLast && m.role === "assistant" && typingVisibleLength < m.content.length;
                const displayContent =
                  m.role === "assistant" && isLast
                    ? m.content.slice(0, typingVisibleLength)
                    : m.content;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex max-w-[85%] items-start gap-3 rounded-2xl px-4 py-3.5 ${
                        m.role === "user"
                          ? "bg-gradient-to-r from-primary-500 to-indigo-500 text-white shadow-lg shadow-primary-500/25"
                          : "bg-slate-100/90 text-slate-800 shadow-sm backdrop-blur"
                      }`}
                    >
                      {m.role === "assistant" && (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 mt-0.5">
                          <Sparkles className="h-4 w-4" strokeWidth={1.5} />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        {m.role === "assistant" ? (
                          <div
                            className="chat-message-content text-sm leading-relaxed text-slate-800 [&_strong]:font-semibold [&_strong]:text-slate-900"
                            dangerouslySetInnerHTML={{
                              __html: renderMarkdown(displayContent) + (isTypingThis ? '<span class="typing-cursor">|</span>' : ""),
                            }}
                          />
                        ) : (
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                        )}
                      </div>
                      {m.role === "user" && (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 mt-0.5">
                          <User className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex justify-start mt-5"
              >
                <div className="flex items-center gap-3 rounded-2xl bg-slate-100/90 px-4 py-3.5 shadow-sm backdrop-blur">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                    <Sparkles className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-600">{CONSULTANT_NAME} is typing</span>
                    <div className="flex gap-1">
                      <motion.span
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                        className="h-2 w-2 rounded-full bg-primary-500"
                      />
                      <motion.span
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                        className="h-2 w-2 rounded-full bg-primary-500"
                      />
                      <motion.span
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                        className="h-2 w-2 rounded-full bg-primary-500"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        <form
          data-chat-form
          onSubmit={handleSubmit}
          className="border-t border-slate-200/80 bg-white/80 p-4 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-3 py-2 shadow-sm transition-all focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-500/20">
            <input
              id="chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={activeId ? "Type your message..." : "Loading…"}
              className="min-w-0 flex-1 bg-transparent py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
              disabled={loading || !activeId}
              aria-label="Message"
            />
            <motion.button
              type="submit"
              disabled={loading || !input.trim() || !activeId}
              whileHover={!(loading || !input.trim()) ? { scale: 1.05 } : {}}
              whileTap={!(loading || !input.trim()) ? { scale: 0.95 } : {}}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white transition-colors hover:bg-primary-600 disabled:opacity-50 disabled:hover:bg-primary-500"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </motion.button>
          </div>
          <p className="mt-2 text-center text-xs text-text-muted">
            Verify deadlines and requirements on official college sites.
          </p>
        </form>
      </div>

      <ChatSidebar data={sidebarData} />
    </motion.div>
  );
}
