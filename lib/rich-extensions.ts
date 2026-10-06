import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
export function richExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      link: { openOnClick: false },
    }),
    Image,
    TableKit,
  ];
}
