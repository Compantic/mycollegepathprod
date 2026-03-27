"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  GraduationCap,
  Award,
  Users,
  List,
  BarChart3,
  CheckSquare,
  Calendar,
  Brain,
  Star,
  ClipboardList,
  Lightbulb,
  Megaphone,
  FlaskConical,
  Heart,
  ChevronRight,
  Edit3,
  Palette,
  Camera,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { computeProfileStrength } from "@/lib/profile/profileStrength";
import { cn } from "@/lib/utils";
import type { GradeLevel } from "@/lib/onboarding/schema";
import type { OnboardingDraft } from "@/lib/onboarding/types";
import { OnboardingSummary } from "@/components/profile/OnboardingSummary";
import { ProfileStepEditorModal } from "@/components/profile/ProfileStepEditorModal";
import { auth } from "@/lib/firebase/client";
import { getStudentProfile, setStudentProfile } from "@/lib/firebase/firestore";
import { uploadProfilePhoto } from "@/lib/firebase/storage";
import { persistOnboardingToFirestore, saveOnboardingDraft } from "@/lib/onboarding/storage";
import { useToastOptional } from "@/components/ui/toast";

const PROFILE_HEADER_COLOR_KEY = "profileHeaderColor";

const HEADER_COLORS: { id: string; label: string; from: string; to: string }[] = [
  { id: "blue", label: "Blue", from: "#2563eb", to: "#3b82f6" },
  { id: "indigo", label: "Indigo", from: "#4f46e5", to: "#6366f1" },
  { id: "violet", label: "Violet", from: "#7c3aed", to: "#8b5cf6" },
  { id: "emerald", label: "Emerald", from: "#059669", to: "#10b981" },
  { id: "teal", label: "Teal", from: "#0d9488", to: "#14b8a6" },
  { id: "amber", label: "Amber", from: "#d97706", to: "#f59e0b" },
  { id: "rose", label: "Rose", from: "#e11d48", to: "#f43f5e" },
  { id: "slate", label: "Slate", from: "#475569", to: "#64748b" },
  { id: "sky", label: "Sky", from: "#0284c7", to: "#0ea5e9" },
];

export interface ProfilePageContentProps {
  onboardingAnswers: OnboardingDraft | null;
  profilePhotoUrl?: string | null;
}

function hasAcademicData(o: OnboardingDraft | null): boolean {
  if (!o) return false;
  return (
    o.gpa != null ||
    o.satScore != null ||
    o.actScore != null ||
    (o.examsTaken?.length ?? 0) > 0 ||
    (o.rigorousApCompleted ?? 0) + (o.rigorousApThisYear ?? 0) + (o.rigorousIbCompleted ?? 0) + (o.rigorousIbThisYear ?? 0) + (o.rigorousHonorsCompleted ?? 0) + (o.rigorousHonorsThisYear ?? 0) > 0 ||
    o.researchPrograms === "Yes"
  );
}

function hasExtracurricularsData(o: OnboardingDraft | null): boolean {
  if (!o) return false;
  const hasActivities = (o.activityTypes?.length ?? 0) > 0;
  const hasAwards =
    (o.awardsSchool?.length ?? 0) > 0 ||
    (o.awardsState?.length ?? 0) > 0 ||
    (o.awardsNational?.length ?? 0) > 0 ||
    (o.awardsInternational?.length ?? 0) > 0;
  return hasActivities || hasAwards;
}

function hasAnyProfileData(o: OnboardingDraft | null): boolean {
  if (!o) return false;
  return (
    (o.firstName?.trim()?.length ?? 0) > 0 ||
    (o.lastName?.trim()?.length ?? 0) > 0 ||
    (o.currentHighSchool?.trim()?.length ?? 0) > 0 ||
    o.expectedGraduationYear != null ||
    o.graduationYear != null ||
    o.gradeLevel != null ||
    o.gpa != null ||
    o.satScore != null ||
    o.satTotal != null ||
    o.actScore != null ||
    o.actComposite != null ||
    (o.activityTypes?.length ?? 0) > 0 ||
    (o.awardsSchool?.length ?? 0) > 0 ||
    (o.awardsState?.length ?? 0) > 0 ||
    (o.awardsNational?.length ?? 0) > 0 ||
    (o.awardsInternational?.length ?? 0) > 0
  );
}

const navItems = [
  { id: "academic", label: "Academic Profile", icon: GraduationCap },
  { id: "achievements", label: "Achievements", icon: Award },
  { id: "activities", label: "Activities", icon: Users },
  { id: "college-list", label: "College List", icon: List },
  { id: "onboarding", label: "Full Questionnaire", icon: ClipboardList },
];

function getStoredHeaderColor(): string {
  if (typeof window === "undefined") return "blue";
  return window.localStorage.getItem(PROFILE_HEADER_COLOR_KEY) || "blue";
}

export function ProfilePageContent({ onboardingAnswers, profilePhotoUrl }: ProfilePageContentProps) {
  const [activeSection, setActiveSection] = useState("academic");
  const [isEditingBasics, setIsEditingBasics] = useState(false);
  const [savingBasics, setSavingBasics] = useState(false);
  const [basicForm, setBasicForm] = useState({
    gpa: "",
    gradYear: "",
    gradeLevel: "",
    sat: "",
    act: "",
  });
  const [showFullQuestionnaire, setShowFullQuestionnaire] = useState(false);
  const [showEditQuestionnaire, setShowEditQuestionnaire] = useState(false);
  const [savingQuestionnaire, setSavingQuestionnaire] = useState(false);
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [savingStep, setSavingStep] = useState(false);
  const [displayPhotoUrl, setDisplayPhotoUrl] = useState<string | null>(profilePhotoUrl ?? null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [headerColorId, setHeaderColorId] = useState<string>("blue");
  const [fullForm, setFullForm] = useState({
    firstName: "",
    lastName: "",
    currentHighSchool: "",
    city: "",
    state: "",
    gpa: "",
    gradYear: "",
    gradeLevel: "",
    sat: "",
    act: "",
  });
  const router = useRouter();
  const { toast } = useToastOptional();

  // Sync and refetch profile photo (server may not have it yet after signup, or cache)
  useEffect(() => {
    setDisplayPhotoUrl(profilePhotoUrl ?? null);
  }, [profilePhotoUrl]);
  // Refetch photo from Firestore on mount (fixes photo missing after onboarding when server had stale data)
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    getStudentProfile(uid).then((p) => {
      if (p?.profilePhotoUrl) setDisplayPhotoUrl((prev) => prev || (p.profilePhotoUrl ?? null));
    });
  }, []);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please choose an image file.", variant: "error" });
      return;
    }
    const uid = auth.currentUser?.uid;
    if (!uid) {
      router.push("/login?redirect=/app/profile");
      return;
    }
    setUploadingPhoto(true);
    e.target.value = "";
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const url = await uploadProfilePhoto(uid, dataUrl);
      await setStudentProfile(uid, { profilePhotoUrl: url });
      setDisplayPhotoUrl(url);
      toast({ title: "Photo updated", description: "Your profile photo has been saved." });
      router.refresh();
    } catch (err) {
      console.error(err);
      toast({ title: "Upload failed", description: "Could not update photo. Please try again.", variant: "error" });
    } finally {
      setUploadingPhoto(false);
    }
  }

  useEffect(() => {
    setHeaderColorId(getStoredHeaderColor());
  }, []);

  useEffect(() => {
    if (!onboardingAnswers) return;
    const satDisplay = onboardingAnswers.satTotal ?? onboardingAnswers.satScore;
    const actDisplay = onboardingAnswers.actComposite ?? onboardingAnswers.actScore;
    const grad = onboardingAnswers.expectedGraduationYear ?? onboardingAnswers.graduationYear ?? null;
    const base = {
      gpa: onboardingAnswers.gpa != null ? String(onboardingAnswers.gpa) : "",
      gradYear: grad != null ? String(grad) : "",
      gradeLevel: onboardingAnswers.gradeLevel != null ? String(onboardingAnswers.gradeLevel) : "",
      sat: satDisplay != null ? String(satDisplay) : "",
      act: actDisplay != null ? String(actDisplay) : "",
    };
    setBasicForm(base);
    setFullForm({
      firstName: onboardingAnswers.firstName?.trim() ?? "",
      lastName: onboardingAnswers.lastName?.trim() ?? "",
      currentHighSchool: onboardingAnswers.currentHighSchool?.trim() ?? "",
      city: onboardingAnswers.city?.trim() ?? "",
      state: onboardingAnswers.state?.trim() ?? "",
      ...base,
    });
  }, [onboardingAnswers]);

  async function handleSaveBasics() {
    if (!onboardingAnswers) return;
    const user = auth.currentUser;
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in again to update your profile.",
        variant: "error",
      });
      router.push("/login?redirect=/app/profile");
      return;
    }

    setSavingBasics(true);
    try {
      const next: OnboardingDraft = { ...onboardingAnswers };
      const gpa = basicForm.gpa.trim() ? Number(basicForm.gpa) : null;
      const grad = basicForm.gradYear.trim() ? Number(basicForm.gradYear) : null;
      const sat = basicForm.sat.trim() ? Number(basicForm.sat) : null;
      const act = basicForm.act.trim() ? Number(basicForm.act) : null;

      next.gpa = gpa != null && !Number.isNaN(gpa) ? gpa : undefined;
      next.expectedGraduationYear = grad != null && !Number.isNaN(grad) ? grad : undefined;
      const gl = basicForm.gradeLevel.trim();
      const validGradeLevels: GradeLevel[] = ["9", "10", "11", "12", "Gap Year", "Other"];
      next.gradeLevel = gl && validGradeLevels.includes(gl as GradeLevel) ? (gl as GradeLevel) : undefined;
      if (sat != null && !Number.isNaN(sat)) {
        next.satTotal = sat;
        next.satScore = sat;
      } else {
        next.satTotal = undefined;
        next.satScore = undefined;
      }
      if (act != null && !Number.isNaN(act)) {
        next.actComposite = act;
        next.actScore = act;
      } else {
        next.actComposite = undefined;
        next.actScore = undefined;
      }

      await persistOnboardingToFirestore(user.uid, next);
      toast({
        title: "Profile updated",
        description: "Your academic information has been saved.",
      });
      setIsEditingBasics(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast({
        title: "Update failed",
        description: "Something went wrong while saving. Please try again.",
        variant: "error",
      });
    } finally {
      setSavingBasics(false);
    }
  }

  function handleHeaderColorChange(id: string) {
    setHeaderColorId(id);
    if (typeof window !== "undefined") window.localStorage.setItem(PROFILE_HEADER_COLOR_KEY, id);
  }

  async function handleSaveFullQuestionnaire() {
    if (!onboardingAnswers) return;
    const user = auth.currentUser;
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in again.", variant: "error" });
      router.push("/login?redirect=/app/profile");
      return;
    }
    setSavingQuestionnaire(true);
    try {
      const next: OnboardingDraft = { ...onboardingAnswers };
      next.firstName = fullForm.firstName.trim() || undefined;
      next.lastName = fullForm.lastName.trim() || undefined;
      next.currentHighSchool = fullForm.currentHighSchool.trim() || undefined;
      next.city = fullForm.city.trim() || undefined;
      next.state = fullForm.state.trim() || undefined;
      const gpa = fullForm.gpa.trim() ? Number(fullForm.gpa) : null;
      const grad = fullForm.gradYear.trim() ? Number(fullForm.gradYear) : null;
      const sat = fullForm.sat.trim() ? Number(fullForm.sat) : null;
      const act = fullForm.act.trim() ? Number(fullForm.act) : null;
      next.gpa = gpa != null && !Number.isNaN(gpa) ? gpa : undefined;
      next.expectedGraduationYear = grad != null && !Number.isNaN(grad) ? grad : undefined;
      const gl = fullForm.gradeLevel.trim();
      const validGradeLevels: GradeLevel[] = ["9", "10", "11", "12", "Gap Year", "Other"];
      next.gradeLevel = gl && validGradeLevels.includes(gl as GradeLevel) ? (gl as GradeLevel) : undefined;
      if (sat != null && !Number.isNaN(sat)) {
        next.satTotal = sat;
        next.satScore = sat;
      } else {
        next.satTotal = undefined;
        next.satScore = undefined;
      }
      if (act != null && !Number.isNaN(act)) {
        next.actComposite = act;
        next.actScore = act;
      } else {
        next.actComposite = undefined;
        next.actScore = undefined;
      }
      await persistOnboardingToFirestore(user.uid, next);
      toast({ title: "Profile updated", description: "Your questionnaire answers have been saved." });
      setShowEditQuestionnaire(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast({ title: "Update failed", description: "Something went wrong. Please try again.", variant: "error" });
    } finally {
      setSavingQuestionnaire(false);
    }
  }

  if (!hasAnyProfileData(onboardingAnswers)) {
    return (
      <div className="animate-in fade-in duration-300">
        <GlassCard className="p-10 text-center" variant="indigo">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
            <GraduationCap className="h-10 w-10" aria-hidden />
          </div>
          <h2 className="mt-6 text-xl font-bold text-text-primary">Complete your profile</h2>
          <p className="mt-2 max-w-md mx-auto text-sm text-text-muted">
            Your academic CV will appear here. Complete your onboarding to showcase your academics, goals, and preferences.
          </p>
          <Link
            href="/app/profile"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          >
            Go to profile
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </GlassCard>
      </div>
    );
  }

  const o = onboardingAnswers!;
  const firstName = o.firstName?.trim() ?? "";
  const lastName = o.lastName?.trim() ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Student";
  const initial = fullName ? fullName.replace(/\b(\w)/g, (_, c) => c).slice(0, 2).toUpperCase() : "?";
  const gradYear = o.expectedGraduationYear ?? o.graduationYear ?? null;
  const taglineParts = [
    o.careerPathWhat?.trim(),
    o.areasOfInterest?.[0],
    o.currentHighSchool?.trim() ? `Class of ${gradYear ?? ""}` : null,
  ].filter(Boolean);
  const tagline = taglineParts.length > 0 ? taglineParts.join(" | ") : "Building my path to college";
  const strength = computeProfileStrength(o);

  // Awards for cards (flatten by level)
  const awardCards: { title: string; level: string; icon: typeof Star }[] = [];
  const awardLevels = [
    { key: "awardsSchool" as const, label: "School", icon: Star },
    { key: "awardsState" as const, label: "State Level", icon: Award },
    { key: "awardsNational" as const, label: "National Level", icon: Star },
    { key: "awardsInternational" as const, label: "International", icon: Award },
  ];
  awardLevels.forEach(({ key, label, icon }) => {
    const items = o[key];
    if (items?.length)
      items.forEach((a) => awardCards.push({ title: a.title, level: label, icon }));
  });

  const satDisplay = o.satTotal ?? o.satScore;
  const actDisplay = o.actComposite ?? o.actScore;
  const satPercent = satDisplay != null ? Math.min(99, 50 + Number(satDisplay) / 20) : null;
  const apAvg = o.apAverageScore;
  const apPercent = apAvg != null ? Math.min(99, apAvg * 20) : null;

  return (
    <div className="relative flex flex-col overflow-x-hidden">
      {/* ——— Banner ——— */}
      <section
        className="relative h-72 sm:h-80 w-full flex items-end px-2 sm:px-4 lg:px-4 pb-8 sm:pb-10"
        style={{
          background: (() => {
            const c = HEADER_COLORS.find((x) => x.id === headerColorId) ?? HEADER_COLORS[0];
            return `linear-gradient(to right, ${c.from}, ${c.to})`;
          })(),
        }}
      >
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative flex items-end gap-6 sm:gap-8 w-full max-w-7xl mx-auto">
          <div className="relative shrink-0 group">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
              aria-label="Upload profile photo"
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="relative size-28 sm:size-36 lg:size-40 rounded-full border-4 border-white shadow-2xl bg-white overflow-hidden focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-70 disabled:cursor-not-allowed"
              aria-label="Update profile photo"
            >
              {displayPhotoUrl ? (
                <img src={displayPhotoUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-primary-600 bg-secondary-100">
                  {initial}
                </span>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                {uploadingPhoto ? (
                  <span className="text-white text-xs font-medium">Uploading…</span>
                ) : (
                  <Camera className="size-8 sm:size-10 text-white" aria-hidden />
                )}
              </span>
            </button>
            <div className="absolute bottom-1 right-1 size-5 sm:size-6 bg-status-successText border-2 border-white rounded-full" aria-hidden />
          </div>
          <div className="flex-1 min-w-0 pb-2 sm:pb-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white truncate">{fullName}</h1>
            <p className="text-white/90 text-sm sm:text-base lg:text-lg mt-1 sm:mt-2 font-medium italic truncate">{tagline}</p>
            <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-4">
              {o.gpa != null && (
                <span className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold inline-flex items-center gap-1.5">
                  <Star className="size-3.5 sm:size-4" aria-hidden />
                  GPA: {o.gpa}
                </span>
              )}
              {(satDisplay != null || actDisplay != null) && (
                <span className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold inline-flex items-center gap-1.5">
                  <ClipboardList className="size-3.5 sm:size-4" aria-hidden />
                  {satDisplay != null && actDisplay != null ? `SAT: ${satDisplay} · ACT: ${actDisplay}` : satDisplay != null ? `SAT: ${satDisplay}` : `ACT: ${actDisplay}`}
                </span>
              )}
              {gradYear != null && (
                <span className="bg-primary-500 text-white px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-lg">
                  Class of {gradYear}
                </span>
              )}
            </div>
          </div>
          <div className="hidden lg:block shrink-0 mb-4">
            <div className="bg-white rounded-card p-5 shadow-2xl w-56 border border-bg-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Profile Completeness</span>
                <span className="text-sm font-bold text-status-successText">{strength}%</span>
              </div>
              <ProgressBar value={strength} max={100} barClassName="bg-status-successText" className="mb-2" />
              <p className="text-xs text-text-secondary font-medium mb-4">Keep building! 🎯</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider w-full flex items-center gap-1.5">
                  <Palette className="size-3.5" aria-hidden />
                  Header color
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {HEADER_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleHeaderColorChange(c.id)}
                      className={cn(
                        "size-6 rounded-full border-2 transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent",
                        headerColorId === c.id ? "border-white shadow-lg scale-110" : "border-white/50 hover:border-white/80"
                      )}
                      style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
                      aria-label={c.label}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile / tablet profile completeness + header color */}
      <section className="lg:hidden max-w-7xl mx-auto w-full px-2 sm:px-4 lg:px-4 mt-4">
        <div className="bg-white rounded-card p-4 shadow-soft border border-bg-border">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Profile Completeness
            </span>
            <span className="text-sm font-bold text-status-successText">{strength}%</span>
          </div>
          <ProgressBar value={strength} max={100} barClassName="bg-status-successText" className="mb-3" />
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Header color</p>
          <div className="flex flex-wrap gap-2">
            {HEADER_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleHeaderColorChange(c.id)}
                className={cn(
                  "size-7 rounded-full border-2 transition-all",
                  headerColorId === c.id ? "border-primary-500 shadow-md scale-110" : "border-bg-border"
                )}
                style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
                aria-label={c.label}
                title={c.label}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ——— Main 3-column ——— */}
      <main className="max-w-7xl mx-auto w-full px-2 sm:px-4 lg:px-4 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* Left nav — only on large screens */}
        <aside className="hidden lg:block lg:col-span-2 sticky top-24 space-y-1">
          <nav className="flex flex-col gap-1" aria-label="Profile sections">
            {navItems.map(({ id, label, icon: Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={(e) => { e.preventDefault(); setActiveSection(id); document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-button transition-all",
                  activeSection === id ? "bg-primary-500/10 text-primary-600 font-bold" : "text-text-secondary hover:bg-secondary-100 font-medium"
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                <span className="text-sm">{label}</span>
              </a>
            ))}
          </nav>
        </aside>

        {/* Center content */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8">
          {/* Academic GPA & Standing */}
          <section id="academic" className="scroll-mt-24 bg-bg-card rounded-card p-6 shadow-soft border border-bg-border">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2 text-text-primary">
                <BarChart3 className="size-5 text-primary-500" aria-hidden />
                Academic GPA & Standing
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingBasics((v) => !v)}
                  className="inline-flex items-center rounded-button border border-primary-500/40 px-3 py-1.5 text-xs font-semibold text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  {isEditingBasics ? "Cancel editing" : "Edit basics"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditQuestionnaire(true);
                    setShowFullQuestionnaire(false);
                    document.getElementById("onboarding")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-button border border-bg-border px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-secondary-100 transition-colors"
                >
                  <Edit3 className="size-3.5" aria-hidden />
                  Edit full profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFullQuestionnaire(true);
                    setShowEditQuestionnaire(false);
                    document.getElementById("onboarding")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="hidden sm:inline-flex items-center rounded-button border border-bg-border px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-secondary-100 transition-colors"
                >
                  Show all answers
                </button>
              </div>
          </div>
          {isEditingBasics ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="p-4 rounded-button bg-bg-main border border-bg-border">
                <p className="text-xs text-text-muted font-bold uppercase mb-1">Current GPA</p>
                <Input
                  type="number"
                  step="0.01"
                  value={basicForm.gpa}
                  onChange={(e) => setBasicForm((f) => ({ ...f, gpa: e.target.value }))}
                  placeholder="e.g. 3.7"
                  className="mt-1"
                />
              </div>
              <div className="p-4 rounded-button bg-bg-main border border-bg-border">
                <p className="text-xs text-text-muted font-bold uppercase mb-1">Graduation Year</p>
                <Input
                  type="number"
                  value={basicForm.gradYear}
                  onChange={(e) => setBasicForm((f) => ({ ...f, gradYear: e.target.value }))}
                  placeholder="e.g. 2026"
                  className="mt-1"
                />
              </div>
              <div className="p-4 rounded-button bg-bg-main border border-bg-border">
                <p className="text-xs text-text-muted font-bold uppercase mb-1">Grade Level</p>
                <Input
                  type="text"
                  value={basicForm.gradeLevel}
                  onChange={(e) => setBasicForm((f) => ({ ...f, gradeLevel: e.target.value }))}
                  placeholder="e.g. 11"
                  className="mt-1"
                />
              </div>
              <div className="p-4 rounded-button bg-bg-main border border-bg-border sm:col-span-2">
                <p className="text-xs text-text-muted font-bold uppercase mb-1">SAT Total</p>
                <Input
                  type="number"
                  value={basicForm.sat}
                  onChange={(e) => setBasicForm((f) => ({ ...f, sat: e.target.value }))}
                  placeholder="e.g. 1450"
                  className="mt-1"
                />
              </div>
              <div className="p-4 rounded-button bg-bg-main border border-bg-border">
                <p className="text-xs text-text-muted font-bold uppercase mb-1">ACT Composite</p>
                <Input
                  type="number"
                  value={basicForm.act}
                  onChange={(e) => setBasicForm((f) => ({ ...f, act: e.target.value }))}
                  placeholder="e.g. 32"
                  className="mt-1"
                />
              </div>
              <div className="sm:col-span-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditingBasics(false)}
                  className="inline-flex items-center rounded-button border border-bg-border px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-secondary-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingBasics}
                  onClick={handleSaveBasics}
                  className="inline-flex items-center rounded-button bg-primary-500 px-4 py-2 text-xs font-semibold text-white shadow-soft hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {savingBasics ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="p-4 rounded-button bg-bg-main border border-bg-border">
                <p className="text-xs text-text-muted font-bold uppercase mb-1">Current GPA</p>
                <p className="text-2xl sm:text-3xl font-black text-text-primary">{o.gpa ?? "—"}</p>
              </div>
              <div className="p-4 rounded-button bg-bg-main border border-bg-border">
                <p className="text-xs text-text-muted font-bold uppercase mb-1">Graduation Year</p>
                <p className="text-2xl sm:text-3xl font-black text-text-primary">{gradYear ?? "—"}</p>
              </div>
              <div className="p-4 rounded-button bg-bg-main border border-bg-border">
                <p className="text-xs text-text-muted font-bold uppercase mb-1">Grade Level</p>
                <p className="text-lg sm:text-xl font-black text-text-primary">{o.gradeLevel ?? "—"}</p>
              </div>
            </div>
          )}
          </section>

          {/* Standardized Test Dashboard */}
          <section id="tests" className="scroll-mt-24 bg-bg-card rounded-card p-6 shadow-soft border border-bg-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2 text-text-primary">
                <CheckSquare className="size-5 text-primary-500" aria-hidden />
                Standardized Test Dashboard
              </h3>
            </div>
            <div className="space-y-6">
              {satDisplay != null && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-bold text-text-primary">SAT Score: {satDisplay}</p>
                    {satPercent != null && <p className="text-xs font-bold text-primary-500">{Math.round(satPercent)}th Percentile</p>}
                  </div>
                  <div className="w-full bg-secondary-200 h-3 rounded-full overflow-hidden">
                    <div className="bg-primary-500 h-full rounded-full transition-[width]" style={{ width: `${satPercent ?? 0}%` }} />
                  </div>
                </div>
              )}
              {actDisplay != null && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-bold text-text-primary">ACT Score: {actDisplay}</p>
                    <p className="text-xs font-bold text-primary-500">—</p>
                  </div>
                  <div className="w-full bg-secondary-200 h-3 rounded-full overflow-hidden">
                    <div className="bg-primary-500 h-full rounded-full" style={{ width: "85%" }} />
                  </div>
                </div>
              )}
              {apAvg != null && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-bold text-text-primary">AP Exams (Avg): {apAvg}</p>
                    {apPercent != null && <p className="text-xs font-bold text-primary-500">{Math.round(apPercent)}th Percentile</p>}
                  </div>
                  <div className="w-full bg-secondary-200 h-3 rounded-full overflow-hidden">
                    <div className="bg-primary-500 h-full rounded-full" style={{ width: `${apPercent ?? 0}%` }} />
                  </div>
                </div>
              )}
              {!satDisplay && !actDisplay && !apAvg && (
                <p className="text-sm text-text-muted">Add test scores in your profile to see your dashboard.</p>
              )}
              <div className="mt-4 p-4 rounded-button bg-status-warningBg border border-status-warningText/20 flex items-start gap-3">
                <Lightbulb className="size-5 text-status-warningText shrink-0 mt-0.5" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-status-warningText">Retake Recommendation</p>
                  <p className="text-xs text-text-secondary mt-1">
                    Consider retaking the SAT or ACT if you believe you can improve. Many schools superscore.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Awards & Honors */}
          {awardCards.length > 0 && (
            <section id="achievements" className="scroll-mt-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-text-primary">
                  <Award className="size-5 text-primary-500" aria-hidden />
                  Awards & Honors
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {awardCards.slice(0, 6).map((a, i) => {
                  const AwardIcon = a.icon;
                  return (
                    <div key={i} className="p-5 bg-bg-card border border-bg-border rounded-card shadow-soft">
                      <AwardIcon className="size-5 text-primary-500 mb-2" aria-hidden />
                      <p className="font-bold text-text-primary">{a.title}</p>
                      <p className="text-xs text-text-muted mt-1">{a.level}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Extracurricular Commitment */}
          {hasExtracurricularsData(o) && (o.activityTypes?.length ?? 0) > 0 && (
            <section id="activities" className="scroll-mt-24 bg-bg-card rounded-card p-6 shadow-soft border border-bg-border">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-8 text-text-primary">
                <Calendar className="size-5 text-primary-500" aria-hidden />
                Extracurricular Commitment
              </h3>
              <div className="relative space-y-8 pb-4">
                <div className="absolute left-[39px] top-0 bottom-0 w-0.5 bg-secondary-200 rounded-full" aria-hidden />
                {o.activityTypes!.slice(0, 4).map((a, i) => {
                  const years = a.weeksParticipated != null ? Math.round(a.weeksParticipated / 52) : 1;
                  const t = (a.type ?? "").toLowerCase();
                  const Icon = t.includes("sport") ? Award : t.includes("volunteer") || t.includes("community") ? Heart : t.includes("science") || t.includes("research") ? FlaskConical : Megaphone;
                  return (
                    <div key={i} className="relative flex gap-6">
                      <div className="z-10 size-16 sm:size-20 shrink-0 bg-primary-500/10 rounded-button flex items-center justify-center border-2 border-bg-card">
                        <Icon className="size-6 sm:size-8 text-primary-500" aria-hidden />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap justify-between items-center gap-2 mb-1">
                          <h4 className="font-bold text-text-primary">{a.type}</h4>
                          <span className="text-xs font-bold px-2 py-0.5 bg-secondary-200 rounded text-text-muted">{years} Year{years !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="flex gap-1 mb-3">
                          {Array.from({ length: 4 }).map((_, j) => (
                            <div
                              key={j}
                              className={cn("h-1.5 flex-1 rounded-full", j < years ? "bg-primary-500" : "bg-secondary-200")}
                            />
                          ))}
                        </div>
                        {(a.weeksParticipated != null || a.hoursPerWeek != null) && (
                          <p className="text-xs text-text-muted">
                            {a.weeksParticipated != null && `${a.weeksParticipated} weeks`}
                            {a.weeksParticipated != null && a.hoursPerWeek != null && " · "}
                            {a.hoursPerWeek != null && `${a.hoursPerWeek} hr/wk`}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section id="college-list" className="scroll-mt-24 bg-bg-card rounded-card p-6 shadow-soft border border-bg-border">
            <h3 className="text-lg font-bold flex items-center gap-2 text-text-primary">
              <List className="size-5 text-primary-500" aria-hidden />
              College List
            </h3>
            <Link href="/app/colleges" className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-primary-500 hover:underline">
              View your college list
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </section>

          {onboardingAnswers && (
            <section id="onboarding" className="scroll-mt-24">
              <div className="bg-bg-card rounded-card border border-bg-border shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-bg-border">
                  <div>
                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                      <ClipboardList className="size-4 text-primary-500" aria-hidden />
                      Full questionnaire overview
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      A condensed view of all answers. Expand or edit without leaving this page.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEditQuestionnaire((v) => !v)}
                      className="inline-flex items-center gap-1.5 rounded-button border border-primary-500/40 px-3 py-1.5 text-xs font-semibold text-primary-600 hover:bg-primary-50 transition-colors"
                    >
                      <Edit3 className="size-3.5" aria-hidden />
                      {showEditQuestionnaire ? "Cancel edit" : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFullQuestionnaire((v) => !v)}
                      className="inline-flex items-center rounded-button border border-bg-border px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-secondary-100 transition-colors"
                    >
                      {showFullQuestionnaire ? "Hide details" : "Show all answers"}
                      <ChevronRight
                        className={cn(
                          "ml-1 h-3.5 w-3.5 transition-transform",
                          showFullQuestionnaire ? "rotate-90" : ""
                        )}
                        aria-hidden
                      />
                    </button>
                  </div>
                </div>
                {showEditQuestionnaire && (
                  <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-bg-border bg-bg-main/50">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Edit all your profile data below.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[11px] font-semibold uppercase text-text-muted block mb-1">First name</label>
                        <Input
                          value={fullForm.firstName}
                          onChange={(e) => setFullForm((f) => ({ ...f, firstName: e.target.value }))}
                          placeholder="First name"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold uppercase text-text-muted block mb-1">Last name</label>
                        <Input
                          value={fullForm.lastName}
                          onChange={(e) => setFullForm((f) => ({ ...f, lastName: e.target.value }))}
                          placeholder="Last name"
                          className="text-sm"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-semibold uppercase text-text-muted block mb-1">High school</label>
                        <Input
                          value={fullForm.currentHighSchool}
                          onChange={(e) => setFullForm((f) => ({ ...f, currentHighSchool: e.target.value }))}
                          placeholder="Current high school"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold uppercase text-text-muted block mb-1">City</label>
                        <Input
                          value={fullForm.city}
                          onChange={(e) => setFullForm((f) => ({ ...f, city: e.target.value }))}
                          placeholder="City"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold uppercase text-text-muted block mb-1">State / Region</label>
                        <Input
                          value={fullForm.state}
                          onChange={(e) => setFullForm((f) => ({ ...f, state: e.target.value }))}
                          placeholder="State"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold uppercase text-text-muted block mb-1">GPA</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={fullForm.gpa}
                          onChange={(e) => setFullForm((f) => ({ ...f, gpa: e.target.value }))}
                          placeholder="3.9"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold uppercase text-text-muted block mb-1">Graduation year</label>
                        <Input
                          type="number"
                          value={fullForm.gradYear}
                          onChange={(e) => setFullForm((f) => ({ ...f, gradYear: e.target.value }))}
                          placeholder="2027"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold uppercase text-text-muted block mb-1">Grade level</label>
                        <Input
                          value={fullForm.gradeLevel}
                          onChange={(e) => setFullForm((f) => ({ ...f, gradeLevel: e.target.value }))}
                          placeholder="11"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold uppercase text-text-muted block mb-1">SAT</label>
                        <Input
                          type="number"
                          value={fullForm.sat}
                          onChange={(e) => setFullForm((f) => ({ ...f, sat: e.target.value }))}
                          placeholder="1450"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold uppercase text-text-muted block mb-1">ACT</label>
                        <Input
                          type="number"
                          value={fullForm.act}
                          onChange={(e) => setFullForm((f) => ({ ...f, act: e.target.value }))}
                          placeholder="32"
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setShowEditQuestionnaire(false)}
                        className="rounded-button border border-bg-border px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-secondary-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={savingQuestionnaire}
                        onClick={handleSaveFullQuestionnaire}
                        className="rounded-button bg-primary-500 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-600 disabled:opacity-60"
                      >
                        {savingQuestionnaire ? "Saving…" : "Save"}
                      </button>
                    </div>
                  </div>
                )}
                {showFullQuestionnaire && !showEditQuestionnaire && (
                  <div className="px-4 py-4 sm:px-6 sm:py-5">
                    <OnboardingSummary
                      answers={o}
                      onEditSection={(step) => setEditingStep(step)}
                    />
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Right sidebar */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-primary-500/5 border border-primary-500/20 rounded-card p-6 shadow-soft">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="size-5 text-primary-500" aria-hidden />
              <h4 className="font-bold text-text-primary">AI Coach Insights</h4>
            </div>
            <p className="text-xs leading-relaxed text-text-secondary">
              {strength >= 70
                ? "Your profile is in a strong place. Focus on polishing essays and finalizing a balanced college list."
                : "There is still room to strengthen your profile. Completing more sections (academics, activities, preferences) will improve matching and guidance."}
            </p>
            <button
              type="button"
              onClick={() => router.push("/app/chat")}
              className="w-full mt-4 py-2.5 bg-primary-500 text-white text-sm font-bold rounded-button shadow-soft hover:bg-primary-600 transition-colors"
            >
              Discuss with AI Coach
            </button>
          </div>

        </aside>
      </main>

      {editingStep != null && onboardingAnswers && (
        <ProfileStepEditorModal
          step={editingStep}
          answers={onboardingAnswers}
          onSave={async (partial) => {
            const uid = auth.currentUser?.uid;
            if (!uid) {
              router.push("/login?redirect=/app/profile");
              return;
            }
            setSavingStep(true);
            try {
              const next = { ...onboardingAnswers, ...partial };
              await persistOnboardingToFirestore(uid, next);
              setEditingStep(null);
              toast({ title: "Saved", description: "Your changes have been updated." });
              router.refresh();
            } catch (e) {
              console.error(e);
              toast({ title: "Save failed", description: "Please try again.", variant: "error" });
            } finally {
              setSavingStep(false);
            }
          }}
          onClose={() => setEditingStep(null)}
          saving={savingStep}
        />
      )}
    </div>
  );
}
