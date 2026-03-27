"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Star, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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

export function CollegesSearch({
  basePath = "/colleges",
  onFavoriteChange,
}: {
  basePath?: string;
  onFavoriteChange?: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CollegeResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const { toast } = useToastOptional();

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

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() && !stateFilter) return;
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("query", query.trim());
      if (stateFilter) params.set("state", stateFilter);
      const res = await fetch(`/api/scorecard/search?${params.toString()}`);
      const data = await res.json();
      setResults(
        (data.results ?? []).map((r: {
          id: number;
          name: string;
          city?: string;
          state?: string;
          admission?: { admission_rate?: number };
          student?: { size?: number };
          latest?: { student?: { size?: number }; admission?: { admission_rate?: number } };
        }) => ({
          id: r.id,
          name: r.name,
          city: r.city,
          state: r.state,
          admissionRate: r.latest?.admission?.admission_rate ?? r.admission?.admission_rate,
          enrollment: r.latest?.student?.size ?? r.student?.size,
        }))
      );
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
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
        await removeFavoriteCollege(user.uid, college.id,);
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
        category: "Match" as "Reach" | "Match" | "Safety", // placeholder
      })),
    [results]
  );

  const showEmpty = !loading && searched && withCategory.length === 0;

  return (
    <motion.div
      className="rounded-2xl border border-bg-border bg-bg-card p-6 shadow-soft space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1 flex gap-2">
          <label htmlFor="college-search" className="sr-only">
            Search colleges by name
          </label>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" aria-hidden />
            <Input
              id="college-search"
              type="search"
              placeholder="Search by college name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            className="pl-10 rounded-xl border-bg-border h-11"
            />
          </div>
          <label htmlFor="state-filter" className="sr-only">
            State
          </label>
          <select
            id="state-filter"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="w-28 rounded-xl border border-bg-border bg-bg-main px-3 py-2.5 text-sm text-text-primary focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 h-11"
          >
            <option value="">All states</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={loading} className="rounded-xl h-11 px-5">
          {loading ? "Searching…" : "Search"}
        </Button>
      </form>

      {loading && (
        <div className="space-y-3" aria-label="Loading colleges">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!loading && !searched && (
        <p className="text-sm text-text-muted">
          Enter a college name or select a state to search.
        </p>
      )}

      {showEmpty && (
        <p className="text-sm text-text-secondary">
          No colleges found. Try a different search term or state.
        </p>
      )}

      <AnimatePresence mode="wait">
        {!loading && !showEmpty && withCategory.length > 0 && (
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ staggerChildren: 0.05, delayChildren: 0.05 }}
          >
            {withCategory.map((c, index) => {
              const isFav = favorites.has(c.id);
              const location = [c.city, c.state].filter(Boolean).join(", ");
              const accentClass =
                c.category === "Reach"
                  ? "border-l-amber-500 bg-gradient-to-br from-amber-500/5 to-bg-card"
                  : c.category === "Safety"
                  ? "border-l-emerald-500 bg-gradient-to-br from-emerald-500/5 to-bg-card"
                  : "border-l-primary-500 bg-gradient-to-br from-primary-500/5 to-bg-card";
              return (
                <motion.article
                  key={c.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  className={cn(
                    "group relative rounded-2xl border border-bg-border border-l-4 p-5 cursor-pointer transition-shadow hover:shadow-md",
                    accentClass
                  )}
                  onClick={() => router.push(`${basePath}/${c.id}`)}
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-text-primary line-clamp-2 flex-1 text-base pr-8">
                        {c.name}
                      </h3>
                      <motion.button
                        type="button"
                        onClick={(e) => toggleFavorite(c, e)}
                        disabled={!favoritesLoaded}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                          "shrink-0 p-2 rounded-xl transition-colors disabled:opacity-50 absolute top-4 right-4",
                          isFav
                            ? "text-amber-500 hover:bg-amber-500/10"
                            : "text-text-muted hover:bg-secondary-100 hover:text-amber-500"
                        )}
                        aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Star
                          className="h-5 w-5"
                          fill={isFav ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth={2}
                          aria-hidden
                        />
                      </motion.button>
                    </div>
                    {location && (
                      <p className="text-sm text-text-secondary mt-2 flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-primary-500 shrink-0" aria-hidden />
                        {location}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-muted">
                      {c.admissionRate != null && (
                        <span>
                          Acceptance: <strong className="text-text-primary">{(c.admissionRate * 100).toFixed(1)}%</strong>
                        </span>
                      )}
                      {c.enrollment != null && (
                        <span>
                          Enrollment: <strong className="text-text-primary">{c.enrollment.toLocaleString()}</strong>
                        </span>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-bg-border flex items-center justify-between gap-3">
                      <span
                        className={cn(
                          "rounded-lg px-2.5 py-1 text-xs font-semibold",
                          c.category === "Reach" && "bg-amber-100 text-amber-700",
                          c.category === "Safety" && "bg-emerald-100 text-emerald-700",
                          c.category === "Match" && "bg-primary-100 text-primary-700"
                        )}
                      >
                        {c.category}
                      </span>
                      <span className="text-sm text-primary-500 font-semibold inline-flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
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
