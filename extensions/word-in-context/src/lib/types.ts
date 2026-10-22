export interface WordSource {
  app?: string;
  title?: string;
  url?: string;
}

export interface Meaning {
  partOfSpeech: string;
  definitions: string[];
}

export interface Definition {
  phonetic?: string;
  meanings: Meaning[];
}

export interface WordEntry {
  id: string;
  word: string;
  sentence: string;
  paragraph: string;
  source: WordSource;
  createdAt: string;
  // null means the dictionary had no entry for the word
  definition?: Definition | null;
  aiExplanation?: string;
  reviewedCount: number;
  lastReviewedAt?: string;
}
