import { Action, ActionPanel, Detail, Icon } from "@raycast/api";
import { useMemo, useState } from "react";
import { canUseAI } from "./lib/ai";
import { entryMarkdown } from "./lib/render";
import { replaceWord } from "./lib/text";
import { WordEntry } from "./lib/types";
import { useEntries } from "./lib/useEntries";

const SESSION_SIZE = 10;

/** A random handful, nudged towards words that have been reviewed less often. */
function pickSession(entries: WordEntry[]): string[] {
  return entries
    .filter((entry) => entry.sentence)
    .map((entry) => ({ id: entry.id, score: Math.random() / (1 + entry.reviewedCount) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, SESSION_SIZE)
    .map(({ id }) => id);
}

export default function Command() {
  const { entries, isLoading, update, enrich, explain } = useEntries();
  const session = useMemo(() => pickSession(entries), [isLoading]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const entry = entries.find((e) => e.id === session[index]);

  if (!entry) {
    const markdown = isLoading
      ? ""
      : session.length === 0
        ? "# Nothing to review yet\n\nCapture a few words with their sentences first."
        : `# That's it 🎉\n\nYou looked at ${session.length} words. Come back whenever you feel like it.`;
    return <Detail isLoading={isLoading} markdown={markdown} />;
  }

  const reveal = async () => {
    setRevealed(true);
    await update(entry.id, { reviewedCount: entry.reviewedCount + 1, lastReviewedAt: new Date().toISOString() });
    await enrich(entry);
  };
  const next = () => {
    setRevealed(false);
    setIndex(index + 1);
  };

  const blank = replaceWord(entry.sentence, entry.word, (match) => "\\_".repeat(Math.max(4, match.length)));
  const markdown = revealed
    ? entryMarkdown(entry)
    : `# Which word fits?\n\n> ${blank}\n\n_Starts with **${entry.word[0]}**, ${entry.word.length} letters._`;

  return (
    <Detail
      navigationTitle={`Casual Review · ${index + 1} of ${session.length}`}
      markdown={markdown}
      actions={
        <ActionPanel>
          {revealed ? (
            <Action title="Next Word" icon={Icon.ArrowRight} onAction={next} />
          ) : (
            <Action title="Reveal" icon={Icon.Eye} onAction={reveal} />
          )}
          {revealed && canUseAI() && (
            <Action title="Explain in This Sentence" icon={Icon.Stars} onAction={() => explain(entry)} />
          )}
          {!revealed && <Action title="Skip" icon={Icon.Forward} onAction={next} />}
        </ActionPanel>
      }
    />
  );
}
