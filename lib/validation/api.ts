/**
 * Zod schemas for API request validation.
 * Use in route handlers to validate body/query and return 400 with clear messages.
 */
import { z } from "zod";

export const sessionPostBodySchema = z.object({
  token: z.string().min(1, "token required"),
});

export const chatPostBodySchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string(),
  })).min(1, "messages required"),
  model: z.string().optional(),
});

export const scorecardCollegeQuerySchema = z.object({
  id: z.coerce.number().int().positive("Invalid id"),
});

export type SessionPostBody = z.infer<typeof sessionPostBodySchema>;
export type ChatPostBody = z.infer<typeof chatPostBodySchema>;
export type ScorecardCollegeQuery = z.infer<typeof scorecardCollegeQuerySchema>;
