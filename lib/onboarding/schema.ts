/**
 * Onboarding schema: all wizard steps, Firestore users/{uid}/onboardingAnswers.
 */

// Step 1 – Identity
export type Gender = "Male" | "Female" | "Non-binary" | "Prefer not to say" | "Other";
export type GradeLevel = "9" | "10" | "11" | "12" | "Gap Year" | "Other";

// Step 2 – Psychology
export type AcademicSuccessCrucial = "Yes" | "No" | "Not sure";
export type PreferenceCoreType = "Ideas" | "Data" | "People" | "Things";
/** @deprecated Prefer preferenceCoreType; kept for legacy Firestore docs */
export type WorkInclinationItem = PreferenceCoreType;

export type StructuredVsOpen = "Structured" | "Balanced" | "Open-ended";
export type LectureVsDiscussion = "Lecture" | "Balanced" | "Discussion";
export type ResearchVsApplication = "Research" | "Balanced" | "Application";
export type TheoreticalVsHandsOn = "Theoretical" | "Balanced" | "Hands-on";
export type CompetitiveVsCollaborative = "Competitive" | "Balanced" | "Collaborative";
export type IntrovertedVsSocial = "Introverted" | "Balanced" | "Social";
export type LargeVsTight = "Large networks" | "Balanced" | "Tight circles";
export type IndependentVsGuided = "Independent" | "Balanced" | "Guided";

// Step 3 – Career
export type CareerPath = "Yes" | "Not sure" | "No";
export type TargetDegree =
  | "MA"
  | "MS"
  | "GD"
  | "LLM"
  | "PHD"
  | "Ed.D"
  | "MD"
  | "DO"
  | "DDS"
  | "DVM"
  | "Not sure";
export type KnowCoursesStandOut = "Yes" | "Somewhat" | "No";

export type InterestCategory =
  | "STEM"
  | "Health"
  | "Business"
  | "Humanities"
  | "Social Sciences"
  | "Arts"
  | "Education"
  | "Other";

// Step 4 – Academic strength
export type ExamType = "SAT" | "ACT" | "AP" | "IB" | "TOEFL" | "IELTS" | "Duolingo" | "PTE" | "PSAT";
export type TutoringBenefit = "Individual" | "Small group" | "Large group" | "No" | "No preference";
export type CollegeCreditsAnswer = "Yes" | "No";
export type ResearchProgramsAnswer = "Yes" | "No";

// Step 5 – Activities & preferences
export type ActivityType =
  | "Clubs"
  | "Arts"
  | "Sports"
  | "Volunteering"
  | "Work"
  | "Leadership"
  | "Family responsibilities"
  | "Internship"
  | "Academic"
  | "Exchange program"
  | "Other";

export interface RigorousCourse {
  name: string;
  status: "Completed" | "This Year";
}

/** @deprecated Removed from flow */
export type ActivityRankItem = "Leadership" | "Volunteer" | "Academic" | "Hobbies & clubs";

export interface ActivityWithIntensity {
  type: ActivityType;
  weeksParticipated?: number;
  hoursPerWeek?: number;
  description?: string;
}

export type AwardLevel = "School" | "State" | "National" | "International";

export interface AwardItem {
  title: string;
  description?: string;
}

export interface AwardWithLevel extends AwardItem {
  level: AwardLevel;
}

export type CampusUrbanSuburbanRural = "Urban" | "Suburban" | "Rural";
export type LectureVsSeminar = "Large lecture" | "Balanced" | "Small seminar";
export type CoreVsOpen = "Core" | "Balanced" | "Open curriculum";
/** Legacy field; optional on read for old documents */
export type QuizzesVsExams = "Weekly quizzes" | "Balanced" | "High-stakes exams";
export type IntensityVsBalanced = "High intensity" | "Balanced" | "Lifestyle";
export type HasCollegeList = "Yes" | "No";
export type ApplicationStrategy = "ED" | "EA" | "RD" | "Not sure";

export type BudgetPerYear = "5K" | "10K" | "20K" | "30K" | "40K" | "50K" | "60K" | "70K+";
export type FafsaEligibility = "Yes" | "No" | "Not sure";
export type FamilyIncomeBracket =
  | "Under $40,000"
  | "$40,000–$75,000"
  | "$75,000–$125,000"
  | "$125,000–$200,000"
  | "$200,000+"
  | "Prefer not to say";

export type CollegeSectorPreference = "Public" | "Private" | "Technical";
export type DegreeLengthPreference = "2-year" | "4-year" | "No preference";
export type InternationalOpenness = "Must" | "No preference";

export interface OnboardingAnswers {
  // Step 1 – Identity & basics
  profilePhotoDataUrl?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: Gender;
  genderOther?: string;
  country?: string;
  state?: string;
  city?: string;
  currentHighSchool?: string;
  gradeLevel?: GradeLevel;
  expectedGraduationYear?: number;

  // Step 2 – Psychology & personal signals
  lifeSatisfaction?: number;
  addingToLife?: string;
  eliminatingFromLife?: string;
  academicSuccessCrucial?: AcademicSuccessCrucial;
  naturalSkills?: string;
  /** Top 3 subject labels in order (optional). */
  favoriteSubjectsRank?: string[];
  intellectualStructuredVsOpen?: StructuredVsOpen;
  intellectualLectureVsDiscussion?: LectureVsDiscussion;
  intellectualResearchVsApplication?: ResearchVsApplication;
  intellectualTheoreticalVsHandsOn?: TheoreticalVsHandsOn;
  socialCompetitiveVsCollaborative?: CompetitiveVsCollaborative;
  socialIntrovertedVsSocial?: IntrovertedVsSocial;
  socialLargeVsTight?: LargeVsTight;
  socialIndependentVsGuided?: IndependentVsGuided;
  preferenceCoreType?: PreferenceCoreType;
  /** @deprecated Legacy ranked list; migrate to preferenceCoreType */
  workInclination?: WorkInclinationItem[];

  // Step 3 – Career & academic direction
  careerPath?: CareerPath;
  careerPathWhat?: string;
  careerConfidence?: number;
  areasOfInterest?: InterestCategory[];
  interestOther?: string;
  knowCoursesStandOut?: KnowCoursesStandOut;
  knowActivitiesStandOut?: number;
  targetDegree?: TargetDegree;
  studySkillsConfidence?: number;
  focusDifficulty?: number;
  /** @deprecated Removed from UI; may exist on old documents */
  placementRatesImportance?: number;

  // Legacy / profile mirror
  graduationYear?: number;
  gpa?: number;
  gpaScale?: 4 | 5;
  satScore?: number;
  actScore?: number;
  preferredSize?: "small" | "medium" | "large";
  preferredStates?: string[];

  examsTaken?: ExamType[];
  psatTotal?: number;
  satReadingWriting?: number;
  satMath?: number;
  satTotal?: number;
  actComposite?: number;
  actEnglish?: number;
  actMath?: number;
  actReading?: number;
  actScience?: number;
  apExamsCount?: number;
  apAverageScore?: number;
  ibTotal?: number;
  toeflScore?: number;
  ieltsScore?: number;
  duolingoScore?: number;
  pteScore?: number;
  rigorousApCompleted?: number;
  rigorousApThisYear?: number;
  rigorousApDetails?: string;
  rigorousApCourses?: RigorousCourse[];
  rigorousIbCompleted?: number;
  rigorousIbThisYear?: number;
  rigorousIbDetails?: string;
  rigorousIbCourses?: RigorousCourse[];
  rigorousHonorsCompleted?: number;
  rigorousHonorsThisYear?: number;
  rigorousHonorsDetails?: string;
  rigorousHonorsCourses?: RigorousCourse[];
  collegeCredits?: CollegeCreditsAnswer;
  collegeCreditsDetail?: string;
  researchPrograms?: ResearchProgramsAnswer;
  researchProgramsDetail?: string;
  difficultiesOptional?: string;

  // Step 5 – Activities, preferences, financials, strategy
  activityTypes?: ActivityWithIntensity[];
  /** @deprecated Removed from UI */
  activityRanking?: ActivityRankItem[];
  awardsSchool?: AwardItem[];
  awardsState?: AwardItem[];
  awardsNational?: AwardItem[];
  awardsInternational?: AwardItem[];
  awardsConsolidated?: AwardWithLevel[];
  tutoringBenefit?: TutoringBenefit;

  locationPreferenceStates?: string[];
  campusUrbanSuburbanRural?: CampusUrbanSuburbanRural[];
  campusLectureVsSeminar?: LectureVsSeminar[];
  campusCoreVsOpen?: CoreVsOpen[];
  /** @deprecated Removed from UI */
  campusQuizzesVsExams?: QuizzesVsExams;
  campusIntensityVsBalanced?: IntensityVsBalanced[];
  collegeSectorPreference?: CollegeSectorPreference[];
  degreeLengthPreference?: DegreeLengthPreference;
  internationalOpenness?: InternationalOpenness;

  budgetPerYear?: BudgetPerYear;
  familyIncome?: FamilyIncomeBracket;
  fafsaEligibility?: FafsaEligibility;

  hasCollegeList?: HasCollegeList;
  collegeListReachMatchSafety?: string;
  collegeListVisited?: string;
  collegeListWhatLike?: string;
  applicationStrategy?: ApplicationStrategy[];
  admissionProcessConfidence?: number;
  selectivityImportance?: number;

  /** @deprecated Removed from flow */
  favoriteClass?: string;
}

export const defaultAnswers: OnboardingAnswers = {
  workInclination: [],
  areasOfInterest: [],
  examsTaken: [],
  activityTypes: [],
  activityRanking: [],
  awardsSchool: [],
  awardsState: [],
  awardsNational: [],
  awardsInternational: [],
  locationPreferenceStates: [],
  favoriteSubjectsRank: [],
};

export const PREFERENCE_CORE_OPTIONS: PreferenceCoreType[] = ["Ideas", "Data", "People", "Things"];
export const WORK_INCLINATION_ITEMS = PREFERENCE_CORE_OPTIONS;
export const INTEREST_CATEGORIES: InterestCategory[] = [
  "STEM",
  "Health",
  "Business",
  "Humanities",
  "Social Sciences",
  "Arts",
  "Education",
  "Other",
];
export const EXAM_TYPES: ExamType[] = ["SAT", "ACT", "AP", "IB", "TOEFL", "IELTS", "Duolingo", "PTE", "PSAT"];
export const ACTIVITY_TYPES: ActivityType[] = [
  "Clubs",
  "Arts",
  "Sports",
  "Volunteering",
  "Work",
  "Leadership",
  "Family responsibilities",
  "Internship",
  "Academic",
  "Exchange program",
  "Other",
];
/** @deprecated Removed from flow */
export const ACTIVITY_RANK_ITEMS: ActivityRankItem[] = ["Leadership", "Volunteer", "Academic", "Hobbies & clubs"];

export const FAVORITE_SUBJECT_OPTIONS = [
  "Math",
  "English / Literature",
  "Science",
  "History / Social Studies",
  "Foreign Language",
  "Arts",
  "Computer Science / Technology",
  "Business / Economics",
  "Health / PE",
  "Other",
] as const;

export const stepConfig = {
  1: [
    "firstName",
    "lastName",
    "dateOfBirth",
    "gender",
    "genderOther",
    "country",
    "state",
    "city",
    "currentHighSchool",
    "expectedGraduationYear",
    "gradeLevel",
  ] as const,
  2: [
    "lifeSatisfaction",
    "addingToLife",
    "eliminatingFromLife",
    "academicSuccessCrucial",
    "naturalSkills",
    "favoriteSubjectsRank",
    "intellectualStructuredVsOpen",
    "intellectualLectureVsDiscussion",
    "intellectualResearchVsApplication",
    "intellectualTheoreticalVsHandsOn",
    "socialCompetitiveVsCollaborative",
    "socialIntrovertedVsSocial",
    "socialLargeVsTight",
    "socialIndependentVsGuided",
    "preferenceCoreType",
  ] as const,
  3: [
    "careerPath",
    "careerPathWhat",
    "careerConfidence",
    "areasOfInterest",
    "interestOther",
    "knowCoursesStandOut",
    "knowActivitiesStandOut",
    "targetDegree",
    "studySkillsConfidence",
    "focusDifficulty",
  ] as const,
  4: [
    "gpa",
    "gpaScale",
    "examsTaken",
    "psatTotal",
    "satReadingWriting",
    "satMath",
    "satTotal",
    "actComposite",
    "actEnglish",
    "actMath",
    "actReading",
    "actScience",
    "apExamsCount",
    "apAverageScore",
    "ibTotal",
    "toeflScore",
    "ieltsScore",
    "duolingoScore",
    "pteScore",
    "rigorousApCompleted",
    "rigorousApThisYear",
    "rigorousApDetails",
    "rigorousApCourses",
    "rigorousIbCompleted",
    "rigorousIbThisYear",
    "rigorousIbDetails",
    "rigorousIbCourses",
    "rigorousHonorsCompleted",
    "rigorousHonorsThisYear",
    "rigorousHonorsDetails",
    "rigorousHonorsCourses",
    "collegeCredits",
    "collegeCreditsDetail",
    "researchPrograms",
    "researchProgramsDetail",
    "difficultiesOptional",
  ] as const,
  5: [
    "activityTypes",
    "awardsSchool",
    "awardsState",
    "awardsNational",
    "awardsInternational",
    "awardsConsolidated",
    "tutoringBenefit",
    "locationPreferenceStates",
    "campusUrbanSuburbanRural",
    "campusLectureVsSeminar",
    "campusCoreVsOpen",
    "campusIntensityVsBalanced",
    "collegeSectorPreference",
    "degreeLengthPreference",
    "internationalOpenness",
    "budgetPerYear",
    "familyIncome",
    "fafsaEligibility",
    "hasCollegeList",
    "collegeListReachMatchSafety",
    "collegeListVisited",
    "collegeListWhatLike",
    "applicationStrategy",
    "admissionProcessConfidence",
    "selectivityImportance",
  ] as const,
  6: [] as const,
  7: [] as const,
} as const;
