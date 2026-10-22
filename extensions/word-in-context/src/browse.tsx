import {
  Action,
  ActionPanel,
  Alert,
  confirmAlert,
  Form,
  Icon,
  Keyboard,
  List,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { canUseAI } from "./lib/ai";
import { entryMarkdown } from "./lib/render";
import { WordEntry } from "./lib/types";
import { useEntries } from "./lib/useEntries";

function EditContext({ entry, onSave }: { entry: WordEntry; onSave: (changes: Partial<WordEntry>) => Promise<void> }) {
  const { pop } = useNavigation();
  return (
    <Form
      navigationTitle={`Edit "${entry.word}"`}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Save"
            onSubmit={async (values: { word: string; sentence: string }) => {
              const word = values.word.trim() || entry.word;
              // a changed word needs a fresh definition and explanation
              const reset = word === entry.word ? {} : { definition: undefined, aiExplanation: undefined };
              await onSave({ ...reset, word, sentence: values.sentence.trim() });
              await showToast({ style: Toast.Style.Success, title: "Saved" });
              pop();
            }}
          />
        </ActionPanel>
      }
    >
      <Form.TextField id="word" title="Word" defaultValue={entry.word} />
      <Form.TextArea id="sentence" title="Sentence" defaultValue={entry.sentence} />
    </Form>
  );
}

export default function Command() {
  const { entries, isLoading, update, remove, enrich, explain } = useEntries();

  return (
    <List
      isLoading={isLoading}
      isShowingDetail={entries.length > 0}
      searchBarPlaceholder="Search words and sentences…"
      onSelectionChange={(id) => enrich(entries.find((entry) => entry.id === id))}
    >
      <List.EmptyView
        icon={Icon.Book}
        title="No words yet"
        description="Triple-click a sentence while reading and run Capture Word"
      />
      {entries.map((entry) => (
        <List.Item
          key={entry.id}
          id={entry.id}
          title={entry.word}
          keywords={entry.sentence.split(/\W+/).filter(Boolean)}
          accessories={[{ date: new Date(entry.createdAt), tooltip: entry.source.title ?? entry.source.app }]}
          detail={
            <List.Item.Detail
              markdown={entryMarkdown(entry)}
              metadata={
                <List.Item.Detail.Metadata>
                  {entry.source.app && <List.Item.Detail.Metadata.Label title="App" text={entry.source.app} />}
                  {entry.source.url && (
                    <List.Item.Detail.Metadata.Link
                      title="Page"
                      text={entry.source.title || entry.source.url}
                      target={entry.source.url}
                    />
                  )}
                  <List.Item.Detail.Metadata.Label title="Saved" text={new Date(entry.createdAt).toLocaleString()} />
                  <List.Item.Detail.Metadata.Label title="Reviewed" text={`${entry.reviewedCount}×`} />
                </List.Item.Detail.Metadata>
              }
            />
          }
          actions={
            <ActionPanel>
              {canUseAI() && entry.sentence && (
                <Action title="Explain in This Sentence" icon={Icon.Stars} onAction={() => explain(entry)} />
              )}
              <Action.Push
                title="Edit Context"
                icon={Icon.Pencil}
                shortcut={Keyboard.Shortcut.Common.Edit}
                target={<EditContext entry={entry} onSave={(changes) => update(entry.id, changes)} />}
              />
              {entry.source.url && <Action.OpenInBrowser title="Open Source Page" url={entry.source.url} />}
              <Action.CopyToClipboard title="Copy Word" content={entry.word} />
              <Action.CopyToClipboard
                title="Copy Sentence"
                content={entry.sentence}
                shortcut={Keyboard.Shortcut.Common.CopyName}
              />
              <Action
                title="Delete"
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                shortcut={Keyboard.Shortcut.Common.Remove}
                onAction={async () => {
                  const confirmed = await confirmAlert({
                    title: `Delete "${entry.word}"?`,
                    primaryAction: { title: "Delete", style: Alert.ActionStyle.Destructive },
                  });
                  if (confirmed) await remove(entry.id);
                }}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
