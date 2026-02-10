"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UserPlus, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import axios from "axios";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (password !== confirmPassword) {
      setError("Passwords match nahi ho rahe, bro! ❌");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/auth/register", { name, email, password });
      router.push("/login?success=true"); // Register hote hi login par bhej denge
    } catch (err: any) {
      setError(err.response?.data?.error || "Kuch gadbad ho gayi!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0b0f] text-white font-sans selection:bg-blue-500/30">
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-6">
        
        {/* 🌌 Same Colorful Background */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_500px_at_20%_10%,rgba(0,168,255,0.20),transparent_60%),radial-gradient(900px_600px_at_85%_20%,rgba(255,52,101,0.20),transparent_55%),radial-gradient(700px_700px_at_40%_90%,rgba(140,255,120,0.16),transparent_60%)]" />
        <div className="pointer-events-none absolute -top-20 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[conic-gradient(from_90deg_at_50%_50%,rgba(70,130,255,0.35),rgba(255,70,120,0.35),rgba(120,255,200,0.30),rgba(70,130,255,0.35))] opacity-40 animate-pulse blur-3xl" />

        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-[500px] rounded-[2.5rem] border border-white/10 bg-white/5 p-10 shadow-2xl backdrop-blur-xl"
        >
          <div className="mb-8 flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 border border-white/10">
              <UserPlus className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/60 font-bold">Msgly Join</p>
              <h1 className="text-3xl font-semibold tracking-tight">Create Account</h1>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleRegister}>
            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80 ml-1">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-3.5 text-sm text-white focus:border-white/30 outline-none transition-all"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80 ml-1">Email</label>
                <input
                  type="email"
                  placeholder="you@domain.com"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-3.5 text-sm text-white focus:border-white/30 outline-none transition-all"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80 ml-1">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    required
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-3.5 text-sm text-white focus:border-white/30 outline-none transition-all"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80 ml-1">Confirm</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    required
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-3.5 text-sm text-white focus:border-white/30 outline-none transition-all"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs text-rose-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group w-full flex items-center justify-center gap-2 rounded-2xl bg-white/90 py-4 text-sm font-bold text-black transition hover:bg-white active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Register <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
            <p className="text-white/60 text-sm">
              Pehle se account hai?{" "}
              <Link href="/login" className="font-bold text-white hover:underline ml-1">Sign In</Link>
            </p>
          </div>
        </motion.section>
      </div>
    </main>
  );
}