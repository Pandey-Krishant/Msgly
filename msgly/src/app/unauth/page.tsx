"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, ArrowRight, ShieldAlert } from "lucide-react";

const emojiCloud = [
  { emoji: "🔒", top: "10%", left: "8%", size: "text-3xl", opacity: "opacity-35" },
  { emoji: "🧊", top: "18%", left: "75%", size: "text-2xl", opacity: "opacity-30" },
  { emoji: "✨", top: "28%", left: "55%", size: "text-xl", opacity: "opacity-40" },
  { emoji: "🛰️", top: "36%", left: "15%", size: "text-2xl", opacity: "opacity-25" },
  { emoji: "🔐", top: "44%", left: "80%", size: "text-3xl", opacity: "opacity-35" },
  { emoji: "🌙", top: "52%", left: "30%", size: "text-2xl", opacity: "opacity-30" },
  { emoji: "⚡", top: "64%", left: "62%", size: "text-2xl", opacity: "opacity-35" },
  { emoji: "🌌", top: "72%", left: "12%", size: "text-3xl", opacity: "opacity-25" },
  { emoji: "🧿", top: "78%", left: "70%", size: "text-2xl", opacity: "opacity-30" },
  { emoji: "🚫", top: "86%", left: "45%", size: "text-2xl", opacity: "opacity-25" },
];

export default function UnauthPage() {
  return (
    <main className="min-h-screen bg-[#0b0b0f] text-white font-sans selection:bg-blue-500/30">
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_500px_at_20%_10%,rgba(0,168,255,0.18),transparent_60%),radial-gradient(900px_600px_at_85%_20%,rgba(255,52,101,0.18),transparent_55%),radial-gradient(700px_700px_at_40%_90%,rgba(140,255,120,0.14),transparent_60%)]" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-[conic-gradient(from_90deg_at_50%_50%,rgba(70,130,255,0.35),rgba(255,70,120,0.35),rgba(120,255,200,0.30),rgba(70,130,255,0.35))] opacity-40 animate-pulse blur-3xl" />

        <div className="pointer-events-none absolute inset-0">
          {emojiCloud.map((item, idx) => (
            <span
              key={`${item.emoji}-${idx}`}
              className={`absolute ${item.size} ${item.opacity} blur-[0.2px]`}
              style={{ top: item.top, left: item.left }}
            >
              {item.emoji}
            </span>
          ))}
        </div>

        <motion.section
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-full max-w-[620px] rounded-[2.75rem] border border-white/10 bg-white/5 p-10 md:p-14 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 border border-white/10">
              <ShieldAlert className="h-6 w-6 text-rose-300" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-white/60 font-bold">Access Guard</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                You’re not signed in.
              </h1>
            </div>
          </div>

          <p className="text-white/70 text-sm md:text-base leading-relaxed">
            This zone is locked. Please log in to continue or create a new account to get a private ID.
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/40 font-bold">
                <Lock className="h-3.5 w-3.5" />
                Locked
              </div>
              <p className="mt-2 text-sm font-semibold">Protected chats</p>
              <p className="text-xs text-white/50 mt-1">Sign in to unlock your feed.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/40 font-bold">
                <span>✨</span>
                New
              </div>
              <p className="mt-2 text-sm font-semibold">Fresh account</p>
              <p className="text-xs text-white/50 mt-1">Create one in seconds.</p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-2xl bg-white/90 px-6 py-3 text-sm font-bold text-black transition hover:bg-white active:scale-[0.98]"
            >
              Login
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 hover:bg-white/10 transition"
            >
              Create account
            </Link>
            <Link href="/" className="text-xs text-white/50 hover:text-white transition">
              Back to home
            </Link>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
