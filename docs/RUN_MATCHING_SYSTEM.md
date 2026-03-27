# Run Matching System – How It Works

This document explains how the college matching pipeline works: what student data we use, what we get from the College Scorecard API, how OpenAI is used, how many colleges we recommend, and how the percentage match score is computed.

---

## 1. Student data we use

We combine **profile** (Firestore `studentProfiles`) and **onboarding questionnaire** (Firestore `users/{uid}` → `onboardingAnswers`).

### From profile (Settings / student profile)

| Field | Use in matching |
|-------|------------------|
| **GPA** | Compared to school selectivity (admission rate); academic fit. |
| **SAT** | Compared to school SAT midpoint (critical reading + math + writing). |
| **ACT** | Compared to school ACT midpoint (cumulative). |
| **Preferred states** | Which states to search; state preference score (in-state boost). |
| **Preferred size** | small / medium / large → matched to enrollment (e.g. &lt;5k, 5k–15k, &gt;15k). |
| **Preferred majors** | Merged with onboarding “areas of interest”; used in profile summary for OpenAI. |

If a value is missing in profile, we fall back to the same field from onboarding (e.g. `satTotal`, `preferredStates`, `preferredSize`).

### From onboarding questionnaire

- **Grade level, target degree, career path** – in student summary for explanations.
- **Areas of interest** – used as “preferred majors” if profile majors are empty.
- **Preferred states / location preference states** – used if profile preferred states are empty.
- **Rigorous coursework** (AP/IB/Honors completed) → **academic rigor score** (0–1). Used to slightly boost fit at more selective schools.
- **Activity types + awards** (school, state, national, international) → **activity depth score** (0–1). Used in weighting and for “larger campus” preference.
- **Selectivity importance** (0–10) → **selectivity preference score**. Shifts target admission rate (e.g. more selective preference → lower target admit rate).
- **Admission process confidence**, **placement rates importance** – normalized into derived metrics.
- **Campus intensity vs balanced** → **prefers high intensity** (true/false). Slight penalty for very large campuses if “balanced life.”
- **Intellectual preferences** (structured vs open, theoretical vs hands-on, work inclination, life satisfaction) → **personality openness score**. Used in weighting.

So we use both **explicit criteria** (GPA, SAT, ACT, states, size, majors) and **derived metrics** from the questionnaire to build a single **matching profile** for the pipeline.

---

## 2. What we get from the College Scorecard API

We use the **federal College Scorecard API**:  
`https://api.data.gov/ed/collegescorecard/v1/schools`

- **Authentication**: `api_key` from env (`SCORECARD_API_KEY` or `COLLEGE_SCORECARD_API_KEY`).

### Search (candidate collection)

- **Endpoint**: GET with query params (no POST body).
- **Parameters we send**:
  - `per_page`: 50  
  - `page`: 0, 1, 2, … until we have enough candidates  
  - `school.degrees_awarded.predominant`: **"3"** (bachelor’s degree–granting institutions only)  
  - **If** the user has **preferred states**: `school.state`: state code (we loop over up to 5 states).  
  - **Else**: no state filter (national search).
- **Stopping**: We stop when we have **400 candidates** (`CANDIDATE_LIMIT`) or when the API returns fewer than 50 results in a page. If the user has no preferred states, we do not call the API and return zero matches.

### Fields we request from Scorecard (for each school)

- `id`, `school.name`, `school.city`, `school.state`, `school.school_url`, `school.location`
- `student.size` (enrollment)
- `admission.admission_rate`
- `admission.sat_scores.midpoint.critical_reading`, `math`, `writing`
- `admission.act_scores.midpoint.cumulative`
- `latest.student.size`, `latest.admission.admission_rate` (when available)
- For single-school fetch by ID we also request: `latest.cost.tuition.reported`, `latest.cost.roomboard.reported`

So from Scorecard we get: **identity, location, size, admission rate, SAT/ACT midpoints**. We do **not** use Scorecard for match scoring logic outside of these fields (e.g. no direct “fit” API); all scoring is done in our engine.

---

## 3. How OpenAI is used

OpenAI is **not** used to pick which colleges to recommend or to compute the match percentage. It is only used to **improve the text** of the results.

- **When**: After we have the final list of **top 100** matches and their scores/tiers/reasons/tips.
- **What we call**: We take the **top 20** of those 100 and, for each school, we call **one** OpenAI `chatCompletion` with:
  - A short **student summary** (GPA, test scores, grade, interests, states, rigor, activities, etc.)
  - A short **school summary** (admission rate, SAT/ACT midpoints, size, state, city)
  - The current **tier**, **reasons**, and **improveTips** we already computed.
- **Prompt**: We ask the model to return **only** a small JSON object with:
  - `whyFit`: one short sentence on why this college fits the student
  - `reasons`: up to 3 bullet strings
  - `improveTips`: up to 4 concrete suggestion strings
- **Result**: We replace (or merge) the heuristic `reasons` and `improveTips` for those top 20 schools with the model output. If the API fails or returns invalid JSON, we keep the original heuristic reasons and tips.

So: **selection and scoring = our rules + Scorecard data; OpenAI = explanation enrichment only** for the top 20.

---

## 4. How many colleges we recommend

- **Preferred states required**: We only recommend colleges in the user’s **preferred states**. If no state is selected in the profile (or onboarding), the candidate pool is empty and the user gets no matches until they add at least one state.
- **Candidate pool**: Up to **400** schools from Scorecard, by querying **only** the user’s preferred states (paginated, 50 per page).
- **After scoring**: All candidates are scored.
- **After diversity**: We **filter** to colleges whose state is in the user’s preferred states, then keep the top **20** by match score (`TOP_N = 20`).
- **Final list**: The user sees at most **20** colleges, all in their chosen states, ordered by match score. **All 20** receive deeper OpenAI analysis (whyFit, reasons, improveTips).

---

## 5. How the percentage match score is determined

The **match score** is a **0–100** integer. It is computed entirely in our code from student criteria + Scorecard fields; no external “scoring” API is used.

### Step 1: Three component scores (each 0–1)

1. **Academic fit**
   - **SAT**: If we have student SAT and school SAT midpoint → score = `max(0, 1 - |studentSAT - schoolSAT| / 400)`.
   - **ACT**: If we have student ACT and school ACT midpoint → score = `max(0, 1 - |studentACT - schoolACT| / 10)`.
   - **GPA vs selectivity**: GPA normalized to 0–1 (e.g. GPA/4), selectivity = `1 - admission_rate`; score = `max(0, 1 - |gpaNorm - selectivity|)`.
   - If we have no GPA/SAT/ACT but we have admission rate, we use a default based on selectivity only.
   - Small **academic rigor** boost from onboarding (more rigorous coursework → slight increase for selective schools).

2. **Selectivity fit**
   - We have a “target” admission rate (default ~40%). It can shift with onboarding “selectivity importance” (e.g. more selective preference → lower target).
   - Score = `max(0, 1 - 2 * |school_admission_rate - target|)`.
   - Labels: highly selective (reach), selective (match), more accessible (safety).

3. **Preference fit**
   - **State**: 1 if school state is in preferred states, else 0.5 (neutral).
   - **Size**: 1 if school size matches preferred size (small &lt;5k, medium 5k–15k, large &gt;15k), else 0.
   - Optional small adjustments: e.g. higher activity depth can nudge size score up for larger campuses; “balanced life” can slightly lower score for very large campuses.
   - Final preference score = average of state and size components.

### Step 2: Weights (defaults; then adjusted by onboarding)

- **Academic**: ~0.35  
- **Selectivity**: ~0.15  
- **Preference**: ~0.25  
- **Activity** (preference × activity depth): ~0.15  
- **Personality** (selectivity × openness): ~0.10  

Weights are normalized and can shift slightly (e.g. higher selectivity importance → more weight on selectivity; higher activity depth → more on activity; “balanced life” → more on preference).

### Step 3: Composite and final score

- **Composite** = weighted sum of the three main components (with activity and personality derived from preference/selectivity and onboarding).
- **Base match score** = `round( clamp(composite, 0, 1) * 100 )`.
- If the school has **limited data** (missing admission rate and both SAT/ACT midpoints), we apply a penalty: `baseMatchScore * 0.8 - random(0..7)`, then clamp to 0–100.
- **Tier** (reach / match / safety) is assigned separately: based on admission rate and whether the student is above the school’s SAT/ACT midpoint (within a small band). Reach: rate ≤ 25% or student below midpoint; Safety: rate ≥ 60% and student above midpoint; else Match.

So the **% match** is a **weighted combination of academic fit, selectivity fit, and preference fit**, with small modifiers from questionnaire-derived metrics. It is **not** from an external API and **not** from OpenAI.

---

## Summary table

| Question | Answer |
|----------|--------|
| **Student data** | Profile: GPA, SAT, ACT, preferred states, size, majors. Onboarding: interests, states, size, grade, degree, career, rigor, activities, awards, selectivity/campus/intellectual preferences. Merged and derived into a single matching profile. |
| **Scorecard API** | Search: bachelor’s schools, optional state filter, 50 per page, up to 600 schools. Fields: id, name, city, state, size, admission rate, SAT/ACT midpoints (and latest where available). |
| **OpenAI** | Used only to enrich **reasons** and **improveTips** for the **top 20** matches. No role in which schools are chosen or in the numeric match score. |
| **Number of colleges** | Up to **20**, only from the user’s **preferred states**. All 20 get deep OpenAI analysis. |
| **% match score** | Our formula: weighted sum of (1) academic fit vs SAT/ACT/GPA and selectivity, (2) selectivity fit vs target admission rate, (3) preference fit (state + size), with small adjustments from onboarding. Result clamped 0–100; limited-data schools get a penalty. |

If you want, we can add a short “Run Matching system overview” section to the main project README that links to this doc and summarizes the same points in a few bullets.
