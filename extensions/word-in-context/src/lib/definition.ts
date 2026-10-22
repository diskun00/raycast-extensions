import { Definition } from "./types";

interface ApiEntry {
  phonetic?: string;
  phonetics?: { text?: string }[];
  meanings?: { partOfSpeech: string; definitions: { definition: string }[] }[];
}

/** Looks the word up in the Free Dictionary API; resolves to null when the word is unknown. */
export async function fetchDefinition(word: string): Promise<Definition | null> {
  const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Dictionary lookup failed (${response.status})`);

  const entries = (await response.json()) as ApiEntry[];
  const meanings = new Map<string, string[]>();
  for (const meaning of entries.flatMap((entry) => entry.meanings ?? [])) {
    const definitions = meanings.get(meaning.partOfSpeech) ?? [];
    definitions.push(...meaning.definitions.map((d) => d.definition));
    meanings.set(meaning.partOfSpeech, definitions);
  }
  const phonetic = entries.map((e) => e.phonetic ?? e.phonetics?.find((p) => p.text)?.text).find(Boolean);
  return {
    phonetic,
    meanings: [...meanings].map(([partOfSpeech, definitions]) => ({
      partOfSpeech,
      definitions: definitions.slice(0, 3),
    })),
  };
}

export function formatDefinition(definition: Definition): string {
  return definition.meanings
    .map(
      ({ partOfSpeech, definitions }) => `*${partOfSpeech}*\n${definitions.map((d, i) => `${i + 1}. ${d}`).join("\n")}`,
    )
    .join("\n\n");
}
