"use client";

import { motion } from "framer-motion";

export function MeshGradient() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0A0F1E] pointer-events-none">
      {/* Base deep gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1A237E]/40 via-[#0A0F1E] to-[#0A0F1E]" />
      
      {/* Animated Blobs (Light Leaks) */}
      <motion.div
        animate={{
          x: [0, 150, -100, 0],
          y: [0, -100, 150, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute -top-[10%] -left-[10%] h-[100%] w-[80%] rounded-full bg-primary-500/20 blur-[150px]"
      />
      
      <motion.div
        animate={{
          x: [0, -120, 100, 0],
          y: [0, 150, -100, 0],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-[20%] -right-[15%] h-[90%] w-[70%] rounded-full bg-violet-500/20 blur-[120px]"
      />
      
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-0 left-[25%] h-[50%] w-[50%] rounded-full bg-blue-400/10 blur-[100px]"
      />

      {/* Noise Texture */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] contrast-150 brightness-110 mix-blend-overlay" />
      
      {/* Bottom Face - Gradient bridge to page background */}
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#F7F9FC] via-[#F7F9FC]/20 to-transparent" />
    </div>
  );
}
