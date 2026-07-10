/**
 * Heuristic essay analysis used when OpenAI is unavailable or returns invalid JSON.
 * Not a substitute for AI coaching — clearly labeled so the UI can show usable guidance.
 */

export type EssayFeedbackItem = { title: string; description: string };

export type EssayAnalysisResult = {
  toneSummary: string;
  criticalIssues: EssayFeedbackItem[];
  suggestions: EssayFeedbackItem[];
  strengths: EssayFeedbackItem[];
  heatmap: {
    impact: number;
    reflection: number;
    specificity: number;
    structure: number;
    voice: number;
  };
  overallScore: number;
  reportSummary: string;
  criteria: Array<{ name: string; score: number; maxScore: number; description: string }>;
  /** Present when this result was produced without a live AI model response. */
  fallback?: boolean;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function scoreFromLength(words: number): number {
  if (words < 150) return 42;
  if (words < 250) return 55;
  if (words < 400) return 68;
  if (words < 650) return 74;
  if (words < 900) return 70;
  return 62;
}

function heatFromOverall(overall: number, bias: number): number {
  return clamp(Math.round(overall / 20 + bias), 1, 5);
}

export function buildHeuristicEssayAnalysis(essay: string): EssayAnalysisResult {
  const text = essay.trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
  const avgSentenceLen = sentences > 0 ? words / sentences : words;

  const overallScore = scoreFromLength(words);
  const structureScore = clamp(
    paragraphs >= 3 ? 4 : paragraphs === 2 ? 3 : 2,
    1,
    5
  );
  const specificityScore = clamp(
    /\b(I|my|me)\b/i.test(text) && words > 200 ? 3 : 2,
    1,
    5
  );

  const criticalIssues: EssayFeedbackItem[] = [];
  if (words < 250) {
    criticalIssues.push({
      title: "Essay may be too short",
      description:
        "Most college essays need more development. Add concrete scenes, decisions, and outcomes so readers can see your growth.",
    });
  }
  if (avgSentenceLen > 28) {
    criticalIssues.push({
      title: "Sentences run long",
      description:
        "Break up long sentences. Shorter lines improve clarity and help admissions readers follow your story.",
    });
  }
  if (paragraphs < 2) {
    criticalIssues.push({
      title: "Limited paragraph structure",
      description:
        "Organize into clear paragraphs: hook, context, turning point, reflection, and a forward-looking close.",
    });
  }

  const suggestions: EssayFeedbackItem[] = [
    {
      title: "Lead with a specific moment",
      description:
        "Open on a concrete scene or decision instead of a broad claim. Specificity makes your voice memorable.",
    },
    {
      title: "Show reflection, not only events",
      description:
        "After each key moment, add one sentence on what you learned and how it changed your next choice.",
    },
    {
      title: "Cut generic phrases",
      description:
        "Replace lines like “I have always been passionate” with evidence: what you did, for how long, and what changed.",
    },
  ];

  const strengths: EssayFeedbackItem[] = [];
  if (words >= 300) {
    strengths.push({
      title: "Solid length to work with",
      description: "You have enough material to revise toward a focused narrative rather than starting from scratch.",
    });
  }
  if (/\b(I|my)\b/i.test(text)) {
    strengths.push({
      title: "First-person voice present",
      description: "You are writing from your own perspective — keep that authenticity while tightening structure.",
    });
  }
  if (strengths.length === 0) {
    strengths.push({
      title: "Draft is a useful starting point",
      description: "You have raw material on the page. Focus next on structure, specificity, and reflection.",
    });
  }

  return {
    toneSummary:
      "This is a preliminary structural review generated because the AI coach was temporarily unavailable. Tone and voice notes below are based on length, structure, and basic writing signals — not a full narrative read.",
    criticalIssues,
    suggestions,
    strengths,
    heatmap: {
      impact: heatFromOverall(overallScore, 0),
      reflection: heatFromOverall(overallScore, -1),
      specificity: specificityScore,
      structure: structureScore,
      voice: heatFromOverall(overallScore, 0),
    },
    overallScore,
    reportSummary: `Preliminary review (AI unavailable): about ${words} words across ${paragraphs || 1} paragraph(s). Focus on a clearer arc, more concrete detail, and stronger reflection. Re-run analysis when the AI coach is back for deeper feedback. Your usage was still applied because you received this usable draft review.`,
    criteria: [
      { name: "Clarity", score: heatFromOverall(overallScore, 0), maxScore: 5, description: "Estimated from sentence length and readability signals." },
      { name: "Structure", score: structureScore, maxScore: 5, description: "Based on paragraph count and overall organization cues." },
      { name: "Voice", score: heatFromOverall(overallScore, 0), maxScore: 5, description: "Heuristic only — re-run for AI voice feedback." },
      { name: "Impact", score: heatFromOverall(overallScore, 0), maxScore: 5, description: "Estimated from length and presence of personal detail." },
      { name: "Specificity", score: specificityScore, maxScore: 5, description: "Looks for personal markers; AI review will catch stronger examples." },
      { name: "Reflection", score: heatFromOverall(overallScore, -1), maxScore: 5, description: "Add explicit takeaways after key moments." },
      { name: "Hook & Conclusion", score: clamp(structureScore - 1, 1, 5), maxScore: 5, description: "Check that the opening scene and closing insight bookend the essay." },
    ],
    fallback: true,
  };
}
