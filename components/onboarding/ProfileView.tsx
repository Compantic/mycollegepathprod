"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase/client";
import { getStudentProfile } from "@/lib/firebase/firestore";
import type { StudentProfile } from "@/lib/firebase/firestore";

export function ProfileView() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }
      getStudentProfile(user.uid)
        .then(setProfile)
        .finally(() => setLoading(false));
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="rounded-card border border-bg-border bg-bg-card p-6 shadow-soft animate-pulse">
        <div className="h-4 w-1/3 bg-secondary-200 rounded" />
        <div className="mt-4 h-4 w-2/3 bg-secondary-200 rounded" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-card border border-bg-border bg-bg-card p-6 shadow-soft">
        <p className="text-[#475569]">No profile saved yet.</p>
        <Link href="/settings" className="mt-4 inline-block text-primary-500 font-medium hover:underline">
          Complete your profile in Settings →
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-bg-border bg-bg-card p-6 shadow-soft">
      <dl className="space-y-3">
        {profile.displayName && (
          <>
            <dt className="text-sm text-[#94A3B8]">Name</dt>
            <dd className="text-[#0F172A]">{profile.displayName}</dd>
          </>
        )}
        {profile.graduationYear != null && (
          <>
            <dt className="text-sm text-[#94A3B8]">Graduation year</dt>
            <dd className="text-[#0F172A]">{profile.graduationYear}</dd>
          </>
        )}
        {profile.gpa != null && (
          <>
            <dt className="text-sm text-[#94A3B8]">GPA</dt>
            <dd className="text-[#0F172A]">{profile.gpa}</dd>
          </>
        )}
        {profile.satScore != null && (
          <>
            <dt className="text-sm text-[#94A3B8]">SAT</dt>
            <dd className="text-[#0F172A]">{profile.satScore}</dd>
          </>
        )}
        {profile.actScore != null && (
          <>
            <dt className="text-sm text-[#94A3B8]">ACT</dt>
            <dd className="text-[#0F172A]">{profile.actScore}</dd>
          </>
        )}
        {profile.preferredSize && (
          <>
            <dt className="text-sm text-[#94A3B8]">Preferred size</dt>
            <dd className="text-[#0F172A]">{profile.preferredSize}</dd>
          </>
        )}
        {profile.preferredStates?.length ? (
          <>
            <dt className="text-sm text-[#94A3B8]">Preferred states</dt>
            <dd className="text-[#0F172A]">{profile.preferredStates.join(", ")}</dd>
          </>
        ) : null}
      </dl>
      <Link href="/settings" className="mt-6 inline-block text-primary-500 font-medium hover:underline">
        Edit in Settings →
      </Link>
    </div>
  );
}
