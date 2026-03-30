"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import { Extension } from "@tiptap/core"
import { Suggestion } from "@tiptap/suggestion"
import type { Editor as CoreEditor, Range } from "@tiptap/core"
import type { Editor } from "@tiptap/react"
import {
    Pilcrow,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Code2,
    Minus,
} from "lucide-react"

/* ── Command definitions ── */

export interface SlashCommand {
    label: string
    description: string
    icon: React.ComponentType<{ size?: number; className?: string }>
    action: (editor: CoreEditor, range: Range) => void
}

export const SLASH_COMMANDS: SlashCommand[] = [
    {
        label: "Text",
        description: "Plain paragraph",
        icon: Pilcrow,
        action: (editor, range) =>
            editor.chain().focus().deleteRange(range).setParagraph().run(),
    },
    {
        label: "Heading 1",
        description: "Large heading",
        icon: Heading1,
        action: (editor, range) =>
            editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run(),
    },
    {
        label: "Heading 2",
        description: "Medium heading",
        icon: Heading2,
        action: (editor, range) =>
            editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run(),
    },
    {
        label: "Heading 3",
        description: "Small heading",
        icon: Heading3,
        action: (editor, range) =>
            editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run(),
    },
    {
        label: "Bullet List",
        description: "Unordered list",
        icon: List,
        action: (editor, range) =>
            editor.chain().focus().deleteRange(range).toggleBulletList().run(),
    },
    {
        label: "Numbered List",
        description: "Ordered list",
        icon: ListOrdered,
        action: (editor, range) =>
            editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
    },
    {
        label: "Quote",
        description: "Block quote",
        icon: Quote,
        action: (editor, range) =>
            editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
    },
    {
        label: "Code Block",
        description: "Code snippet",
        icon: Code2,
        action: (editor, range) =>
            editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
    },
    {
        label: "Divider",
        description: "Horizontal rule",
        icon: Minus,
        action: (editor, range) =>
            editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
    },
]

/* ── Tiptap Extension (no React — pure ProseMirror plugin) ── */

// Event bus so the extension can talk to the React component
type SlashEventCallback = (data: {
    type: "open" | "update" | "close"
    items?: SlashCommand[]
    command?: (item: SlashCommand) => void
    clientRect?: (() => DOMRect | null) | null
}) => void

let slashEventListener: SlashEventCallback | null = null

export function onSlashEvent(cb: SlashEventCallback) {
    slashEventListener = cb
    return () => { slashEventListener = null }
}

const SlashCommandExtension = Extension.create({
    name: "slashCommand",

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                char: "/",
                startOfLine: false,
                items: ({ query }) =>
                    SLASH_COMMANDS.filter((cmd) =>
                        cmd.label.toLowerCase().includes(query.toLowerCase()),
                    ),
                command: ({ editor, range, props }) => {
                    (props as SlashCommand).action(editor, range)
                },
                render: () => {
                    return {
                        onStart: (props) => {
                            slashEventListener?.({
                                type: "open",
                                items: props.items as SlashCommand[],
                                command: props.command as (item: SlashCommand) => void,
                                clientRect: props.clientRect,
                            })
                        },
                        onUpdate: (props) => {
                            slashEventListener?.({
                                type: "update",
                                items: props.items as SlashCommand[],
                                command: props.command as (item: SlashCommand) => void,
                                clientRect: props.clientRect,
                            })
                        },
                        onKeyDown: ({ event }) => {
                            if (event.key === "Escape") {
                                slashEventListener?.({ type: "close" })
                                return true
                            }
                            if (["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) {
                                return true
                            }
                            return false
                        },
                        onExit: () => {
                            slashEventListener?.({ type: "close" })
                        },
                    }
                },
            }),
        ]
    },
})

export default SlashCommandExtension

/* ── React component — mount this inside the editor page ── */

export function SlashCommandMenu({ editor }: { editor: Editor | null }) {
    const [open, setOpen] = useState(false)
    const [items, setItems] = useState<SlashCommand[]>([])
    const [selected, setSelected] = useState(0)
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
    const [commandFn, setCommandFn] = useState<{ fn: (item: SlashCommand) => void } | null>(null)
    const menuRef = useRef<HTMLDivElement>(null)

    // Subscribe to extension events
    useEffect(() => {
        return onSlashEvent((data) => {
            if (data.type === "open" || data.type === "update") {
                setItems(data.items ?? [])
                if (data.command) setCommandFn({ fn: data.command })
                const rect = data.clientRect?.()
                if (rect) setPos({ top: rect.bottom + 8, left: rect.left })
                setOpen(true)
                if (data.type === "open") setSelected(0)
            } else {
                setOpen(false)
            }
        })
    }, [])

    // Keyboard navigation
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!open) return
            if (e.key === "ArrowDown") {
                e.preventDefault()
                setSelected((s) => (s + 1) % items.length)
            } else if (e.key === "ArrowUp") {
                e.preventDefault()
                setSelected((s) => (s - 1 + items.length) % items.length)
            } else if (e.key === "Enter") {
                e.preventDefault()
                if (items[selected]) commandFn?.fn(items[selected])
                setOpen(false)
            }
        },
        [open, items, selected, commandFn],
    )

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown, true)
        return () => document.removeEventListener("keydown", handleKeyDown, true)
    }, [handleKeyDown])

    // Scroll selected item into view
    useEffect(() => {
        const el = menuRef.current?.children[selected] as HTMLElement | undefined
        el?.scrollIntoView({ block: "nearest" })
    }, [selected])

    if (!open || !editor || items.length === 0 || !pos) return null

    return createPortal(
        <div
            ref={menuRef}
            className="fixed z-50 w-56 max-h-72 overflow-y-auto rounded-xl border border-border bg-card shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100"
            style={{ top: pos.top, left: pos.left }}
        >
            {items.map((item, i) => {
                const Icon = item.icon
                return (
                    <button
                        key={item.label}
                        onMouseDown={(e) => {
                            e.preventDefault()
                            commandFn?.fn(item)
                            setOpen(false)
                        }}
                        onMouseEnter={() => setSelected(i)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                            i === selected
                                ? "bg-muted/70 text-foreground"
                                : "text-muted-foreground hover:bg-muted/40"
                        }`}
                    >
                        <div className="shrink-0 w-8 h-8 rounded-lg border border-border bg-background flex items-center justify-center">
                            <Icon size={15} />
                        </div>
                        <div>
                            <div className="font-medium text-foreground text-[13px]">{item.label}</div>
                            <div className="text-[11px] text-muted-foreground/70">{item.description}</div>
                        </div>
                    </button>
                )
            })}
        </div>,
        document.body,
    )
}
