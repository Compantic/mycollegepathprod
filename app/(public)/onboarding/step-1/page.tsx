"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveOnboardingDraft, getOnboardingDraft, persistOnboardingToFirestore } from "@/lib/onboarding/storage";
import { fileToProfileJpegDataUrl } from "@/lib/onboarding/profilePhotoResize";
import { useToastOptional } from "@/components/ui/toast";
import { auth } from "@/lib/firebase/client";
import type { GradeLevel, Gender } from "@/lib/onboarding/schema";
import { ageFromDateOfBirth } from "@/lib/onboarding/utils";
import { Button } from "@/components/ui/button";
import { OnboardingStepCard } from "@/components/onboarding/OnboardingStepCard";
import { Input } from "@/components/ui/input";
import { STEP_CONFIG } from "@/lib/onboarding/stepConfig";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { User, Calendar as CalendarSectionIcon, Search, ChevronDown, Camera } from "lucide-react";
import { DateOfBirthPicker } from "@/components/onboarding/DateOfBirthPicker";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
];

const GRAD_YEARS = [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033];

const GRADE_OPTIONS: { value: GradeLevel; label: string }[] = [
  { value: "9", label: "Grade 9" },
  { value: "10", label: "Grade 10" },
  { value: "11", label: "Grade 11" },
  { value: "12", label: "Grade 12" },
  { value: "Gap Year", label: "Gap Year" },
  { value: "Other", label: "Other" },
];

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Non-binary", label: "Non-binary" },
  { value: "Prefer not to say", label: "Prefer not to say" },
  { value: "Other", label: "Other" },
];

const PROFILE_PHOTO_INPUT_ID = "onboarding-profile-photo";
const APP_COUNTRY = "United States" as const;

function OnboardingStep1Content() {
  const { toast } = useToastOptional();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromProfile = searchParams.get("from") === "profile";
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [genderOther, setGenderOther] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [currentHighSchool, setCurrentHighSchool] = useState("");
  const [expectedGraduationYear, setExpectedGraduationYear] = useState<number | "">("");
  const [gradeLevel, setGradeLevel] = useState<GradeLevel | "">("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);

  useEffect(() => {
    const d = getOnboardingDraft();
    if (d.profilePhotoDataUrl) setPhotoPreview(d.profilePhotoDataUrl);
    if (d.firstName) setFirstName(d.firstName);
    if (d.lastName) setLastName(d.lastName);
    if (d.dateOfBirth) setDateOfBirth(d.dateOfBirth);
    if (d.gender) setGender(d.gender);
    if (d.genderOther) setGenderOther(d.genderOther);
    if (d.state) setState(d.state);
    if (d.city) setCity(d.city);
    if (d.currentHighSchool) setCurrentHighSchool(d.currentHighSchool);
    if (d.expectedGraduationYear != null) setExpectedGraduationYear(d.expectedGraduationYear);
    if (d.gradeLevel) setGradeLevel(d.gradeLevel);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!firstName.trim()) err.firstName = "First name is required.";
    if (!lastName.trim()) err.lastName = "Last name is required.";
    if (!dateOfBirth.trim()) err.dateOfBirth = "Date of birth is required.";
    if (!gender) err.gender = "Please select a gender.";
    if (!state) err.state = "State is required.";
    if (expectedGraduationYear === "" || expectedGraduationYear == null) err.expectedGraduationYear = "Expected graduation year is required.";
    if (!gradeLevel) err.gradeLevel = "Please select your grade level.";
    setErrors(err);
    if (Object.keys(err).length) return;

    saveOnboardingDraft({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth: dateOfBirth.trim() || undefined,
      gender: gender || undefined,
      genderOther: gender === "Other" ? genderOther.trim() || undefined : undefined,
      country: APP_COUNTRY,
      state: state || undefined,
      city: city.trim() || undefined,
      currentHighSchool: currentHighSchool.trim() || undefined,
      expectedGraduationYear: expectedGraduationYear === "" ? undefined : Number(expectedGraduationYear),
      gradeLevel: gradeLevel as GradeLevel,
    });
    if (fromProfile && auth.currentUser) {
      await persistOnboardingToFirestore(auth.currentUser.uid, getOnboardingDraft());
      router.push("/app/profile");
      return;
    }
    router.push("/onboarding/step-2");
  }

  const displayAge = dateOfBirth ? ageFromDateOfBirth(dateOfBirth) : null;
  const config = STEP_CONFIG[1];

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    setPhotoBusy(true);
    try {
      const dataUrl = await fileToProfileJpegDataUrl(file);
      const status = saveOnboardingDraft({ profilePhotoDataUrl: dataUrl });
      if (status === "failed") {
        setPhotoPreview(null);
        toast({
          variant: "error",
          title: "Could not save",
          description: "Browser storage is full. Clear site data for this site or continue without a photo.",
        });
        return;
      }
      setPhotoPreview(dataUrl);
      if (status === "quota_photo_removed") {
        toast({
          variant: "error",
          title: "Photo not saved",
          description: "You can see it here, but browser storage is full so it won’t persist after refresh. Free space or add a photo later from your profile.",
        });
      }
    } catch {
      toast({
        variant: "error",
        title: "Could not use this image",
        description: "Try another photo (JPEG or PNG).",
      });
    } finally {
      setPhotoBusy(false);
    }
  }

  return (
    <OnboardingStepCard
      title={config.title}
      subtitle="Let’s start with who you are and where you go to school."
      icon={<User className="h-5 w-5" />}
      showPrivacyFooter
      formId="onboarding-step1-form"
      actions={
        <>
          <button
            type="button"
            onClick={() => router.push(fromProfile ? "/app/profile" : "/onboarding/step-2")}
            className="text-sm font-medium text-text-muted hover:text-primary-500 transition-colors"
          >
            {fromProfile ? "Back to profile" : "Skip for now"}
          </button>
          <Button type="submit" form="onboarding-step1-form" className="gap-2">
            Next <span aria-hidden>→</span>
          </Button>
        </>
      }
    >
      <form id="onboarding-step1-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center gap-3">
          {/*
            Use <label htmlFor> + sr-only input (not display:none). Programmatic input.click()
            fails in Safari and some browsers when the input has class "hidden".
          */}
          <input
            id={PROFILE_PHOTO_INPUT_ID}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={photoBusy}
            onChange={handlePhotoChange}
            aria-label="Upload profile photo"
          />
          <label
            htmlFor={PROFILE_PHOTO_INPUT_ID}
            className={cn(
              "relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-primary-500/30 bg-gradient-to-br from-secondary-100 to-primary-500/10 transition-all duration-300 hover:scale-[1.02] hover:border-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2",
              photoBusy && "pointer-events-none opacity-60"
            )}
          >
            {photoPreview ? (
              <img src={photoPreview} alt="" className="h-full w-full object-cover" />
            ) : (
              <Camera className="h-8 w-8 text-text-muted" aria-hidden />
            )}
          </label>
          <p className="text-sm text-text-muted">Upload a profile photo (optional)</p>
          <label
            htmlFor={PROFILE_PHOTO_INPUT_ID}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "cursor-pointer rounded-xl border-2 hover:border-primary-500 hover:bg-primary-500/5",
              photoBusy && "pointer-events-none opacity-60"
            )}
          >
            {photoBusy ? "Processing…" : "Select File"}
          </label>
        </div>

        <section className="space-y-5" aria-labelledby="personal-heading">
          <h2 id="personal-heading" className="onboarding-section-title">
            <User className="h-4 w-4 text-primary-500" />
            Identity & basics
          </h2>
          <div className="space-y-5">
            <div className="flex gap-3">
              <div className="onboarding-icon-box">
                <User className="h-5 w-5" />
              </div>
              <div className="grid flex-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="first-name" className="block text-sm font-medium text-text-primary mb-1.5">First name</label>
                  <Input id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="e.g. John" className="mt-0 onboarding-input h-11" aria-required aria-invalid={!!errors.firstName} />
                  {errors.firstName && <p className="mt-1.5 text-sm text-status-dangerText">{errors.firstName}</p>}
                </div>
                <div>
                  <label htmlFor="last-name" className="block text-sm font-medium text-text-primary mb-1.5">Last name</label>
                  <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="e.g. Doe" className="mt-0 onboarding-input h-11" aria-required aria-invalid={!!errors.lastName} />
                  {errors.lastName && <p className="mt-1.5 text-sm text-status-dangerText">{errors.lastName}</p>}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="onboarding-icon-box">
                <CalendarSectionIcon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <label htmlFor="dob" className="block text-sm font-medium text-text-primary mb-1.5">Date of birth</label>
                <p className="text-xs text-text-muted mb-1.5">Use the month and year menus, then tap your day</p>
                <DateOfBirthPicker id="dob" value={dateOfBirth} onChange={setDateOfBirth} invalid={!!errors.dateOfBirth} />
                {displayAge != null && <p className="mt-1.5 text-xs text-primary-600 font-medium">Age: {displayAge} years</p>}
                {errors.dateOfBirth && <p className="mt-1.5 text-sm text-status-dangerText">{errors.dateOfBirth}</p>}
              </div>
            </div>

            <fieldset>
              <legend className="text-sm font-medium text-text-primary">Gender</legend>
              <p className="mt-0.5 text-xs text-text-muted mb-3">Required</p>
              <div className="flex flex-wrap gap-2">
                {GENDER_OPTIONS.map((o) => (
                  <label key={o.value} className={cn("onboarding-pill", gender === o.value && "onboarding-pill-selected")}>
                    <input type="radio" name="gender" value={o.value} checked={gender === o.value} onChange={() => setGender(o.value)} className="sr-only" />
                    {o.label}
                  </label>
                ))}
              </div>
              {gender === "Other" && <Input value={genderOther} onChange={(e) => setGenderOther(e.target.value)} placeholder="Specify (optional)" className="mt-3 max-w-xs onboarding-input h-11" />}
              {errors.gender && <p className="mt-1.5 text-sm text-status-dangerText">{errors.gender}</p>}
            </fieldset>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Location</label>
              <p className="text-xs text-text-muted mb-2">MyCollegePath is focused on U.S. college admissions — location is United States only. State is required.</p>
              <div className="space-y-3">
                <div>
                  <label htmlFor="state" className="block text-xs font-medium text-text-muted mb-1.5">State</label>
                  <select id="state" value={state} onChange={(e) => setState(e.target.value)} className="onboarding-select" aria-required aria-invalid={!!errors.state}>
                    <option value="">Select state</option>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.state && <p className="mt-1.5 text-sm text-status-dangerText">{errors.state}</p>}
                </div>
                <div>
                  <label htmlFor="city" className="block text-xs font-medium text-text-muted mb-1.5">City (optional)</label>
                  <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Boston, Los Angeles" className="mt-0 onboarding-input h-11" />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="onboarding-icon-box">
                <Search className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <label htmlFor="high-school" className="block text-sm font-medium text-text-primary mb-1.5">High school</label>
                <Input id="high-school" value={currentHighSchool} onChange={(e) => setCurrentHighSchool(e.target.value)} placeholder="Start typing your school name…" className="mt-0 onboarding-input h-11" />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="onboarding-icon-box">
                <ChevronDown className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <label htmlFor="grade" className="block text-sm font-medium text-text-primary mb-1.5">Grade level</label>
                <p className="text-xs text-text-muted mb-2">Required</p>
                <select id="grade" value={gradeLevel} onChange={(e) => setGradeLevel((e.target.value || "") as GradeLevel)} className="onboarding-select" aria-invalid={!!errors.gradeLevel}>
                  <option value="">Select grade</option>
                  {GRADE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {errors.gradeLevel && <p className="mt-1.5 text-sm text-status-dangerText">{errors.gradeLevel}</p>}
              </div>
            </div>

            <div className="flex gap-3">
              <div className="onboarding-icon-box">
                <CalendarSectionIcon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <label htmlFor="grad-year" className="block text-sm font-medium text-text-primary mb-1.5">Graduation year</label>
                <select id="grad-year" value={expectedGraduationYear === "" ? "" : expectedGraduationYear} onChange={(e) => setExpectedGraduationYear(e.target.value ? Number(e.target.value) : "")} className="mt-0 onboarding-select" aria-required aria-invalid={!!errors.expectedGraduationYear}>
                  <option value="">Select year</option>
                  {GRAD_YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                {errors.expectedGraduationYear && <p className="mt-1.5 text-sm text-status-dangerText">{errors.expectedGraduationYear}</p>}
              </div>
            </div>
          </div>
        </section>
      </form>
    </OnboardingStepCard>
  );
}

export default function OnboardingStep1Page() {
  return (
    <Suspense fallback={null}>
      <OnboardingStep1Content />
    </Suspense>
  );
}
