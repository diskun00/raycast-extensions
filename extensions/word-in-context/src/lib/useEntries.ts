import { getPreferenceValues, showToast, Toast } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { canUseAI, explainInContext } from "./ai";
import { fetchDefinition } from "./definition";
import { deleteEntry, loadEntries, updateEntry } from "./store";
import { WordEntry } from "./types";

/** Saved entries plus lazy, cached enrichment (dictionary definition, AI explanation). */
export function useEntries() {
  const [entries, setEntries] = useState<WordEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const inFlight = useRef(new Set<string>());

  useEffect(() => {
    loadEntries()
      .then(setEntries)
      .catch((error) => showFailureToast(error, { title: "Couldn't load saved words" }))
      .finally(() => setIsLoading(false));
  }, []);

  const update = useCallback(async (id: string, changes: Partial<WordEntry>) => {
    setEntries(await updateEntry(id, changes));
  }, []);

  const remove = useCallback(async (id: string) => {
    setEntries(await deleteEntry(id));
  }, []);

  const explain = useCallback(
    async (entry: WordEntry) => {
      const key = `ai:${entry.id}`;
      if (inFlight.current.has(key) || !entry.sentence) return;
      inFlight.current.add(key);
      const toast = await showToast({ style: Toast.Style.Animated, title: `Explaining "${entry.word}"…` });
      try {
        await update(entry.id, { aiExplanation: await explainInContext(entry) });
        await toast.hide();
      } catch (error) {
        await toast.hide();
        await showFailureToast(error, { title: "AI explanation failed" });
      } finally {
        inFlight.current.delete(key);
      }
    },
    [update],
  );

  /** Fetches whatever the entry is still missing; safe to call on every selection change. */
  const enrich = useCallback(
    async (entry: WordEntry | undefined) => {
      if (!entry) return;
      const key = `def:${entry.id}`;
      if (entry.definition === undefined && !inFlight.current.has(key)) {
        inFlight.current.add(key);
        try {
          await update(entry.id, { definition: await fetchDefinition(entry.word) });
        } catch {
          // offline or rate limited: try again next time the entry is shown
        } finally {
          inFlight.current.delete(key);
        }
      }
      const { autoExplain } = getPreferenceValues<Preferences>();
      if (autoExplain && !entry.aiExplanation && canUseAI()) await explain(entry);
    },
    [update, explain],
  );

  return { entries, isLoading, update, remove, enrich, explain };
}
