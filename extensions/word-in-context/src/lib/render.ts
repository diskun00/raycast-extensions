import { formatDefinition } from "./definition";
import { replaceWord } from "./text";
import { WordEntry } from "./types";

export function definitionMarkdown(entry: WordEntry): string {
  if (entry.definition === undefined) return "_Looking up definition…_";
  if (entry.definition === null) return "_No dictionary entry found._";
  return formatDefinition(entry.definition);
}

export function entryMarkdown(entry: WordEntry): string {
  const phonetic = entry.definition?.phonetic ? `  \`${entry.definition.phonetic}\`` : "";
  const sentence = entry.sentence
    ? `> ${replaceWord(entry.sentence, entry.word, (match) => `**${match}**`)}`
    : "_No context saved. Use Edit Context to add the sentence._";
  const ai = entry.aiExplanation ? `\n\n---\n\n### In this sentence\n\n${entry.aiExplanation}` : "";
  return `# ${entry.word}${phonetic}\n\n${sentence}\n\n${definitionMarkdown(entry)}${ai}`;
}
