import OpenAI from "openai";
import { RateLimitError, ServiceUnavailableError } from "@/lib/errors/api";

function getClient(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey: key });
}

function normalizeOpenAIError(err: unknown): Error {
  if (err instanceof RateLimitError || err instanceof ServiceUnavailableError) return err;
  const status = err && typeof err === "object" && "status" in err ? (err as { status: number }).status : undefined;
  if (status === 429) {
    return new RateLimitError("AI rate limit exceeded. Please try again in a moment.");
  }
  if (status === 401 || status === 403) {
    return new ServiceUnavailableError("AI service configuration error. Please try again later.");
  }
  return err instanceof Error ? err : new ServiceUnavailableError("AI service temporarily unavailable. Please try again later.");
}

export async function chatCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options?: { model?: string; temperature?: number }
): Promise<OpenAI.Chat.ChatCompletionMessage | null> {
  const openai = getClient();
  try {
    const res = await openai.chat.completions.create({
      model: options?.model ?? "gpt-4o-mini",
      messages,
      temperature: options?.temperature ?? 0.7,
    });
    return res.choices?.[0]?.message ?? null;
  } catch (err) {
    throw normalizeOpenAIError(err);
  }
}

export { getClient };
