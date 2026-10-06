"use client";
import { EditorContent, useEditor } from "@tiptap/react";
import { richExtensions } from "@/lib/rich-extensions";
import type { RichNode } from "@/lib/types";
import { MediaChooser } from "./media-picker";
import { safeLink } from "@/lib/urls";
export default function RichEditor({
  value,
  onChange,
}: {
  value: RichNode;
  onChange: (v: RichNode) => void;
}) {
  const editor = useEditor({
    extensions: richExtensions(),
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getJSON() as RichNode),
    editorProps: {
      attributes: {
        class: "rich-body",
        role: "textbox",
        "aria-label": "Article content",
        "aria-multiline": "true",
      },
    },
  });
  if (!editor) return <p role="status">Loading editor…</p>;
  const commands: [string, () => void][] = [
    [
      "Bold",
      () => {
        editor.chain().focus().toggleBold().run();
      },
    ],
    [
      "Italic",
      () => {
        editor.chain().focus().toggleItalic().run();
      },
    ],
    [
      "Heading",
      () => {
        editor.chain().focus().toggleHeading({ level: 2 }).run();
      },
    ],
    [
      "Subheading",
      () => {
        editor.chain().focus().toggleHeading({ level: 3 }).run();
      },
    ],
    [
      "Bullets",
      () => {
        editor.chain().focus().toggleBulletList().run();
      },
    ],
    [
      "Numbered list",
      () => {
        editor.chain().focus().toggleOrderedList().run();
      },
    ],
    [
      "Quote",
      () => {
        editor.chain().focus().toggleBlockquote().run();
      },
    ],
    [
      "Link",
      () => {
        const url = prompt(
          "Link URL (https://…, mailto:…, or /page). Leave empty to remove.",
          editor.getAttributes("link").href || "",
        );
        if (url === null) return;
        if (!url) editor.chain().focus().unsetLink().run();
        else if (safeLink(url))
          editor.chain().focus().setLink({ href: url }).run();
        else alert("Enter a valid https://, mailto:, tel:, or local link.");
      },
    ],
    [
      "Table",
      () => {
        editor
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run();
      },
    ],
    [
      "Undo",
      () => {
        editor.chain().focus().undo().run();
      },
    ],
    [
      "Redo",
      () => {
        editor.chain().focus().redo().run();
      },
    ],
  ];
  return (
    <div className="rich-editor">
      <div className="toolbar" role="toolbar" aria-label="Text formatting">
        {commands.map(([label, run]) => (
          <button type="button" key={label} onClick={run}>
            {label}
          </button>
        ))}
        <MediaChooser
          label="Insert image"
          onSelect={(m) => {
            const alt = prompt(
              "Describe this image for screen readers (leave empty if decorative).",
              "",
            );
            if (alt !== null)
              editor.chain().focus().setImage({ src: m.url, alt }).run();
          }}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
