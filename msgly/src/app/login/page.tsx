"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      alert("Access Denied, Bro! ❌");
      setLoading(false);
    } else {
      router.push("/chat");
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0b0f] text-white font-sans selection:bg-blue-500/30">
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-6">
        
        {/* 🌌 Wahi Colorful Background jo tune bheja tha */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_500px_at_20%_10%,rgba(0,168,255,0.20),transparent_60%),radial-gradient(900px_600px_at_85%_20%,rgba(255,52,101,0.20),transparent_55%),radial-gradient(700px_700px_at_40%_90%,rgba(140,255,120,0.16),transparent_60%)]" />
        
        {/* Animated Glow Circle Top Par */}
        <div className="pointer-events-none absolute -top-20 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[conic-gradient(from_90deg_at_50%_50%,rgba(70,130,255,0.35),rgba(255,70,120,0.35),rgba(120,255,200,0.30),rgba(70,130,255,0.35))] opacity-40 animate-pulse blur-3xl" />

        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-[480px] rounded-[2.5rem] border border-white/10 bg-white/5 p-10 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl"
        >
          {/* Msgly Branding */}
          <div className="mb-10 flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 border border-white/10 shadow-inner">
              <AlertTriangle className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/60 font-bold">
                Msgly Access
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-white">
                Login to account
              </h1>
            </div>
          </div>

          <p className="mb-8 text-sm text-white/60 leading-relaxed font-normal">
            Enter your email and password to continue. Keep your credentials secure bro. 🦾
          </p>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 ml-1">Email</label>
              <input
                type="email"
                placeholder="you@domain.com"
                required
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white placeholder:text-white/20 focus:border-white/30 focus:outline-none transition-all shadow-inner"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-medium text-white/80">Password</label>
                <span className="text-[11px] text-white/40 hover:text-white cursor-pointer transition-colors">Forgot password?</span>
              </div>
              <input
                type="password"
                placeholder="Enter your password"
                required
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white placeholder:text-white/20 focus:border-white/30 focus:outline-none transition-all shadow-inner"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 px-1">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-white/20 bg-black/60 accent-white"
              />
              <span className="text-xs text-white/60 font-medium">Remember me</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full flex items-center justify-center gap-2 rounded-2xl bg-white/90 py-4 text-sm font-bold text-black transition hover:bg-white active:scale-[0.98] disabled:opacity-70 shadow-xl"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Login
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Link Box like original AuthShell */}
          <div className="mt-10 rounded-2xl border border-white/10 bg-black/30 p-5 text-center">
            <p className="text-white/60 text-sm">
              New here?{" "}
              <Link href="/register" className="font-bold text-white hover:underline ml-1">
                Create an account
              </Link>
            </p>
          </div>
        </motion.section>
      </div>
    </main>
  );
}