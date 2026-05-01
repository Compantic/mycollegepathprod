"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { ChatLayout } from "@/components/chat/ChatLayout";

export default function ChatPage() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className="space-y-6"
    >
      <div className="relative isolation-isolate overflow-hidden rounded-[2.5rem] border border-slate-800/60 p-8 shadow-2xl shadow-slate-950/20">
        {/* PREMIUM BACKGROUND EFFECTS */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0f1b2d] via-primary-700 to-[#162236]" aria-hidden />
        <div
          className="absolute inset-0 -z-10 opacity-40"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, rgba(252,211,77,0.12) 0%, transparent 45%),
              radial-gradient(circle at 80% 20%, rgba(43,95,217,0.25) 0%, transparent 40%)`,
          }}
          aria-hidden
        />
        <div 
          className="absolute inset-0 -z-10 opacity-[0.03]" 
          style={{ 
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
            maskImage: 'radial-gradient(ellipse at center, black, transparent)'
          }}
          aria-hidden 
        />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
          <motion.div
            initial={reduceMotion ? false : { scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: reduceMotion ? 0 : 0.08, type: "spring", stiffness: 280, damping: 22 }}
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[2rem] bg-white/10 text-white shadow-2xl backdrop-blur-xl ring-1 ring-white/20"
          >
            <Sparkles className="h-10 w-10 text-amber-400" strokeWidth={1.5} aria-hidden />
          </motion.div>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 backdrop-blur-md">
              <Sparkles className="size-3.5" aria-hidden />
              AI guidance
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">AI Consultant</h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-400">
              <span className="italic text-primary-400 font-medium">Personalized for you.</span> Ask about colleges, applications, or your list — answers use your profile and matches.
            </p>
          </div>
        </div>
      </div>
      <ChatLayout />
    </motion.div>
  );
}
