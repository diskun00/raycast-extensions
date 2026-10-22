const STOPWORDS = new Set(
  (
    "about above after again against also although among another anyone anything around because been before being " +
    "below between both cannot could does doing done down during each either else even ever every few from further " +
    "have having here hers herself himself however into itself just least less like made make many maybe might mine " +
    "more most much must myself near neither never none nothing often once only other ought ours ourselves over " +
    "own perhaps quite rather really same says shall should since some something still such than that their theirs " +
    "them themselves then there these they thing things this those though through thus together under until upon " +
    "very want wants were what whatever when where whether which while whom whose will with within without would " +
    "yeah your yours yourself yourselves the and but for not you are was his her she him its our can all any how " +
    "who why one two out off yes get got let new now old see use way may did has had say said"
  ).split(" "),
);

const wordSegmenter = new Intl.Segmenter("en", { granularity: "word" });
const sentenceSegmenter = new Intl.Segmenter("en", { granularity: "sentence" });

export function normalizeSelection(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Words worth offering in the capture list, in reading order, without duplicates. */
export function candidateWords(text: string, minLength: number): string[] {
  const seen = new Set<string>();
  const words: string[] = [];
  for (const { segment, isWordLike } of wordSegmenter.segment(text)) {
    if (!isWordLike) continue;
    const word = segment.replace(/^['’]+|['’]+$/g, "");
    const key = word.toLowerCase();
    if (word.length < minLength || /\d/.test(word) || STOPWORDS.has(key) || seen.has(key)) continue;
    seen.add(key);
    words.push(word);
  }
  return words;
}

export function splitSentences(text: string): string[] {
  const sentences: string[] = [];
  for (const { segment } of sentenceSegmenter.segment(text)) {
    const sentence = segment.trim();
    if (!sentence) continue;
    // Intl.Segmenter splits after abbreviations like "Dr." or "e.g."; glue those back on
    const previous = sentences[sentences.length - 1];
    if (previous && /\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|vs|etc|e\.g|i\.e)\.$/i.test(previous)) {
      sentences[sentences.length - 1] = `${previous} ${sentence}`;
    } else {
      sentences.push(sentence);
    }
  }
  return sentences;
}

export function containsWord(text: string, word: string): boolean {
  const target = word.toLowerCase();
  for (const { segment, isWordLike } of wordSegmenter.segment(text)) {
    if (isWordLike && segment.toLowerCase().replace(/^['’]+|['’]+$/g, "") === target) return true;
  }
  return false;
}

/** The first sentence of the paragraph that contains the word; the whole paragraph if none does. */
export function sentenceFor(paragraph: string, word: string): string {
  return splitSentences(paragraph).find((sentence) => containsWord(sentence, word)) ?? paragraph;
}

/** Splits text around case-insensitive whole-word matches so callers can emphasise or blank the word. */
export function replaceWord(text: string, word: string, replacement: (match: string) => string): string {
  const target = word.toLowerCase();
  let result = "";
  for (const { segment, isWordLike } of wordSegmenter.segment(text)) {
    result += isWordLike && segment.toLowerCase() === target ? replacement(segment) : segment;
  }
  return result;
}
