import {
  Action,
  ActionPanel,
  BrowserExtension,
  environment,
  getFrontmostApplication,
  getPreferenceValues,
  getSelectedText,
  Icon,
  List,
  PopToRootType,
  showHUD,
  showToast,
  Toast,
} from "@raycast/api";
import { showFailureToast, usePromise } from "@raycast/utils";
import { appendToMarkdown } from "./lib/markdown";
import { addEntry } from "./lib/store";
import { candidateWords, normalizeSelection, sentenceFor } from "./lib/text";
import { WordSource } from "./lib/types";

interface Selection {
  paragraph: string;
  words: string[];
  source: WordSource;
}

async function readSource(): Promise<WordSource> {
  const source: WordSource = {};
  try {
    source.app = (await getFrontmostApplication()).name;
  } catch {
    // the source is a nice-to-have
  }
  if (environment.canAccess(BrowserExtension)) {
    try {
      const tab = (await BrowserExtension.getTabs()).find((t) => t.active);
      if (tab) Object.assign(source, { title: tab.title, url: tab.url });
    } catch {
      // the browser extension is not installed or the frontmost app is not a browser
    }
  }
  return source;
}

async function readSelection(): Promise<Selection | undefined> {
  const [text, source] = await Promise.all([getSelectedText().catch(() => ""), readSource()]);
  const paragraph = normalizeSelection(text);
  if (!paragraph) return undefined;
  const { minWordLength } = getPreferenceValues<Preferences.Capture>();
  const words = candidateWords(paragraph, Number(minWordLength) || 4);
  return { paragraph, words, source };
}

async function save(word: string, selection: Selection) {
  const singleWord = selection.paragraph.split(" ").length === 1;
  const entry = await addEntry({
    word,
    sentence: singleWord ? "" : sentenceFor(selection.paragraph, word),
    paragraph: singleWord ? "" : selection.paragraph,
    source: selection.source,
  });
  const { markdownPath } = getPreferenceValues<Preferences.Capture>();
  if (markdownPath?.trim()) {
    try {
      await appendToMarkdown(markdownPath.trim(), entry);
    } catch (error) {
      await showFailureToast(error, { title: `Saved "${word}", but couldn't write the Markdown file` });
      return;
    }
  }
  await showHUD(`Saved: ${word}`, { clearRootSearch: true, popToRootType: PopToRootType.Immediate });
}

export default function Command() {
  const { data: selection, isLoading } = usePromise(async () => {
    const selection = await readSelection();
    if (!selection) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Nothing selected",
        message: "Triple-click a sentence or paragraph, then run Capture Word",
      });
    } else if (selection.paragraph.split(" ").length === 1) {
      // A single selected word needs no picking
      await save(selection.words[0] ?? selection.paragraph.replace(/[^\p{L}'’-]/gu, ""), selection);
    }
    return selection;
  });

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Type a few letters of the word…">
      {selection && (
        <List.Section title="Words in selection" subtitle={selection.source.title ?? selection.source.app}>
          {selection.words.map((word) => (
            <List.Item
              key={word}
              title={word}
              icon={Icon.Text}
              actions={
                <ActionPanel>
                  <Action title="Save Word" icon={Icon.SaveDocument} onAction={() => save(word, selection)} />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}
      <List.EmptyView
        icon={Icon.TextSelection}
        title={selection ? "No interesting words found" : "Nothing selected"}
        description="Triple-click a sentence or paragraph, then run Capture Word"
      />
    </List>
  );
}
