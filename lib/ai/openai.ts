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

function isFallbackCandidateError(err: unknown): boolean {
  const status = err && typeof err === "object" && "status" in err ? (err as { status?: number }).status : undefined;
  const message =
    err && typeof err === "object" && "message" in err
      ? String((err as { message?: string }).message ?? "")
      : "";
  if (status === 400 || status === 404) return true;
  return /model|unsupported|not found|access|permission/i.test(message);
}

export async function chatCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options?: { model?: string; temperature?: number; response_format?: object }
): Promise<OpenAI.Chat.ChatCompletionMessage | null> {
  const openai = getClient();
  const modelCandidates = [
    options?.model,
    process.env.OPENAI_MODEL,
    "gpt-5.5",
    "gpt-4.1",
    "gpt-4o-mini",
  ].filter((m): m is string => Boolean(m));
  const dedupedModels = Array.from(new Set(modelCandidates));

  try {
    for (let i = 0; i < dedupedModels.length; i++) {
      const model = dedupedModels[i];
      try {
        const res = await openai.chat.completions.create({
          model,
          messages,
          temperature: options?.temperature ?? 0.7,
          response_format: options?.response_format as any,
        });
        return res.choices?.[0]?.message ?? null;
      } catch (err) {
        if (i < dedupedModels.length - 1 && isFallbackCandidateError(err)) {
          continue;
        }
        throw err;
      }
    }
    return null;
  } catch (err) {
    throw normalizeOpenAIError(err);
  }
}

export { getClient };
