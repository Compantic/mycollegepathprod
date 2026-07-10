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
  return err instanceof Error
    ? err
    : new ServiceUnavailableError("AI service temporarily unavailable. Please try again later.");
}

function isFallbackCandidateError(err: unknown): boolean {
  const status =
    err && typeof err === "object" && "status" in err ? (err as { status?: number }).status : undefined;
  const message =
    err && typeof err === "object" && "message" in err
      ? String((err as { message?: string }).message ?? "")
      : "";
  if (status === 400 || status === 404) return true;
  return /model|unsupported|not found|access|permission|max_completion_tokens|max_tokens/i.test(
    message
  );
}

export type ChatCompletionOptions = {
  model?: string;
  temperature?: number;
  response_format?: object;
  max_completion_tokens?: number;
};

function buildModelCandidates(preferred?: string): string[] {
  return Array.from(
    new Set(
      [
        preferred,
        process.env.OPENAI_CHAT_MODEL,
        process.env.OPENAI_MODEL,
        "gpt-5.5",
        "gpt-4.1",
        "gpt-4o",
        "gpt-4o-mini",
      ].filter((m): m is string => Boolean(m))
    )
  );
}

export async function chatCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options?: ChatCompletionOptions
): Promise<OpenAI.Chat.ChatCompletionMessage | null> {
  const openai = getClient();
  const dedupedModels = buildModelCandidates(options?.model);

  try {
    for (let i = 0; i < dedupedModels.length; i++) {
      const model = dedupedModels[i];
      try {
        const params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
          model,
          messages,
          temperature: options?.temperature ?? 0.7,
        };
        if (options?.response_format) {
          (params as { response_format?: object }).response_format = options.response_format;
        }
        if (options?.max_completion_tokens != null) {
          // Newer models prefer max_completion_tokens; older ones may reject it and trigger fallback.
          (params as { max_completion_tokens?: number }).max_completion_tokens =
            options.max_completion_tokens;
        }

        const res = await openai.chat.completions.create(params);
        return res.choices?.[0]?.message ?? null;
      } catch (err) {
        if (i < dedupedModels.length - 1 && isFallbackCandidateError(err)) {
          // Retry without max_completion_tokens if that param caused the failure.
          if (
            options?.max_completion_tokens != null &&
            /max_completion_tokens/i.test(
              err && typeof err === "object" && "message" in err
                ? String((err as { message?: string }).message ?? "")
                : ""
            )
          ) {
            try {
              const res = await openai.chat.completions.create({
                model,
                messages,
                temperature: options?.temperature ?? 0.7,
                ...(options?.response_format
                  ? { response_format: options.response_format as OpenAI.Chat.ChatCompletionCreateParams["response_format"] }
                  : {}),
                max_tokens: options.max_completion_tokens,
              });
              return res.choices?.[0]?.message ?? null;
            } catch {
              /* fall through to next model */
            }
          }
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
