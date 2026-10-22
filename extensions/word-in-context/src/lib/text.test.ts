import assert from "node:assert/strict";
import { test } from "node:test";
import { candidateWords, containsWord, replaceWord, sentenceFor, splitSentences } from "./text.ts";

const paragraph =
  "Dr. Smith arrived late. It was pure serendipity that we met at the station! " +
  "Later, the conversation turned ephemeral, as conversations do.";

test("splits sentences without breaking on abbreviations", () => {
  assert.deepEqual(splitSentences(paragraph), [
    "Dr. Smith arrived late.",
    "It was pure serendipity that we met at the station!",
    "Later, the conversation turned ephemeral, as conversations do.",
  ]);
});

test("offers interesting words once, in reading order", () => {
  const words = candidateWords(paragraph, 4);
  assert.ok(words.includes("serendipity"));
  assert.ok(words.includes("ephemeral"));
  assert.ok(!words.includes("that"), "stopwords are dropped");
  assert.ok(!words.includes("met"), "short words are dropped");
  assert.equal(words.filter((w) => w.toLowerCase() === "conversation").length, 1);
  assert.ok(words.indexOf("serendipity") < words.indexOf("ephemeral"));
});

test("finds the sentence containing the word, case-insensitively", () => {
  assert.equal(sentenceFor(paragraph, "Serendipity"), "It was pure serendipity that we met at the station!");
  assert.equal(sentenceFor(paragraph, "missing"), paragraph);
});

test("matches whole words only", () => {
  assert.ok(containsWord("Conversations matter.", "conversations"));
  assert.ok(!containsWord("Conversations matter.", "conversation"));
});

test("strips quotes and apostrophes around words", () => {
  assert.deepEqual(candidateWords("'Quixotic' plans", 4), ["Quixotic", "plans"]);
});

test("replaces every occurrence of the word", () => {
  assert.equal(
    replaceWord("Ephemeral things are ephemeral.", "ephemeral", () => "___"),
    "___ things are ___.",
  );
});
