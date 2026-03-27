"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { AppCard } from "@/components/ui/AppCard";
import { auth } from "@/lib/firebase/client";
import { addFavoriteCollege, removeFavoriteCollege, getFavoriteColleges, getStudentProfile } from "@/lib/firebase/firestore";
import { useToastOptional } from "@/components/ui/toast";

type EnrichData = {
  acceptanceNote?: string;
  enrollmentNote?: string;
  satNote?: string;
  actNote?: string;
  tuitionNote?: string;
  roomboardNote?: string;
  aboutLine?: string;
  gpaNote?: string;
};

interface College {
  id: number;
  name: string;
  city?: string;
  state?: string;
  school_url?: string;
  location?: { lat: number; lon: number };
  student?: { size?: number };
  admission?: {
    admission_rate?: number;
    sat_scores?: { midpoint?: { critical_reading?: number; math?: number; writing?: number } };
    act_scores?: { midpoint?: { cumulative?: number } };
  };
  latest?: {
    student?: { size?: number };
    admission?: { admission_rate?: number };
    cost?: { tuition?: number; roomboard?: number };
  };
  avgGpa?: number;
}

const TABS = [
  { id: "overview", label: "Overview", icon: "grid" },
  { id: "requirements", label: "Requirements", icon: "checklist" },
  { id: "essays", label: "Essays", icon: "doc" },
] as const;

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

/** Simple deterministic "why good fit" from profile + college. */
function getWhyGoodFit(
  college: College,
  profile: { gpa?: number; satScore?: number; actScore?: number; preferredStates?: string[]; preferredSize?: string } | null
): string {
  const rate = college.latest?.admission?.admission_rate ?? college.admission?.admission_rate;
  const size = college.latest?.student?.size ?? college.student?.size;
  const parts: string[] = [];

  if (college.state && profile?.preferredStates?.length && profile.preferredStates.includes(college.state)) {
    parts.push(`Located in ${college.state}, which is one of your preferred states.`);
  }
  if (rate != null && rate <= 0.4) {
    parts.push("Selective admission rate can be a good reach target.");
  } else if (rate != null && rate >= 0.5 && rate <= 0.8) {
    parts.push("Admission rate suggests a strong match for your profile.");
  }
  if (size != null && profile?.preferredSize) {
    const small = size < 5000;
    const medium = size >= 5000 && size <= 15000;
    const large = size > 15000;
    if (profile.preferredSize === "small" && small) parts.push("School size matches your preference for a smaller campus.");
    if (profile.preferredSize === "medium" && medium) parts.push("Mid-size enrollment aligns with your preference.");
    if (profile.preferredSize === "large" && large) parts.push("Large enrollment fits your preference for a bigger campus.");
  }
  if (profile?.gpa != null && rate != null) {
    parts.push("Your GPA and this school’s selectivity are a reasonable fit to consider.");
  }
  if (parts.length === 0) {
    return "Add your profile and preferences in Settings to see a personalized fit summary. You can still explore this school’s stats and deadlines below.";
  }
  return parts.join(" ");
}

export function CollegeDetail({ collegeId, basePath = "/colleges" }: { collegeId: number; basePath?: string }) {
  const { toast } = useToastOptional();
  const [college, setCollege] = useState<College | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<typeof TABS[number]["id"]>("overview");
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [profile, setProfile] = useState<{ gpa?: number; satScore?: number; actScore?: number; preferredStates?: string[]; preferredSize?: string } | null>(null);
  const [whyFitText, setWhyFitText] = useState<string | null>(null);
  const [whyFitLoading, setWhyFitLoading] = useState(false);
  const [enrich, setEnrich] = useState<EnrichData | null>(null);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/scorecard/college?id=${collegeId}`)
      .then(async (res) => {
        if (!res.ok) {
          try {
            const body = await res.json().catch(() => null);
            const msg =
              (body && typeof body.error === "string"
                ? body.error
                : "College data is temporarily unavailable. Please try again later.") || "College data is temporarily unavailable. Please try again later.";
            throw new Error(msg);
          } catch (e) {
            if (e instanceof Error) throw e;
            throw new Error("College data is temporarily unavailable. Please try again later.");
          }
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setCollege(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error
              ? err.message
              : "College data is temporarily unavailable. Please try again later."
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [collegeId]);

  useEffect(() => {
    if (!college) return;
    let cancelled = false;
    setWhyFitLoading(true);
    setWhyFitText(null);
    fetch("/api/college/why-fit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        collegeId: college.id,
        profile: profile ?? undefined,
      }),
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!cancelled && data?.text) setWhyFitText(data.text);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setWhyFitLoading(false);
      });
    return () => { cancelled = true; };
  }, [college?.id, profile]);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setIsFavorite(false);
        return;
      }
      try {
        const favs = await getFavoriteColleges(user.uid);
        setIsFavorite(favs.some((f) => f.collegeId === collegeId));
      } catch {
        setIsFavorite(false);
      }
      try {
        const p = await getStudentProfile(user.uid);
        if (p) setProfile({ gpa: p.gpa, satScore: p.satScore, actScore: p.actScore, preferredStates: p.preferredStates, preferredSize: p.preferredSize });
      } catch {
        setProfile(null);
      }
    });
    return () => unsub();
  }, [collegeId]);

  useEffect(() => {
    if (!college) return;
    let cancelled = false;
    fetch("/api/college/enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collegeId: college.id }),
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!cancelled && data) setEnrich(data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [college?.id]);

  useEffect(() => {
    if (!college?.name) return;
    let cancelled = false;
    fetch(`/api/college/image?name=${encodeURIComponent(college.name)}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!cancelled && data?.imageUrl) setHeroImageUrl(data.imageUrl);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [college?.name]);

  async function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !college) return;
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await removeFavoriteCollege(user.uid, college.id);
        setIsFavorite(false);
        toast({ description: "Removed from favorites.", variant: "success" });
      } else {
        await addFavoriteCollege(user.uid, college.id, college.name);
        setIsFavorite(true);
        toast({ description: "Added to favorites.", variant: "success" });
      }
    } catch {
      toast({ description: "Could not update favorites.", variant: "error" });
    } finally {
      setFavoriteLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-card" />
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 rounded-card" />
          <Skeleton className="h-24 rounded-card" />
          <Skeleton className="h-24 rounded-card" />
        </div>
      </div>
    );
  }

  if (error || !college) {
    return (
      <AppCard className="p-8 text-center">
        <p className="text-text-secondary">{error || "College not found."}</p>
        <Link href={basePath} className="mt-4 inline-block text-primary-500 hover:underline">
          ← Back to colleges
        </Link>
      </AppCard>
    );
  }

  const rate = college.latest?.admission?.admission_rate ?? college.admission?.admission_rate;
  const size = college.latest?.student?.size ?? college.student?.size;
  const tuition = college.latest?.cost?.tuition;
  const roomboard = college.latest?.cost?.roomboard;
  const locationStr = [college.city, college.state].filter(Boolean).join(", ");
  const sat = college.admission?.sat_scores?.midpoint;
  const act = college.admission?.act_scores?.midpoint?.cumulative;
  const satTotal = sat && (sat.critical_reading != null || sat.math != null || sat.writing != null)
    ? (sat.critical_reading ?? 0) + (sat.math ?? 0) + (sat.writing ?? 0)
    : null;
  const whyFit = whyFitText ?? getWhyGoodFit(college, profile);
  const mapUrl =
    college.location?.lat != null && college.location?.lon != null
      ? `https://www.google.com/maps?q=${college.location.lat},${college.location.lon}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(college.name + (locationStr ? ", " + locationStr : ""))}`;
  const mapEmbedUrl =
    college.location?.lat != null && college.location?.lon != null
      ? `https://www.google.com/maps?q=${college.location.lat},${college.location.lon}&output=embed`
      : `https://www.google.com/maps?q=${encodeURIComponent(college.name + (locationStr ? " " + locationStr : ""))}&output=embed`;

  const initial = college.name.replace(/\b(\w)/g, (_, c) => c).slice(0, 1).toUpperCase() || "—";
  const shortNote = (s: string | undefined) => (s && s.length > 26 ? s.slice(0, 25) + "…" : s);
  const categoryLabel = rate != null && rate < 0.2 ? "REACH" : rate != null && rate > 0.6 ? "SAFETY" : "MATCH";
  const scorecardUrl = `https://collegescorecard.ed.gov/school/?id=${college.id}`;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.1 },
    },
  };
  const itemVariants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <nav className="text-sm text-text-muted" aria-label="Breadcrumb">
        <Link href={basePath} className="hover:text-[#2563EB]">Colleges</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-[#111827]">{college.name}</span>
      </nav>

      {/* Hero: full-width image with overlay */}
      <motion.section
        className="relative h-[280px] sm:h-[320px] w-full overflow-hidden rounded-2xl"
        variants={itemVariants}
      >
        {heroImageUrl ? (
          <Image
            src={heroImageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a5f] via-[#2563EB] to-[#7C3AED]" aria-hidden />
        )}
        <div className="absolute inset-0 bg-black/50" aria-hidden />
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex gap-4 items-end">
              <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur flex items-center justify-center text-2xl font-bold text-white shadow-lg" aria-hidden>
                {initial}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-md">{college.name}</h1>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium text-white ${categoryLabel === "REACH" ? "bg-amber-500" : categoryLabel === "SAFETY" ? "bg-emerald-500" : "bg-blue-500"}`}>
                    {categoryLabel}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-4 text-sm text-white/90">
                  {locationStr && (
                    <span className="inline-flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                      {locationStr}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">Private Research University</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleFavorite}
              disabled={favoriteLoading}
              className="mt-3 sm:mt-0 inline-flex items-center justify-center gap-2 h-[42px] px-5 rounded-xl bg-white text-[#1e3a5f] font-semibold text-sm hover:bg-white/90 disabled:opacity-60 shadow-lg transition-transform hover:scale-[1.02]"
            >
              <span className="text-lg leading-none">+</span>
              {isFavorite ? "On My List" : "Add to My List"}
            </button>
          </div>
        </div>
      </motion.section>

      {enrich?.aboutLine && (
        <motion.p className="text-sm text-[#374151] leading-relaxed px-1" variants={itemVariants}>
          {enrich.aboutLine}
        </motion.p>
      )}

      {/* Tabs */}
      <motion.div className="border-b border-[#E5E7EB]" variants={itemVariants}>
        <nav className="flex gap-6" aria-label="College sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-[#2563EB] text-[#2563EB]"
                  : "border-transparent text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              {tab.icon === "grid" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>}
              {tab.icon === "checklist" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>}
              {tab.icon === "doc" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
              {tab.label}
            </button>
          ))}
        </nav>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* Overview */}
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            className="grid lg:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-[#374151] uppercase tracking-wider mb-4">Key Performance Indicators</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-card border border-[#E5E7EB] bg-white p-4 shadow-soft">
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Acceptance Rate</p>
                  <p className="mt-1 text-xl font-bold text-[#111827]">
                    {rate != null
                      ? `${(rate * 100).toFixed(1)}%`
                      : (enrich?.acceptanceNote?.includes("%") ? shortNote(enrich.acceptanceNote) : null) ?? "—"}
                  </p>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    {rate == null
                      ? "Selectivity data limited"
                      : rate < 0.15
                      ? "Highly selective"
                      : rate < 0.4
                      ? "Moderately selective"
                      : "More accessible"}
                  </p>
                </div>
                <div className="rounded-card border border-[#E5E7EB] bg-white p-4 shadow-soft">
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Average GPA</p>
                  <p className="mt-1 text-xl font-bold text-[#111827]">
                    {college.avgGpa != null ? college.avgGpa.toFixed(2) : shortNote(enrich?.gpaNote) ?? "—"}
                  </p>
                  <p className="text-xs text-[#6B7280] mt-0.5">(Unweighted, estimated)</p>
                </div>
                <div className="rounded-card border border-[#E5E7EB] bg-white p-4 shadow-soft">
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Enrollment</p>
                  <p className="mt-1 text-xl font-bold text-[#111827]">
                    {size != null ? (size >= 1000 ? `${(size / 1000).toFixed(0)}k+` : size.toLocaleString()) : shortNote(enrich?.enrollmentNote) ?? "—"}
                  </p>
                  <p className="text-xs text-[#6B7280] mt-0.5">Students on campus</p>
                </div>
              </div>
            </div>

            <div className="rounded-card border border-[#BFDBFE] bg-[#EFF6FF] p-6 shadow-soft">
              <h2 className="font-semibold text-[#2563EB] flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                Why this college is a good fit
                {whyFitLoading && <span className="text-xs font-normal text-[#6B7280]">(generating…)</span>}
              </h2>
              <p className="mt-2 text-sm text-[#374151] leading-relaxed">{whyFit}</p>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-[#374151] uppercase tracking-wider mb-4">Financial Snapshot</h2>
              <div className="rounded-card border border-[#E5E7EB] bg-white p-4 shadow-soft space-y-3">
                <div>
                  <p className="text-xs text-[#6B7280]">Average Tuition</p>
                  <p className="font-bold text-[#111827]">{tuition != null ? formatCurrency(tuition) : shortNote(enrich?.tuitionNote) ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">Room & Board</p>
                  <p className="font-bold text-[#111827]">{roomboard != null ? formatCurrency(roomboard) : shortNote(enrich?.roomboardNote) ?? "—"}</p>
                </div>
                <a
                  href={scorecardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs text-text-muted hover:underline"
                >
                  View this school on College Scorecard
                </a>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-[#374151] uppercase tracking-wider mb-4">Location</h2>
              <div className="rounded-card border border-[#E5E7EB] bg-white overflow-hidden shadow-soft">
                <iframe
                  title={`Map of ${college.name}`}
                  src={mapEmbedUrl}
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full block"
                />
                <p className="p-3 text-sm font-medium text-[#111827]">{locationStr || college.name || "—"}</p>
                <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="px-3 pb-3 text-sm text-[#2563EB] hover:underline block">
                  Open in Google Maps →
                </a>
              </div>
            </div>
          </div>
          </motion.div>
        )}

        {activeTab === "requirements" && (
          <motion.div
            key="requirements"
            className="space-y-6"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <AppCard className="p-6 border-l-4 border-l-primary-500 shadow-soft">
            <h2 className="font-semibold text-text-primary mb-4">Admission requirements</h2>
            <p className="text-sm text-text-secondary mb-4">
              Requirements vary by program. Below is a summary of typical criteria; always confirm on the official admissions site.
            </p>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-text-muted uppercase tracking-wider">Acceptance rate</dt>
                <dd className="mt-1 text-text-primary font-medium">{rate != null ? `${(rate * 100).toFixed(1)}%` : shortNote(enrich?.acceptanceNote) ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-text-muted uppercase tracking-wider">SAT (mid 50%)</dt>
                <dd className="mt-1 text-text-primary font-medium">{satTotal != null && satTotal > 0 ? satTotal : shortNote(enrich?.satNote) ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-text-muted uppercase tracking-wider">ACT (mid 50%)</dt>
                <dd className="mt-1 text-text-primary font-medium">{act != null ? act : shortNote(enrich?.actNote) ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-text-muted uppercase tracking-wider">Enrollment</dt>
                <dd className="mt-1 text-text-primary font-medium">{size != null ? size.toLocaleString() : shortNote(enrich?.enrollmentNote) ?? "—"}</dd>
              </div>
            </dl>
            <ul className="mt-6 space-y-2 text-sm text-text-secondary">
              <li className="flex items-start gap-2"><span className="text-primary-500 mt-0.5">•</span> High school transcript and GPA</li>
              <li className="flex items-start gap-2"><span className="text-primary-500 mt-0.5">•</span> Standardized test scores (SAT/ACT) — check if test-optional</li>
              <li className="flex items-start gap-2"><span className="text-primary-500 mt-0.5">•</span> Letters of recommendation (typically 1–2)</li>
              <li className="flex items-start gap-2"><span className="text-primary-500 mt-0.5">•</span> Personal essay and/or supplemental essays</li>
              <li className="flex items-start gap-2"><span className="text-primary-500 mt-0.5">•</span> Application fee or fee waiver</li>
            </ul>
            <p className="mt-6 text-xs text-text-muted">
              This summary is based on publicly available data; always confirm exact criteria with the admissions office.
            </p>
          </AppCard>
          </motion.div>
        )}

        {activeTab === "essays" && (
          <motion.div
            key="essays"
            className="space-y-6"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <AppCard className="p-6 border-l-4 border-l-primary-500 shadow-soft">
            <h2 className="font-semibold text-text-primary mb-2">Application essays</h2>
            <p className="text-sm text-text-secondary mb-4">
              Most schools require a personal statement (e.g. Common App or Coalition essay) plus one or more school-specific supplements.
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-text-primary">Common App / main essay</h3>
                <p className="text-sm text-text-muted mt-1">Typically 250–650 words. Prompts are on the Common App or Coalition site.</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-primary">Supplemental essays</h3>
                <p className="text-sm text-text-muted mt-1">
                  {college.name} may require additional short-answer or essay questions. Word limits and prompts are updated each cycle on the admissions website.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-primary">Tips</h3>
                <ul className="text-sm text-text-muted mt-1 space-y-1 list-disc list-inside">
                  <li>Start early and allow time for revisions</li>
                  <li>Answer the prompt directly and be specific</li>
                  <li>Proofread and get feedback from a counselor or teacher</li>
                </ul>
              </div>
            </div>
            <p className="mt-6 text-xs text-text-muted">
              Essay prompts and word counts can change each year; double‑check the latest instructions in your application portal.
            </p>
          </AppCard>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
