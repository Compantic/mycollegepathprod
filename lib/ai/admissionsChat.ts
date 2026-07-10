/**
 * Admissions Coach chat: single completion with user context, no tools.
 * Uses the shared OpenAI model fallback chain so a missing/unsupported primary model
 * does not hard-fail paying users.
 */
import { chatCompletion } from "./openai";
import type { ChatContext, MentionedCollege } from "./chatContext";
import { buildSystemPrompt } from "./chatContext";
import type { OpenAI } from "openai";

export async function runAdmissionsCoachWithContext(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  ctx: ChatContext,
  mentionedColleges: MentionedCollege[],
  options?: { model?: string }
): Promise<{ content: string }> {
  const systemContent = buildSystemPrompt(ctx, mentionedColleges);

  const allMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemContent },
    ...messages,
  ];

  const message = await chatCompletion(allMessages, {
    model: options?.model,
    temperature: 0.7,
    max_completion_tokens: 900,
  });

  const content =
    message?.content?.trim() ||
    "I couldn't generate a response. Please try again.";
  return { content };
}
