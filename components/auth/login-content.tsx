"use client";

import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logo.png";
import { motion } from "framer-motion";
import { SignInButtons } from "@/components/auth/sign-in-buttons";
import { Shield, Zap, Clock, Calendar, AlertCircle, BarChart3 } from "lucide-react";

const ease = [0.4, 0, 0.2, 1] as const;

export function LoginContent() {
  return (
    <div className="min-h-screen flex">

      {/* ── LEFT — form panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-between px-10 py-10 bg-white">
        {/* Top: logo + back link */}
        <div>
          <Link href="/">
            <Image src={logo} alt="SyncOne" height={26} style={{ width: "auto" }} priority />
          </Link>
        </div>

        {/* Center: form */}
        <div className="w-full max-w-sm mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-1.5">Welcome back.</h1>
            <p className="text-sm text-gray-400 mb-8">
              Sign in to your SyncOne account to continue.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease }}
          >
            <SignInButtons />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-8 text-xs text-gray-400 text-center leading-relaxed"
          >
            By signing in you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2 hover:text-gray-600 transition-colors">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-gray-600 transition-colors">
              Privacy Policy
            </Link>
            .
          </motion.p>
        </div>

        {/* Bottom: security note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="flex items-center gap-2 text-xs text-gray-400"
        >
          <Shield className="w-3.5 h-3.5 flex-shrink-0" />
          OAuth tokens encrypted at rest with AES-256-GCM
        </motion.div>
      </div>

      {/* ── RIGHT — brand panel ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, ease }}
        className="hidden lg:flex w-[46%] bg-primary relative flex-col justify-between overflow-hidden px-12 py-10"
      >
        {/* Decorative rings */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full border border-white/10" />
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full border border-white/10" />
        <div className="absolute -bottom-40 -left-20 w-80 h-80 rounded-full border border-white/10" />
        <div className="absolute -bottom-24 -left-10 w-52 h-52 rounded-full border border-white/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/[0.04]" />

        {/* Top: tagline */}
        <div className="relative z-10">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">SyncOne</p>
          <h2 className="text-white text-2xl font-bold leading-snug max-w-xs">
            The smarter way to<br />manage your calendar.
          </h2>
        </div>

        {/* Center: mini app preview */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 my-6"
        >
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
            {/* Window bar */}
            <div className="bg-gray-50 border-b border-gray-100 px-4 py-2.5 flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </div>
            {/* App preview */}
            <div className="flex h-52">
              {/* Sidebar */}
              <div className="w-12 bg-gray-900 flex flex-col items-center py-3 gap-2.5">
                {[Calendar, BarChart3, AlertCircle, Shield].map((Icon, i) => (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${i === 0 ? "bg-white/10" : ""}`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${i === 0 ? "text-white" : "text-gray-600"}`} />
                  </div>
                ))}
              </div>
              {/* Content */}
              <div className="flex-1 p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[10px] font-bold text-gray-900">Today</p>
                    <p className="text-[8px] text-gray-400">6 events · 2 conflicts</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-[#4285F4] flex items-center justify-center text-[6px] font-bold text-white">G</div>
                    <div className="w-4 h-4 rounded-full bg-[#00A4EF] flex items-center justify-center text-[6px] font-bold text-white">M</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {[
                    { v: "6",    l: "Events",    alert: false },
                    { v: "2",    l: "Conflicts",  alert: true  },
                    { v: "3.5h", l: "Free time",  alert: false },
                  ].map((s) => (
                    <div key={s.l} className={`rounded-lg p-1.5 ${s.alert ? "bg-red-50" : "bg-gray-50"}`}>
                      <p className={`text-[11px] font-bold ${s.alert ? "text-red-500" : "text-gray-900"}`}>{s.v}</p>
                      <p className="text-[7px] text-gray-400">{s.l}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  {[
                    { time: "9:00",  title: "Team standup",  color: "#4285F4", conflict: false },
                    { time: "10:30", title: "Product review", color: "#00A4EF", conflict: true  },
                    { time: "14:00", title: "Client call",    color: "#4285F4", conflict: false },
                  ].map((ev) => (
                    <div
                      key={ev.title}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${ev.conflict ? "bg-red-50" : "bg-gray-50"}`}
                    >
                      <div className="w-[2px] h-5 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color }} />
                      <span className="text-[7px] text-gray-400 w-7 flex-shrink-0">{ev.time}</span>
                      <span className="text-[8px] font-medium text-gray-700 flex-1 truncate">{ev.title}</span>
                      {ev.conflict && (
                        <span className="text-[6px] font-bold text-red-500 bg-red-100 px-1 py-0.5 rounded flex-shrink-0">⚠</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom: feature checklist card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease }}
          className="relative z-10"
        >
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-6 py-5">
            <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest mb-4">
              Why SyncOne
            </p>
            <div className="space-y-3.5">
              {[
                { icon: Zap,           text: "Real-time sync across Google & Outlook" },
                { icon: AlertCircle,   text: "Instant conflict detection, zero surprises" },
                { icon: Clock,         text: "Smart free time finder across all calendars" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span className="text-white/80 text-xs leading-snug">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

    </div>
  );
}
