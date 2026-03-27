/**
 * Build context and resolve college mentions for the Admissions Coach chat.
 * Server-only (uses resolveCollegeNameToId).
 */
import { resolveCollegeNameToId } from "@/lib/scorecard/resolveName";
import type { CollegeMatch } from "@/lib/matching/types";
import type { ServerStudentProfile } from "@/lib/firebase/serverFirestore";

export interface ChatContext {
  profile: ServerStudentProfile | null;
  favorites: { collegeId: number; name: string }[];
  latestMatchRun: { runId: string; matches: CollegeMatch[] } | null;
}

export interface MentionedCollege {
  id: number;
  name: string;
  match?: CollegeMatch;
}

/** Known colleges from match run + favorites for substring matching. */
function getKnownColleges(ctx: ChatContext): { id: number; name: string }[] {
  const byId = new Map<number, string>();
  for (const m of ctx.latestMatchRun?.matches ?? []) {
    byId.set(m.id, m.name);
  }
  for (const f of ctx.favorites) {
    byId.set(f.collegeId, f.name);
  }
  return Array.from(byId.entries()).map(([id, name]) => ({ id, name }));
}

/**
 * Resolve college names mentioned in the message to ids and optional match data.
 * 1) Match against known names (match run + favorites).
 * 2) Optionally try one search with a phrase extracted from the message.
 */
export async function resolveMentionedColleges(
  message: string,
  ctx: ChatContext
): Promise<MentionedCollege[]> {
  const known = getKnownColleges(ctx);
  const normalized = message.toLowerCase();
  const matchMap = new Map(
    (ctx.latestMatchRun?.matches ?? []).map((m) => [m.id, m])
  );
  const result: MentionedCollege[] = [];
  const seen = new Set<number>();

  for (const { id, name } of known) {
    if (seen.has(id)) continue;
    if (normalized.includes(name.toLowerCase())) {
      seen.add(id);
      result.push({
        id,
        name,
        match: matchMap.get(id),
      });
    }
  }

  // Try one search with a short phrase (e.g. "What about Berkeley?" -> "Berkeley")
  const aboutMatch = message.match(/\b(?:about|regarding|for)\s+([^.?!]+?)(?:\?|\.|!|$)/i);
  const phrase = aboutMatch
    ? aboutMatch[1].trim().slice(0, 50)
    : message.trim().split(/\s+/).slice(-3).join(" ").slice(0, 50);
  if (phrase.length >= 2 && result.length === 0) {
    const id = await resolveCollegeNameToId(phrase);
    if (id != null && !seen.has(id)) {
      seen.add(id);
      const match = matchMap.get(id);
      const name = match?.name ?? `College ${id}`;
      result.push({ id, name, match });
    }
  }

  return result;
}

export function buildSystemPrompt(
  ctx: ChatContext,
  mentioned: MentionedCollege[]
): string {
  const parts: string[] = [
    `You are the Admissions Coach for MyCollegePath. You help high school students with detailed, highly specific college admissions guidance.`,
    `Rules: Respond only with admissions guidance (fit, strategy, deadlines, what to improve). Do not rewrite or edit essays, personal statements, or application text. Be clear, encouraging, and practical. Use the student's data below to give concrete, tailored advice that explicitly references their GPA, scores, preferences, and target schools whenever possible. Address the student directly as "you". Always respond in English.`,
    `Depth and length: Give thorough answers that feel like a mini-consultation, typically 3–6 short paragraphs or well-structured bullet points (around 250–450 words) unless the question is extremely narrow.`,
    `Formatting: Do not use markdown headings with #, ##, or ###. Instead, use plain text paragraphs and, when helpful, numbered lists (1., 2., 3.) or simple bullet points (-) for steps and examples.`,
    `Specificity: Avoid vague phrases like "it depends" without follow-up. When discussing chances or school fit, tie your reasoning to the student's profile, match scores, tiers, and the particular colleges mentioned. When you are unsure, say so but still give your best estimate and how the student can verify details.`,
    `You can make mistakes; suggest the student verify important details (deadlines, requirements, policies) on official college sites.`,
  ];

  if (ctx.profile) {
    const p = ctx.profile;
    const profileLines: string[] = ["Student profile:"];
    if (p.gpa != null) profileLines.push(`- GPA: ${p.gpa}`);
    if (p.satScore != null) profileLines.push(`- SAT: ${p.satScore}`);
    if (p.actScore != null) profileLines.push(`- ACT: ${p.actScore}`);
    if (p.preferredStates?.length) profileLines.push(`- Preferred states: ${p.preferredStates.join(", ")}`);
    if (p.preferredSize) profileLines.push(`- Preferred campus size: ${p.preferredSize}`);
    if (p.preferredMajors?.length) profileLines.push(`- Preferred majors: ${p.preferredMajors.join(", ")}`);
    if (profileLines.length > 1) parts.push(profileLines.join("\n"));
  }

  if (ctx.favorites.length > 0) {
    parts.push(
      `Favorite/target schools: ${ctx.favorites.map((f) => f.name).join(", ")}.`
    );
  }

  if (ctx.latestMatchRun && ctx.latestMatchRun.matches.length > 0) {
    parts.push("Latest matching run (top recommendations with match score, tier, reasons, and improvement tips):");
    for (const m of ctx.latestMatchRun.matches.slice(0, 10)) {
      parts.push(
        `- ${m.name} (id ${m.id}): ${m.matchScore}% match, ${m.tier}. Reasons: ${m.reasons.join("; ")}. How to improve: ${m.improveTips.join("; ")}.`
      );
    }
  }

  if (mentioned.length > 0) {
    parts.push("The user is asking about the following college(s) — use the match data above when relevant:");
    for (const c of mentioned) {
      if (c.match) {
        parts.push(
          `- ${c.name}: ${c.match.matchScore}% match, ${c.match.tier}. Reasons: ${c.match.reasons.join("; ")}. Improve: ${c.match.improveTips.join("; ")}.`
        );
      } else {
        parts.push(`- ${c.name} (id ${c.id})`);
      }
    }
  }

  return parts.join("\n\n");
}
