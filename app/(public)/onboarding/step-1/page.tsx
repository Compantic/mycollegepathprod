"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { saveOnboardingDraft, getOnboardingDraft, persistOnboardingToFirestore } from "@/lib/onboarding/storage";
import { auth } from "@/lib/firebase/client";
import type { GradeLevel, AcademicSuccessCrucial, Gender } from "@/lib/onboarding/schema";
import { ageFromDateOfBirth } from "@/lib/onboarding/utils";
import { Button } from "@/components/ui/button";
import { OnboardingStepCard } from "@/components/onboarding/OnboardingStepCard";
import { Input } from "@/components/ui/input";
import { STEP_CONFIG } from "@/lib/onboarding/stepConfig";
import { cn } from "@/lib/utils";
import { User, Calendar, Search, ChevronDown, Camera } from "lucide-react";

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

function OnboardingStep1Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromProfile = searchParams.get("from") === "profile";
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [genderOther, setGenderOther] = useState("");
  const [country, setCountry] = useState("United States");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [currentHighSchool, setCurrentHighSchool] = useState("");
  const [expectedGraduationYear, setExpectedGraduationYear] = useState<number | "">("");
  const [gradeLevel, setGradeLevel] = useState<GradeLevel | "">("");
  const [lifeSatisfaction, setLifeSatisfaction] = useState<number | "">("");
  const [addingToLife, setAddingToLife] = useState("");
  const [eliminatingFromLife, setEliminatingFromLife] = useState("");
  const [academicSuccessCrucial, setAcademicSuccessCrucial] = useState<AcademicSuccessCrucial | "">("");
  const [naturalSkills, setNaturalSkills] = useState("");
  const [favoriteClass, setFavoriteClass] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const d = getOnboardingDraft();
    if (d.profilePhotoDataUrl) setPhotoPreview(d.profilePhotoDataUrl);
    if (d.firstName) setFirstName(d.firstName);
    if (d.lastName) setLastName(d.lastName);
    if (d.dateOfBirth) setDateOfBirth(d.dateOfBirth);
    if (d.gender) setGender(d.gender);
    if (d.genderOther) setGenderOther(d.genderOther);
    if (d.country) setCountry(d.country);
    if (d.state) setState(d.state);
    if (d.city) setCity(d.city);
    if (d.currentHighSchool) setCurrentHighSchool(d.currentHighSchool);
    if (d.expectedGraduationYear != null) setExpectedGraduationYear(d.expectedGraduationYear);
    if (d.gradeLevel) setGradeLevel(d.gradeLevel);
    if (d.lifeSatisfaction != null) setLifeSatisfaction(d.lifeSatisfaction);
    if (d.addingToLife) setAddingToLife(d.addingToLife);
    if (d.eliminatingFromLife) setEliminatingFromLife(d.eliminatingFromLife);
    if (d.academicSuccessCrucial) setAcademicSuccessCrucial(d.academicSuccessCrucial);
    if (d.naturalSkills) setNaturalSkills(d.naturalSkills);
    if (d.favoriteClass) setFavoriteClass(d.favoriteClass);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!firstName.trim()) err.firstName = "First name is required.";
    if (!lastName.trim()) err.lastName = "Last name is required.";
    if (!dateOfBirth.trim()) err.dateOfBirth = "Date of birth is required.";
    if (!gender) err.gender = "Please select a gender.";
    if (country === "United States" && !state) err.state = "State is required when country is United States.";
    if (expectedGraduationYear === "" || expectedGraduationYear == null) err.expectedGraduationYear = "Expected graduation year is required.";
    if (!gradeLevel) err.gradeLevel = "Please select your grade level.";
    if (lifeSatisfaction === "" || lifeSatisfaction === undefined) err.lifeSatisfaction = "Please rate your life satisfaction.";
    if (!academicSuccessCrucial) err.academicSuccessCrucial = "Please select an option.";
    setErrors(err);
    if (Object.keys(err).length) return;

    const sat = lifeSatisfaction === "" ? undefined : Number(lifeSatisfaction);
    if (sat != null && (sat < 1 || sat > 10)) {
      setErrors((prev) => ({ ...prev, lifeSatisfaction: "Choose a value between 1 and 10." }));
      return;
    }

    saveOnboardingDraft({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth: dateOfBirth.trim() || undefined,
      gender: gender || undefined,
      genderOther: gender === "Other" ? genderOther.trim() || undefined : undefined,
      country: country || undefined,
      state: state || undefined,
      city: city.trim() || undefined,
      currentHighSchool: currentHighSchool.trim() || undefined,
      expectedGraduationYear: expectedGraduationYear === "" ? undefined : Number(expectedGraduationYear),
      gradeLevel: gradeLevel as GradeLevel,
      lifeSatisfaction: sat ?? undefined,
      addingToLife: addingToLife.trim() || undefined,
      eliminatingFromLife: eliminatingFromLife.trim() || undefined,
      academicSuccessCrucial: academicSuccessCrucial as AcademicSuccessCrucial,
      naturalSkills: naturalSkills.trim() || undefined,
      favoriteClass: favoriteClass.trim() || undefined,
    });
    if (fromProfile && auth.currentUser) {
      await persistOnboardingToFirestore(auth.currentUser.uid, getOnboardingDraft());
      router.push("/app/profile");
      return;
    }
    router.push("/onboarding/step-2");
  }

  const satNum = lifeSatisfaction === "" ? 5 : Math.min(10, Math.max(1, Number(lifeSatisfaction)));
  const displayAge = dateOfBirth ? ageFromDateOfBirth(dateOfBirth) : null;

  const config = STEP_CONFIG[1];

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPhotoPreview(dataUrl);
      saveOnboardingDraft({ profilePhotoDataUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  }

  return (
    <OnboardingStepCard
      title={config.title}
      subtitle="Let's start building your academic profile. This helps us personalize your journey."
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
        {/* Profile photo */}
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative rounded-full w-24 h-24 border-2 border-primary-500/30 bg-gradient-to-br from-secondary-100 to-primary-500/10 flex items-center justify-center overflow-hidden hover:border-primary-500 hover:scale-[1.02] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            {photoPreview ? (
              <img src={photoPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <Camera className="h-8 w-8 text-text-muted" />
            )}
            <span className="absolute bottom-0 right-0 rounded-full bg-primary-500 text-white p-1">
              <Camera className="h-3.5 w-3.5" />
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
            aria-label="Upload profile photo"
          />
          <p className="text-sm text-text-muted">Upload a profile photo</p>
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="rounded-xl border-2 hover:border-primary-500 hover:bg-primary-500/5 transition-colors">
            Select File
          </Button>
        </div>

        {/* Personal Information */}
        <section className="space-y-5" aria-labelledby="personal-heading">
          <h2 id="personal-heading" className="onboarding-section-title">
            <User className="h-4 w-4 text-primary-500" />
            Personal information
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
                <Calendar className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <label htmlFor="dob" className="block text-sm font-medium text-text-primary mb-1.5">Date of birth</label>
                <p className="text-xs text-text-muted mb-1.5">Format: mm/dd/yyyy</p>
                <Input id="dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="max-w-xs onboarding-input h-11" aria-invalid={!!errors.dateOfBirth} />
                {displayAge != null && <p className="mt-1.5 text-xs text-primary-600 font-medium">Age: {displayAge} years</p>}
                {errors.dateOfBirth && <p className="mt-1.5 text-sm text-status-dangerText">{errors.dateOfBirth}</p>}
              </div>
            </div>

            <fieldset>
              <legend className="text-sm font-medium text-text-primary">Gender</legend>
              <p className="mt-0.5 text-xs text-text-muted mb-3">Required</p>
              <div className="flex flex-wrap gap-2">
                {GENDER_OPTIONS.map((o) => (
                  <label
                    key={o.value}
                    className={cn("onboarding-pill", gender === o.value && "onboarding-pill-selected")}
                  >
                    <input type="radio" name="gender" value={o.value} checked={gender === o.value} onChange={() => setGender(o.value)} className="sr-only" />
                    {o.label}
                  </label>
                ))}
              </div>
              {gender === "Other" && <Input value={genderOther} onChange={(e) => setGenderOther(e.target.value)} placeholder="Specify (optional)" className="mt-3 max-w-xs onboarding-input h-11" />}
              {errors.gender && <p className="mt-1.5 text-sm text-status-dangerText">{errors.gender}</p>}
            </fieldset>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Where do you live?</label>
              <p className="text-xs text-text-muted mb-2">Country required; state required if US.</p>
              <div className="space-y-3">
                <div>
                  <label htmlFor="country" className="sr-only">Country</label>
                  <select id="country" value={country} onChange={(e) => setCountry(e.target.value)} className="onboarding-select h-11">
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {country === "United States" && (
                  <div>
                    <label htmlFor="state" className="block text-xs font-medium text-text-muted mb-1.5">State</label>
                    <select id="state" value={state} onChange={(e) => setState(e.target.value)} className="onboarding-select h-11" aria-required>
                      <option value="">Select state</option>
                      {US_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {errors.state && <p className="mt-1.5 text-sm text-status-dangerText">{errors.state}</p>}
                  </div>
                )}
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
                <label htmlFor="high-school" className="block text-sm font-medium text-text-primary mb-1.5">Current high school</label>
                <Input id="high-school" value={currentHighSchool} onChange={(e) => setCurrentHighSchool(e.target.value)} placeholder="Start typing your school name..." className="mt-0 onboarding-input h-11" />
                <Link href="#" className="mt-1.5 inline-block text-xs font-medium text-primary-500 hover:text-primary-600 hover:underline transition-colors">Can&apos;t find your school? Add it manually</Link>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="onboarding-icon-box">
                <ChevronDown className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <label htmlFor="grad-year" className="block text-sm font-medium text-text-primary mb-1.5">Expected graduation year</label>
                <select id="grad-year" value={expectedGraduationYear === "" ? "" : expectedGraduationYear} onChange={(e) => setExpectedGraduationYear(e.target.value ? Number(e.target.value) : "")} className="mt-0 onboarding-select h-11" aria-required aria-invalid={!!errors.expectedGraduationYear}>
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

        {/* Life Outlook */}
        <section className="pt-6 border-t-2 border-bg-border" aria-labelledby="life-outlook-heading">
          <h2 id="life-outlook-heading" className="onboarding-section-title">
            Life outlook
          </h2>
          <p className="mt-1 text-xs text-text-muted">A few icebreakers to get to know you.</p>
          <div className="mt-5 space-y-6">
            <div>
              <label htmlFor="grade" className="block text-sm font-medium text-text-primary mb-1.5">What is your current grade level?</label>
              <p className="text-xs text-text-muted mb-2">Required</p>
              <select id="grade" value={gradeLevel} onChange={(e) => setGradeLevel((e.target.value || "") as GradeLevel)} className="onboarding-select h-11" aria-invalid={!!errors.gradeLevel}>
                <option value="">Select grade</option>
                {GRADE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {errors.gradeLevel && <p className="mt-1.5 text-sm text-status-dangerText">{errors.gradeLevel}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="life-sat" className="text-sm font-medium text-text-primary">How would you rate your life satisfaction?</label>
                <span className="text-sm font-semibold text-primary-600 min-w-[2rem] text-right">{lifeSatisfaction === "" ? "—" : satNum}/10</span>
              </div>
              <p className="text-xs text-text-muted mb-2">1 = low, 10 = high. Required.</p>
              <input id="life-sat" type="range" min={1} max={10} value={satNum} onChange={(e) => setLifeSatisfaction(parseInt(e.target.value, 10))} className="onboarding-slider" />
              {errors.lifeSatisfaction && <p className="mt-1.5 text-sm text-status-dangerText">{errors.lifeSatisfaction}</p>}
            </div>

            <div>
              <label htmlFor="adding" className="block text-sm font-medium text-text-primary mb-1.5">If you had all the opportunities without limitations, what would you add to your life?</label>
              <p className="text-xs text-text-muted mb-2">Optional</p>
              <textarea id="adding" value={addingToLife} onChange={(e) => setAddingToLife(e.target.value)} rows={3} className="w-full onboarding-input resize-none py-3" placeholder="e.g. More time for hobbies, travel, learning a new skill..." />
            </div>

            <div>
              <label htmlFor="eliminating" className="block text-sm font-medium text-text-primary mb-1.5">What is one thing you want to eliminate from your life that would release the most burden or difficulty?</label>
              <p className="text-xs text-text-muted mb-2">Optional</p>
              <textarea id="eliminating" value={eliminatingFromLife} onChange={(e) => setEliminatingFromLife(e.target.value)} rows={3} className="w-full onboarding-input resize-none py-3" placeholder="e.g. Stress, procrastination, self-doubt..." />
            </div>

            <fieldset>
              <legend className="text-sm font-medium text-text-primary">Do you believe academic success is crucial for your happiness and life success?</legend>
              <p className="mt-0.5 text-xs text-text-muted mb-3">Required</p>
              <div className="flex flex-wrap gap-2">
                {(["Yes", "No", "Not sure"] as const).map((opt) => (
                  <label
                    key={opt}
                    className={cn("onboarding-pill", academicSuccessCrucial === opt && "onboarding-pill-selected")}
                  >
                    <input type="radio" name="academic" value={opt} checked={academicSuccessCrucial === opt} onChange={() => setAcademicSuccessCrucial(opt)} className="sr-only" />
                    {opt}
                  </label>
                ))}
              </div>
              {errors.academicSuccessCrucial && <p className="mt-1.5 text-sm text-status-dangerText">{errors.academicSuccessCrucial}</p>}
            </fieldset>

            <div>
              <label htmlFor="natural" className="block text-sm font-medium text-text-primary mb-1.5">What are you naturally good at?</label>
              <p className="text-xs text-text-muted mb-2">Optional</p>
              <textarea id="natural" value={naturalSkills} onChange={(e) => setNaturalSkills(e.target.value)} rows={3} className="w-full onboarding-input resize-none py-3" placeholder="e.g. Problem-solving, writing, teamwork..." />
            </div>

            <div>
              <label htmlFor="favorite-class" className="block text-sm font-medium text-text-primary mb-1.5">What is your favorite class?</label>
              <p className="text-xs text-text-muted mb-2">Optional</p>
              <Input id="favorite-class" value={favoriteClass} onChange={(e) => setFavoriteClass(e.target.value)} placeholder="e.g. Math, History, Biology" className="onboarding-input h-11" />
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
