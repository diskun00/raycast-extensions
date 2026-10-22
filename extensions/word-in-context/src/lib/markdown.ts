import { appendFile, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { replaceWord } from "./text";
import { WordEntry } from "./types";

export function resolvePath(path: string): string {
  return resolve(path.replace(/^~(?=$|\/)/, homedir()));
}

export function formatMarkdown(entry: WordEntry): string {
  const date = entry.createdAt.slice(0, 10);
  const quote = replaceWord(entry.sentence, entry.word, (match) => `**${match}**`);
  const { app, title, url } = entry.source;
  const page = url ? `[${title || url}](${url})` : title;
  const source = [app, page].filter(Boolean).join(" · ");
  return `\n## ${entry.word} — ${date}\n\n> ${quote}\n${source ? `\n— ${source}\n` : ""}`;
}

export async function appendToMarkdown(path: string, entry: WordEntry): Promise<void> {
  const file = resolvePath(path);
  await mkdir(dirname(file), { recursive: true });
  await appendFile(file, formatMarkdown(entry), "utf8");
}
