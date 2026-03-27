"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ListChecks, Star, Trash2, GraduationCap, Sparkles, ChevronRight, Search } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { getFavoriteColleges, removeFavoriteCollege } from "@/lib/firebase/firestore";
import { CollegesSearch } from "./CollegesSearch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const basePath = "/app/colleges";
const PER_PAGE = 5;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function CollegesPageContent() {
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

  return (
    <motion.div
      className="min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Hero header */}
      <motion.header
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl mb-8 sm:mb-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-500 to-indigo-600"
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, rgba(255,255,255,0.15) 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 40%)`,
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
          aria-hidden
        />
        <div className="relative px-6 sm:px-8 py-8 sm:py-10">
          <nav className="text-sm text-white/80 mb-6" aria-label="Breadcrumb">
            <Link href="/app/dashboard" className="hover:text-white transition-colors">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white font-medium">My College List</span>
          </nav>
          <motion.div
            className="flex flex-col gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-1.5 w-fit text-sm font-medium text-white">
              <Sparkles className="h-4 w-4" aria-hidden />
              Personalized college list hub
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight max-w-2xl">
              My College List
            </h1>
            <p className="text-base sm:text-lg text-white/90 max-w-xl">
              Save schools you&apos;re interested in, then jump into details, matching, and AI guidance from one place.
            </p>
          </motion.div>
        </div>
      </motion.header>

      {/* Summary cards */}
      <motion.div
        className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 mb-8"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div
          variants={item}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.99 }}
          className="group relative overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-soft p-6 flex items-center justify-between bg-gradient-to-br from-primary-500/10 via-bg-card to-transparent hover:shadow-md transition-shadow"
        >
          <div className="relative z-10">
            <p className="text-xs font-bold text-primary-600 uppercase tracking-wider">Total colleges</p>
            <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-text-primary tabular-nums">
              {loading ? "—" : list.length}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Favorites you&apos;ve saved for deeper research.
            </p>
          </div>
          <motion.div
            className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-500 text-white shadow-lg"
            whileHover={{ rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <ListChecks className="h-7 w-7" aria-hidden />
          </motion.div>
        </motion.div>

        <motion.div
          variants={item}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.99 }}
          className="group relative overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-soft p-6 flex items-center justify-between bg-gradient-to-br from-amber-500/10 via-bg-card to-transparent hover:shadow-md transition-shadow"
        >
          <div className="relative z-10">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Targeting reach schools</p>
            <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-amber-600 tabular-nums">
              {loading ? "—" : reachCount}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Ambitious options to keep your list balanced.
            </p>
          </div>
          <motion.div
            className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg"
            whileHover={{ rotate: -5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Star className="h-7 w-7 fill-current" aria-hidden />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* College list card */}
      <motion.div
        className="rounded-2xl border border-bg-border bg-bg-card shadow-soft overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        {loading ? (
          <div className="p-6 sm:p-8 space-y-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : list.length === 0 ? (
          <motion.div
            className="p-10 sm:p-14 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-500 mb-6"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <GraduationCap className="h-10 w-10" aria-hidden />
            </motion.div>
            <p className="text-lg font-medium text-text-primary">You haven&apos;t added any colleges yet.</p>
            <p className="mt-1 text-sm text-text-secondary max-w-sm mx-auto">
              Search below and add schools to build your personalized list.
            </p>
            <Button
              className="mt-6 gap-2"
              size="lg"
              onClick={scrollToSearch}
            >
              <Search className="h-4 w-4" aria-hidden />
              Add College
            </Button>
          </motion.div>
        ) : (
          <>
            <div className="px-5 sm:px-6 pt-5 pb-3 border-b border-bg-border bg-secondary-100/40">
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Favorites</p>
              <p className="text-sm text-text-secondary mt-0.5">
                Click a college to open its profile, or remove it from your list.
              </p>
            </div>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm" role="table">
                <thead>
                  <tr className="border-b border-bg-border bg-secondary-100/50">
                    <th className="text-left py-4 px-5 font-semibold text-text-muted uppercase tracking-wider">College Name</th>
                    <th className="w-24 py-4 px-4 text-right font-semibold text-text-muted uppercase tracking-wider">Actions</th>
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
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: index * 0.04 }}
                          className="border-b border-bg-border last:border-0 hover:bg-primary-500/5 transition-colors"
                        >
                          <td className="py-4 px-5">
                            <Link
                              href={`${basePath}/${fav.collegeId}`}
                              className="flex items-center gap-4 no-underline text-inherit group/link"
                            >
                              <motion.span
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-sm font-bold text-primary-600"
                                whileHover={{ scale: 1.05 }}
                                aria-hidden
                              >
                                {initial}
                              </motion.span>
                              <span className="font-semibold text-text-primary group-hover/link:text-primary-600 transition-colors">
                                {fav.name}
                              </span>
                              <ChevronRight className="h-4 w-4 text-text-muted group-hover/link:text-primary-500 ml-auto opacity-0 group-hover/link:opacity-100 transition-all" aria-hidden />
                            </Link>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={async () => {
                                if (!userId) return;
                                try {
                                  await removeFavoriteCollege(userId, fav.collegeId);
                                  refreshFavorites();
                                } catch {
                                  // ignore
                                }
                              }}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
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

            <div className="sm:hidden divide-y divide-bg-border">
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
                      transition={{ delay: index * 0.04 }}
                      className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-secondary-100/40 transition-colors"
                    >
                      <Link
                        href={`${basePath}/${fav.collegeId}`}
                        className="flex flex-1 items-center gap-3 no-underline text-inherit min-w-0"
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-sm font-bold text-primary-600">
                          {initial}
                        </span>
                        <span className="font-semibold text-text-primary line-clamp-2">{fav.name}</span>
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
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
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
                className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 border-t border-bg-border text-sm bg-secondary-100/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <span className="text-text-muted">
                  Showing {start + 1}–{Math.min(start + PER_PAGE, list.length)} of {list.length}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
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
                        "h-9 min-w-[2.25rem] rounded-lg font-medium text-sm transition-colors",
                        p === page
                          ? "bg-primary-500 text-white shadow-sm"
                          : "border border-bg-border bg-bg-card text-text-secondary hover:bg-secondary-100"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
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

      {/* AI suggestion banner */}
      <motion.div
        className="rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-500/5 to-indigo-500/5 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 mt-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        whileHover={{ scale: 1.005 }}
      >
        <span className="shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/20 text-primary-600" aria-hidden>
          <Sparkles className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-text-primary">Need help balancing your list?</p>
          <p className="text-sm text-text-secondary mt-0.5">
            Our AI Counselor suggests adding at least 2 more Safety schools to increase your chances of admission.
          </p>
        </div>
        <Link
          href="/app/chat"
          className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 transition-colors"
        >
          Get AI Suggestions
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </motion.div>

      {/* Search section */}
      <motion.section
        id="search-colleges"
        className="space-y-5 pt-10 border-t border-bg-border mt-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <h2 className="text-xl font-bold text-text-primary">Search colleges to add</h2>
        <CollegesSearch basePath={basePath} onFavoriteChange={refreshFavorites} />
      </motion.section>

      <motion.footer
        className="pt-12 pb-6 text-center text-sm text-text-muted"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        © {new Date().getFullYear()} MyCollegePath.ai — Your personalized roadmap to higher education.
      </motion.footer>
    </motion.div>
  );
}
