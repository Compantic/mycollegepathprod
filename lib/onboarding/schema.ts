/**
 * Onboarding schema: all 6 steps, no omissions.
 * Used for localStorage draft and Firestore users/{uid}/onboardingAnswers.
 */

// Step 1 – Personal Information
export type Gender = "Male" | "Female" | "Non-binary" | "Prefer not to say" | "Other";

// Step 1 – Life Outlook
export type GradeLevel = "9" | "10" | "11" | "12" | "Gap Year" | "Other";
export type AcademicSuccessCrucial = "Yes" | "No" | "Not sure";

// Step 2
export type WorkInclinationItem = "Ideas" | "Data" | "People" | "Things";
export type StructuredVsOpen = "Structured" | "Balanced" | "Open-ended";
export type LectureVsDiscussion = "Lecture" | "Balanced" | "Discussion";
export type ResearchVsApplication = "Research" | "Balanced" | "Application";
export type TheoreticalVsHandsOn = "Theoretical" | "Balanced" | "Hands-on";
export type CompetitiveVsCollaborative = "Competitive" | "Balanced" | "Collaborative";
export type IntrovertedVsSocial = "Introverted" | "Balanced" | "Socially energized";
export type LargeVsTight = "Large networks" | "Balanced" | "Tight circles";
export type IndependentVsGuided = "Independent" | "Balanced" | "Guided";

// Step 3
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
  | "Health Professions"
  | "Business"
  | "Humanities"
  | "Social Sciences"
  | "Arts"
  | "Education"
  | "Other";

// Step 4
export type ExamType =
  | "ACT"
  | "SAT"
  | "SAT Subject"
  | "AP"
  | "IB"
  | "Cambridge"
  | "TOEFL"
  | "PTE Academic"
  | "IELTS"
  | "Duolingo"
  | "PSAT";
export type TutoringBenefit = "Individual" | "Small group" | "Large group" | "No";
export type CollegeCreditsAnswer = "Yes" | "No";
export type ResearchProgramsAnswer = "Yes" | "No";

// Step 5
export type ActivityType =
  | "Arts/Music"
  | "Clubs"
  | "Community engagement"
  | "Family responsibilities"
  | "Hobbies"
  | "Sports"
  | "Work/Volunteering";
export type ActivityRankItem = "Leadership" | "Volunteer" | "Hobbies & clubs" | "Academic";

export interface ActivityWithIntensity {
  type: ActivityType;
  weeksParticipated?: number;
  hoursPerWeek?: number;
}

export interface AwardItem {
  title: string;
  description?: string;
}

// Step 6
export type CampusUrbanSuburbanRural = "Urban" | "Suburban" | "Rural";
export type LectureVsSeminar = "Large lecture" | "Balanced" | "Small seminar";
export type CoreVsOpen = "Core" | "Balanced" | "Open curriculum";
export type QuizzesVsExams = "Weekly quizzes" | "Balanced" | "High-stakes exams";
export type IntensityVsBalanced = "High intensity" | "Balanced" | "Balanced life";
export type HasCollegeList = "Yes" | "No";
export type ApplicationStrategy = "ED" | "EA" | "RD" | "Not sure";

export interface OnboardingAnswers {
  // Step 1 – Personal Information (0a–0f)
  /** Data URL of profile photo (only in localStorage draft; uploaded to Storage on finish, not stored in Firestore). */
  profilePhotoDataUrl?: string;
  firstName?: string;
  lastName?: string;
  /** ISO date string YYYY-MM-DD (source of truth; age is computed for display only). */
  dateOfBirth?: string;
  gender?: Gender;
  genderOther?: string;
  country?: string;
  state?: string;
  city?: string;
  currentHighSchool?: string;
  expectedGraduationYear?: number;

  // Step 1 – Life Outlook
  gradeLevel?: GradeLevel;
  lifeSatisfaction?: number;
  addingToLife?: string;
  eliminatingFromLife?: string;
  academicSuccessCrucial?: AcademicSuccessCrucial;
  naturalSkills?: string;
  favoriteClass?: string;

  // Step 2
  workInclination?: WorkInclinationItem[];
  intellectualStructuredVsOpen?: StructuredVsOpen;
  intellectualLectureVsDiscussion?: LectureVsDiscussion;
  intellectualResearchVsApplication?: ResearchVsApplication;
  intellectualTheoreticalVsHandsOn?: TheoreticalVsHandsOn;
  socialCompetitiveVsCollaborative?: CompetitiveVsCollaborative;
  socialIntrovertedVsSocial?: IntrovertedVsSocial;
  socialLargeVsTight?: LargeVsTight;
  socialIndependentVsGuided?: IndependentVsGuided;

  // Step 3
  careerPath?: CareerPath;
  careerPathWhat?: string;
  careerConfidence?: number;
  areasOfInterest?: InterestCategory[];
  interestOther?: string;
  targetDegree?: TargetDegree;
  knowCoursesStandOut?: KnowCoursesStandOut;
  knowActivitiesStandOut?: number;
  placementRatesImportance?: number;

  // Step 4 (legacy / profile fields used elsewhere)
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
  rigorousIbCompleted?: number;
  rigorousIbThisYear?: number;
  rigorousHonorsCompleted?: number;
  rigorousHonorsThisYear?: number;
  collegeCredits?: CollegeCreditsAnswer;
  collegeCreditsDetail?: string;
  researchPrograms?: ResearchProgramsAnswer;
  researchProgramsDetail?: string;
  tutoringBenefit?: TutoringBenefit;
  difficultiesOptional?: string;

  // Step 5
  activityTypes?: ActivityWithIntensity[];
  activityRanking?: ActivityRankItem[];
  awardsSchool?: AwardItem[];
  awardsState?: AwardItem[];
  awardsNational?: AwardItem[];
  awardsInternational?: AwardItem[];

  // Step 6
  admissionProcessConfidence?: number;
  selectivityImportance?: number;
  locationPreferenceStates?: string[];
  campusUrbanSuburbanRural?: CampusUrbanSuburbanRural;
  campusLectureVsSeminar?: LectureVsSeminar;
  campusCoreVsOpen?: CoreVsOpen;
  campusQuizzesVsExams?: QuizzesVsExams;
  campusIntensityVsBalanced?: IntensityVsBalanced;
  hasCollegeList?: HasCollegeList;
  collegeListReachMatchSafety?: string;
  collegeListVisited?: string;
  collegeListWhatLike?: string;
  applicationStrategy?: ApplicationStrategy;
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
};

/** Runtime allowlists for sanitizeDraft (schema-aligned). */
export const WORK_INCLINATION_ITEMS: WorkInclinationItem[] = ["Ideas", "Data", "People", "Things"];
export const INTEREST_CATEGORIES: InterestCategory[] = [
  "STEM", "Health Professions", "Business", "Humanities", "Social Sciences", "Arts", "Education", "Other",
];
export const EXAM_TYPES: ExamType[] = [
  "ACT", "SAT", "SAT Subject", "AP", "IB", "Cambridge", "TOEFL", "PTE Academic", "IELTS", "Duolingo", "PSAT",
];
export const ACTIVITY_TYPES: ActivityType[] = [
  "Arts/Music", "Clubs", "Community engagement", "Family responsibilities", "Hobbies", "Sports", "Work/Volunteering",
];
export const ACTIVITY_RANK_ITEMS: ActivityRankItem[] = ["Leadership", "Volunteer", "Hobbies & clubs", "Academic"];

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
    "lifeSatisfaction",
    "addingToLife",
    "eliminatingFromLife",
    "academicSuccessCrucial",
    "naturalSkills",
    "favoriteClass",
  ] as const,
  2: [
    "workInclination",
    "intellectualStructuredVsOpen",
    "intellectualLectureVsDiscussion",
    "intellectualResearchVsApplication",
    "intellectualTheoreticalVsHandsOn",
    "socialCompetitiveVsCollaborative",
    "socialIntrovertedVsSocial",
    "socialLargeVsTight",
    "socialIndependentVsGuided",
  ] as const,
  3: [
    "careerPath",
    "careerPathWhat",
    "careerConfidence",
    "areasOfInterest",
    "interestOther",
    "targetDegree",
    "knowCoursesStandOut",
    "knowActivitiesStandOut",
    "placementRatesImportance",
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
    "rigorousIbCompleted",
    "rigorousIbThisYear",
    "rigorousHonorsCompleted",
    "rigorousHonorsThisYear",
    "collegeCredits",
    "collegeCreditsDetail",
    "researchPrograms",
    "researchProgramsDetail",
    "tutoringBenefit",
    "difficultiesOptional",
  ] as const,
  5: [
    "activityTypes",
    "activityRanking",
    "awardsSchool",
    "awardsState",
    "awardsNational",
    "awardsInternational",
  ] as const,
  6: [
    "admissionProcessConfidence",
    "selectivityImportance",
    "locationPreferenceStates",
    "campusUrbanSuburbanRural",
    "campusLectureVsSeminar",
    "campusCoreVsOpen",
    "campusQuizzesVsExams",
    "campusIntensityVsBalanced",
    "hasCollegeList",
    "collegeListReachMatchSafety",
    "collegeListVisited",
    "collegeListWhatLike",
    "applicationStrategy",
  ] as const,
} as const;
