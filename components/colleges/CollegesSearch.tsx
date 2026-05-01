"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { MapPin, Star, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/firebase/client";
import { addFavoriteCollege, removeFavoriteCollege, getFavoriteColleges } from "@/lib/firebase/firestore";
import { useToastOptional } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface CollegeResult {
  id: number;
  name: string;
  city?: string;
  state?: string;
  admissionRate?: number;
  enrollment?: number;
}

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
];

function mapApiRow(r: {
  id: number;
  name: string;
  city?: string;
  state?: string;
  admission?: { admission_rate?: number };
  student?: { size?: number };
  latest?: { student?: { size?: number }; admission?: { admission_rate?: number } };
}): CollegeResult {
  return {
    id: r.id,
    name: r.name,
    city: r.city,
    state: r.state,
    admissionRate: r.latest?.admission?.admission_rate ?? r.admission?.admission_rate,
    enrollment: r.latest?.student?.size ?? r.student?.size,
  };
}

export function CollegesSearch({
  basePath = "/colleges",
  onFavoriteChange,
}: {
  basePath?: string;
  onFavoriteChange?: () => void;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CollegeResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const { toast } = useToastOptional();

  const [didYouMean, setDidYouMean] = useState<{ id: number; name: string } | null>(null);
  const [searchUnavailable, setSearchUnavailable] = useState(false);
  const [searchUnavailableMsg, setSearchUnavailableMsg] = useState("");

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setFavorites(new Set());
        setFavoritesLoaded(true);
        return;
      }
      try {
        const favs = await getFavoriteColleges(user.uid);
        setFavorites(new Set(favs.map((f) => f.collegeId)));
      } finally {
        setFavoritesLoaded(true);
      }
    });
    return () => unsub();
  }, []);

  const runSearch = useCallback(
    async (q: string, state: string) => {
      setLoading(true);
      setSearched(true);
      setDidYouMean(null);
      setSearchUnavailable(false);
      setSearchUnavailableMsg("");
      try {
        const params = new URLSearchParams();
        if (q.trim()) params.set("query", q.trim());
        if (state) params.set("state", state);
        params.set("per_page", "24");
        const res = await fetch(`/api/scorecard/search?${params.toString()}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setResults([]);
          setDidYouMean(null);
          setSearchUnavailable(false);
          setSearchUnavailableMsg("");
          if (res.status === 429) {
            toast({
              title: "Too many searches",
              description: typeof data?.error === "string" ? data.error : "Please wait a minute and try again.",
              variant: "error",
            });
          } else if (res.status === 503) {
            toast({
              title: "College search not configured",
              description: typeof data?.error === "string" ? data.error : "Add your College Scorecard API key to .env.local.",
              variant: "error",
            });
          } else if (res.status >= 500) {
            toast({
              title: "Search error",
              description: typeof data?.error === "string" ? data.error : "Please try again.",
              variant: "error",
            });
          }
          return;
        }
        const rows = (data.results ?? []).map(mapApiRow);
        if (data.unavailable) {
          setResults(rows);
          setDidYouMean(null);
          setSearchUnavailable(rows.length === 0);
          setSearchUnavailableMsg(
            typeof data.message === "string" ? data.message : "The college directory is temporarily unavailable."
          );
          return;
        }
        setSearchUnavailable(false);
        setSearchUnavailableMsg("");
        setResults(rows);
        const dym = data.didYouMean as { id?: number; name?: string } | null | undefined;
        if (dym?.id != null && dym?.name) setDidYouMean({ id: dym.id, name: dym.name });
        else setDidYouMean(null);
      } catch {
        setResults([]);
        setDidYouMean(null);
        setSearchUnavailable(false);
        setSearchUnavailableMsg("");
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() && !stateFilter) return;
    await runSearch(query, stateFilter);
  }

  async function toggleFavorite(college: CollegeResult, e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      router.push("/login?from=/app/colleges");
      return;
    }
    const isFav = favorites.has(college.id);
    try {
      if (isFav) {
        await removeFavoriteCollege(user.uid, college.id);
        setFavorites((prev) => {
          const next = new Set(prev);
          next.delete(college.id);
          return next;
        });
        toast({ description: "Removed from favorites.", variant: "success" });
      } else {
        await addFavoriteCollege(user.uid, college.id, college.name);
        setFavorites((prev) => new Set(prev).add(college.id));
        toast({ description: "Added to favorites.", variant: "success" });
      }
      onFavoriteChange?.();
    } catch {
      toast({ description: "Could not update favorites.", variant: "error" });
    }
  }

  const withCategory = useMemo(
    () =>
      results.map((c) => ({
        ...c,
        category: "Match" as "Reach" | "Match" | "Safety",
      })),
    [results]
  );

  const showEmpty = !loading && searched && withCategory.length === 0;

  return (
    <motion.div
      className="space-y-6 rounded-3xl border border-slate-200/90 bg-white/95 p-6 shadow-onboarding-card backdrop-blur-sm sm:p-7"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
    >
      <div className="h-0.5 rounded-full bg-gradient-to-r from-primary-600 via-amber-300 to-primary-500 opacity-80" aria-hidden />

      <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <label htmlFor="college-search" className="sr-only">
            Search colleges by name
          </label>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              id="college-search"
              type="search"
              autoComplete="off"
              placeholder="Search by college name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="onboarding-input h-12 w-full pl-10 pr-10"
            />
          </div>
          <label htmlFor="state-filter" className="sr-only">
            State
          </label>
          <select
            id="state-filter"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="onboarding-select h-12 w-full sm:w-36"
          >
            <option value="">All states</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="h-12 shrink-0 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-6 font-bold shadow-lg shadow-primary-600/20 hover:scale-[1.02] sm:w-auto"
        >
          {loading ? "Searching…" : "Search"}
        </Button>
      </form>

      <p className="text-xs text-slate-500">Type a school name, then press Search for the full grid.</p>

      {loading && (
        <div className="space-y-3" aria-label="Loading colleges">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {!loading && !searched && (
        <p className="text-sm text-slate-500">Enter a college name or pick a state, then search.</p>
      )}

      {showEmpty && searchUnavailable && (
        <div
          className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950"
          role="status"
        >
          {searchUnavailableMsg}
        </div>
      )}

      {showEmpty && !searchUnavailable && (
        <div className="space-y-3">
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            No colleges found. Try another name or state.
          </p>
          {didYouMean && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary-200 bg-primary-50/40 px-4 py-3 text-sm text-slate-800">
              <span className="text-slate-600">Did you mean</span>
              <button
                type="button"
                onClick={() => router.push(`${basePath}/${didYouMean.id}`)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-primary-700 shadow-sm ring-1 ring-primary-200/80 transition hover:bg-primary-50"
              >
                {didYouMean.name}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
              <span className="text-slate-500">?</span>
            </div>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        {!loading && !showEmpty && withCategory.length > 0 && (
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ staggerChildren: reduceMotion ? 0 : 0.05, delayChildren: reduceMotion ? 0 : 0.04 }}
          >
            {withCategory.map((c, index) => {
              const isFav = favorites.has(c.id);
              const location = [c.city, c.state].filter(Boolean).join(", ");
              const accentClass =
                c.category === "Reach"
                  ? "border-amber-200 bg-gradient-to-br from-amber-50/90 to-white"
                  : c.category === "Safety"
                    ? "border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-white"
                    : "border-blue-200 bg-gradient-to-br from-blue-50/90 to-white";
              return (
                <motion.article
                  key={c.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduceMotion ? 0 : index * 0.04, type: "spring", stiffness: 320, damping: 28 }}
                  whileHover={reduceMotion ? undefined : { y: -4, transition: { duration: 0.2 } }}
                  className={cn(
                    "group relative cursor-pointer rounded-2xl border-2 p-5 shadow-md transition-shadow hover:shadow-xl",
                    accentClass
                  )}
                  onClick={() => router.push(`${basePath}/${c.id}`)}
                >
                  <div className="flex h-full flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="flex-1 pr-10 text-base font-bold leading-snug text-slate-900 line-clamp-2">
                        {c.name}
                      </h3>
                      <motion.button
                        type="button"
                        onClick={(e) => toggleFavorite(c, e)}
                        disabled={!favoritesLoaded}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.94 }}
                        className={cn(
                          "absolute right-4 top-4 shrink-0 rounded-xl p-2 transition-colors disabled:opacity-50",
                          isFav ? "text-amber-500 hover:bg-amber-100" : "text-slate-400 hover:bg-white hover:text-amber-500"
                        )}
                        aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Star className="h-5 w-5" fill={isFav ? "currentColor" : "none"} strokeWidth={2} aria-hidden />
                      </motion.button>
                    </div>
                    {location && (
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
                        <MapPin className="h-4 w-4 shrink-0 text-primary-600" aria-hidden />
                        {location}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                      {c.admissionRate != null && (
                        <span>
                          Acceptance:{" "}
                          <strong className="text-slate-800">{(c.admissionRate * 100).toFixed(1)}%</strong>
                        </span>
                      )}
                      {c.enrollment != null && (
                        <span>
                          Enrollment: <strong className="text-slate-800">{c.enrollment.toLocaleString()}</strong>
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200/80 pt-4">
                      <span
                        className={cn(
                          "rounded-lg px-2.5 py-1 text-xs font-bold",
                          c.category === "Reach" && "border border-amber-300 bg-amber-200 text-amber-950",
                          c.category === "Safety" && "border border-emerald-200 bg-emerald-100 text-emerald-900",
                          c.category === "Match" && "border border-primary-200 bg-primary-100 text-primary-800"
                        )}
                      >
                        {c.category}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-sm font-bold text-primary-700 transition-all group-hover:gap-1.5">
                        Details
                        <ChevronRight className="h-4 w-4" aria-hidden />
                      </span>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
