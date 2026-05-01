"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
import { markFirstTenStepDone } from "@/lib/activation/firstTen";

const CONSULTANT_NAME = "Admissions Consultant";
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

function useItemVariants(reduceMotion: boolean | null) {
  return {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 12 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: reduceMotion ? 0 : i * 0.04, type: "spring" as const, stiffness: 320, damping: 28 },
    }),
  };
}

const SUGGESTIONS = [
  "What should I focus on for my top school?",
  "How can I improve my college list?",
  "Explain early decision vs early action",
  "What are good reach and safety schools for my profile?",
];

const SUGGESTION_CHIP_STYLES = [
  "border-emerald-200 bg-emerald-50/50 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md hover:shadow-emerald-900/5",
  "border-blue-200 bg-blue-50/50 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md hover:shadow-blue-900/5",
  "border-violet-200 bg-violet-50/50 hover:border-violet-300 hover:bg-violet-50 hover:shadow-md hover:shadow-violet-900/5",
  "border-amber-200 bg-amber-50/50 hover:border-amber-300 hover:bg-amber-50 hover:shadow-md hover:shadow-amber-900/5",
];

export function ChatLayout() {
  const reduceMotion = useReducedMotion();
  const itemVariants = useItemVariants(reduceMotion);
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
  const [typingVisibleLength, setTypingVisibleLength] = useState(1000000);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const TEXTAREA_MAX_PX = 200;

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
                toast({ description: "Could not save chat right now. Your message stays in this device session.", variant: "error" });
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
                  toast({ description: "Chat history loaded from local backup.", variant: "info" });
                  return;
                }
              }
            } catch {}
          }
          toast({ description: "Could not load cloud chat history. Starting a local chat session.", variant: "error" });
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
    setTypingVisibleLength(1000000);
  }, [activeId]);

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

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(el.scrollHeight, TEXTAREA_MAX_PX);
    el.style.height = `${next}px`;
  }, [input]);

  async function handleSubmit(e: React.FormEvent, suggestedText?: string) {
    e.preventDefault();
    const text = (suggestedText ?? input).trim();
    if (!text || loading || !activeId || !userId) return;
    setInput("");
    const userMsg: Message = { role: "user", content: text };
    markFirstTenStepDone(userId, "chat");
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
      setTypingVisibleLength(0);
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
      const fallbackContent = "Sorry, I couldn't respond right now. Please try again.";
      setTypingVisibleLength(0);
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
        toast({ description: "Could not create cloud chat right now. Starting locally.", variant: "error" });
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
      initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
      className="flex min-h-[480px] flex-col overflow-y-auto rounded-3xl border border-slate-200/90 bg-white/95 shadow-onboarding-card backdrop-blur-sm md:h-[calc(100vh-12rem)] md:flex-row md:overflow-hidden"
    >
      <div className="h-1 shrink-0 bg-gradient-to-r from-[#0f1b2d] via-primary-600 to-amber-400 md:hidden" aria-hidden />
      {/* Left: conversations */}
      <nav
        className="flex w-full shrink-0 flex-col border-b border-slate-200/80 bg-gradient-to-b from-slate-50/95 to-white md:w-60 md:border-b-0 md:border-r"
        aria-label="Conversations"
      >
        <div className="hidden h-1 shrink-0 bg-gradient-to-r from-primary-600 to-amber-400 md:block" aria-hidden />
        <div className="border-b border-slate-200/80 p-3">
          <motion.button
            type="button"
            onClick={addConversation}
            disabled={sessionsLoading || !userId}
            whileHover={reduceMotion || sessionsLoading || !userId ? undefined : { scale: 1.02 }}
            whileTap={reduceMotion || sessionsLoading || !userId ? undefined : { scale: 0.98 }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 py-3 text-sm font-bold text-white shadow-lg shadow-primary-600/25 transition-shadow hover:shadow-xl disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            New chat
          </motion.button>
        </div>
        <ul className="flex-1 space-y-1 overflow-y-auto p-2">
          {sessionsLoading ? (
            [1, 2, 3].map((i) => (
              <li key={i} className="rounded-xl px-2 py-1.5">
                <div className="h-9 animate-pulse rounded-xl bg-slate-200/60" />
              </li>
            ))
          ) : (
          conversationList.map(({ id, title }) => (
            <li key={id}>
              <div
                className={`flex items-center gap-0.5 rounded-xl px-1.5 py-1 text-sm transition-all ${
                  activeId === id
                    ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md ring-2 ring-amber-300/40"
                    : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveId(id)}
                  className="min-w-0 flex-1 truncate px-2 py-2 text-left font-semibold"
                >
                  {title || DEFAULT_TITLE}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    renameConversation(id);
                  }}
                  className={`rounded-lg p-1.5 transition-colors ${activeId === id ? "hover:bg-white/15" : "hover:bg-slate-100"}`}
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
                  className={`rounded-lg p-1.5 transition-colors ${activeId === id ? "hover:bg-white/15" : "hover:bg-slate-100"}`}
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
      <div className="relative flex min-w-0 flex-1 flex-col bg-gradient-to-b from-white via-slate-50/40 to-primary-50/20">
        <div className="pointer-events-none absolute inset-0 bg-pattern opacity-[0.35]" aria-hidden />
        <div className="relative z-10 flex-1 overflow-y-auto p-6">
          {sessionsLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-sm text-slate-500">
              Loading your conversations…
            </div>
          ) : messages.length === 0 && activeId ? (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: reduceMotion ? 0 : 0.06,
                    delayChildren: reduceMotion ? 0 : 0.1,
                  },
                },
              }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <motion.div
                variants={itemVariants}
                custom={0}
                className="relative flex h-28 w-28 items-center justify-center rounded-3xl border border-blue-200/80 bg-gradient-to-br from-violet-50 via-blue-50 to-amber-50 text-primary-600 shadow-lg shadow-primary-600/10"
              >
                {reduceMotion ? (
                  <div className="absolute inset-2 rounded-2xl bg-white/50 blur-sm" aria-hidden />
                ) : (
                  <motion.div
                    aria-hidden
                    className="absolute inset-2 rounded-2xl bg-white/40 blur-sm"
                    animate={{ opacity: [0.5, 0.85, 0.5] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                <Sparkles className="relative h-14 w-14" strokeWidth={1.5} />
              </motion.div>
              <motion.p variants={itemVariants} custom={1} className="mt-8 max-w-md text-lg font-semibold text-slate-900">
                Hi! I&apos;m your {CONSULTANT_NAME}. Ask about colleges, applications, or your list.
              </motion.p>
              <motion.p variants={itemVariants} custom={2} className="mt-2 text-sm text-slate-600">
                Try one of these or type your own question:
              </motion.p>
              <div className="mt-6 flex max-w-2xl flex-wrap justify-center gap-2.5">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={i}
                    variants={itemVariants}
                    custom={i + 3}
                    type="button"
                    onClick={() => sendSuggestion(s)}
                    whileHover={reduceMotion ? undefined : { scale: 1.02, y: -2 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold text-slate-800 shadow-sm transition-colors ${SUGGESTION_CHIP_STYLES[i % SUGGESTION_CHIP_STYLES.length]}`}
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
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex max-w-[85%] items-start gap-3 rounded-2xl px-4 py-3.5 ${
                        m.role === "user"
                          ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-600/30"
                          : "border border-blue-100 bg-white/95 text-slate-800 shadow-md backdrop-blur-sm"
                      }`}
                    >
                      {m.role === "assistant" && (
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-primary-600 ring-1 ring-blue-100">
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
                initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-5 flex justify-start"
              >
                <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white/95 px-4 py-3.5 shadow-md backdrop-blur-sm">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-primary-600 ring-1 ring-blue-100">
                    <Sparkles className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-600">{CONSULTANT_NAME} is typing</span>
                    <div className="flex gap-1">
                      <motion.span
                        animate={reduceMotion ? { opacity: 1 } : { opacity: [0.35, 1, 0.35] }}
                        transition={reduceMotion ? undefined : { duration: 0.8, repeat: Infinity, delay: 0 }}
                        className="h-2 w-2 rounded-full bg-primary-500"
                      />
                      <motion.span
                        animate={reduceMotion ? { opacity: 1 } : { opacity: [0.35, 1, 0.35] }}
                        transition={reduceMotion ? undefined : { duration: 0.8, repeat: Infinity, delay: 0.2 }}
                        className="h-2 w-2 rounded-full bg-primary-500"
                      />
                      <motion.span
                        animate={reduceMotion ? { opacity: 1 } : { opacity: [0.35, 1, 0.35] }}
                        transition={reduceMotion ? undefined : { duration: 0.8, repeat: Infinity, delay: 0.4 }}
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
          className="relative z-10 border-t border-slate-200/80 bg-white/90 p-4 backdrop-blur-md"
        >
          <div className="flex items-end gap-2 rounded-2xl border-2 border-slate-200/90 bg-white px-3 py-2 shadow-sm transition-all focus-within:border-primary-400 focus-within:shadow-md focus-within:ring-2 focus-within:ring-primary-500/15">
            <textarea
              ref={textareaRef}
              id="chat-input"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!loading && input.trim() && activeId) {
                    e.currentTarget.form?.requestSubmit();
                  }
                }
              }}
              placeholder={activeId ? "Type your message…" : "Loading…"}
              className="min-h-[44px] min-w-0 flex-1 resize-none overflow-y-auto bg-transparent py-2.5 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:outline-none"
              style={{ maxHeight: TEXTAREA_MAX_PX }}
              disabled={loading || !activeId}
              aria-label="Message"
            />
            <motion.button
              type="submit"
              disabled={loading || !input.trim() || !activeId}
              whileHover={reduceMotion || loading || !input.trim() ? undefined : { scale: 1.06 }}
              whileTap={reduceMotion || loading || !input.trim() ? undefined : { scale: 0.94 }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-600/25 transition-shadow hover:shadow-xl disabled:opacity-50 disabled:shadow-none"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </motion.button>
          </div>
          <p className="mt-2 text-center text-xs text-slate-500">
            Verify deadlines and requirements on official college sites.
          </p>
        </form>
      </div>

      <ChatSidebar data={sidebarData} />
    </motion.div>
  );
}
