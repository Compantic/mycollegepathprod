import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/firebase/serverAuth";
import {
  getStudentProfileForServer,
  getLatestMatchRun,
  getFavoritesForServer,
} from "@/lib/firebase/serverFirestore";
import { resolveMentionedColleges, type ChatContext, runAdmissionsCoachWithContext } from "@/lib/domain/chat";
import type { OpenAI } from "openai";
import { chatPostBodySchema } from "@/lib/validation/api";
import { getApiErrorStatus } from "@/lib/errors/api";
import { enforceUserRateLimit } from "@/lib/rateLimit/server";
import { logApiError } from "@/lib/logging/api";
import { BillingError, releaseFeatureUsage, reserveFeatureUsage } from "@/lib/billing/enforce";

export async function POST(req: NextRequest) {
  let uid: string | null = null;
  let reserved = false;

  try {
    const user = await getSessionUserFromRequest(req);
    if (!user) {
      console.warn("[chat] POST: no user session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    uid = user.uid;

    await reserveFeatureUsage(user.uid, "chat");
    reserved = true;

    await enforceUserRateLimit({
      userId: user.uid,
      bucket: "chat",
      windowMs: 60_000,
      maxRequests: 20,
    });

    const body = await req.json();
    const parsed = chatPostBodySchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.errors.map((e) => e.message).join("; ") || "messages required";
      await releaseFeatureUsage(user.uid, "chat");
      reserved = false;
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    const { messages, model } = parsed.data;

    const profile = await getStudentProfileForServer(user.uid);
    const favorites = await getFavoritesForServer(user.uid);
    const latestMatchRun = await getLatestMatchRun(user.uid);
    const ctx: ChatContext = {
      profile,
      favorites,
      latestMatchRun,
    };

    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((m) => m.role === "user");
    const lastContent = typeof lastUserMessage?.content === "string" ? lastUserMessage.content : "";
    const mentioned = await resolveMentionedColleges(lastContent, ctx);

    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const { content } = await runAdmissionsCoachWithContext(openaiMessages, ctx, mentioned, { model });

    const text = (content ?? "").trim();
    if (!text) {
      console.warn("[chat] POST: empty content from OpenAI");
      await releaseFeatureUsage(user.uid, "chat");
      reserved = false;
      return NextResponse.json(
        { error: "I couldn't generate a response. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ content: text });
  } catch (err) {
    if (reserved && uid) {
      await releaseFeatureUsage(uid, "chat");
    }
    if (err instanceof BillingError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    const status = getApiErrorStatus(err);
    logApiError("chat", {}, err);
    if (status === 429) {
      return NextResponse.json({ error: "Too many requests. Try again in a moment." }, { status: 429 });
    }
    if (status === 503) {
      return NextResponse.json(
        { error: "Chat service temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Something went wrong while generating a response. Please try again." },
      { status: 500 }
    );
  }
}
