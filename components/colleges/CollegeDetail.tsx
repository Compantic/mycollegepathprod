"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { LayoutGrid, ClipboardList, FileText, MapPin, Sparkles, Plus, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
    admissions?: {
      admission_rate?: { overall?: number };
      sat_scores?: {
        "25th_percentile"?: { critical_reading?: number; math?: number };
        "75th_percentile"?: { critical_reading?: number; math?: number };
      };
      act_scores?: {
        "25th_percentile"?: { cumulative?: number };
        "75th_percentile"?: { cumulative?: number };
      };
    };
    cost?: {
      tuition?: number;
      roomboard?: number;
      avg_net_price?: {
        overall?: number;
        by_income_level?: {
          "0-30000"?: number;
          "30001-48000"?: number;
          "48001-75000"?: number;
          "75001-110000"?: number;
          "110001-plus"?: number;
        };
      };
    };
    aid?: { median_debt?: { completers?: { monthly_payments?: number } } };
    earnings?: { "10_yrs_after_entry"?: { median?: number } };
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
  const reduceMotion = useReducedMotion();

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
    const params = new URLSearchParams({ name: college.name });
    if (college.city) params.set("city", college.city);
    if (college.state) params.set("state", college.state);
    fetch(`/api/college/image?${params.toString()}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!cancelled && data?.imageUrl) setHeroImageUrl(data.imageUrl);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [college?.name, college?.city, college?.state]);

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
        <Skeleton className="h-9 w-56 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-3xl sm:h-80" />
        <Skeleton className="h-12 w-full max-w-md rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !college) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-10 text-center shadow-onboarding-card">
        <p className="text-slate-700">{error || "College not found."}</p>
        <Link href={basePath} className="mt-5 inline-flex font-bold text-primary-700 hover:underline">
          ← Back to colleges
        </Link>
      </div>
    );
  }

  const rate = college.latest?.admission?.admission_rate ?? college.admission?.admission_rate;
  const latestRate = college.latest?.admissions?.admission_rate?.overall;
  const acceptanceRate = latestRate ?? rate;
  const size = college.latest?.student?.size ?? college.student?.size;
  const tuition = college.latest?.cost?.tuition;
  const roomboard = college.latest?.cost?.roomboard;
  const avgNetPrice = college.latest?.cost?.avg_net_price?.overall;
  const familyIncomeCosts = college.latest?.cost?.avg_net_price?.by_income_level;
  const monthlyLoan = college.latest?.aid?.median_debt?.completers?.monthly_payments;
  const medianEarnings = college.latest?.earnings?.["10_yrs_after_entry"]?.median;
  const locationStr = [college.city, college.state].filter(Boolean).join(", ");
  const sat = college.admission?.sat_scores?.midpoint;
  const sat25 = college.latest?.admissions?.sat_scores?.["25th_percentile"];
  const sat75 = college.latest?.admissions?.sat_scores?.["75th_percentile"];
  const act = college.admission?.act_scores?.midpoint?.cumulative;
  const act25 = college.latest?.admissions?.act_scores?.["25th_percentile"]?.cumulative;
  const act75 = college.latest?.admissions?.act_scores?.["75th_percentile"]?.cumulative;
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
  const categoryLabel = acceptanceRate != null && acceptanceRate < 0.2 ? "REACH" : acceptanceRate != null && acceptanceRate > 0.6 ? "SAFETY" : "MATCH";
  const scorecardUrl = `https://collegescorecard.ed.gov/school/?id=${college.id}`;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: reduceMotion ? 0 : 0.07, delayChildren: reduceMotion ? 0 : 0.08 },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 14 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 28 } },
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <nav className="text-sm text-slate-500" aria-label="Breadcrumb">
        <Link href={basePath} className="font-medium text-primary-700 transition-colors hover:text-primary-600">
          Colleges
        </Link>
        <span className="mx-2 text-slate-300">/</span>
        <span className="font-semibold text-slate-900">{college.name}</span>
      </nav>

      <motion.section
        className="relative h-[300px] w-full overflow-hidden rounded-3xl border border-white/10 shadow-2xl sm:h-[340px]"
        variants={itemVariants}
      >
        {heroImageUrl ? (
          <Image src={heroImageUrl} alt="" fill className="object-cover" sizes="100vw" priority />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-[#0f1b2d] via-primary-700 to-[#162236]"
            aria-hidden
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1b2d]/95 via-slate-900/45 to-transparent" aria-hidden />
        <div className="absolute inset-0 bg-pattern opacity-20" aria-hidden />
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-9">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/15 text-2xl font-bold text-white shadow-lg backdrop-blur-md sm:h-[4.5rem] sm:w-[4.5rem]"
                aria-hidden
              >
                {initial}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-white drop-shadow-sm sm:text-3xl lg:text-4xl">
                    {college.name}
                  </h1>
                  <span
                    className={`inline-flex rounded-full border px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                      categoryLabel === "REACH"
                        ? "border-amber-300 bg-amber-200 text-amber-950"
                        : categoryLabel === "SAFETY"
                          ? "border-emerald-200 bg-emerald-100 text-emerald-900"
                          : "border-blue-200 bg-blue-100 text-blue-900"
                    }`}
                  >
                    {categoryLabel}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-200">
                  {locationStr && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-amber-300" aria-hidden />
                      {locationStr}
                    </span>
                  )}
                  <span>Private research university</span>
                </div>
              </div>
            </div>
            <motion.button
              type="button"
              onClick={toggleFavorite}
              disabled={favoriteLoading}
              whileHover={reduceMotion ? undefined : { scale: 1.03 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-[#0f2a5f] shadow-xl transition-colors hover:bg-amber-50 disabled:opacity-60 sm:mt-0"
            >
              {isFavorite ? <Star className="h-4 w-4 fill-amber-400 text-amber-500" /> : <Plus className="h-4 w-4" />}
              {isFavorite ? "On my list" : "Add to my list"}
            </motion.button>
          </div>
        </div>
      </motion.section>

      {enrich?.aboutLine && (
        <motion.p className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm leading-relaxed text-slate-600 shadow-sm" variants={itemVariants}>
          {enrich.aboutLine}
        </motion.p>
      )}

      <motion.div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-1.5 shadow-inner" variants={itemVariants}>
        <nav className="flex gap-1" aria-label="College sections">
          {TABS.map((tab) => {
            const Icon = tab.icon === "grid" ? LayoutGrid : tab.icon === "checklist" ? ClipboardList : FileText;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all sm:flex-initial sm:px-5 ${
                  active
                    ? "bg-white text-primary-700 shadow-md ring-1 ring-primary-200"
                    : "text-slate-500 hover:bg-white/60 hover:text-slate-800"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="text-xs font-semibold sm:text-sm">{tab.label}</span>
              </button>
            );
          })}
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
            <div className="space-y-6 lg:col-span-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-700">At a glance</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">Key performance indicators</h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/90 to-white p-5 shadow-md">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800/80">Acceptance rate</p>
                    <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">
                      {acceptanceRate != null
                        ? `${(acceptanceRate * 100).toFixed(1)}%`
                        : (enrich?.acceptanceNote?.includes("%") ? shortNote(enrich.acceptanceNote) : null) ?? "—"}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {acceptanceRate == null
                        ? "Selectivity data limited"
                        : acceptanceRate < 0.15
                          ? "Highly selective"
                          : acceptanceRate < 0.4
                            ? "Moderately selective"
                            : "More accessible"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-white p-5 shadow-md">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800/80">Average GPA</p>
                    <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">
                      {college.avgGpa != null ? college.avgGpa.toFixed(2) : shortNote(enrich?.gpaNote) ?? "—"}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">Unweighted, estimated</p>
                  </div>
                  <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/90 to-white p-5 shadow-md">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-violet-800/80">Enrollment</p>
                    <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">
                      {size != null
                        ? size >= 1000
                          ? `${(size / 1000).toFixed(0)}k+`
                          : size.toLocaleString()
                        : shortNote(enrich?.enrollmentNote) ?? "—"}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">Students on campus</p>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-primary-50/40 p-6 shadow-lg">
                <div className="pointer-events-none absolute -right-10 top-0 h-32 w-32 rounded-full bg-primary-400/15 blur-2xl" />
                <h2 className="flex items-center gap-2 font-bold text-primary-800">
                  <Sparkles className="h-5 w-5 text-amber-500" aria-hidden />
                  Why this college is a good fit
                  {whyFitLoading && (
                    <span className="text-xs font-normal text-slate-500">(generating…)</span>
                  )}
                </h2>
                <p className="relative mt-3 text-sm leading-relaxed text-slate-700">{whyFit}</p>
              </div>

              {/* NEW: ADMISSION REQUIREMENTS SUMMARY */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
                  <div className="flex items-center gap-2 mb-4">
                    <ClipboardList className="size-5 text-primary-600" />
                    <h3 className="font-bold text-slate-900">Admission Requirements</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                      <span className="text-slate-500">SAT Range</span>
                      <span className="font-black text-slate-900">{satTotal != null && satTotal > 0 ? satTotal : (sat25?.math ? `${(sat25.critical_reading ?? 0) + (sat25.math ?? 0)} - ${(sat75?.critical_reading ?? 0) + (sat75?.math ?? 0)}` : "Test Optional")}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                      <span className="text-slate-500">ACT Range</span>
                      <span className="font-black text-slate-900">{act != null ? act : (act25 ? `${act25} - ${act75}` : "Test Optional")}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Common App</span>
                      <span className="font-black text-emerald-600">Accepted</span>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab("requirements")} className="mt-4 text-xs font-black text-primary-700 hover:underline">View details →</button>
                </div>

                <div className="rounded-3xl border border-violet-200 bg-violet-50/30 p-6 shadow-md">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="size-5 text-violet-600" />
                    <h3 className="font-bold text-slate-900">Application Essays</h3>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 mb-4">
                    {college.name} requires a personal statement plus school-specific supplemental essays.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-white/60 p-2 rounded-xl">
                      <div className="size-1.5 rounded-full bg-violet-400" />
                      Main Personal Statement
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-white/60 p-2 rounded-xl">
                      <div className="size-1.5 rounded-full bg-violet-400" />
                      Supplemental Prompts
                    </div>
                  </div>
                  <button onClick={() => setActiveTab("essays")} className="mt-4 text-xs font-black text-violet-700 hover:underline">Prepare essays →</button>
                </div>
              </div>
            </div>

          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Costs</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">Financial snapshot</h2>
              <div className="mt-3 space-y-4 rounded-3xl border border-slate-200/90 bg-white/95 p-5 shadow-md">
                <div>
                  <p className="text-xs font-medium text-slate-500">Average tuition</p>
                  <p className="text-lg font-bold text-slate-900">
                    {tuition != null ? formatCurrency(tuition) : shortNote(enrich?.tuitionNote) ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Average annual cost</p>
                  <p className="text-lg font-bold text-slate-900">{avgNetPrice != null ? formatCurrency(avgNetPrice) : "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Room &amp; board</p>
                  <p className="text-lg font-bold text-slate-900">
                    {roomboard != null ? formatCurrency(roomboard) : shortNote(enrich?.roomboardNote) ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Typical monthly loan payment</p>
                  <p className="text-lg font-bold text-slate-900">{monthlyLoan != null ? formatCurrency(monthlyLoan) : "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Median earnings (10 years)</p>
                  <p className="text-lg font-bold text-slate-900">{medianEarnings != null ? formatCurrency(medianEarnings) : "—"}</p>
                </div>
                <a
                  href={scorecardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs font-semibold text-primary-700 hover:underline"
                >
                  View on College Scorecard →
                </a>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Net price by family income</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">By family income</h2>
              <div className="mt-3 overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-4 shadow-md">
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <dt className="text-xs text-slate-500">$0–$30,000</dt>
                    <dd className="font-semibold text-slate-900">{familyIncomeCosts?.["0-30000"] != null ? formatCurrency(familyIncomeCosts["0-30000"]) : "—"}</dd>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <dt className="text-xs text-slate-500">$30,001–$48,000</dt>
                    <dd className="font-semibold text-slate-900">{familyIncomeCosts?.["30001-48000"] != null ? formatCurrency(familyIncomeCosts["30001-48000"]) : "—"}</dd>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <dt className="text-xs text-slate-500">$48,001–$75,000</dt>
                    <dd className="font-semibold text-slate-900">{familyIncomeCosts?.["48001-75000"] != null ? formatCurrency(familyIncomeCosts["48001-75000"]) : "—"}</dd>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <dt className="text-xs text-slate-500">$75,001–$110,000</dt>
                    <dd className="font-semibold text-slate-900">{familyIncomeCosts?.["75001-110000"] != null ? formatCurrency(familyIncomeCosts["75001-110000"]) : "—"}</dd>
                  </div>
                  <div className="col-span-2 rounded-xl bg-slate-50 p-3">
                    <dt className="text-xs text-slate-500">$110,001+</dt>
                    <dd className="font-semibold text-slate-900">{familyIncomeCosts?.["110001-plus"] != null ? formatCurrency(familyIncomeCosts["110001-plus"]) : "—"}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Map</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">Location</h2>
              <div className="mt-3 overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-md">
                <iframe
                  title={`Map of ${college.name}`}
                  src={mapEmbedUrl}
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="block w-full"
                />
                <p className="border-t border-slate-100 px-4 py-3 text-sm font-semibold text-slate-800">
                  {locationStr || college.name || "—"}
                </p>
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 pb-4 text-sm font-bold text-primary-700 hover:underline"
                >
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
            <div className="rounded-3xl border border-slate-200/90 bg-white/95 p-6 shadow-onboarding-card sm:p-8">
              <div className="mb-6 h-1 w-16 rounded-full bg-gradient-to-r from-primary-600 to-amber-400" aria-hidden />
              <h2 className="text-xl font-semibold text-slate-900">Admission requirements</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Requirements vary by program. Below is a summary of typical criteria; always confirm on the official admissions site.
              </p>
              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Acceptance rate</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {acceptanceRate != null ? `${(acceptanceRate * 100).toFixed(1)}%` : shortNote(enrich?.acceptanceNote) ?? "—"}
                  </dd>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">SAT (mid 50%)</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {satTotal != null && satTotal > 0 ? satTotal : shortNote(enrich?.satNote) ?? "—"}
                  </dd>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">ACT (mid 50%)</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{act != null ? act : shortNote(enrich?.actNote) ?? "—"}</dd>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Enrollment</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {size != null ? size.toLocaleString() : shortNote(enrich?.enrollmentNote) ?? "—"}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">SAT ranges</p>
                  <p className="mt-2 text-slate-900">
                    Reading/Writing: {sat25?.critical_reading ?? "—"} - {sat75?.critical_reading ?? "—"}
                  </p>
                  <p className="text-slate-900">Math: {sat25?.math ?? "—"} - {sat75?.math ?? "—"}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">ACT range</p>
                  <p className="mt-2 text-slate-900">Composite: {act25 ?? "—"} - {act75 ?? "—"}</p>
                </div>
              </div>
              <ul className="mt-6 space-y-2.5 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-600">✓</span> High school transcript and GPA
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-600">✓</span> Standardized test scores (SAT/ACT) — check if test-optional
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-600">✓</span> Letters of recommendation (typically 1–2)
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-600">✓</span> Personal essay and/or supplemental essays
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-600">✓</span> Application fee or fee waiver
                </li>
              </ul>
              <p className="mt-6 text-xs text-slate-500">
                This summary is based on publicly available data; always confirm exact criteria with the admissions office.
              </p>
            </div>
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
            <div className="rounded-3xl border border-violet-200/80 bg-gradient-to-br from-violet-50/50 via-white to-white p-6 shadow-onboarding-card sm:p-8">
              <div className="mb-6 flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <FileText className="h-5 w-5" aria-hidden />
                </span>
                <h2 className="text-xl font-semibold text-slate-900">Application essays</h2>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                Most schools require a personal statement (e.g. Common App or Coalition essay) plus one or more school-specific supplements.
              </p>
              <div className="mt-6 space-y-5">
                <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
                  <h3 className="font-semibold text-slate-900">Common App / main essay</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Typically 250–650 words. Prompts are on the Common App or Coalition site.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
                  <h3 className="font-semibold text-slate-900">Supplemental essays</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {college.name} may require additional short-answer or essay questions. Word limits and prompts are updated each cycle on the admissions website.
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4">
                  <h3 className="font-semibold text-amber-950">Tips</h3>
                  <ul className="mt-2 space-y-1.5 text-sm text-amber-950/80">
                    <li>• Start early and allow time for revisions</li>
                    <li>• Answer the prompt directly and be specific</li>
                    <li>• Proofread and get feedback from a counselor or teacher</li>
                  </ul>
                </div>
              </div>
              <p className="mt-6 text-xs text-slate-500">
                Essay prompts and word counts can change each year; double‑check the latest instructions in your application portal.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
