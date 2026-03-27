import type { ChatCompletionTool } from "openai/resources/chat/completions";

export const admissionsCoachTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_colleges",
      description: "Search for colleges by name or filters (state, size). Use when the user asks for college suggestions or to find schools.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query or school name" },
          state: { type: "string", description: "Two-letter state code" },
          size: { type: "string", enum: ["small", "medium", "large"], description: "School size preference" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_college_details",
      description: "Get detailed information about a specific college by ID. Use when the user asks about a particular school.",
      parameters: {
        type: "object",
        properties: {
          college_id: { type: "number", description: "College Scorecard ID" },
        },
        required: ["college_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_matching",
      description: "Run college matching based on student profile (GPA, test scores, preferences). Use when the user wants personalized recommendations.",
      parameters: {
        type: "object",
        properties: {
          gpa: { type: "number" },
          sat_score: { type: "number" },
          act_score: { type: "number" },
          preferred_states: { type: "array", items: { type: "string" } },
          preferred_size: { type: "string", enum: ["small", "medium", "large"] },
        },
      },
    },
  },
];
