**EPIC: MyCollegePath US College Admissions Platform**
Priority: 1
Effort: 100
Business Value: 95
Tags: product, admissions, student, platform
Description: Deliver and mature MyCollegePath as an end to end AI powered US college admissions platform for high school students. The product spans a seven step public onboarding flow, authenticated app modules for college discovery, intelligent matching, roadmap planning, essay coaching, AI consultant chat, profile scoring, and application tracking, plus freemium subscription billing through Stripe and a public marketing site at mycollegepath.ai operated under the COMPANTIC brand.


**FEATURE 1: Student Onboarding and Profile Foundation**
Priority: 1
Effort: 18
Business Value: 90
Tags: onboarding, profile, auth, student
Description: Build the first run experience that captures a rich student profile before and after account creation. The codebase implements a seven step onboarding wizard covering identity, psychology, career direction, academics, activities, review, and signup, persists answers to Firestore, gates the authenticated app until onboarding is complete, and exposes profile editing plus a downloadable Compantic Card on the profile page.


**USER STORY 1.1: As a prospective student, I want to complete a guided onboarding questionnaire so that the platform can personalize matching, roadmap, and AI guidance from day one**
Priority: 1
Story Points: 8
Business Value: 90
Tags: onboarding, student, firestore
Description: A new visitor should move through steps one through seven on the public onboarding routes, provide US focused academic and personal inputs including GPA, SAT, ACT, activities, and preferences, review answers on step six, and create an account on step seven using Google or email authentication. Completed answers must be saved to the user record and unlock access to the authenticated app dashboard.
Acceptance Criteria:
1. A user can complete all seven onboarding steps without errors and land on the dashboard after successful signup.
2. Onboarding answers persist in Firestore and repopulate when the user returns to profile or matching flows.
3. Users who sign in without completed onboarding are redirected back to step one by the app layout guard.

Task 1.1.1: Validate and harden onboarding step schemas and academic input ranges
Priority: 1
Estimate: 6h
Description: Review and tighten Zod schemas, academic validation helpers, and step level error handling across onboarding steps one through five so invalid GPA, test score, and activity inputs are rejected with clear inline messages before persistence.

Task 1.1.2: Persist onboarding snapshot to Firestore on account creation
Priority: 1
Estimate: 5h
Description: Ensure step seven signup writes the full onboarding snapshot to the user document and student profile collections, marks onboarding complete, and clears any local draft storage so server side checks in onboardingCheck succeed.

Task 1.1.3: Wire onboarding progress UI and step navigation consistency
Priority: 2
Estimate: 4h
Description: Align OnboardingProgress and stepConfig titles across all seven routes, fix back and next navigation edge cases, and confirm photo upload and US state selection work on mobile viewports.


**USER STORY 1.2: As a enrolled student, I want to view and update my profile so that my admissions data stays accurate across matching and coaching features**
Priority: 2
Story Points: 5
Business Value: 75
Tags: profile, student, compantic
Description: After onboarding, students need a single profile area to review strength indicators, edit onboarding answers through StepEditors, update display preferences, and download a Compantic Card PDF that represents their verified academic identity within the platform ecosystem.
Acceptance Criteria:
1. Profile page loads real Firestore data for the signed in user including photo, academics, and activities.
2. Edits made through profile step editors save successfully and reflect on the dashboard readiness indicators.
3. Compantic Card download produces a readable PDF using the current profile snapshot.

Task 1.2.1: Implement profile edit save flows for StepEditors sections
Priority: 2
Estimate: 6h
Description: Connect each StepEditors panel to Firestore update helpers so partial profile edits merge into onboardingAnswers and studentProfiles without overwriting unrelated fields.

Task 1.2.2: Surface profile strength ring and readiness metrics from profileStrength helpers
Priority: 3
Estimate: 4h
Description: Integrate profileStrength calculations into ProfileHeader and dashboard widgets so completeness and strength scores update immediately after profile edits.

Task 1.2.3: Stabilize Compantic Card PDF generation and download UX
Priority: 3
Estimate: 5h
Description: Verify html2canvas and jspdf export on the profile page handles images, long names, and mobile layouts, and show success or error toasts when download fails.


**FEATURE 2: College Discovery and Intelligent Matching**
Priority: 1
Effort: 20
Business Value: 92
Tags: colleges, matching, scorecard, search
Description: Enable students to discover US colleges using federal College Scorecard data, build a saved college list, and run an AI assisted matching engine that classifies schools into reach, match, and safety tiers with factor breakdowns. The codebase includes college search UI, scorecard API routes with caching, college detail pages, matching engine agents, matching history APIs, and documents and matching app routes.


**USER STORY 2.1: As a student, I want to search and save colleges to my list so that I can compare schools and prepare for matching**
Priority: 1
Story Points: 5
Business Value: 85
Tags: colleges, scorecard, favorites
Description: Students should search colleges by name through the CollegesSearch component backed by scorecard search API, view enriched detail on college pages including why fit explanations and campus imagery, and save favorites that appear on the dashboard and college list page.
Acceptance Criteria:
1. Search returns relevant US colleges from the Scorecard API with pagination or limits handled gracefully.
2. Saving a college adds it to the user favorites collection and shows on the College List page and dashboard saved colleges widget.
3. College detail pages load enriched data and display loading and error states when Scorecard or image APIs fail.

Task 2.1.1: Harden scorecard search and college enrich API error handling
Priority: 1
Estimate: 5h
Description: Add consistent API error responses, rate limit awareness, and Firestore cache fallbacks in scorecard client and enrich routes so search and detail pages degrade gracefully when external APIs are slow or unavailable.

Task 2.1.2: Unify saved college storage between legacy savedColleges and favorites collections
Priority: 2
Estimate: 6h
Description: Consolidate or consistently merge saved college records so dashboard, college list, and apply now modules read a single canonical list without duplicates as already partially handled in getDashboardUserData.

Task 2.1.3: Improve college detail page why fit and image proxy integration
Priority: 2
Estimate: 4h
Description: Connect college detail routes to why fit and image proxy APIs with loading skeletons and fallback placeholders when Unsplash or enrichment data is missing.


**USER STORY 2.2: As a student, I want personalized reach, match, and safety recommendations so that I can build a balanced application strategy**
Priority: 1
Story Points: 8
Business Value: 95
Tags: matching, ai, reach, safety
Description: Paid plan students run the matching engine against their onboarding profile and derived metrics to receive ranked college recommendations with tier labels and component score breakdowns. Results must be stored in matching history and surfaced on the matching page and insights timeline.
Acceptance Criteria:
1. A matching run returns up to ten ranked colleges with reach, match, or safety tier labels and explanatory factor scores.
2. Matching history API returns prior runs for the signed in user and displays on insights or matching UI.
3. Free plan users receive an upgrade prompt when matching is blocked by billing enforcement.

Task 2.2.1: Tune matching engine weights and tier thresholds against representative profiles
Priority: 1
Estimate: 8h
Description: Review matching engine derived metrics, agent pipeline, and tier assignment logic in lib/matching/engine.ts and validate output distribution across diverse student profiles including test optional and financial need cases.

Task 2.2.2: Persist matching run results to Firestore and expose via history API
Priority: 1
Estimate: 5h
Description: Ensure POST /api/matching/run saves full match payloads under user subcollections and GET /api/matching/history returns chronologically ordered runs for UI consumption.

Task 2.2.3: Build matching results UI with tier badges and factor breakdown panels
Priority: 2
Estimate: 6h
Description: Enhance CollegeMatchingPage and MatchingRun components to display tier labels, component scores, and actions to save recommended colleges directly to the user list.


**FEATURE 3: AI Admissions Coach and Essay Coaching**
Priority: 2
Effort: 16
Business Value: 88
Tags: ai, chat, essays, openai
Description: Provide continuous AI guidance through a consultant chat that uses profile and matching context, plus an essay coach that analyzes drafts and returns structured feedback with scores. The codebase includes chat API routes, chat context assembly, admissionsChat system prompts, ChatLayout UI, essays page with analyze API, and monthly usage limits enforced per billing plan.


**USER STORY 3.1: As a student, I want to chat with an AI admissions consultant so that I can get timely answers grounded in my profile and college list**
Priority: 2
Story Points: 8
Business Value: 85
Tags: chat, ai, consultant
Description: Students on paid plans open Consultant Chat, start or resume conversations, and receive responses informed by onboarding data, saved colleges, and recent matching results through the chat context API and orchestrator. Conversations should respect monthly chat limits and show clear messaging when limits are reached.
Acceptance Criteria:
1. Chat messages stream or return complete responses that reference the user profile context when relevant.
2. Monthly chat usage increments through billing enforcement and blocks further messages with an upgrade prompt when the plan limit is exceeded.
3. Chat sidebar lists prior conversations and allows starting a new thread without losing history.

Task 3.1.1: Expand chat context assembly from profile, matches, and roadmap state
Priority: 2
Estimate: 6h
Description: Enrich lib/ai/chatContext.ts and /api/chat/context to include latest matching tiers, saved colleges, and roadmap gaps so consultant answers stay specific to the student situation.

Task 3.1.2: Implement usage limit UX and billing error handling in ChatLayout
Priority: 2
Estimate: 4h
Description: Map BillingError codes from enforceAndIncrementUsage to user visible toasts and inline banners in ChatLayout when upgrade_required or limit_reached occurs.

Task 3.1.3: Add conversation persistence and sidebar thread management
Priority: 3
Estimate: 6h
Description: Store chat threads in Firestore per user, load them in ChatSidebar on mount, and support renaming or archiving conversations from the chat UI.


**USER STORY 3.2: As a student, I want structured feedback on my application essays so that I can improve clarity and narrative without ghostwriting**
Priority: 2
Story Points: 5
Business Value: 80
Tags: essays, ai, feedback
Description: Students paste or type essays on the essays page, submit them for AI analysis, and receive scores plus detailed feedback reports aligned with the platform ethics stated on the landing FAQ. Essay analysis usage counts against monthly plan limits on starter and growth tiers.
Acceptance Criteria:
1. Essay analyze API returns a structured report with scores and actionable feedback sections.
2. Students can save multiple essay drafts with titles and revisit prior analysis results on the essays page.
3. Free plan users cannot run essay analysis and see a clear upgrade path from the essays page.

Task 3.2.1: Define and validate essay analysis response schema in analyze API route
Priority: 2
Estimate: 5h
Description: Standardize the OpenAI prompt and Zod validation in /api/essays/analyze so every response includes consistent score dimensions, summary, strengths, and improvement bullets.

Task 3.2.2: Persist essay drafts and analysis reports in Firestore
Priority: 2
Estimate: 5h
Description: Save essay title, body, and latest analysis output per user so the essays page can list drafts and display full reports without re running analysis.

Task 3.2.3: Render essay feedback report UI with scores and revision checklist
Priority: 3
Estimate: 4h
Description: Build a readable report panel on the essays page that highlights scores, narrative feedback, and suggested next edits while stating the platform does not ghostwrite essays.


**FEATURE 4: Roadmap Planning and Application Execution**
Priority: 2
Effort: 17
Business Value: 82
Tags: roadmap, apply, deadlines, planning
Description: Translate student profiles into actionable phased roadmaps with tasks and milestones, track application progress on the apply now shortlist, and eventually surface deadline intelligence for saved colleges. The codebase includes roadmap generation engine and APIs, myroad page with task completion, apply now API and content component, insights history, and a deadlines page that currently shows only an empty state placeholder.


**USER STORY 4.1: As a student, I want a personalized admissions roadmap so that I know what to do and when during senior year**
Priority: 2
Story Points: 8
Business Value: 85
Tags: roadmap, tasks, calendar
Description: Paid students generate a multi phase roadmap from their onboarding profile using the roadmap engine agents, view phases and tasks on myroad, mark tasks complete, export calendar events, and revisit prior roadmaps through history APIs. Roadmap generation counts against monthly plan limits except on elite.
Acceptance Criteria:
1. Roadmap generate API returns phased items with priorities, categories, and timeframes tailored to profile gaps.
2. Students can toggle task completion on myroad and see progress reflected on the dashboard readiness percentage.
3. Roadmap history is retrievable and visible on insights or myroad without losing prior versions.

Task 4.1.1: Connect roadmap generate API to profile gap and timeline agents
Priority: 2
Estimate: 6h
Description: Verify /api/roadmap/generate invokes lib/roadmap/engine agents with current onboarding snapshot and stores the full RoadmapResult in user subcollections.

Task 4.1.2: Implement roadmap task completion sync via tasks API
Priority: 2
Estimate: 5h
Description: Wire myroad task checkboxes to /api/roadmap/tasks so completed task IDs persist server side and contribute to dashboard readiness calculations.

Task 4.1.3: Add calendar export for roadmap milestones
Priority: 3
Estimate: 4h
Description: Generate downloadable ICS calendar files from roadmap phase dates on myroad so students can import deadlines into personal calendar apps.


**USER STORY 4.2: As a student, I want to track applications and deadlines for my shortlisted colleges so that I do not miss important submission dates**
Priority: 3
Story Points: 5
Business Value: 70
Tags: apply, deadlines, tracking
Description: Students use apply now to manage application status for colleges from their matching shortlist, and the deadlines module should evolve from its current empty placeholder into a consolidated view of application and financial aid deadlines derived from saved colleges. This closes the gap between marketing copy promising deadline sync and the stub deadlines page in the codebase.
Acceptance Criteria:
1. Apply now page loads shortlist colleges and persists per college application status through the apply now API.
2. Deadlines page lists upcoming dates for colleges on the user list instead of only the empty state message.
3. Dashboard surfaces the next one to three upcoming deadlines with links to the deadlines page.

Task 4.2.1: Complete apply now status persistence and UI states
Priority: 2
Estimate: 6h
Description: Finish ApplyNowPageContent integration with /api/apply-now so students can set statuses such as researching, applying, submitted, and admitted for each shortlisted college.

Task 4.2.2: Implement deadlines aggregation from saved colleges and roadmap tasks
Priority: 3
Estimate: 8h
Description: Replace the deadlines page placeholder with real deadline rows sourced from college metadata, user entered dates, and roadmap application phase items sorted by due date.

Task 4.2.3: Add upcoming deadlines widget to dashboard
Priority: 3
Estimate: 4h
Description: Extend getDashboardData to include the nearest upcoming deadlines and render a compact widget on the dashboard with deep links to deadlines and college detail pages.


**FEATURE 5: Subscription Billing and Plan Entitlements**
Priority: 1
Effort: 15
Business Value: 93
Tags: billing, stripe, subscriptions, entitlements
Description: Monetize the platform through Free, Starter, Growth, and Elite plans with Stripe checkout, webhook subscription sync, catalog pricing from live price IDs, in app billing management, and server side entitlement enforcement with monthly usage meters for chat, essays, matching, and roadmap features. The codebase is production oriented but local Stripe secrets are not yet documented in env example and marketing mentions trials and tier names that differ from legal terms.


**USER STORY 5.1: As a student, I want to subscribe upgrade or downgrade my plan so that I can access paid admissions features at the right level**
Priority: 1
Story Points: 8
Business Value: 95
Tags: stripe, checkout, billing
Description: Students browse pricing on the public pricing page and in app billing page, start Stripe checkout for starter growth or elite plans on monthly or annual billing, land on billing success with subscription sync, and see current plan status from the billing me API.
Acceptance Criteria:
1. Checkout session creation succeeds when STRIPE_SECRET_KEY is configured and redirects the user to Stripe hosted checkout.
2. Webhook processing updates users billing subscription document with plan, status, and billing period after payment events.
3. Billing page shows current plan, renewal status, and correct upgrade or downgrade actions based on plan rank.

Task 5.1.1: Document and validate required Stripe environment variables in env example
Priority: 1
Estimate: 3h
Description: Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET entries to env example with setup instructions so local and hosted environments can run checkout and webhooks without missing env errors from lib/stripe/server.ts.

Task 5.1.2: Harden Stripe webhook idempotency and subscription sync
Priority: 1
Estimate: 6h
Description: Review /api/stripe/webhook and syncStripeSubscription.ts to handle checkout completed, subscription updated, and cancellation events reliably without duplicate writes to Firestore.

Task 5.1.3: Align billing success page with sync checkout refresh flow
Priority: 2
Estimate: 4h
Description: Ensure /app/billing/success triggers /api/billing/sync-checkout and refresh endpoints so users see an active plan immediately after returning from Stripe.


**USER STORY 5.2: As the product owner, I want plan entitlements enforced server side so that free and paid tiers match the pricing promise**
Priority: 1
Story Points: 5
Business Value: 90
Tags: entitlements, metering, plans
Description: Server routes for chat, essay analyze, matching run, roadmap generate, and ai score must call enforceAndIncrementUsage so free users are limited to college list features while paid users receive monthly quotas per PLAN_ENTITLEMENTS. Marketing copy and legal terms should align on tier names and advertised benefits such as webinars and trials.
Acceptance Criteria:
1. Free users receive upgrade_required errors when calling paid only APIs and see upgrade prompts in the UI.
2. Starter and growth users cannot exceed monthly limits defined in lib/billing/entitlements.ts for metered features.
3. Terms of service tier names match the UI labels Free Starter Growth Elite or are updated consistently across legal and marketing surfaces.

Task 5.2.1: Audit all paid API routes for enforceAndIncrementUsage coverage
Priority: 1
Estimate: 5h
Description: Verify chat, essays analyze, matching run, roadmap generate, and ai score calculate routes invoke billing enforcement before expensive AI or Scorecard work executes.

Task 5.2.2: Display remaining monthly usage on billing and feature pages
Priority: 2
Estimate: 5h
Description: Expose usage counts from billing usage subcollections through /api/billing/me or a dedicated usage endpoint and render remaining chat essay matching and roadmap allowances in billing and feature UIs.

Task 5.2.3: Reconcile marketing pricing copy with entitlements and legal tier naming
Priority: 2
Estimate: 4h
Description: Update terms page Explorer Pathfinder Navigator Titan references to match Starter Growth Elite, clarify free tier capabilities versus Free Roadmap marketing claims, and decide whether to implement or remove the advertised seven day trial in Stripe checkout.


**FEATURE 6: Public Marketing Growth Analytics and Trust**
Priority: 2
Effort: 14
Business Value: 80
Tags: marketing, analytics, legal, growth
Description: Acquire and convert students through the public landing and pricing pages, build trust with privacy and terms content, honor service member discount messaging, measure funnel performance with Google Analytics and Google Tag Manager, verify the site in Search Console, and display live platform metrics from Firestore counts. Institutional and advisor login routes currently redirect to generic signin without dedicated experiences.


**USER STORY 6.1: As a prospective student, I want a compelling public website so that I understand the product value and start onboarding easily**
Priority: 2
Story Points: 5
Business Value: 85
Tags: landing, pricing, conversion
Description: Visitors land on the marketing homepage with hero copy, trust cards, methodology section, student benefits, live platform signals from public metrics API, pricing section with Stripe catalog amounts, FAQ, and CTAs into onboarding step one. The pricing page and navigation should support service member discount claims and consistent CTAs.
Acceptance Criteria:
1. Homepage loads live platform signal counts from /api/public/marketing-metrics without breaking the hero when metrics fail.
2. Pricing section displays current Stripe catalog prices for monthly and annual billing periods.
3. Primary CTAs route to /onboarding/step-1 and secondary CTAs route to /pricing from hero, nav, and footer.

Task 6.1.1: Stabilize landing pricing catalog fetch and fallback display
Priority: 2
Estimate: 4h
Description: Harden LandingPricingSection catalog fetch error handling so pricing cards show sensible fallback copy when /api/billing/catalog is unavailable during deploy or misconfiguration.

Task 6.1.2: Implement service member discount FAQ and pricing claim flow
Priority: 3
Estimate: 6h
Description: Connect DiscountFAQ and landing honoring section to a verifiable discount application path or documented manual verification process referenced from the pricing page.

Task 6.1.3: Activate First Ten minutes checklist on dashboard for new users
Priority: 2
Estimate: 5h
Description: Wire FirstTenActivationCard on the dashboard to firstTen local storage flags and deep links for adding colleges, running matching, creating a roadmap, and sending the first chat message.


**USER STORY 6.2: As the business, I want analytics verification and privacy compliant tracking so that we can measure growth while respecting student consent**
Priority: 3
Story Points: 3
Business Value: 65
Tags: analytics, gtm, privacy, seo
Description: The platform integrates Google Analytics with consent mode, Google Tag Manager head and noscript snippets, and Search Console verification metadata in the root layout. Cookie preferences on the cookies page must gate analytics storage, and public legal pages must remain accessible for FERPA and GDPR aligned trust positioning stated on the landing page.
Acceptance Criteria:
1. Google Tag Manager container GTM-WG92MDJG loads in head and body while Google Analytics respects denied consent until the user opts in on the cookies page.
2. Search Console verification meta tag is present on production pages for mycollegepath.ai.
3. Privacy, terms, and cookies pages are linked from the footer and render without authentication.

Task 6.2.1: Verify consent mode updates analytics storage on cookie preference save
Priority: 3
Estimate: 4h
Description: Test GoogleAnalytics component integration with COOKIE_CONSENT_EVENT and cookies page toggles to confirm analytics_storage updates from denied to granted only after explicit opt in.

Task 6.2.2: Configure GTM tags for key conversion events in tag manager UI
Priority: 3
Estimate: 3h
Description: Document and publish GTM tags for onboarding start, signup completion, checkout start, and subscription success events using dataLayer pushes from relevant client routes.

Task 6.2.3: Submit sitemap and monitor Search Console indexing for public routes
Priority: 4
Estimate: 3h
Description: Ensure public routes including home, pricing, privacy, terms, and onboarding entry are indexable, add or verify sitemap.xml, and confirm canonical host redirect from www to mycollegepath.ai via middleware.
