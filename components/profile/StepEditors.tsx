"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { INTEREST_CATEGORIES, ACTIVITY_TYPES } from "@/lib/onboarding/schema";
import { birthYearFromDraft } from "@/lib/onboarding/utils";
import { motion } from "framer-motion";

interface TagCloudProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

function TagCloud({ options, selected, onChange }: TagCloudProps) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={cn(
            "rounded-full px-4 py-2 text-xs font-bold transition-all border",
            selected.includes(opt)
              ? "bg-primary-600 border-primary-600 text-white shadow-lg"
              : "bg-white border-slate-200 text-slate-500 hover:border-primary-400 hover:text-primary-600"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// --- Step 1 Editor ---
export function Step1Editor({ data, onChange }: any) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">First Name</label>
        <Input value={data.firstName || ""} onChange={(e) => onChange({ firstName: e.target.value })} className="mt-1.5 h-12 rounded-xl" />
      </div>
      <div className="col-span-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Last Name</label>
        <Input value={data.lastName || ""} onChange={(e) => onChange({ lastName: e.target.value })} className="mt-1.5 h-12 rounded-xl" />
      </div>
      <div className="col-span-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">High School</label>
        <Input value={data.currentHighSchool || ""} onChange={(e) => onChange({ currentHighSchool: e.target.value })} className="mt-1.5 h-12 rounded-xl" />
      </div>
      <div className="col-span-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">City</label>
        <Input value={data.city || ""} onChange={(e) => onChange({ city: e.target.value })} className="mt-1.5 h-12 rounded-xl" />
      </div>
      <div className="col-span-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">State</label>
        <Input value={data.state || ""} onChange={(e) => onChange({ state: e.target.value })} className="mt-1.5 h-12 rounded-xl" />
      </div>
      <div className="col-span-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Birth Year</label>
        <select
          value={data.birthYear ?? birthYearFromDraft(data) ?? ""}
          onChange={(e) =>
            onChange({
              birthYear: e.target.value ? Number(e.target.value) : undefined,
              dateOfBirth: undefined,
            })
          }
          className="mt-1.5 flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
        >
          <option value="">Select year</option>
          {Array.from({ length: new Date().getFullYear() - 1949 }, (_, i) => new Date().getFullYear() - 10 - i).map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Grade Level</label>
        <select 
          value={data.gradeLevel || ""} 
          onChange={(e) => onChange({ gradeLevel: e.target.value })}
          className="mt-1.5 flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
        >
          <option value="">Select Level</option>
          <option value="9">9th Grade</option>
          <option value="10">10th Grade</option>
          <option value="11">11th Grade</option>
          <option value="12">12th Grade</option>
          <option value="Gap Year">Gap Year</option>
        </select>
      </div>
    </div>
  );
}

// --- Step 2 Editor ---
export function Step2Editor({ data, onChange }: any) {
  const options = ["Structured", "Balanced", "Open-ended"];
  return (
    <div className="space-y-6">
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Academic Environment</label>
        <div className="mt-4 flex gap-2">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange({ intellectualStructuredVsOpen: opt })}
              className={cn(
                "flex-1 rounded-xl p-3 text-xs font-bold transition-all border",
                data.intellectualStructuredVsOpen === opt
                  ? "bg-slate-900 border-slate-900 text-white"
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Favorite Subjects</label>
        <p className="mt-1 text-xs text-slate-400">Comma separated</p>
        <Input 
          value={data.favoriteSubjectsRank?.join(", ") || ""} 
          onChange={(e) => onChange({ favoriteSubjectsRank: e.target.value.split(",").map((s: string) => s.trim()) })} 
          className="mt-2 h-12 rounded-xl" 
        />
      </div>
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Life Satisfaction (1-10)</label>
        <Input type="number" min="1" max="10" value={data.lifeSatisfaction || ""} onChange={(e) => onChange({ lifeSatisfaction: parseInt(e.target.value) })} className="mt-2 h-12 rounded-xl" />
      </div>
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Natural Skills</label>
        <Input value={data.naturalSkills || ""} onChange={(e) => onChange({ naturalSkills: e.target.value })} className="mt-2 h-12 rounded-xl" placeholder="e.g. Communication, Problem solving" />
      </div>
    </div>
  );
}

// --- Step 3 Editor ---
export function Step3Editor({ data, onChange }: any) {
  return (
    <div className="space-y-8">
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 block">Major Areas of Interest</label>
        <TagCloud 
          options={INTEREST_CATEGORIES} 
          selected={data.areasOfInterest || []} 
          onChange={(sel) => onChange({ areasOfInterest: sel })} 
        />
      </div>
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Specific Career Goal</label>
        <Input value={data.careerPathWhat || ""} onChange={(e) => onChange({ careerPathWhat: e.target.value })} className="mt-2 h-12 rounded-xl" placeholder="e.g. Neurosurgeon, Data Scientist" />
      </div>
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Target Degree</label>
        <select 
          value={data.targetDegree || ""} 
          onChange={(e) => onChange({ targetDegree: e.target.value })}
          className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
        >
          <option value="">Select Degree</option>
          {["MA", "MS", "PHD", "MD", "DDS", "JD", "Not sure"].map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// --- Step 4 Editor ---
export function Step4Editor({ data, onChange }: any) {
  const gpaScale = data.gpaScale === 5 ? 5 : 4;
  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="col-span-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">GPA (Weighted)</label>
        <Input type="number" step="0.01" min={0} max={gpaScale} value={data.gpa || ""} onChange={(e) => onChange({ gpa: e.target.value === "" ? undefined : parseFloat(e.target.value) })} className="mt-1.5 h-12 rounded-xl" />
      </div>
      <div className="col-span-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">GPA Scale</label>
        <select 
          value={data.gpaScale || ""} 
          onChange={(e) => onChange({ gpaScale: parseInt(e.target.value) })}
          className="mt-1.5 flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
        >
          <option value="4">4.0 Scale</option>
          <option value="5">5.0 Scale</option>
        </select>
      </div>
      <div className="col-span-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">SAT total</label>
        <Input
          type="text"
          inputMode="numeric"
          value={data.satTotal ?? data.satScore ?? ""}
          onChange={(e) =>
            onChange({
              satTotal: e.target.value === "" ? undefined : parseInt(e.target.value, 10),
              satScore: e.target.value === "" ? undefined : parseInt(e.target.value, 10),
              satReadingWriting: undefined,
              satMath: undefined,
            })
          }
          className="mt-1.5 h-12 rounded-xl"
          placeholder="400–1600"
        />
      </div>
      <div className="col-span-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">ACT total</label>
        <Input
          type="text"
          inputMode="numeric"
          value={data.actComposite ?? data.actScore ?? ""}
          onChange={(e) =>
            onChange({
              actComposite: e.target.value === "" ? undefined : parseInt(e.target.value, 10),
              actScore: e.target.value === "" ? undefined : parseInt(e.target.value, 10),
            })
          }
          className="mt-1.5 h-12 rounded-xl"
          placeholder="1–36"
        />
      </div>
      <div className="col-span-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">AP Exams Completed</label>
        <Input type="number" min={0} max={99} value={data.apExamsCount || ""} onChange={(e) => onChange({ apExamsCount: e.target.value === "" ? undefined : parseInt(e.target.value, 10) })} className="mt-1.5 h-12 rounded-xl" />
      </div>
    </div>
  );
}

// --- Step 5 Editor ---
export function Step5Editor({ data, onChange }: any) {
  const campusOptions = ["Urban", "Suburban", "Rural"];
  return (
    <div className="space-y-8">
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 block">Preferred Activities</label>
        <TagCloud 
          options={ACTIVITY_TYPES} 
          selected={(data.activityTypes || []).map((a: any) => a.type)} 
          onChange={(sel) => {
            const current = data.activityTypes || [];
            const next = sel.map(type => {
              const existing = current.find((c: any) => c.type === type);
              return existing || { type, description: "" };
            });
            onChange({ activityTypes: next });
          }} 
        />
      </div>
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 block">Campus Settings</label>
        <div className="flex gap-2">
          {campusOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                const current = data.campusUrbanSuburbanRural || [];
                const next = current.includes(opt) ? current.filter((c: string) => c !== opt) : [...current, opt];
                onChange({ campusUrbanSuburbanRural: next });
              }}
              className={cn(
                "flex-1 rounded-xl p-3 text-xs font-bold transition-all border",
                (data.campusUrbanSuburbanRural || []).includes(opt)
                  ? "bg-slate-900 border-slate-900 text-white"
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 block">Preferred States</label>
        <p className="mt-1 mb-4 text-[10px] text-slate-400">Comma separated, e.g. CA, NY, TX</p>
        <Input 
          value={(data.locationPreferenceStates || []).join(", ")} 
          onChange={(e) => onChange({ locationPreferenceStates: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} 
          className="h-12 rounded-xl" 
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Annual Budget</label>
          <select 
            value={data.budgetPerYear || ""} 
            onChange={(e) => onChange({ budgetPerYear: e.target.value })}
            className="mt-1.5 flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
          >
            <option value="">Select Budget</option>
            {["5K", "10K", "20K", "30K", "40K", "50K", "60K", "70K+"].map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Financial Aid</label>
          <select 
            value={data.fafsaEligibility || ""} 
            onChange={(e) => onChange({ fafsaEligibility: e.target.value })}
            className="mt-1.5 flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
          >
            <option value="">Select Strategy</option>
            <option value="Yes">Seeking Aid</option>
            <option value="No">Self-funded</option>
            <option value="Not sure">Not sure</option>
          </select>
        </div>
      </div>
    </div>
  );
}
