"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase/client";
import { getFavoriteColleges, removeFavoriteCollege } from "@/lib/firebase/firestore";
import { AppCard } from "@/components/ui/AppCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface CollegeFavoritesProps {
  basePath?: string;
  /** When this value changes, favorites list is refetched (e.g. after add/remove elsewhere). */
  refreshTrigger?: number;
}

export function CollegeFavorites({ basePath = "/app/colleges", refreshTrigger = 0 }: CollegeFavoritesProps) {
  const [list, setList] = useState<{ collegeId: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setUserId(user?.uid ?? null);
    });
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
  }, [userId, refreshTrigger]);

  async function handleRemove(collegeId: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!userId) return;
    setRemovingId(collegeId);
    try {
      await removeFavoriteCollege(userId, collegeId);
      setList((prev) => prev.filter((f) => f.collegeId !== collegeId));
    } catch {
      // ignore
    } finally {
      setRemovingId(null);
    }
  }

  if (!userId) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500/15 text-primary-500" aria-hidden>★</span>
          My Favorites
        </h2>
        {list.length > 0 && (
          <span className="text-sm text-text-muted">{list.length} college{list.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className={`h-24 rounded-card border-l-4 ${i === 1 ? "border-l-primary-500" : i === 2 ? "border-l-status-successText" : "border-l-status-warningText"}`} />
          ))}
        </div>
      ) : list.length === 0 ? (
        <AppCard className="p-8 text-center border-l-4 border-l-primary-500 bg-gradient-to-br from-primary-500/8 via-bg-card to-status-infoBg/20">
          <p className="text-text-secondary text-sm">
            You haven&apos;t added any favorites yet. Search for colleges and add them to your list.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 border-primary-500/50 text-primary-600 hover:bg-primary-500/10"
            onClick={() => document.getElementById("college-search")?.focus()}
          >
            Search colleges
          </Button>
        </AppCard>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((fav, idx) => {
            const accent = [ "border-l-primary-500 bg-gradient-to-br from-primary-500/6 to-bg-card", "border-l-status-successText bg-gradient-to-br from-status-successBg/30 to-bg-card", "border-l-status-warningText bg-gradient-to-br from-status-warningBg/30 to-bg-card" ][idx % 3];
            return (
            <AppCard
              key={fav.collegeId}
              as="article"
              className={`group p-4 transition-shadow hover:shadow-md border-l-4 ${accent}`}
            >
              <Link
                href={`${basePath}/${fav.collegeId}`}
                className="flex items-center justify-between gap-3 no-underline text-inherit"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-text-primary truncate">{fav.name}</h3>
                  <p className="text-xs text-text-muted mt-0.5">View details →</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleRemove(fav.collegeId, e)}
                  disabled={removingId === fav.collegeId}
                  className="shrink-0 rounded-button p-2 text-text-muted hover:bg-status-dangerBg hover:text-status-dangerText disabled:opacity-50 transition-colors"
                  aria-label="Remove from favorites"
                >
                  {removingId === fav.collegeId ? "…" : "★"}
                </button>
              </Link>
            </AppCard>
          );
          })}
        </div>
      )}
    </section>
  );
}
