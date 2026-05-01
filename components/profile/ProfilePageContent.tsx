"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  GraduationCap,
  Award,
  Users,
  List,
  BarChart3,
  CheckSquare,
  Calendar,
  Star,
  ClipboardList,
  Edit3,
  Camera,
  School,
  MapPin,
  Trophy,
  ChevronRight,
  Contact,
  Shield,
} from "lucide-react";
import { LogoIcon } from "@/components/landing/LogoIcon";
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";

import { Input } from "@/components/ui/input";
import { computeProfileStrength } from "@/lib/profile/profileStrength";
import { cn } from "@/lib/utils";
import { type GradeLevel, defaultAnswers } from "@/lib/onboarding/schema";
import type { OnboardingDraft } from "@/lib/onboarding/types";
import { OnboardingSummary } from "@/components/profile/OnboardingSummary";
import { auth } from "@/lib/firebase/client";
import { getStudentProfile, setStudentProfile } from "@/lib/firebase/firestore";
import { uploadProfilePhoto } from "@/lib/firebase/storage";
import { persistOnboardingToFirestore } from "@/lib/onboarding/storage";
import { useToastOptional } from "@/components/ui/toast";

import { MeshGradient } from "./MeshGradient";
import { ProfileStrengthRing } from "./ProfileStrengthRing";
import { ProfileEditDrawer } from "./ProfileEditDrawer";
import { Step1Editor, Step2Editor, Step3Editor, Step4Editor, Step5Editor } from "./StepEditors";

// --- Glass Card Component (Unified Design) ---
function BentoCard({ children, title, icon: Icon, className, onClickEdit }: any) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/70 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.04)]",
      className
    )}>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 ring-1 ring-primary-100">
                <Icon className="size-5" />
              </div>
            )}
            <h3 className="text-xl font-black text-slate-900">{title}</h3>
          </div>
          {onClickEdit && (
            <button 
              onClick={onClickEdit}
              className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-primary-50 hover:text-primary-600"
            >
              <Edit3 className="size-4" />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

export function ProfilePageContent({ onboardingAnswers, profilePhotoUrl }: ProfilePageContentProps) {
  const router = useRouter();
  const { toast } = useToastOptional();
  const reduceMotion = useReducedMotion();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState("overview");
  const [drawerMode, setDrawerMode] = useState<"basics" | "full" | "step" | null>(null);
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [userUid, setUserUid] = useState<string | null>(auth.currentUser?.uid ?? null);

  // Stable student id derived from uid (fallbacks to name seed when uid unavailable).
  const studentId = useMemo(() => {
    const fallbackSeed = `${onboardingAnswers?.firstName ?? ""}${onboardingAnswers?.lastName ?? ""}` || "STUDENT";
    const seed = (userUid ?? fallbackSeed).trim();
    const hash = seed.split("").reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
    const normalized = Math.abs(hash);
    const prefix = (normalized % 46656).toString(36).toUpperCase().padStart(3, "0");
    const suffix = (Math.floor(normalized / 46656) % 10000).toString().padStart(4, "0");
    return `CMP-${prefix}-${suffix}`;
  }, [userUid, onboardingAnswers?.firstName, onboardingAnswers?.lastName]);

  const downloadCard = async () => {
    if (!cardRef.current) return;
    
    toast({
      title: "Generating Card…",
      description: "Optimizing layout and assets for PDF.",
    });

    try {
      // 1. Resolve export photo as data URL before capture (most reliable with html2canvas).
      let exportPhotoSrc = displayPhotoUrl ?? null;
      if (displayPhotoUrl && /^https?:\/\//i.test(displayPhotoUrl)) {
        try {
          const proxiedUrl = `/api/image-proxy?url=${encodeURIComponent(displayPhotoUrl)}`;
          const res = await fetch(proxiedUrl, { cache: "no-store" });
          if (res.ok) {
            const blob = await res.blob();
            exportPhotoSrc = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result ?? ""));
              reader.onerror = () => reject(new Error("Photo data URL conversion failed"));
              reader.readAsDataURL(blob);
            });
          } else {
            console.warn("Image proxy returned non-OK status for export:", res.status);
          }
        } catch (e) {
          console.warn("Export photo conversion failed:", e);
        }
      }

      // 2. Capture with precise settings
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: "#0f172a",
        logging: false,
        onclone: (clonedDoc) => {
          const glow = clonedDoc.querySelector("[data-export-hide-glow='true']");
          if (glow && glow instanceof HTMLElement) {
            glow.style.display = "none";
          }
          const photoImg = clonedDoc.getElementById('compantic-id-photo');
          if (photoImg && exportPhotoSrc) {
            (photoImg as HTMLImageElement).src = exportPhotoSrc;
          }
        }
      });

      const imgData = canvas.toDataURL("image/png");
      const width = cardRef.current.clientWidth;
      const height = cardRef.current.clientHeight;
      
      const pdf = new jsPDF({
        orientation: width > height ? "l" : "p",
        unit: "px",
        format: [width, height],
      });

      pdf.addImage(imgData, "PNG", 0, 0, width, height);
      pdf.save(`Compantic_Card_${forms.firstName || "Student"}.pdf`);

      toast({
        title: "Download Complete!",
        description: "Your official Compantic Card is ready.",
      });
    } catch (error: any) {
      console.error("PDF Export Error:", error);
      toast({
        title: "Export Failed",
        description: "Please try again in a moment.",
      });
    }
  };
  const [displayPhotoUrl, setDisplayPhotoUrl] = useState<string | null>(profilePhotoUrl ?? null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [realRank, setRealRank] = useState<number | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setUserUid(user?.uid ?? null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    async function getRank() {
      try {
        const res = await fetchWithAuth("/api/ai-score/leaderboard?limit=50");
        const data = await res.json();
        const myUid = auth.currentUser?.uid;
        const idx = data.leaderboard?.findIndex((x: any) => x.uid === myUid);
        if (idx !== undefined && idx >= 0) setRealRank(idx + 1);
      } catch (e) { console.error(e); }
    }
    getRank();
  }, []);
  
  
  const [forms, setForms] = useState({
    firstName: "",
    lastName: "",
    gpa: "",
    gradYear: "",
    gradeLevel: "",
    sat: "",
    act: "",
    school: "",
    city: "",
    state: "",
  });

  const [stepData, setStepData] = useState<any>(null);

  useEffect(() => {
    setDisplayPhotoUrl(profilePhotoUrl ?? null);
  }, [profilePhotoUrl]);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    getStudentProfile(uid).then((p) => {
      if (p?.profilePhotoUrl) setDisplayPhotoUrl(p.profilePhotoUrl);
    });
  }, []);

  useEffect(() => {
    if (!onboardingAnswers) return;
    const o = onboardingAnswers;
    const sat = o.satTotal ?? o.satScore;
    const act = o.actComposite ?? o.actScore;
    const grad = o.expectedGraduationYear ?? o.graduationYear;
    
    setForms({
      firstName: o.firstName ?? "",
      lastName: o.lastName ?? "",
      gpa: o.gpa != null ? String(o.gpa) : "",
      gradYear: grad != null ? String(grad) : "",
      gradeLevel: o.gradeLevel ?? "",
      sat: sat != null ? String(sat) : "",
      act: act != null ? String(act) : "",
      school: o.currentHighSchool ?? "",
      city: o.city ?? "",
      state: o.state ?? "",
    });
  }, [onboardingAnswers]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    
    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((res) => {
        reader.onload = () => res(reader.result as string);
        reader.readAsDataURL(file);
      });
      const url = await uploadProfilePhoto(uid, dataUrl);
      await setStudentProfile(uid, { profilePhotoUrl: url });
      setDisplayPhotoUrl(url);
      toast({ title: "Success", description: "Profile photo updated." });
    } catch (err) {
      toast({ title: "Error", description: "Upload failed.", variant: "error" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!onboardingAnswers) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    setIsSaving(true);
    try {
      let next: OnboardingDraft;

      if (drawerMode === "step" && editingStep) {
        next = {
          ...onboardingAnswers,
          ...stepData
        };
      } else {
        next = {
          ...onboardingAnswers,
          firstName: forms.firstName.trim() || undefined,
          lastName: forms.lastName.trim() || undefined,
          currentHighSchool: forms.school.trim() || undefined,
          city: forms.city.trim() || undefined,
          state: forms.state.trim() || undefined,
          gpa: forms.gpa ? Number(forms.gpa) : undefined,
          expectedGraduationYear: forms.gradYear ? Number(forms.gradYear) : undefined,
          gradeLevel: forms.gradeLevel as GradeLevel || undefined,
          satTotal: forms.sat ? Number(forms.sat) : undefined,
          actComposite: forms.act ? Number(forms.act) : undefined,
        };
      }

      await persistOnboardingToFirestore(uid, next);
      toast({ 
        title: "Profile Updated", 
        description: "Your matches and AI score might have changed. Visit College Matching to refresh results.",
      });
      setDrawerMode(null);
      setEditingStep(null);
      router.refresh();
    } catch (err) {
      toast({ title: "Error", description: "Could not save changes.", variant: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const openStepEditor = (step: number) => {
    setEditingStep(step);
    setDrawerMode("step");
    setStepData({ ...onboardingAnswers });
  };

  if (!onboardingAnswers) return null;

  const o = onboardingAnswers;
  const strength = computeProfileStrength(o);
  const fullName = [forms.firstName, forms.lastName].filter(Boolean).join(" ") || "Student";
  const initial = fullName.slice(0, 1).toUpperCase();

  const awardCards = (o.awardsConsolidated ?? []).slice(0, 4);
  const activityCards = (o.activityTypes ?? []).slice(0, 4);

  return (
    <div className="relative min-h-screen bg-[#F7F9FC] pb-20">
      {/* V3 PREMIUM HEADER - COMPACT & MODERN */}
      {/* ULTRA-PREMIUM V4 HEADER */}
      <section className="relative w-full bg-[#050A18] pb-24 pt-20">
        {/* Cinematic Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/50 via-[#050A18] to-[#050A18]" />
          <div className="absolute -top-20 -left-20 h-[600px] w-[600px] rounded-full bg-primary-600/10 blur-[140px] animate-pulse" />
          <div className="absolute top-1/2 -right-20 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[120px]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-end lg:justify-between">
            
            {/* Left: Dynamic Identity */}
            <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-center">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group"
              >
                <div className="relative z-10 size-36 overflow-hidden rounded-[3rem] border-4 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.3)] transition-all duration-500 group-hover:scale-105 group-hover:border-primary-500/50 sm:size-44">
                  {displayPhotoUrl ? (
                    <img src={displayPhotoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-600 to-violet-700 text-5xl font-black text-white">
                      {initial}
                    </div>
                  )}
                </div>
                {/* Visual Echoes */}
                <div className="absolute -inset-4 rounded-[3.5rem] border border-primary-500/10 opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:scale-110" />
                
                <button 
                  onClick={() => photoInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 z-20 flex size-12 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-2xl transition-all hover:scale-110 active:scale-95"
                >
                  <Camera className="size-6" />
                </button>
                <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center lg:text-left"
              >
                <div className="mb-4 flex flex-wrap justify-center gap-2 lg:justify-start">
                   <span className="rounded-full bg-primary-500/10 border border-primary-500/20 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary-400 backdrop-blur-md">Academic Profile</span>
                   <span className="rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 backdrop-blur-md">ID Verified</span>
                </div>
                <h1 className="text-4xl font-black tracking-tight text-white sm:text-7xl mb-6">
                  {forms.firstName} <span className="bg-gradient-to-r from-primary-400 to-violet-400 bg-clip-text text-transparent">{forms.lastName}</span>
                </h1>
                <div className="flex flex-wrap justify-center gap-6 lg:justify-start">
                   <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                         <School className="size-5 text-primary-400" />
                      </div>
                      <div className="text-left">
                         <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Current School</p>
                         <p className="text-sm font-bold text-white/90">{forms.school || "Your High School"}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                         <GraduationCap className="size-5 text-violet-400" />
                      </div>
                      <div className="text-left">
                         <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Graduation Year</p>
                         <p className="text-sm font-bold text-white/90">Class of {forms.gradYear || "2027"}</p>
                      </div>
                   </div>
                </div>
              </motion.div>
            </div>

            {/* Right: Score Visualizer */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative overflow-hidden rounded-[3.5rem] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl shadow-[0_0_60px_rgba(0,0,0,0.5)] lg:min-w-[320px]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 via-transparent to-violet-600/10" />
              <div className="relative flex flex-col items-center gap-6">
                 <ProfileStrengthRing percentage={strength} />
                 <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Readiness Index</p>
                    <div className="flex items-center gap-3 justify-center">
                       <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                       <span className="text-sm font-black text-white">{strength}% Data Completed</span>
                    </div>
                 </div>
              </div>
            </motion.div>

          </div>
        </div>
        
        {/* Floating Master Navigation */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 z-50 flex justify-center px-4">
           <div className="flex items-center gap-1.5 p-2 rounded-[2.5rem] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 backdrop-blur-2xl">
             {[
               { id: "overview", label: "Dashboard", icon: BarChart3 },
               { id: "academic", label: "Academics", icon: GraduationCap },
               { id: "compantic_card", label: "Identity Card", icon: Contact },
               { id: "records", label: "Full Records", icon: List },
             ].map((tab) => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={cn(
                   "group relative flex items-center gap-2 px-8 py-3.5 rounded-[2rem] text-xs font-black transition-all",
                   activeTab === tab.id 
                     ? "bg-slate-900 text-white shadow-2xl scale-105" 
                     : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                 )}
               >
                 <tab.icon className={cn("size-4 transition-transform group-hover:scale-125", activeTab === tab.id ? "text-primary-400" : "")} />
                 {tab.label}
                 {activeTab === tab.id && (
                   <motion.div layoutId="tab-glow" className="absolute inset-0 rounded-[2rem] bg-primary-500/10 blur-xl" />
                 )}
               </button>
             ))}
           </div>
        </div>
      </section>

      {/* BENTO GRID CONTENT */}
      <main className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {activeTab === "compantic_card" && (
            <motion.div
              key="compantic_card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <div className="relative w-full max-w-4xl group">
                {/* ID Card Outer Glow */}
                <div
                  data-export-hide-glow="true"
                  className="absolute -inset-1 rounded-[3rem] bg-gradient-to-r from-primary-600 via-violet-600 to-amber-400 opacity-20 blur-3xl transition duration-1000 group-hover:opacity-40"
                />
                
                <div 
                  ref={cardRef}
                  className="relative aspect-[1.8/1] w-full overflow-hidden rounded-[2.5rem] border border-white/40 bg-slate-900 shadow-2xl transition-all duration-700 sm:aspect-[1.586/1]"
                >
                  {/* Premium Background Elements */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(var(--primary-rgb),0.15),transparent_50%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.1),transparent_50%)]" />
                  <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay grayscale invert" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
                  
                  {/* Card Content Grid */}
                  <div className="relative flex h-full p-10 sm:p-14">
                    {/* Left Section: Info & Stats */}
                    <div className="flex flex-1 flex-col">
                      {/* Header */}
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 shadow-inner ring-1 ring-white/10 backdrop-blur-xl">
                          <LogoIcon className="h-7 w-7 text-white" />
                        </div>
                        <div>
                          <h1 className="text-2xl font-black tracking-tight text-white">Compantic Card</h1>
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-400">Verified Academic Identity</p>
                        </div>
                      </div>

                      {/* Main Identity */}
                      <div className="mt-12">
                        <h2 className="text-4xl font-black tracking-tighter text-white sm:text-6xl">{fullName}</h2>
                        <div className="mt-4 flex items-center gap-3 text-slate-400">
                          <MapPin className="size-4 text-primary-500" />
                          <span className="text-sm font-black uppercase tracking-widest">{forms.city}, {forms.state}</span>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="mt-auto grid grid-cols-3 gap-10">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Academic GPA</p>
                          <p className="text-2xl font-black text-white">{forms.gpa || "N/A"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Test Scores</p>
                          <p className="text-2xl font-black text-white">{forms.sat || forms.act || "—"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Rank</p>
                          <p className="text-2xl font-black text-amber-400 italic">#{realRank ? String(realRank).padStart(2, '0') : "—"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right Section: Large Photo & QR */}
                    <div className="flex w-64 flex-col items-center justify-between sm:w-80">
                      <div className="relative">
                        {/* Photo Container */}
                        <div className="size-48 overflow-hidden rounded-[3rem] border-[6px] border-white/5 shadow-2xl sm:size-64">
                          {displayPhotoUrl ? (
                            <img 
                              id="compantic-id-photo"
                              src={displayPhotoUrl} 
                              alt="" 
                              className="h-full w-full object-cover" 
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-6xl font-black text-white/20">
                              {initial}
                            </div>
                          )}
                        </div>
                        {/* Security Badge */}
                        <div className="absolute -bottom-4 -right-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-2xl ring-4 ring-slate-900">
                          <Shield className="size-7" />
                        </div>
                      </div>

                      {/* Additional Details & ID Area */}
                      <div className="mt-8 flex w-full items-end justify-between">
                         <div className="space-y-3">
                            <div>
                               <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Grade Level</p>
                               <p className="text-sm font-black text-white">{forms.gradeLevel}th Grade</p>
                            </div>
                            <div>
                               <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Nationality</p>
                               <p className="text-sm font-black text-white">{o.country?.slice(0, 15) || "USA"}</p>
                            </div>
                         </div>
                         
                         <div className="text-right">
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Issue Date</p>
                            <p className="text-[10px] font-bold text-white mb-3">{new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}</p>
                            <div className="rounded-lg bg-white/10 px-3 py-1.5 backdrop-blur-sm border border-white/10">
                               <p className="text-[7px] font-black uppercase tracking-[0.2em] text-primary-400">STUDENT ID</p>
                               <p className="text-[10px] font-black text-white">#{studentId}</p>
                            </div>
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* Decorative Aesthetic Strip */}
                  <div className="absolute inset-y-0 right-0 w-2 bg-gradient-to-b from-primary-600 via-violet-600 to-amber-400 opacity-80" />
                </div>
              </div>
              
              <div className="mt-12 flex flex-col items-center gap-6">
                <button
                  onClick={downloadCard}
                  className="group relative flex items-center gap-3 rounded-2xl bg-slate-900 px-10 py-5 text-sm font-black text-white shadow-2xl transition-all hover:scale-105 active:scale-95"
                >
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary-600 to-violet-600 opacity-20 blur transition group-hover:opacity-50" />
                  <GraduationCap className="size-5 text-primary-400" />
                  Download Compantic Card (PDF)
                </button>
                <p className="max-w-md text-center text-sm font-medium text-slate-500 leading-relaxed">
                  This card represents your verified academic status within the Compantic ecosystem.
                  The QR code can be used for instant verification by academic counselors.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-12 gap-6"
            >
              {/* Tile: Hero Stats */}
              <BentoCard 
                title="Academic Standing" 
                icon={BarChart3} 
                className="col-span-12 lg:col-span-8"
              >
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div className="rounded-3xl border border-slate-100 bg-slate-50/50 p-6 transition-transform hover:scale-[1.03]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">GPA</p>
                    <p className="mt-2 text-5xl font-black tracking-tighter text-slate-900">{forms.gpa || "N/A"}</p>
                    <div className="mt-4 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full bg-primary-600 rounded-full" style={{ width: `${Math.min(100, (Number(forms.gpa)||0)*25)}%` }} />
                    </div>
                  </div>
                  <div className="rounded-3xl border border-slate-100 bg-slate-50/50 p-6 transition-transform hover:scale-[1.03]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">SAT Score</p>
                    <p className="mt-2 text-5xl font-black tracking-tighter text-slate-900">{forms.sat || "—"}</p>
                    <p className="mt-2 text-xs font-bold text-primary-600">{forms.sat ? "Above average" : "Pending"}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-100 bg-slate-50/50 p-6 transition-transform hover:scale-[1.03]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">ACT Comp</p>
                    <p className="mt-2 text-5xl font-black tracking-tighter text-slate-900">{forms.act || "—"}</p>
                    <p className="mt-2 text-xs font-bold text-violet-600">{forms.act ? "Target reached" : "No record"}</p>
                  </div>
                </div>
              </BentoCard>

              {/* Tile: Location Card */}
              <div className="col-span-12 lg:col-span-4 rounded-[2rem] border border-white/60 bg-slate-900 p-8 text-white shadow-2xl backdrop-blur-3xl">
                <div className="flex items-center gap-4">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                    <MapPin className="size-7 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">Identity</h3>
                    <p className="text-sm text-slate-400">{forms.city}, {forms.state}</p>
                  </div>
                </div>
                <div className="mt-12 space-y-6">
                  {[
                    { label: "Grade Level", value: `${forms.gradeLevel}th Grade`, icon: Star },
                    { label: "Nationality", value: o.country || "United States", icon: Users },
                    { label: "Interest", value: o.areasOfInterest?.[0] || "Exploring", icon: CheckSquare },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <item.icon className="size-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-400">{item.label}</span>
                      </div>
                      <span className="text-sm font-black">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tile: Honors / Awards */}
              <div className="col-span-12 rounded-[2.5rem] bg-gradient-to-br from-violet-600 to-indigo-700 p-8 text-white shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="flex items-center gap-3 text-xl font-black">
                    <Trophy className="size-6" />
                    Achievements & Recognitions
                  </h3>
                  <Award className="size-6 text-white/20" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {awardCards.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-white/40">
                      <Star className="mx-auto size-8 opacity-20" />
                      <p className="mt-4 text-sm font-bold">Awards will appear here</p>
                    </div>
                  ) : (
                    awardCards.map((a, i) => (
                      <div key={i} className="flex items-center gap-4 rounded-2xl border border-white/20 bg-white/10 p-4 transition-transform hover:translate-x-2">
                        <Star className="size-5 text-amber-400 shrink-0" />
                        <div>
                          <p className="text-sm font-black leading-tight">{a.title}</p>
                          <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{a.level}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ... Other Tabs remain same but use BentoCard for consistency ... */}
          {activeTab === "academic" && (
            <motion.div
              key="academic"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
            >
              <BentoCard title="Academic Records" icon={GraduationCap} className="w-full">
                <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-2">
                   {/* Left Column: Academic Basics */}
                   <div className="grid grid-cols-1 gap-4">
                      <div className="flex h-32 flex-col justify-center rounded-[2rem] border border-slate-100 bg-slate-50/50 p-8 transition-transform hover:scale-[1.02]">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Weighted GPA</p>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-5xl font-black tracking-tighter text-slate-900">{forms.gpa || "0.0"}</span>
                          <span className="text-sm font-bold text-slate-400">/ {o.gpaScale || "4.0"} Scale</span>
                        </div>
                      </div>
                      <div className="flex h-32 flex-col justify-center rounded-[2rem] border border-slate-100 bg-slate-50/50 p-8 transition-transform hover:scale-[1.02]">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Expected Graduation</p>
                        <span className="mt-2 text-4xl font-black tracking-tighter text-slate-900">{forms.gradYear || "202X"}</span>
                      </div>
                   </div>

                   {/* Right Column: Test Results (Dark Card) */}
                   <div className="flex flex-col justify-center rounded-[2.5rem] bg-slate-900 p-10 text-white shadow-2xl transition-transform hover:scale-[1.02]">
                      <div className="mb-10 flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Official Test Summary</h4>
                        <div className="size-2 rounded-full bg-primary-500 shadow-[0_0_12px_rgba(var(--primary-rgb),0.5)]" />
                      </div>
                      
                      <div className="space-y-10">
                         <div className="flex items-center justify-between border-b border-white/5 pb-6 last:border-0 last:pb-0">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">SAT Total Score</p>
                              <p className="mt-1 text-sm font-bold text-slate-400">Latest official record</p>
                            </div>
                            <span className="text-5xl font-black tracking-tighter text-primary-400">{forms.sat || "—"}</span>
                         </div>
                         <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">ACT Composite</p>
                              <p className="mt-1 text-sm font-bold text-slate-400">Alternative assessment</p>
                            </div>
                            <span className="text-5xl font-black tracking-tighter text-violet-400">{forms.act || "—"}</span>
                         </div>
                      </div>
                   </div>
                </div>
              </BentoCard>
            </motion.div>
          )}


          {activeTab === "records" && (
            <motion.div
              key="records"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <OnboardingSummary 
                answers={o} 
                onEditSection={(step) => openStepEditor(step)} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* SIDE EDIT DRAWER */}
      <ProfileEditDrawer
        isOpen={drawerMode !== null}
        onClose={() => {
          setDrawerMode(null);
          setEditingStep(null);
        }}
        title={
          drawerMode === "basics" ? "Quick Adjust" : 
          editingStep ? `Edit Section ${editingStep}` : 
          "Settings"
        }
        onSave={handleSave}
        isSaving={isSaving}
      >
        {drawerMode === "step" && stepData && (
          <div className="space-y-6">
            {editingStep === 1 && <Step1Editor data={stepData} onChange={(upd: any) => setStepData((p: any) => ({...p, ...upd}))} />}
            {editingStep === 2 && <Step2Editor data={stepData} onChange={(upd: any) => setStepData((p: any) => ({...p, ...upd}))} />}
            {editingStep === 3 && <Step3Editor data={stepData} onChange={(upd: any) => setStepData((p: any) => ({...p, ...upd}))} />}
            {editingStep === 4 && <Step4Editor data={stepData} onChange={(upd: any) => setStepData((p: any) => ({...p, ...upd}))} />}
            {editingStep === 5 && <Step5Editor data={stepData} onChange={(upd: any) => setStepData((p: any) => ({...p, ...upd}))} />}
          </div>
        )}

        {drawerMode === "basics" && (
          <div className="grid grid-cols-2 gap-6">
          <div className="col-span-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">First Name</label>
            <Input value={forms.firstName} onChange={e => setForms(f => ({...f, firstName: e.target.value}))} className="mt-2 rounded-xl h-12" />
          </div>
          <div className="col-span-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last Name</label>
            <Input value={forms.lastName} onChange={e => setForms(f => ({...f, lastName: e.target.value}))} className="mt-2 rounded-xl h-12" />
          </div>
          <div className="col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current High School</label>
            <Input value={forms.school} onChange={e => setForms(f => ({...f, school: e.target.value}))} className="mt-2 rounded-xl h-12" />
          </div>
          <div className="col-span-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">GPA (Weighted)</label>
            <Input type="number" step="0.01" min={0} max={onboardingAnswers?.gpaScale ?? 5} value={forms.gpa} onChange={e => setForms(f => ({...f, gpa: e.target.value}))} className="mt-2 rounded-xl h-12" />
          </div>
          <div className="col-span-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Graduation Year</label>
            <Input type="number" value={forms.gradYear} onChange={e => setForms(f => ({...f, gradYear: e.target.value}))} className="mt-2 rounded-xl h-12" />
          </div>
          
          <div className="col-span-2 py-4"><div className="h-px bg-slate-100" /></div>

          <div className="col-span-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">SAT Score</label>
            <Input type="number" min={400} max={1600} value={forms.sat} onChange={e => setForms(f => ({...f, sat: e.target.value}))} className="mt-2 rounded-xl h-12" />
          </div>
          <div className="col-span-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">ACT Composite</label>
            <Input type="number" min={1} max={36} value={forms.act} onChange={e => setForms(f => ({...f, act: e.target.value}))} className="mt-2 rounded-xl h-12" />
          </div>
          <div className="col-span-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">City</label>
            <Input value={forms.city} onChange={e => setForms(f => ({...f, city: e.target.value}))} className="mt-2 rounded-xl h-12" />
          </div>
          <div className="col-span-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">State</label>
            <Input value={forms.state} onChange={e => setForms(f => ({...f, state: e.target.value}))} className="mt-2 rounded-xl h-12" />
          </div>
        </div>
      )}
      </ProfileEditDrawer>
    </div>
  );
}

export interface ProfilePageContentProps {
  onboardingAnswers: OnboardingDraft | null;
  profilePhotoUrl?: string | null;
}
