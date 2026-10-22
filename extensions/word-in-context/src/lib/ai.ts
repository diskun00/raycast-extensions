import { AI, environment } from "@raycast/api";
import { WordEntry } from "./types";

export const canUseAI = () => environment.canAccess(AI);

export async function explainInContext(entry: WordEntry): Promise<string> {
  return AI.ask(
    `I'm learning English vocabulary. I came across the word "${entry.word}" in this sentence:\n\n` +
      `"${entry.sentence}"\n\n` +
      `Answer in Markdown, briefly:\n` +
      `1. **Meaning here** — what the word means in this exact sentence (one or two lines).\n` +
      `2. **Register** — formal, neutral, casual, literary, technical…, and when people typically use it.\n` +
      `3. **Example** — one new, natural example sentence using it in the same sense.\n` +
      `4. **Similar words** — two or three, with how they differ.`,
    { creativity: "low" },
  );
}
