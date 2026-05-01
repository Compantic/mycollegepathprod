"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText, Info, Cookie, Settings, BarChart3, ShieldAlert, Check } from "lucide-react";

export default function CookiePolicy() {
  const lastUpdated = "April 17, 2026";
  const currentYear = "2026";

  // Cookie Settings State
  const [preferences, setPreferences] = useState({
    functional: true,
    analytics: false,
  });
  const [saved, setSaved] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("mcp_cookie_consent");
    if (stored) {
      try {
        setPreferences(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse cookie preferences");
      }
    }
  }, []);

  const handleSave = (newPrefs?: typeof preferences) => {
    const toSave = newPrefs || preferences;
    localStorage.setItem("mcp_cookie_consent", JSON.stringify(toSave));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAcceptAll = () => {
    const allOn = { functional: true, analytics: true };
    setPreferences(allOn);
    handleSave(allOn);
  };

  const handleRejectAll = () => {
    const allOff = { functional: false, analytics: false };
    setPreferences(allOff);
    handleSave(allOff);
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-slate-900">
      {/* Navigation */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
            MyCollegePath
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 pb-24 pt-32 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-700">
            <Cookie className="h-3.5 w-3.5" />
            Cookie Policy
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Cookie Policy</h1>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
            <p>Effective Date: {lastUpdated}</p>
            <p>Last Updated: {lastUpdated}</p>
            <p>Version 1.0</p>
          </div>
        </div>

        {/* TL;DR Summary Card */}
        <section className="mb-12 rounded-2xl border border-primary-100 bg-primary-50/50 p-6 shadow-sm backdrop-blur-sm sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md">
              <Info className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">TL;DR — PLAIN-ENGLISH SUMMARY</h2>
          </div>
          <p className="text-lg leading-relaxed text-slate-700">
            We use cookies to keep you logged in, remember your preferences, and understand how the platform is used. We <strong>do NOT</strong> use cookies for advertising or tracking you across other websites. You can control non-essential cookies anytime using the settings panel at the bottom of this page.
          </p>
        </section>

        <div className="prose prose-slate max-w-none space-y-12 text-slate-700 leading-relaxed">
          <section>
            <p>
              This Cookie Policy explains how DEVIX Corporation LLC, d/b/a COMPANTIC (“Company,” “we,” “us,” or “our”) uses cookies and similar tracking technologies on the MyCollegePath platform (“Platform”). This policy should be read alongside our Privacy Policy and Terms of Service.
            </p>
            <p>
              By continuing to use the Platform after being presented with our cookie notice, you consent to our use of strictly necessary cookies. For all other cookie categories, you may grant or withhold consent using the interactive settings panel below.
            </p>
          </section>

          <section id="basics">
            <h2 className="text-2xl font-bold text-slate-900">What Are Cookies?</h2>
            <p>
              Cookies are small text files that websites place on your device (computer, phone, or tablet) when you visit them. They serve various purposes: some are essential for the website to work, others remember your preferences, and some help us understand how visitors use the Platform so we can improve it.
            </p>
          </section>

          <section id="categories">
            <h2 className="text-2xl font-bold text-slate-900">Categories of Cookies We Use</h2>
            
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <Lock className="h-5 w-5 text-slate-500" />
                  1. Strictly Necessary Cookies
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  These cookies are essential for the Platform to function. Without them, you can&apos;t log in, navigate pages, or use core features. They cannot be disabled.
                </p>
                <ul className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <li className="flex items-center gap-2 text-slate-500">
                    <Check className="h-4 w-4 text-emerald-500" /> Session Management
                  </li>
                  <li className="flex items-center gap-2 text-slate-500">
                    <Check className="h-4 w-4 text-emerald-500" /> Security Tokens
                  </li>
                  <li className="flex items-center gap-2 text-slate-500">
                    <Check className="h-4 w-4 text-emerald-500" /> Load Balancing
                  </li>
                  <li className="flex items-center gap-2 text-slate-500">
                    <Check className="h-4 w-4 text-emerald-500" /> Consent Preferences
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <Settings className="h-5 w-5 text-primary-500" />
                  2. Functional Cookies
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  These remember your preferences (like language, dashboard layout, or accessibility settings) so you don&apos;t have to set them every time.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <BarChart3 className="h-5 w-5 text-emerald-500" />
                  3. Analytics Cookies
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  These help us understand how visitors use the Platform. All data is aggregated and anonymized. We use Google Analytics with IP Anonymization enabled.
                </p>
              </div>
            </div>
          </section>

          <section id="commitments" className="rounded-2xl border-2 border-emerald-100 bg-emerald-50/30 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">What We Do NOT Use</h2>
            <div className="my-6 rounded-xl bg-emerald-600 p-6 text-white shadow-lg">
              <div className="mb-2 flex items-center gap-2 font-bold uppercase tracking-wider text-emerald-100 text-xs text-center">
                <ShieldCheck className="h-4 w-4" />
                OUR COOKIE GUARANTEE
              </div>
              <p className="m-0 text-lg font-bold leading-tight">
                MyCollegePath does NOT and will NOT deploy advertising cookies, retargeting pixels, or any technology designed to serve ads or build advertising profiles.
              </p>
            </div>
            <ul className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <li className="flex items-center gap-3 font-semibold text-slate-700">
                <ShieldAlert className="h-5 w-5 text-emerald-600" /> No Advertising Cookies
              </li>
              <li className="flex items-center gap-3 font-semibold text-slate-700">
                <ShieldAlert className="h-5 w-5 text-emerald-600" /> No Cross-Site Tracking
              </li>
              <li className="flex items-center gap-3 font-semibold text-slate-700">
                <ShieldAlert className="h-5 w-5 text-emerald-600" /> No Fingerprinting
              </li>
              <li className="flex items-center gap-3 font-semibold text-slate-700">
                <ShieldAlert className="h-5 w-5 text-emerald-600" /> No Session Replay
              </li>
            </ul>
          </section>

          {/* Interactive Settings Panel */}
          <section id="settings-panel" className="rounded-2xl border-2 border-primary-100 bg-white p-8 shadow-xl">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900">Your Cookie Settings</h2>
              <p className="mt-2 text-slate-600">Manage your preferences — changes apply instantly.</p>
            </div>

            <div className="space-y-8">
              {/* Necessary */}
              <div className="flex items-center justify-between gap-6 border-b border-slate-100 pb-6">
                <div>
                  <h3 className="font-bold text-slate-900">Strictly Necessary Cookies</h3>
                  <p className="text-sm text-slate-500">Essential for the platform to function. Cannot be disabled.</p>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                  Always On
                </div>
              </div>

              {/* Functional */}
              <div className="flex items-center justify-between gap-6 border-b border-slate-100 pb-6">
                <div>
                  <h3 className="font-bold text-slate-900">Functional Cookies</h3>
                  <p className="text-sm text-slate-500">Remember choices like language, theme, and accessibility.</p>
                </div>
                <button
                  onClick={() => setPreferences(prev => ({ ...prev, functional: !prev.functional }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    preferences.functional ? "bg-primary-600" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      preferences.functional ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between gap-6 border-b border-slate-100 pb-6">
                <div>
                  <h3 className="font-bold text-slate-900">Analytics Cookies</h3>
                  <p className="text-sm text-slate-500">Help us improve the platform using anonymized usage data.</p>
                </div>
                <button
                  onClick={() => setPreferences(prev => ({ ...prev, analytics: !prev.analytics }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    preferences.analytics ? "bg-primary-600" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      preferences.analytics ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* NOT USED */}
              <div className="flex items-center justify-between gap-6 opacity-50">
                <div>
                  <h3 className="font-bold text-slate-900">Advertising & Tracking Cookies</h3>
                  <p className="text-sm text-slate-500">We do NOT use advertising cookies. Shown for transparency only.</p>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                  Not Used
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <button
                onClick={handleAcceptAll}
                className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800 hover:shadow-lg active:scale-95"
              >
                Accept All
              </button>
              <button
                onClick={() => handleSave()}
                className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-900 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95 flex items-center gap-2"
              >
                {saved ? <Check className="h-4 w-4 text-emerald-500" /> : null}
                {saved ? "Preferences Saved" : "Save My Preferences"}
              </button>
              <button
                onClick={handleRejectAll}
                className="rounded-xl px-6 py-3 text-sm font-bold text-slate-500 transition-all hover:text-slate-900"
              >
                Reject Non-Essential
              </button>
            </div>
          </section>

          <section id="contact" className="rounded-2xl border border-slate-200 bg-white p-8 shadow-md">
            <h2 className="text-2xl font-bold text-slate-900">Contact Us</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Email</p>
                <a href="mailto:contac@mycollegepath.com" className="mt-1 block font-semibold text-primary-600 hover:underline">
                  contac@mycollegepath.com
                </a>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">General Support</p>
                <a href="mailto:contact@compantic.com" className="mt-1 block font-semibold text-slate-900">
                  contact@compantic.com
                </a>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Mailing Address</p>
                <p className="mt-1 text-slate-900 leading-tight text-center">
                  Leander, Texas, United States
                </p>
              </div>
            </div>
          </section>
        </div>

        <footer className="mt-24 border-t border-slate-200 pt-8 text-center text-xs text-slate-500">
          <p>© {currentYear} DEVIX Corporation LLC, d/b/a COMPANTIC. All Rights Reserved.</p>
          <p className="mt-2">MyCollegePath — Personalized College Admissions Guidance</p>
          <p className="mt-1">Leander, Texas, United States</p>
        </footer>
      </main>
    </div>
  );
}
