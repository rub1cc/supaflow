import { cn } from "@/utils/cn";
import { DialogClose } from "@radix-ui/react-dialog";
import { FontBoldIcon, FontItalicIcon, Link1Icon } from "@radix-ui/react-icons";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { BubbleMenu, EditorContent, Extension, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React, { useCallback, useEffect } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const NoNewLine = Extension.create({
  name: "noNewLine",

  // add configuration options
  addOptions() {
    return {
      enabled: true,
    };
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => (this.options.enabled ? true : false),
    };
  },
});

type EditableProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  multiline?: boolean;
  fallback?: React.ReactNode;
  disabled?: boolean;
  textOnly?: boolean;
  placeholder?: string;
  newLine?: boolean;
};

export function Editable({ newLine = true, ...props }: EditableProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      NoNewLine.configure({
        enabled: !newLine,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Placeholder.configure({
        placeholder: props.placeholder,
        showOnlyWhenEditable: false,
      }),
    ],
    content: props.value,
    onUpdate({ editor }) {
      if (props.textOnly) {
        props.onChange(editor.getText());
        return;
      }
      props.onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(!props.disabled);
    }
  }, [props.disabled, editor]);

  const validateLink = (str: string) => {
    const regex = new RegExp(
      "^((https?|ftp|smtp):\\/\\/)?(www.)?[a-z0-9]+(\\.[a-z0-9]+)+([/?].*)?$",
      "i"
    );

    return regex.test(str);
  };

  const onSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const previousUrl = editor?.getAttributes("link").href;
      const url = formData.get("link") || previousUrl;

      // cancelled
      if (url === null || validateLink(url) === false) {
        alert("Invalid URL");
        return;
      }

      // empty
      if (url === "") {
        editor?.chain().focus().extendMarkRange("link").unsetLink().run();

        return;
      }

      // update link
      editor
        ?.chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    },
    [editor]
  );

  if (!editor) return null;

  return (
    <>
      <EditorContent
        className={cn(
          "editor-content",
          "outline-none border border-transparent w-full rounded-lg",
          !props.disabled && "hover:bg-neutral-100",
          "focus:bg-white focus:border-neutral-200",
          "transition duration-200",
          props.className
        )}
        editor={editor}
      />

      {!props.textOnly && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          className="rounded-xl shadow bg-neutral-900 text-white flex space-x-1 p-1"
        >
          <Button
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={cn(
              "hover:bg-neutral-700 hover:text-white rounded-lg",
              editor?.isActive("bold") ? "bg-neutral-700" : ""
            )}
            variant="ghost"
            size="icon"
          >
            <FontBoldIcon />
          </Button>
          <Button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={cn(
              "hover:bg-neutral-700 hover:text-white rounded-lg",
              editor?.isActive("italic") ? "bg-neutral-700" : ""
            )}
            variant="ghost"
            size="icon"
          >
            <FontItalicIcon />
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                className={cn(
                  "hover:bg-neutral-700 hover:text-white rounded-lg",
                  editor?.isActive("italic") ? "bg-neutral-700" : ""
                )}
                variant="ghost"
                size="icon"
              >
                <Link1Icon />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Link</DialogTitle>
              </DialogHeader>
              <form onSubmit={onSubmit}>
                <div className="grid flex-1 gap-2">
                  <Label htmlFor="link" className="sr-only">
                    Link
                  </Label>
                  <Input
                    id="link"
                    defaultValue={editor?.getAttributes("link").href}
                    name="link"
                  />
                </div>
                <DialogFooter className="flex justify-between mt-4">
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">
                      Cancel
                    </Button>
                  </DialogClose>
                  <div className="flex space-x-2">
                    <DialogClose asChild>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                          editor?.chain().focus().unsetLink().run()
                        }
                      >
                        Remove Link
                      </Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button type="submit">Set Link</Button>
                    </DialogClose>
                  </div>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </BubbleMenu>
      )}
    </>
  );
}
