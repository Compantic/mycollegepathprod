import { getClient } from "./openai";
import { admissionsCoachTools } from "./tools";
import { searchSchools, getSchoolById } from "@/lib/scorecard/client";
import { getCachedCollege } from "@/lib/scorecard/cache";
import { runMatching } from "@/lib/matching/engine";
import type { OpenAI } from "openai";

const SYSTEM_PROMPT = `You are the Admissions Coach for MyCollegePath. You help high school students find and evaluate colleges. Be concise, encouraging, and factual. Use the provided tools to search colleges, get details, and run matching when the user wants recommendations. Always respond in English.`;

export async function runAdmissionsCoach(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options?: { model?: string }
): Promise<{ content: string; toolCalls?: OpenAI.Chat.ChatCompletionMessageToolCall[] }> {
  const openai = getClient();
  const allMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages,
  ];

  const response = await openai.chat.completions.create({
    model: options?.model ?? "gpt-4o-mini",
    messages: allMessages,
    tools: admissionsCoachTools,
    tool_choice: "auto",
    temperature: 0.7,
  });

  const choice = response.choices?.[0];
  if (!choice?.message) {
    return { content: "I couldn't generate a response. Please try again." };
  }

  const msg = choice.message;

  if (msg.tool_calls?.length) {
    const toolResults: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { ...msg, role: "assistant" as const },
    ];
    for (const tc of msg.tool_calls) {
      const name = tc.function?.name;
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(tc.function?.arguments ?? "{}");
      } catch {}
      let result: string;
      try {
        if (name === "search_colleges") {
          const res = await searchSchools({
            schoolname: (args.query as string) || undefined,
            "school.state": (args.state as string) || undefined,
            per_page: 15,
          });
          const results = (res.results ?? []).slice(0, 10);
          result = JSON.stringify(
            results.map((r) => ({
              id: r.id,
              name: r.name,
              city: r.city,
              state: r.state,
            }))
          );
        } else if (name === "get_college_details") {
          const id = args.college_id as number;
          const cached = getCachedCollege(id);
          const college = cached ?? (await getSchoolById(id));
          result = college ? JSON.stringify(college) : "College not found.";
        } else if (name === "run_matching") {
          const matches = await runMatching({
            gpa: args.gpa as number | undefined,
            satScore: args.sat_score as number | undefined,
            actScore: args.act_score as number | undefined,
            preferredStates: args.preferred_states as string[] | undefined,
            preferredSize: args.preferred_size as "small" | "medium" | "large" | undefined,
          });
          result = JSON.stringify(matches);
        } else {
          result = "Unknown tool.";
        }
      } catch (err) {
        result = `Error: ${err instanceof Error ? err.message : String(err)}`;
      }
      toolResults.push({
        role: "tool",
        tool_call_id: tc.id,
        content: result,
      });
    }
    const followUp = await openai.chat.completions.create({
      model: options?.model ?? "gpt-4o-mini",
      messages: [...allMessages, ...toolResults],
      temperature: 0.7,
    });
    const followMsg = followUp.choices?.[0]?.message;
    return {
      content: followMsg?.content ?? "I processed your request but couldn't form a reply.",
    };
  }

  return { content: msg.content ?? "" };
}
