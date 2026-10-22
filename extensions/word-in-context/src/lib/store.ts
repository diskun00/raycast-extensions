import { environment } from "@raycast/api";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { WordEntry } from "./types";

const storePath = () => join(environment.supportPath, "words.json");

export async function loadEntries(): Promise<WordEntry[]> {
  try {
    const entries = JSON.parse(await readFile(storePath(), "utf8")) as WordEntry[];
    return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function saveEntries(entries: WordEntry[]): Promise<void> {
  await mkdir(environment.supportPath, { recursive: true });
  const tmp = `${storePath()}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(entries, null, 2), "utf8");
  await rename(tmp, storePath());
}

export async function addEntry(entry: Omit<WordEntry, "id" | "createdAt" | "reviewedCount">): Promise<WordEntry> {
  const created: WordEntry = { ...entry, id: randomUUID(), createdAt: new Date().toISOString(), reviewedCount: 0 };
  await saveEntries([created, ...(await loadEntries())]);
  return created;
}

export async function updateEntry(id: string, changes: Partial<WordEntry>): Promise<WordEntry[]> {
  const entries = (await loadEntries()).map((entry) => (entry.id === id ? { ...entry, ...changes } : entry));
  await saveEntries(entries);
  return entries;
}

export async function deleteEntry(id: string): Promise<WordEntry[]> {
  const entries = (await loadEntries()).filter((entry) => entry.id !== id);
  await saveEntries(entries);
  return entries;
}
