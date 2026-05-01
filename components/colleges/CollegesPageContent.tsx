"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ListChecks, Star, Trash2, GraduationCap, Sparkles, ChevronRight, Search } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { getFavoriteColleges, removeFavoriteCollege } from "@/lib/firebase/firestore";
import { CollegesSearch } from "./CollegesSearch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const basePath = "/app/colleges";
const PER_PAGE = 5;

export function CollegesPageContent() {
  const reduceMotion = useReducedMotion();
  const [favoritesRefresh, setFavoritesRefresh] = useState(0);
  const [list, setList] = useState<{ collegeId: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const scrollToSearch = () => document.getElementById("search-colleges")?.scrollIntoView({ behavior: "smooth" });

  const refreshFavorites = useCallback(() => {
    setFavoritesRefresh((k) => k + 1);
  }, []);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUserId(u?.uid ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userId) {
      setList([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getFavoriteColleges(userId)
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [userId, favoritesRefresh]);

  const totalPages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const start = (page - 1) * PER_PAGE;
  const paginatedList = list.slice(start, start + PER_PAGE);
  const reachCount = list.length ? Math.ceil(list.length / 3) : 0;

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: reduceMotion ? 0 : 0.07, delayChildren: reduceMotion ? 0 : 0.08 },
    },
  };
  const item = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 320, damping: 28 },
    },
  };

  return (
    <motion.div
      className="min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.35 }}
    >
      <motion.header
        className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 shadow-2xl sm:mb-10"
        initial={reduceMotion ? false : { opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
      >
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#0f1b2d] via-primary-700 to-[#162236]"
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, rgba(252,211,77,0.12) 0%, transparent 45%),
              radial-gradient(circle at 80% 20%, rgba(43,95,217,0.25) 0%, transparent 40%)`,
          }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-pattern opacity-25" aria-hidden />
        <div className="relative px-6 py-9 sm:px-10 sm:py-11">
          <nav className="mb-6 text-sm text-slate-300" aria-label="Breadcrumb">
            <Link href="/app/dashboard" className="transition-colors hover:text-white">
              Home
            </Link>
            <span className="mx-2 text-slate-500">/</span>
            <span className="font-semibold text-white">My College List</span>
          </nav>
          <motion.div
            className="flex max-w-3xl flex-col gap-4"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.1, type: "spring", stiffness: 300, damping: 28 }}
          >
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Personalized college list hub
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              My College List
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              <span className="italic text-amber-200/90">Save, compare, and act.</span> Jump into details, matching, and AI guidance from one place.
            </p>
          </motion.div>
        </div>
      </motion.header>

      <motion.div
        className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div
          variants={item}
          whileHover={reduceMotion ? undefined : { y: -4, transition: { duration: 0.2 } }}
          className="group relative flex items-center justify-between overflow-hidden rounded-3xl border border-blue-200/80 bg-gradient-to-br from-blue-50/90 via-white to-white p-6 shadow-onboarding-card"
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary-400/15 blur-2xl" />
          <div className="relative z-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-700">Total colleges</p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900 sm:text-4xl">
              {loading ? "—" : list.length}
            </p>
            <p className="mt-1 text-sm text-slate-600">Favorites you&apos;ve saved for deeper research.</p>
          </div>
          <motion.div
            className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-lg"
            whileHover={reduceMotion ? undefined : { rotate: 6, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
          >
            <ListChecks className="h-8 w-8" aria-hidden />
          </motion.div>
        </motion.div>

        <motion.div
          variants={item}
          whileHover={reduceMotion ? undefined : { y: -4, transition: { duration: 0.2 } }}
          className="group relative flex items-center justify-between overflow-hidden rounded-3xl border border-amber-200/90 bg-gradient-to-br from-amber-50/90 via-white to-white p-6 shadow-onboarding-card"
        >
          <div className="pointer-events-none absolute -right-6 bottom-0 h-24 w-24 rounded-full bg-amber-300/25 blur-2xl" />
          <div className="relative z-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-800">Targeting reach schools</p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-amber-900 sm:text-4xl">
              {loading ? "—" : reachCount}
            </p>
            <p className="mt-1 text-sm text-slate-600">Ambitious picks to keep your list balanced.</p>
          </div>
          <motion.div
            className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-amber-950 shadow-lg"
            whileHover={reduceMotion ? undefined : { rotate: -6, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
          >
            <Star className="h-8 w-8 fill-current" aria-hidden />
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div
        className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 shadow-onboarding-card backdrop-blur-sm"
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduceMotion ? 0 : 0.12, type: "spring", stiffness: 280, damping: 28 }}
      >
        <div className="h-1 bg-gradient-to-r from-primary-600 via-amber-300 to-primary-500" aria-hidden />
        {loading ? (
          <div className="space-y-4 p-6 sm:p-8">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : list.length === 0 ? (
          <motion.div
            className="px-6 py-14 text-center sm:py-16"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reduceMotion ? 0 : 0.15 }}
          >
            <motion.div
              className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-500/15 to-violet-100 text-primary-700 shadow-inner ring-1 ring-primary-200/50"
              animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <GraduationCap className="h-12 w-12" aria-hidden />
            </motion.div>
            <p className="text-xl font-semibold text-slate-900">You haven&apos;t added any colleges yet.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
              Search below and add schools to build your personalized list.
            </p>
            <Button
              className="mt-8 gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-6 text-base font-bold shadow-lg shadow-primary-600/25 hover:scale-[1.02]"
              size="lg"
              onClick={scrollToSearch}
            >
              <Search className="h-4 w-4" aria-hidden />
              Add college
            </Button>
          </motion.div>
        ) : (
          <>
            <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Favorites</p>
              <p className="mt-1 text-sm text-slate-600">
                Open a school for the full profile, or remove it from your list.
              </p>
            </div>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-sm" role="table">
                <thead>
                  <tr className="border-b border-slate-100 bg-white">
                    <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      College name
                    </th>
                    <th className="w-28 px-4 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {paginatedList.map((fav, index) => {
                      const initial = fav.name.replace(/\b(\w)/g, (_, c) => c).slice(0, 2).toUpperCase() || "—";
                      return (
                        <motion.tr
                          key={fav.collegeId}
                          layout
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="border-b border-slate-100 transition-colors last:border-0 hover:bg-primary-500/[0.04]"
                        >
                          <td className="px-5 py-4">
                            <Link
                              href={`${basePath}/${fav.collegeId}`}
                              className="group/link flex items-center gap-4 text-inherit no-underline"
                            >
                              <motion.span
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/15 to-blue-50 text-sm font-bold text-primary-700 ring-1 ring-primary-200/60"
                                whileHover={{ scale: 1.06 }}
                                aria-hidden
                              >
                                {initial}
                              </motion.span>
                              <span className="font-semibold text-slate-900 transition-colors group-hover/link:text-primary-700">
                                {fav.name}
                              </span>
                              <ChevronRight className="ml-auto h-4 w-4 text-slate-400 opacity-0 transition-all group-hover/link:translate-x-0.5 group-hover/link:text-primary-600 group-hover/link:opacity-100" aria-hidden />
                            </Link>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.96 }}
                              onClick={async () => {
                                if (!userId) return;
                                try {
                                  await removeFavoriteCollege(userId, fav.collegeId);
                                  refreshFavorites();
                                } catch {
                                  // ignore
                                }
                              }}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden />
                              Remove
                            </motion.button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 sm:hidden">
              <AnimatePresence mode="popLayout">
                {paginatedList.map((fav, index) => {
                  const initial = fav.name.replace(/\b(\w)/g, (_, c) => c).slice(0, 2).toUpperCase() || "—";
                  return (
                    <motion.div
                      key={fav.collegeId}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-slate-50/80"
                    >
                      <Link href={`${basePath}/${fav.collegeId}`} className="flex min-w-0 flex-1 items-center gap-3 no-underline">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-500/12 text-sm font-bold text-primary-700">
                          {initial}
                        </span>
                        <span className="line-clamp-2 font-semibold text-slate-900">{fav.name}</span>
                      </Link>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!userId) return;
                          try {
                            await removeFavoriteCollege(userId, fav.collegeId);
                            refreshFavorites();
                          } catch {
                            // ignore
                          }
                        }}
                        className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        Remove
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {list.length > PER_PAGE && (
              <motion.div
                className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/50 px-5 py-4 text-sm"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <span className="text-slate-500">
                  Showing {start + 1}–{Math.min(start + PER_PAGE, list.length)} of {list.length}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-slate-200"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={cn(
                        "h-9 min-w-[2.25rem] rounded-xl text-sm font-semibold transition-colors",
                        p === page
                          ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-slate-200"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </motion.div>

      <motion.div
        className="mt-8 flex flex-col gap-4 rounded-3xl border border-violet-200/90 bg-gradient-to-r from-violet-50/90 via-white to-blue-50/80 p-6 shadow-lg sm:flex-row sm:items-center sm:gap-6 sm:p-7"
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduceMotion ? 0 : 0.15, type: "spring", stiffness: 280, damping: 28 }}
        whileHover={reduceMotion ? undefined : { scale: 1.005 }}
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-primary-600 text-white shadow-lg" aria-hidden>
          <Sparkles className="h-7 w-7" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900">Need help balancing your list?</p>
          <p className="mt-1 text-sm text-slate-600">
            Our AI counselor can suggest safety, match, and reach mixes tailored to your profile.
          </p>
        </div>
        <Link
          href="/app/chat"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary-600/25 transition-transform hover:scale-[1.02]"
        >
          Get AI suggestions
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </motion.div>

      <motion.section
        id="search-colleges"
        className="mt-12 space-y-5 border-t border-slate-200/80 pt-10"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduceMotion ? 0 : 0.2 }}
      >
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-700">Discover</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Search colleges to add</h2>
          <p className="mt-1 text-sm text-slate-600">Filter by state or name — results open in one click.</p>
        </div>
        <CollegesSearch basePath={basePath} onFavoriteChange={refreshFavorites} />
      </motion.section>

      <motion.footer
        className="pb-6 pt-12 text-center text-sm text-slate-500"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduceMotion ? 0 : 0.25 }}
      >
        © {new Date().getFullYear()} MyCollegePath — Your personalized roadmap to higher education.
      </motion.footer>
    </motion.div>
  );
}
