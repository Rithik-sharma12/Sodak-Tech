import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { oneDark } from "@codemirror/theme-one-dark";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { basicSetup } from "codemirror";
import { useEffect, useRef } from "react";

/**
 * CodeMirror 6, not Monaco.
 *
 * Stack doc §2.3: Monaco is several megabytes of JavaScript for the same job,
 * and time-to-first-keystroke is the moment a learner decides whether the
 * platform feels fast. CodeMirror is also usable on a phone, which Monaco is
 * not — and a fair number of learners are on one.
 */

const LANGUAGE_EXTENSIONS: Record<string, () => Extension> = {
  python: () => python(),
  cpp: () => cpp(),
  c: () => cpp(),
  java: () => java(),
  javascript: () => javascript(),
};

function languageExtension(languageId: string): Extension {
  const factory = LANGUAGE_EXTENSIONS[languageId];
  // No highlighting is better than wrong highlighting, and an unknown language
  // should not stop someone typing.
  return factory ? factory() : [];
}

export function CodeEditor({
  value,
  language,
  onChange,
  onSubmit,
  readOnly = false,
  height = "100%",
}: {
  value: string;
  language: string;
  onChange?: (next: string) => void;
  /** Ctrl/Cmd+Enter, the shortcut every competitive programmer reaches for. */
  onSubmit?: () => void;
  readOnly?: boolean;
  height?: string;
}) {
  const host = useRef<HTMLDivElement | null>(null);
  const view = useRef<EditorView | null>(null);

  // Compartments let language and read-only be reconfigured without tearing
  // down the editor — rebuilding it would lose the cursor, the undo history
  // and the scroll position every time someone switched language.
  const languageSlot = useRef(new Compartment());
  const readOnlySlot = useRef(new Compartment());

  // Held in refs so the extensions built once on mount always call the latest
  // handler, rather than closing over the first render's props.
  const changeHandler = useRef(onChange);
  const submitHandler = useRef(onSubmit);
  changeHandler.current = onChange;
  submitHandler.current = onSubmit;

  useEffect(() => {
    if (!host.current || view.current) return;

    const editor = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          lineNumbers(),
          history(),
          keymap.of([
            {
              key: "Mod-Enter",
              preventDefault: true,
              run: () => {
                submitHandler.current?.();
                return true;
              },
            },
            // Tab indents rather than moving focus. Standard in a code editor,
            // and the reason it is opt-in in CodeMirror is keyboard
            // accessibility — Escape then Tab still leaves the editor.
            indentWithTab,
            ...defaultKeymap,
            ...historyKeymap,
          ]),
          oneDark,
          languageSlot.current.of(languageExtension(language)),
          readOnlySlot.current.of(EditorState.readOnly.of(readOnly)),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              changeHandler.current?.(update.state.doc.toString());
            }
          }),
          EditorView.theme({
            "&": { height, fontSize: "13px" },
            ".cm-scroller": {
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
              lineHeight: "1.6",
            },
            "&.cm-focused": { outline: "none" },
          }),
        ],
      }),
    });

    view.current = editor;
    return () => {
      editor.destroy();
      view.current = null;
    };
    // Mount once. Every prop that can change is handled by an effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    view.current?.dispatch({
      effects: languageSlot.current.reconfigure(languageExtension(language)),
    });
  }, [language]);

  useEffect(() => {
    view.current?.dispatch({
      effects: readOnlySlot.current.reconfigure(EditorState.readOnly.of(readOnly)),
    });
  }, [readOnly]);

  // Only push external changes in — loading a draft, switching problems. An
  // unconditional sync would fight the user's own typing on every keystroke.
  useEffect(() => {
    const editor = view.current;
    if (!editor) return;
    const current = editor.state.doc.toString();
    if (current === value) return;
    editor.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    });
  }, [value]);

  return (
    <div
      ref={host}
      className="h-full overflow-hidden rounded-md border border-border"
      style={{ height }}
      data-testid="code-editor"
    />
  );
}
