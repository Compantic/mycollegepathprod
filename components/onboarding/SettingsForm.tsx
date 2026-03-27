"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase/client";
import { getStudentProfile, setStudentProfile } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SettingsForm() {
  const [displayName, setDisplayName] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [gpa, setGpa] = useState("");
  const [satScore, setSatScore] = useState("");
  const [actScore, setActScore] = useState("");
  const [preferredSize, setPreferredSize] = useState("");
  const [preferredStates, setPreferredStates] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      getStudentProfile(user.uid).then((p) => {
        if (p) {
          setDisplayName(p.displayName ?? "");
          setGraduationYear(p.graduationYear != null ? String(p.graduationYear) : "");
          setGpa(p.gpa != null ? String(p.gpa) : "");
          setSatScore(p.satScore != null ? String(p.satScore) : "");
          setActScore(p.actScore != null ? String(p.actScore) : "");
          setPreferredSize(p.preferredSize ?? "");
          setPreferredStates(p.preferredStates?.join(", ") ?? "");
        }
        setLoading(false);
      });
    });
    return () => unsub();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    setSaving(true);
    setSaved(false);
    try {
      await setStudentProfile(user.uid, {
        displayName: displayName.trim() || undefined,
        graduationYear: graduationYear ? parseInt(graduationYear, 10) : undefined,
        gpa: gpa ? parseFloat(gpa) : undefined,
        satScore: satScore ? parseInt(satScore, 10) : undefined,
        actScore: actScore ? parseInt(actScore, 10) : undefined,
        preferredSize: preferredSize ? (preferredSize as "small" | "medium" | "large") : undefined,
        preferredStates: preferredStates
          ? preferredStates.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-card border border-bg-border bg-bg-card p-6 shadow-soft animate-pulse">
        <div className="h-10 w-full bg-secondary-200 rounded-button" />
        <div className="mt-4 h-10 w-full bg-secondary-200 rounded-button" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-card border border-bg-border bg-bg-card p-6 shadow-soft space-y-6">
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-[#0F172A]">Display name</label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          className="mt-2"
        />
      </div>
      <div>
        <label htmlFor="graduationYear" className="block text-sm font-medium text-[#0F172A]">Graduation year</label>
        <Input
          id="graduationYear"
          type="number"
          min="2024"
          max="2032"
          value={graduationYear}
          onChange={(e) => setGraduationYear(e.target.value)}
          placeholder="e.g. 2027"
          className="mt-2"
        />
      </div>
      <div>
        <label htmlFor="gpa" className="block text-sm font-medium text-[#0F172A]">GPA (0–4.0)</label>
        <Input
          id="gpa"
          type="number"
          min="0"
          max="4"
          step="0.1"
          value={gpa}
          onChange={(e) => setGpa(e.target.value)}
          placeholder="e.g. 3.5"
          className="mt-2"
        />
      </div>
      <div>
        <label htmlFor="sat" className="block text-sm font-medium text-[#0F172A]">SAT total</label>
        <Input
          id="sat"
          type="number"
          min="400"
          max="1600"
          value={satScore}
          onChange={(e) => setSatScore(e.target.value)}
          placeholder="e.g. 1200"
          className="mt-2"
        />
      </div>
      <div>
        <label htmlFor="act" className="block text-sm font-medium text-[#0F172A]">ACT composite</label>
        <Input
          id="act"
          type="number"
          min="1"
          max="36"
          value={actScore}
          onChange={(e) => setActScore(e.target.value)}
          placeholder="e.g. 24"
          className="mt-2"
        />
      </div>
      <div>
        <label htmlFor="size" className="block text-sm font-medium text-[#0F172A]">Preferred college size</label>
        <select
          id="size"
          value={preferredSize}
          onChange={(e) => setPreferredSize(e.target.value)}
          className="mt-2 w-full rounded-button border border-bg-border bg-bg-main px-4 py-2.5 text-[#0F172A] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="">Any</option>
          <option value="small">Small (under 5,000)</option>
          <option value="medium">Medium (5,000–15,000)</option>
          <option value="large">Large (over 15,000)</option>
        </select>
      </div>
      <div>
        <label htmlFor="states" className="block text-sm font-medium text-[#0F172A]">Preferred states (comma-separated, e.g. CA, NY)</label>
        <Input
          id="states"
          value={preferredStates}
          onChange={(e) => setPreferredStates(e.target.value)}
          placeholder="CA, NY, TX"
          className="mt-2"
        />
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save profile"}
      </Button>
      {saved && <p className="text-sm text-status-successText">Profile saved.</p>}
    </form>
  );
}
