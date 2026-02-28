"use client";

import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logo.png";
import { useRef, useEffect, useState } from "react";
import { motion, useInView, useAnimate, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Zap, AlertCircle, BarChart3, Calendar, Shield, Clock,
  CheckCircle, RefreshCw, Eye,
} from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────────────────
function useScrollReveal(margin = "-80px") {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin } as Parameters<typeof useInView>[1]);
  return { ref, isInView };
}
const ease = [0.4, 0, 0.2, 1] as const;

// ─────────────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Nav />
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <CtaSection />
      <Footer />
    </div>
  );
}

// ── NAV ───────────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Image src={logo} alt="SyncOne" height={28} style={{ width: "auto" }} priority />

        <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
          <Link href="#features" className="hover:text-gray-900 transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</Link>
          <Link href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">
            Sign in
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-sm bg-primary text-white px-4 py-2 rounded-xl font-medium hover:bg-primary-700 transition-colors"
          >
            Get started
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ── HERO ──────────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative pt-36 pb-32 px-6 overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 50% -10%, rgba(0,85,255,0.07), transparent)",
        }}
      />

      {/* Text content */}
      <div className="max-w-4xl mx-auto text-center relative">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease }}
          className="inline-flex items-center gap-2 bg-white border border-gray-200 shadow-sm text-gray-600 text-xs font-medium px-3.5 py-1.5 rounded-full mb-8"
        >
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-green-400"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          Real-time sync · Google Calendar &amp; Outlook
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease }}
          className="text-6xl font-bold tracking-tight leading-[1.1] mb-6"
        >
          <span className="text-gray-900">All your calendars,</span>
          <br />
          <span className="text-gray-400">one intelligent view.</span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.16, ease }}
          className="text-lg text-gray-500 max-w-lg mx-auto mb-10 leading-relaxed"
        >
          Connect Google Calendar and Outlook, detect conflicts instantly,
          and find the best time to meet — without the tab-switching.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24, ease }}
          className="flex items-center justify-center gap-3 flex-wrap mb-4"
        >
          <Link
            href="/api/connect/google"
            className="flex items-center gap-2.5 bg-white border border-gray-200 shadow-sm px-5 py-2.5 rounded-xl text-sm font-medium hover:border-gray-300 hover:shadow-md transition-all"
          >
            <GoogleIcon />
            Connect Google Calendar
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            Get started free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.34 }}
          className="text-xs text-gray-400"
        >
          Free forever · No credit card required
        </motion.p>
      </div>

      {/* Dashboard + floating cards */}
      <div className="max-w-5xl mx-auto mt-16 relative">

        {/* Floating card — left */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.65, ease }}
          className="absolute -left-6 top-14 z-10 hidden lg:block"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
            className="bg-white rounded-2xl border border-gray-100 shadow-xl px-4 py-3 w-54"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              </div>
              <span className="text-[11px] font-semibold text-gray-800">2 conflicts detected</span>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed pl-8">
              Product review overlaps with standup at 10:30
            </p>
          </motion.div>
        </motion.div>

        {/* Floating card — right */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.75, ease }}
          className="absolute -right-6 top-10 z-10 hidden lg:block"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-xl px-4 py-3 w-48"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-3 h-3 text-green-500" />
              </div>
              <span className="text-[11px] font-semibold text-gray-800">Synced</span>
            </div>
            <p className="text-[10px] text-gray-400 pl-7">47 events · 3 calendars</p>
          </motion.div>
        </motion.div>

        {/* Floating card — bottom */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.85, ease }}
          className="absolute -bottom-5 left-1/2 -translate-x-1/2 z-10 hidden lg:block"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-xl px-4 py-2.5 flex items-center gap-2.5"
          >
            <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Clock className="w-3 h-3 text-primary" />
            </div>
            <span className="text-[11px] font-semibold text-gray-700">Free slot found · Tomorrow at 2:00 pm</span>
          </motion.div>
        </motion.div>

        {/* Dashboard window */}
        <motion.div
          initial={{ opacity: 0, y: 48, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.46, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl overflow-hidden border border-gray-200 shadow-2xl"
        >
          {/* Window chrome */}
          <div className="bg-gray-50/80 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <div className="flex-1 mx-6">
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-1 text-[10px] text-gray-400 text-center">
                app.syncone.io/calendar
              </div>
            </div>
          </div>
          <DashboardPreview />
        </motion.div>
      </div>
    </section>
  );
}

// ── STATS BAR ─────────────────────────────────────────────────────────────────
function StatsBar() {
  const { ref, isInView } = useScrollReveal();

  const stats = [
    { value: "< 2s",       label: "Sync latency"      },
    { value: "Real-time",  label: "Conflict alerts"   },
    { value: "AES-256",    label: "Token encryption"  },
    { value: "GDPR",       label: "Compliant"         },
  ];

  return (
    <section ref={ref} className="py-10 border-y border-gray-100 bg-gray-50/40">
      <div className="max-w-4xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.07, ease }}
            >
              <p className="text-xl font-bold text-gray-900 mb-0.5">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FEATURES ─────────────────────────────────────────────── (section 2 — untouched)
function FeaturesSection() {
  const { ref, isInView } = useScrollReveal();

  return (
    <section ref={ref} id="features" className="py-24 px-6 bg-[#F7F8FA] border-t border-border">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease }}
          className="mb-14"
        >
          <h2 className="text-[2.6rem] font-bold tracking-tight leading-tight">
            <span className="text-gray-900">Everything in one dashboard,</span>
            <br />
            <span className="text-gray-400">built for busy professionals.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 32 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.08 + i * 0.07, ease }}
              className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden hover:shadow-card-hover transition-shadow duration-200"
            >
              <div className="h-44 relative overflow-hidden" style={{ backgroundColor: f.accentBg }}>
                {f.illustration}
              </div>
              <div className="p-5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: f.accentBg }}
                >
                  <f.icon className="w-4 h-4" style={{ color: f.iconColor }} />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── HOW IT WORKS ──────────────────────────────────────────────────────────────
function HowItWorksSection() {
  const { ref, isInView } = useScrollReveal();

  const steps = [
    {
      number: "01",
      icon: Zap,
      title: "Connect your accounts",
      description:
        "Link Google Calendar and Microsoft Outlook in under 60 seconds. OAuth — no passwords stored, ever.",
      accentBg: "#EFF6FF",
      iconColor: "#2563EB",
    },
    {
      number: "02",
      icon: RefreshCw,
      title: "We sync everything",
      description:
        "Real-time webhooks pull all your events into a single unified view. Changes reflect in under 2 seconds.",
      accentBg: "#F0FDF4",
      iconColor: "#16A34A",
    },
    {
      number: "03",
      icon: Eye,
      title: "Stay in control",
      description:
        "One view, zero tab-switching. Conflicts flagged the moment they happen. Best meeting times suggested automatically.",
      accentBg: "#F5F3FF",
      iconColor: "#7C3AED",
    },
  ];

  return (
    <section ref={ref} id="how-it-works" className="py-24 px-6 border-t border-border bg-white">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease }}
          className="mb-14"
        >
          <h2 className="text-[2.6rem] font-bold tracking-tight leading-tight">
            <span className="text-gray-900">Simple by design,</span>
            <br />
            <span className="text-gray-400">powerful by default.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-10 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-gray-100 z-0" />

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 32 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.1, ease }}
              className="relative z-10"
            >
              <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-7 hover:shadow-card-hover transition-shadow duration-200 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: step.accentBg }}
                  >
                    <step.icon className="w-4.5 h-4.5" style={{ color: step.iconColor }} />
                  </div>
                  <span className="text-xs font-bold text-gray-200 tracking-widest">{step.number}</span>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── PRICING ───────────────────────────────────────────────────────────────────
function PricingSection() {
  const { ref, isInView } = useScrollReveal();

  const freeFeatures = [
    "2 calendar connections",
    "Basic conflict detection",
    "Week + month view",
    "Manual sync",
  ];

  const proFeatures = [
    "Unlimited calendar connections",
    "Advanced conflict detection",
    "Smart scheduling suggestions",
    "Workload analytics",
    "Burnout detection",
    "Auto-mirror calendars",
    "Priority support",
  ];

  return (
    <section ref={ref} id="pricing" className="py-24 px-6 bg-[#F7F8FA] border-t border-border">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease }}
          className="mb-14"
        >
          <h2 className="text-[2.6rem] font-bold tracking-tight leading-tight">
            <span className="text-gray-900">Start free,</span>
            <br />
            <span className="text-gray-400">scale when you&apos;re ready.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1, ease }}
            className="bg-white rounded-2xl border border-gray-100 shadow-card p-8 flex flex-col"
          >
            <div className="mb-8">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Free</p>
              <div className="flex items-end gap-1.5">
                <span className="text-5xl font-bold text-gray-900">$0</span>
                <span className="text-gray-400 mb-2 text-sm">/mo</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">Perfect to get started</p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path d="M1 3L3 5L7 1" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/login"
              className="block text-center text-sm font-semibold border border-gray-200 rounded-xl py-3.5 hover:bg-gray-50 transition-colors text-gray-700"
            >
              Get started free
            </Link>
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.18, ease }}
            className="bg-gray-900 rounded-2xl p-8 flex flex-col relative overflow-hidden"
          >
            {/* Gradient overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(0,85,255,0.25), transparent)" }}
            />

            <div className="relative flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Pro</p>
                <span className="text-[11px] bg-blue-500/15 text-blue-400 px-2.5 py-1 rounded-full font-semibold">
                  Most popular
                </span>
              </div>

              <div className="flex items-end gap-1.5 mb-2">
                <span className="text-5xl font-bold text-white">$12</span>
                <span className="text-gray-500 mb-2 text-sm">/mo</span>
              </div>
              <p className="text-sm text-gray-500 mb-8">Everything you need to own your time</p>

              <ul className="space-y-3 mb-8 flex-1">
                {proFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-4 h-4 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L3 5L7 1" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/login"
                className="block text-center text-sm font-semibold bg-white text-gray-900 rounded-xl py-3.5 hover:bg-gray-100 transition-colors"
              >
                Start Pro trial
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── CTA ───────────────────────────────────────────────────────────────────────
function CtaSection() {
  const { ref, isInView } = useScrollReveal();

  return (
    <section ref={ref} className="py-28 px-6 bg-gray-950 relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(0,85,255,0.12), transparent)" }}
      />

      <div className="max-w-3xl mx-auto text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease }}
        >
          <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-5">
            <span className="text-white">Stop switching tabs.</span>
            <br />
            <span className="text-gray-500">Start owning your time.</span>
          </h2>
          <p className="text-gray-400 text-lg mb-10 leading-relaxed max-w-xl mx-auto">
            Join professionals who&apos;ve unified their calendar chaos into one clear, conflict-free view.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/api/connect/google"
              className="flex items-center gap-2.5 bg-white text-gray-900 px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              <GoogleIcon />
              Connect Google Calendar
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 border border-gray-800 text-gray-400 px-6 py-3 rounded-xl text-sm font-medium hover:border-gray-600 hover:text-gray-200 transition-colors"
            >
              Get started free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <p className="text-xs text-gray-700 mt-6">Free plan · No credit card required</p>
        </motion.div>
      </div>
    </section>
  );
}

// ── FOOTER ────────────────────────────────────────────────────────────────────
function Footer() {
  const productLinks = ["Features", "How it works", "Pricing", "Changelog"];
  const companyLinks = ["About", "Blog", "Careers", "Contact"];
  const legalLinks   = [["Privacy", "/privacy"], ["Terms", "/terms"], ["Security", "#"]] as const;

  return (
    <footer className="bg-gray-950 border-t border-gray-900 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-10 mb-14">
          {/* Brand */}
          <div>
            <Image
              src={logo}
              alt="SyncOne"
              height={22}
              style={{ width: "auto" }}
              className="mb-4 brightness-0 invert opacity-60"
            />
            <p className="text-sm text-gray-600 leading-relaxed">
              One intelligent view for all your calendars. Built for people who live in their schedule.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-5">Product</p>
            <ul className="space-y-3.5">
              {productLinks.map((l) => (
                <li key={l}>
                  <Link href="#" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">{l}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-5">Company</p>
            <ul className="space-y-3.5">
              {companyLinks.map((l) => (
                <li key={l}>
                  <Link href="#" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">{l}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-5">Legal</p>
            <ul className="space-y-3.5">
              {legalLinks.map(([name, href]) => (
                <li key={name}>
                  <Link href={href} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">{name}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-900 pt-8 flex items-center justify-between flex-wrap gap-4">
          <p className="text-xs text-gray-700">© 2026 SyncOne. All rights reserved.</p>
          <div className="flex items-center gap-1.5">
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="text-xs text-gray-700">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── DASHBOARD PREVIEW ─────────────────────────────────────────────────────────
function DashboardPreview() {
  return (
    <div className="flex h-72 bg-white">
      {/* Sidebar */}
      <div className="w-14 bg-gray-900 flex flex-col items-center py-4 gap-2">
        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-white" />
        </div>
        {[BarChart3, AlertCircle, Shield].map((Icon, i) => (
          <div key={i} className="w-9 h-9 rounded-xl flex items-center justify-center">
            <Icon className="w-4 h-4 text-gray-600" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-5 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-bold text-gray-900">Today</p>
            <p className="text-xs text-gray-400">Friday, Feb 28 · 6 events</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-[#4285F4] flex items-center justify-center text-[7px] font-bold text-white">G</div>
            <div className="w-5 h-5 rounded-full bg-[#00A4EF] flex items-center justify-center text-[7px] font-bold text-white">M</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: "Events",       value: "6",    alert: false },
            { label: "Conflicts",    value: "2",    alert: true  },
            { label: "Free time",    value: "3.5h", alert: false },
            { label: "Meeting load", value: "68%",  alert: false },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl p-2.5 ${s.alert ? "bg-red-50" : "bg-gray-50"}`}>
              <p className={`text-sm font-bold ${s.alert ? "text-red-500" : "text-gray-900"}`}>{s.value}</p>
              <p className="text-[9px] text-gray-400 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Events */}
        <div className="space-y-1.5">
          {[
            { time: "9:00",  title: "Team standup",   color: "#4285F4", conflict: false },
            { time: "10:30", title: "Product review",  color: "#00A4EF", conflict: true  },
            { time: "14:00", title: "Client call",     color: "#4285F4", conflict: false },
          ].map((ev) => (
            <div
              key={ev.title}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ${ev.conflict ? "bg-red-50 border border-red-100" : "bg-gray-50"}`}
            >
              <div className="w-[3px] h-6 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color }} />
              <span className="text-[9px] text-gray-400 w-8 tabular-nums flex-shrink-0">{ev.time}</span>
              <span className="text-[10px] font-medium text-gray-700 flex-1">{ev.title}</span>
              {ev.conflict && (
                <span className="text-[8px] font-semibold text-red-500 bg-red-100 px-1.5 py-0.5 rounded-lg">
                  ⚠ Conflict
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── ILLUSTRATIONS ──────────────────────────────────────────────────────────────

function SyncIllustration() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-40px" });

  return (
    <div ref={ref} className="absolute inset-0 flex items-center justify-center">
      <div className="flex items-center gap-4">
        <div className="w-20 bg-white rounded-2xl border border-blue-100 shadow-sm p-3">
          <div className="flex items-center gap-1.5 mb-2.5">
            <motion.div
              className="w-2.5 h-2.5 rounded-full bg-[#4285F4]"
              animate={isInView ? { scale: [1, 1.35, 1], opacity: [1, 0.65, 1] } : {}}
              transition={{ duration: 0.5, delay: 0.6, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }}
            />
            <div className="h-1.5 flex-1 rounded-full bg-gray-100" />
          </div>
          <div className="space-y-1.5">
            <div className="h-4 rounded-md bg-[#4285F4]/12 flex items-center px-1.5">
              <div className="h-1 w-9 rounded-full bg-[#4285F4]/35" />
            </div>
            <motion.div
              className="h-4 rounded-md overflow-hidden"
              style={{ backgroundColor: "rgba(66,133,244,0.06)" }}
              animate={isInView ? { opacity: [0, 0, 1, 1, 0] } : {}}
              transition={{ duration: 3.2, delay: 0.2, repeat: Infinity, times: [0, 0.12, 0.3, 0.75, 1], ease: "easeInOut" }}
            >
              <motion.div
                className="h-full rounded-md"
                style={{ backgroundColor: "rgba(66,133,244,0.18)", transformOrigin: "left", scaleX: 0 }}
                animate={isInView ? { scaleX: [0, 0, 0.75, 0.75, 0] } : {}}
                transition={{ duration: 3.2, delay: 0.2, repeat: Infinity, times: [0, 0.12, 0.35, 0.75, 1], ease: "easeOut" }}
              />
            </motion.div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <motion.svg
            width="22" height="8" viewBox="0 0 22 8" fill="none"
            animate={isInView ? { opacity: [0.2, 1, 1, 0.2] } : { opacity: 0.2 }}
            transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.6, ease: "easeInOut" }}
          >
            <path d="M1 4H18M14 1.5L18 4L14 6.5" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
          <motion.svg
            width="22" height="8" viewBox="0 0 22 8" fill="none"
            animate={isInView ? { opacity: [0.2, 1, 1, 0.2] } : { opacity: 0.2 }}
            transition={{ duration: 1.4, delay: 1.5, repeat: Infinity, repeatDelay: 1.6, ease: "easeInOut" }}
          >
            <path d="M21 4H4M8 1.5L4 4L8 6.5" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        </div>

        <div className="w-20 bg-white rounded-2xl border border-blue-100 shadow-sm p-3">
          <div className="flex items-center gap-1.5 mb-2.5">
            <motion.div
              className="w-2.5 h-2.5 rounded-full bg-[#00A4EF]"
              animate={isInView ? { scale: [1, 1.35, 1], opacity: [1, 0.65, 1] } : {}}
              transition={{ duration: 0.5, delay: 2.1, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }}
            />
            <div className="h-1.5 flex-1 rounded-full bg-gray-100" />
          </div>
          <div className="space-y-1.5">
            <div className="h-4 rounded-md bg-[#00A4EF]/12 flex items-center px-1.5">
              <div className="h-1 w-7 rounded-full bg-[#00A4EF]/35" />
            </div>
            <motion.div
              className="h-4 rounded-md overflow-hidden"
              style={{ backgroundColor: "rgba(0,164,239,0.06)" }}
              animate={isInView ? { opacity: [0, 0, 1, 1, 0] } : {}}
              transition={{ duration: 3.2, delay: 1.7, repeat: Infinity, times: [0, 0.12, 0.3, 0.75, 1], ease: "easeInOut" }}
            >
              <motion.div
                className="h-full rounded-md"
                style={{ backgroundColor: "rgba(0,164,239,0.18)", transformOrigin: "left", scaleX: 0 }}
                animate={isInView ? { scaleX: [0, 0, 0.65, 0.65, 0] } : {}}
                transition={{ duration: 3.2, delay: 1.7, repeat: Infinity, times: [0, 0.12, 0.35, 0.75, 1], ease: "easeOut" }}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConflictIllustration() {
  const [scope, animate] = useAnimate();
  const isInView = useInView(scope, { once: false, margin: "-40px" });

  useEffect(() => {
    if (!isInView) return;
    let cancelled = false;

    async function loop() {
      animate(".ev-b", { y: 32, opacity: 0 }, { duration: 0 });
      animate(".badge", { opacity: 0, scale: 0.7 }, { duration: 0 });

      while (!cancelled) {
        await animate(".ev-b", { y: 0, opacity: 1 }, { duration: 0.5, ease: [0.22, 1, 0.36, 1] });
        if (cancelled) break;
        await new Promise((r) => setTimeout(r, 200));
        if (cancelled) break;
        await animate(".badge", { opacity: 1, scale: 1 }, { duration: 0.38, ease: [0.34, 1.56, 0.64, 1] });
        if (cancelled) break;
        await new Promise((r) => setTimeout(r, 1400));
        if (cancelled) break;
        await animate(".badge", { scale: 1.06 }, { duration: 0.18 });
        await animate(".badge", { scale: 1 }, { duration: 0.18 });
        if (cancelled) break;
        await new Promise((r) => setTimeout(r, 600));
        if (cancelled) break;
        await Promise.all([
          animate(".badge", { opacity: 0, scale: 0.7 }, { duration: 0.25 }),
          animate(".ev-b", { y: 32, opacity: 0 }, { duration: 0.4, ease: [0.4, 0, 1, 1] }),
        ]);
        if (cancelled) break;
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    loop();
    return () => { cancelled = true; };
  }, [isInView]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={scope} className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <div className="relative w-52" style={{ height: "88px" }}>
        <div className="absolute top-0 left-0 right-0 h-11 rounded-xl bg-[#4285F4]/15 border border-[#4285F4]/20 flex items-center gap-2.5 px-3.5 shadow-sm">
          <div className="w-[3px] h-5 rounded-full bg-[#4285F4] flex-shrink-0" />
          <div className="flex-1">
            <div className="h-1.5 w-20 rounded-full bg-[#4285F4]/40 mb-1" />
            <div className="h-1 w-12 rounded-full bg-[#4285F4]/20" />
          </div>
        </div>
        <div
          className="ev-b absolute top-10 left-0 right-0 h-11 rounded-xl bg-[#00A4EF]/15 border border-[#00A4EF]/20 flex items-center gap-2.5 px-3.5 shadow-sm"
          style={{ opacity: 0, transform: "translateY(32px)" }}
        >
          <div className="w-[3px] h-5 rounded-full bg-[#00A4EF] flex-shrink-0" />
          <div className="flex-1">
            <div className="h-1.5 w-16 rounded-full bg-[#00A4EF]/40 mb-1" />
            <div className="h-1 w-10 rounded-full bg-[#00A4EF]/20" />
          </div>
          <div
            className="badge flex-shrink-0 flex items-center gap-1 bg-red-500 text-white text-[8px] font-semibold px-2 py-1 rounded-lg"
            style={{ opacity: 0, scale: "0.7" }}
          >
            <span>⚠</span><span>Conflict</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FreeTimeIllustration() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-40px" });

  const slots = [
    { time: "9:00",  label: "Team standup",  type: "busy", color: "#4285F4" },
    { time: "10:30", label: "Product review", type: "busy", color: "#00A4EF" },
    { time: "12:00", label: "Free · 1h 30m",  type: "free" },
    { time: "13:30", label: "Client call",    type: "busy", color: "#4285F4" },
  ] as const;

  return (
    <div ref={ref} className="absolute inset-0 flex items-center justify-center">
      <div className="w-48 space-y-1.5">
        {slots.map((slot, i) => (
          <motion.div
            key={slot.time}
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -8 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.35, delay: i * 0.09, ease: [0.4, 0, 0.2, 1] }}
          >
            <span className="text-[8px] text-gray-400 w-9 flex-shrink-0 tabular-nums">{slot.time}</span>
            {slot.type === "busy" ? (
              <div
                className="flex-1 h-5 rounded-lg flex items-center px-2 gap-1.5"
                style={{ backgroundColor: `${slot.color}18`, border: `1px solid ${slot.color}25` }}
              >
                <div className="w-[2px] h-3 rounded-full flex-shrink-0" style={{ backgroundColor: slot.color }} />
                <span className="text-[8px] font-medium" style={{ color: slot.color }}>{slot.label}</span>
              </div>
            ) : (
              <motion.div
                className="flex-1 h-5 rounded-lg bg-green-100 border border-green-200 flex items-center px-2 gap-1.5"
                animate={isInView ? { backgroundColor: ["#dcfce7", "#bbf7d0", "#dcfce7"] } : {}}
                transition={{ duration: 2, delay: 0.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0"
                  animate={isInView ? { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] } : {}}
                  transition={{ duration: 1.8, delay: 0.8, repeat: Infinity, ease: "easeInOut" }}
                />
                <span className="text-[8px] font-semibold text-green-600">{slot.label}</span>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsIllustration() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-40px" });

  const bars = [
    { day: "Mon", pct: 48 },
    { day: "Tue", pct: 72 },
    { day: "Wed", pct: 100, active: true },
    { day: "Thu", pct: 65 },
    { day: "Fri", pct: 38 },
  ];

  const barCycle = (targetPct: number, delay: number) => ({
    animate: isInView ? { scaleY: [0, targetPct / 100, targetPct / 100, 0, 0] } : { scaleY: 0 },
    transition: { duration: 4.5, delay, repeat: Infinity, times: [0, 0.25, 0.7, 0.85, 1], ease: "easeOut" as const },
  });

  return (
    <div ref={ref} className="absolute inset-0 flex flex-col items-center justify-end px-8 pb-4 pt-5">
      <motion.div
        className="w-full flex justify-center mb-1"
        animate={isInView ? { opacity: [0, 0, 1, 1, 0] } : { opacity: 0 }}
        transition={{ duration: 4.5, delay: 0.2, repeat: Infinity, times: [0, 0.22, 0.35, 0.7, 0.87] }}
      >
        <span className="text-[9px] font-semibold text-primary">6.4h</span>
      </motion.div>
      <div className="flex items-end gap-2.5 w-full" style={{ height: "76px" }}>
        {bars.map((bar, i) => {
          const { animate, transition } = barCycle(bar.pct, i * 0.06);
          return (
            <div key={bar.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <motion.div
                className="w-full rounded-t-lg"
                style={{ backgroundColor: bar.active ? "#0055FF" : "#DDD6FE", transformOrigin: "bottom", scaleY: 0 }}
                animate={animate}
                transition={transition}
              />
              <span className="text-[8px] text-gray-400">{bar.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SecurityIllustration() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-40px" });

  return (
    <div ref={ref} className="absolute inset-0 flex flex-col items-center justify-center gap-3.5">
      <div className="relative">
        <motion.div
          className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center"
          animate={isInView ? { scale: [1, 1.04, 1] } : {}}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Shield className="w-7 h-7 text-slate-500" />
        </motion.div>
        <motion.div
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-white flex items-center justify-center"
          animate={isInView ? { scale: [1, 1.45, 1], opacity: [1, 0.55, 1] } : {}}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </div>
      <div className="bg-white rounded-xl px-4 py-2.5 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-1.5">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-green-400"
            animate={isInView ? { opacity: [1, 0.4, 1] } : {}}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="text-[8px] font-semibold text-slate-500 tracking-widest">AES-256-GCM</span>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: 18 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-1 h-2 rounded-full"
              style={{ backgroundColor: i % 4 === 0 ? "#0055FF50" : "#e2e8f0" }}
              animate={isInView ? { opacity: [1, 0.15, 1] } : {}}
              transition={{ duration: 0.6 + (i * 0.17) % 1.2, delay: (i * 0.11) % 1.4, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const ALL_EVENTS = [
  { color: "#4285F4", title: "Team standup",   time: "9:00",  provider: "G" },
  { color: "#00A4EF", title: "Product sync",    time: "10:30", provider: "M" },
  { color: "#4285F4", title: "Client call",     time: "14:00", provider: "G" },
  { color: "#00A4EF", title: "Strategy review", time: "15:00", provider: "M" },
  { color: "#4285F4", title: "1:1 with Sarah",  time: "16:30", provider: "G" },
];

function UniversalIllustration() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-40px" });
  const counterRef = useRef(3);
  const [queue, setQueue] = useState(
    ALL_EVENTS.slice(0, 3).map((ev, i) => ({ ...ev, id: i }))
  );

  useEffect(() => {
    if (!isInView) return;
    const timer = setInterval(() => {
      const next = ALL_EVENTS[counterRef.current % ALL_EVENTS.length];
      counterRef.current += 1;
      setQueue((prev) => [{ ...next, id: counterRef.current }, ...prev.slice(0, 2)]);
    }, 2200);
    return () => clearInterval(timer);
  }, [isInView]);

  return (
    <div ref={ref} className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <div className="w-[11.5rem] flex flex-col gap-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {queue.map((ev) => (
            <motion.div
              key={ev.id}
              layout
              initial={{ opacity: 0, y: -18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.96 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-xl border border-orange-100 flex items-center px-3 py-2.5 gap-2.5 shadow-sm"
            >
              <div className="w-[3px] h-6 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color }} />
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-semibold text-gray-700 leading-none mb-1">{ev.title}</div>
                <div className="text-[8px] text-gray-400">{ev.time}</div>
              </div>
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-[8px] font-bold text-white"
                style={{ backgroundColor: ev.color }}
              >
                {ev.provider}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── FEATURES DATA ─────────────────────────────────────────────────────────────
const features = [
  {
    icon: Zap,
    iconColor: "#2563EB",
    title: "Instant sync",
    description: "Real-time webhooks keep all your calendars in sync within seconds. Delta sync ensures minimal API usage.",
    accentBg: "#EFF6FF",
    illustration: <SyncIllustration />,
  },
  {
    icon: AlertCircle,
    iconColor: "#DC2626",
    title: "Conflict detection",
    description: "Automatically detect overlapping events across all connected accounts. Hard and soft conflicts flagged instantly.",
    accentBg: "#FEF2F2",
    illustration: <ConflictIllustration />,
  },
  {
    icon: Clock,
    iconColor: "#16A34A",
    title: "Free time finder",
    description: "Smart algorithm suggests optimal meeting slots based on your actual schedule across all calendars.",
    accentBg: "#F0FDF4",
    illustration: <FreeTimeIllustration />,
  },
  {
    icon: BarChart3,
    iconColor: "#7C3AED",
    title: "Workload insights",
    description: "Understand your time density, meeting load, and get early burnout signals before they impact you.",
    accentBg: "#F5F3FF",
    illustration: <AnalyticsIllustration />,
  },
  {
    icon: Shield,
    iconColor: "#475569",
    title: "Secure by design",
    description: "OAuth tokens encrypted at rest with AES-256-GCM. Per-user keys. GDPR compliant data handling.",
    accentBg: "#F8FAFC",
    illustration: <SecurityIllustration />,
  },
  {
    icon: Calendar,
    iconColor: "#D97706",
    title: "Universal format",
    description: "Google, Outlook, and more — all normalized into one unified event model. Add providers without changing your workflow.",
    accentBg: "#FFF7ED",
    illustration: <UniversalIllustration />,
  },
];

// ── STATIC ICONS ──────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
