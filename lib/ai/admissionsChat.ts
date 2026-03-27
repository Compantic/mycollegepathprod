/**
 * Admissions Coach chat: single completion with user context, no tools.
 * Server-only. No essay rewriting; only admissions guidance.
 */
import { getClient } from "./openai";
import type { ChatContext, MentionedCollege } from "./chatContext";
import { buildSystemPrompt } from "./chatContext";
import type { OpenAI } from "openai";

export async function runAdmissionsCoachWithContext(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  ctx: ChatContext,
  mentionedColleges: MentionedCollege[],
  options?: { model?: string }
): Promise<{ content: string }> {
  const openai = getClient();
  const systemContent = buildSystemPrompt(ctx, mentionedColleges);

  const allMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemContent },
    ...messages,
  ];

  const response = await openai.chat.completions.create({
    model: options?.model ?? "gpt-4o-mini",
    messages: allMessages,
    temperature: 0.6,
    max_tokens: 900,
  });

  const choice = response.choices?.[0];
  const content = choice?.message?.content?.trim() ?? "I couldn't generate a response. Please try again.";
  return { content };
}
