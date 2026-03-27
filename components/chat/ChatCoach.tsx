"use client";

import { useState, useRef, useEffect } from "react";
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatCoach() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const nextMessages = [...messages, { role: "user" as const, content: text }];
      const res = await fetchWithAuth("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMessages((prev) => [...prev, { role: "assistant", content: data.content ?? "" }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't respond. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-card border border-bg-border bg-bg-card shadow-soft flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto min-h-[320px] max-h-[60vh] p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-[#94A3B8] text-sm">
            Ask your Admissions Coach anything about colleges, applications, or your list. Try: &quot;What should I look for in a college?&quot; or &quot;Run matching for me.&quot;
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-button px-4 py-2 ${
                m.role === "user"
                  ? "bg-primary-500 text-white"
                  : "bg-secondary-100 text-[#0F172A]"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-button bg-secondary-100 px-4 py-2 text-[#94A3B8] text-sm">
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSubmit} className="border-t border-bg-border p-4">
        <label htmlFor="chat-input" className="sr-only">
          Message Admissions Coach
        </label>
        <div className="flex gap-2">
          <input
            id="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 rounded-button border border-bg-border bg-bg-main px-4 py-2.5 text-[#0F172A] placeholder:text-[#94A3B8] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-button bg-primary-500 px-4 py-2.5 font-medium text-white hover:bg-primary-600 disabled:opacity-60"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
