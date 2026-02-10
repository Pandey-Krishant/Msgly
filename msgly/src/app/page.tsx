"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0b0b0f] text-white font-sans selection:bg-blue-500/30">
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_500px_at_20%_10%,rgba(0,168,255,0.18),transparent_60%),radial-gradient(900px_600px_at_85%_20%,rgba(255,52,101,0.18),transparent_55%),radial-gradient(700px_700px_at_40%_90%,rgba(140,255,120,0.14),transparent_60%)]" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-[conic-gradient(from_90deg_at_50%_50%,rgba(70,130,255,0.35),rgba(255,70,120,0.35),rgba(120,255,200,0.30),rgba(70,130,255,0.35))] opacity-40 animate-pulse blur-3xl" />

        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative w-full max-w-[720px] rounded-[2.75rem] border border-white/10 bg-white/5 p-10 md:p-14 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 border border-white/10">
              <Sparkles className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-white/60 font-bold">Msgly Welcome</p>
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
                Private chats, bold energy.
              </h1>
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="text-white/70 text-sm md:text-base leading-relaxed"
          >
            Find friends by unique ID, send a request, and talk securely. Your identity stays clean with
            no numbers in nicknames.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-[11px] uppercase tracking-widest text-white/40 font-bold">Step 1</p>
              <p className="mt-1 text-sm font-semibold">Create account</p>
              <p className="text-xs text-white/50 mt-1">Register in seconds.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-[11px] uppercase tracking-widest text-white/40 font-bold">Step 2</p>
              <p className="mt-1 text-sm font-semibold">Login</p>
              <p className="text-xs text-white/50 mt-1">Get into your hub.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-[11px] uppercase tracking-widest text-white/40 font-bold">Step 3</p>
              <p className="mt-1 text-sm font-semibold">Chat home</p>
              <p className="text-xs text-white/50 mt-1">Send requests & talk.</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="mt-10 flex items-center gap-4"
          >
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-2xl bg-white/90 px-6 py-3 text-sm font-bold text-black transition hover:bg-white active:scale-[0.98]"
            >
              Next
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <span className="text-xs text-white/50">Start your journey</span>
          </motion.div>
        </motion.section>
      </div>
    </main>
  );
}
