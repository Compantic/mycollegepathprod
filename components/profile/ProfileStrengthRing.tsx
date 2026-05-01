"use client";

import { motion } from "framer-motion";

export function ProfileStrengthRing({ percentage }: { percentage: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center size-28 sm:size-32">
      {/* Outer Pulse */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0 rounded-full border border-blue-400/20 blur-sm"
      />

      <svg className="size-full -rotate-90 transform" viewBox="0 0 100 100">
        {/* Background Track */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth="4"
          className="text-white/5"
        />
        
        {/* Progress Circle */}
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke="url(#v3Hologram)"
          strokeWidth="6"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 2, ease: "circOut" }}
          strokeLinecap="round"
          className="drop-shadow-[0_0_12px_rgba(43,95,217,0.8)]"
        />

        <defs>
          <linearGradient id="v3Hologram" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center Percentage */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-xl sm:text-2xl font-black text-white"
        >
          {percentage}%
        </motion.span>
        <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Ready</span>
      </div>
    </div>
  );
}
