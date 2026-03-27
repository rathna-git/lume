"use client"

import { use, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Bold, Italic, Strikethrough, Code, MoreHorizontal, Sparkles, Pilcrow, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code2, Minus, Undo2, Redo2, ChevronDown, ChevronRight, Calendar, BookText, PenLine, ChevronsUpDown } from "lucide-react"
import { marked } from "marked"
import { toast } from "sonner"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { cn } from "@/lib/utils"
import { useDocument, useUpdateDocument, useDeleteDocument } from "@/hooks/use-document"
import { useGenerateAi, useAiGenerations, type AiAction, type AiGeneration } from "@/hooks/use-ai"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import ReactMarkdown from "react-markdown"

type SaveStatus = "idle" | "saving" | "saved" | "error"

type Doc = {
    id: string
    title: string
    content: string | null
    updatedAt: string
}

function formatExactDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit",
    })
}

function relativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60_000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`
    return formatExactDate(dateStr)
}

const ACTION_LABEL: Record<AiAction, string> = {
    summarize: "Summarize",
    rewrite: "Rewrite",
    expand: "Expand",
}

const ACTION_ICON: Record<AiAction, React.ReactNode> = {
    summarize: <BookText size={13} />,
    rewrite: <PenLine size={13} />,
    expand: <ChevronsUpDown size={13} />,
}



/**
 * Floating bubble menu — appears near any text selection.
 * Uses a render prop to pass positioning info (flipLeft) to children
 * so the overflow panel can be placed to the correct side of the pill.
 */
function BubbleMenuReact({
    editor,
    onHide,
    children,
}: {
    editor: Editor
    onHide: () => void
    children: (opts: { flipLeft: boolean }) => React.ReactNode
}) {
    const [rect, setRect] = useState<DOMRect | null>(null)
    const onHideRef = useRef(onHide)
    onHideRef.current = onHide

    useEffect(() => {
        function handleSelectionUpdate() {
            const { from, to } = editor.state.selection
            if (from === to) {
                setRect(null)
                onHideRef.current()
                return
            }
            const sel = window.getSelection()
            if (sel && sel.rangeCount > 0) {
                setRect(sel.getRangeAt(0).getBoundingClientRect())
            } else {
                setRect(null)
            }
        }

        function handleBlur() {
            setRect(null)
            onHideRef.current()
        }

        editor.on("selectionUpdate", handleSelectionUpdate)
        editor.on("blur", handleBlur)

        return () => {
            editor.off("selectionUpdate", handleSelectionUpdate)
            editor.off("blur", handleBlur)
        }
    }, [editor])

    if (!rect) return null

    const left = Math.min(Math.max(rect.left + rect.width / 2, 80), window.innerWidth - 80)
    // Not enough space above → show below selection instead
    const showBelow = rect.top < 56
    // Not enough room to the right for the overflow panel (~128px + 8px gap) → flip it left
    const flipLeft = left > window.innerWidth - 224

    const posStyle: React.CSSProperties = showBelow
        ? { position: "fixed", top: rect.bottom + 8, left, transform: "translateX(-50%)", zIndex: 50 }
        : { position: "fixed", bottom: window.innerHeight - rect.top + 8, left, transform: "translateX(-50%)", zIndex: 50 }

    return createPortal(
        <div style={posStyle} onMouseDown={(e) => e.preventDefault()}>
            {children({ flipLeft })}
        </div>,
        document.body
    )
}

function AiPanel({
    content,
    selectedAction,
    generations,
    generationsLoading,
    generationsError,
    selectedGenerationId,
    pendingAction,
    onSelectAction,
    onSelectGeneration,
    onGenerate,
    onReplace,
    replacedGenerationId,
    onInsertAtCursor,
    onCopy,
    onRevert,
    onRetry,
}: {
    content: string
    selectedAction: AiAction | null
    generations: AiGeneration[]
    generationsLoading: boolean
    generationsError: boolean
    selectedGenerationId: string | null
    pendingAction: AiAction | null
    onSelectAction: (action: AiAction) => void
    onSelectGeneration: (id: string | null) => void
    onGenerate: (action: AiAction) => void
    onReplace: (text: string, id: string) => void
    replacedGenerationId: string | null
    onInsertAtCursor: (text: string) => void
    onCopy: (text: string) => void
    onRevert: () => void
    onRetry: () => void
}) {
    const actionGenerations = selectedAction
        ? generations.filter(
              (g) => g.type === selectedAction.toUpperCase() && g.status === "SUCCESS"
          )
        : []

    const latest = actionGenerations[0] ?? null
    const displayed = selectedGenerationId
        ? (actionGenerations.find((g) => g.id === selectedGenerationId) ?? latest)
        : latest
    const isViewingLatest = displayed?.id === latest?.id
    const olderGenerations = actionGenerations.slice(1)

    const isStale = isViewingLatest &&
        replacedGenerationId !== displayed?.id &&
        !!(displayed?.inputSnapshot != null && displayed.inputSnapshot !== content)
    const isPending = pendingAction === selectedAction && selectedAction !== null
    const anyPending = pendingAction !== null

    const [resultCollapsed, setResultCollapsed] = useState(false)

    return (
        <div className="flex flex-col gap-4">
            {/* Action tabs */}
            <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium mb-2.5">
                    Actions
                </p>
                <div className="flex flex-col gap-1.5">
                    {(["summarize", "rewrite", "expand"] as const).map((action) => (
                        <button
                            key={action}
                            onClick={() => onSelectAction(action)}
                            className={`text-xs rounded-lg px-3 py-2 text-left transition-colors border flex items-center gap-2 ${
                                selectedAction === action
                                    ? "border-border bg-muted text-foreground font-medium"
                                    : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
                            }`}
                        >
                            {ACTION_ICON[action]}
                            {ACTION_LABEL[action]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Generations loading state */}
            {generationsLoading && selectedAction && (
                <div className="flex flex-col gap-2 pt-4 border-t border-border animate-pulse">
                    <div className="h-2.5 bg-muted rounded w-1/3" />
                    <div className="h-2.5 bg-muted rounded w-full mt-1" />
                    <div className="h-2.5 bg-muted rounded w-5/6" />
                    <div className="h-2.5 bg-muted rounded w-4/6" />
                </div>
            )}

            {/* Generations error state */}
            {generationsError && !generationsLoading && (
                <div className="flex flex-col gap-2 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground/60 leading-relaxed">
                        Couldn&apos;t load your previous results.
                    </p>
                    <button
                        onClick={onRetry}
                        className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors text-left hover:bg-muted/60"
                    >
                        Try again
                    </button>
                </div>
            )}

            {/* Result area for selected action */}
            {selectedAction && !generationsLoading && !generationsError && (
                <div className="flex flex-col gap-3 pt-5 border-t border-border">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">
                            {ACTION_LABEL[selectedAction]}
                        </span>
                        <div className="flex items-center gap-3">
                            {!isViewingLatest && (
                                <button
                                    onClick={() => onSelectGeneration(null)}
                                    className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors"
                                >
                                    Back to latest
                                </button>
                            )}
                            {displayed && isViewingLatest && (
                                <button
                                    onClick={() => onGenerate(selectedAction)}
                                    disabled={anyPending || !content.trim()}
                                    className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {isPending ? "Running…" : "Regenerate"}
                                </button>
                            )}
                            {displayed?.output?.text && (
                                <button
                                    onClick={() => setResultCollapsed(c => !c)}
                                    className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                                    title={resultCollapsed ? "Expand result" : "Collapse result"}
                                >
                                    <ChevronDown size={13} className={cn("transition-transform duration-200", !resultCollapsed && "-rotate-180")} />
                                </button>
                            )}
                        </div>
                    </div>

                    {!resultCollapsed && (
                        <>
                        {/* Pending, no existing result */}
                        {isPending && !displayed && (
                            <p className="text-xs text-muted-foreground/50">Running…</p>
                        )}

                        {/* Empty state */}
                        {!displayed && !isPending && (
                            <div className="flex flex-col gap-3">
                                <p className="text-xs text-muted-foreground/50 leading-relaxed">
                                    No {ACTION_LABEL[selectedAction].toLowerCase()} yet.
                                </p>
                                <button
                                    onClick={() => onGenerate(selectedAction)}
                                    disabled={anyPending || !content.trim()}
                                    className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors text-left hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Generate
                                </button>
                            </div>
                        )}

                        {/* Displayed result */}
                        {displayed?.output?.text && (
                            <>
                                {isStale && (
                                    <p className="text-[0.8rem] text-muted-foreground/50 italic leading-relaxed">
                                        This result may be outdated. It was generated from an earlier version of this document.
                                    </p>
                                )}
                                <div className="max-h-[40vh] overflow-y-auto">
                                    <div className="prose-ai text-[0.875rem] leading-relaxed text-foreground">
                                        <ReactMarkdown
                                            components={{
                                                p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                                                h1: ({ children }) => <p className="font-semibold text-base mb-2">{children}</p>,
                                                h2: ({ children }) => <p className="font-semibold text-sm mb-2">{children}</p>,
                                                h3: ({ children }) => <p className="font-medium text-sm mb-1">{children}</p>,
                                                ul: ({ children }) => <ul className="list-disc pl-4 mb-3 space-y-0.5">{children}</ul>,
                                                ol: ({ children }) => <ol className="list-decimal pl-4 mb-3 space-y-0.5">{children}</ol>,
                                                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                                                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                                em: ({ children }) => <em className="italic">{children}</em>,
                                                blockquote: ({ children }) => <blockquote className="border-l-2 border-border pl-3 text-muted-foreground italic mb-3">{children}</blockquote>,
                                                code: ({ children, className }) =>
                                                    className ? (
                                                        <code className="block bg-muted rounded-md px-3 py-2 text-xs font-mono overflow-x-auto mb-3 whitespace-pre">{children}</code>
                                                    ) : (
                                                        <code className="bg-muted rounded px-1 py-0.5 text-xs font-mono">{children}</code>
                                                    ),
                                                pre: ({ children }) => <pre className="mb-3">{children}</pre>,
                                            }}
                                        >
                                            {displayed.output.text}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 pt-4 border-t border-border">
                                    {(() => {
                                        const isAlreadyApplied = displayed.id === replacedGenerationId
                                        return (
                                            <>
                                                <button
                                                    onClick={() => onReplace(displayed.output!.text, displayed.id)}
                                                    disabled={isAlreadyApplied}
                                                    className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors text-left hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                                                >
                                                    Replace content
                                                </button>
                                                <button
                                                    onClick={() => onInsertAtCursor(displayed.output!.text)}
                                                    disabled={isAlreadyApplied}
                                                    className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors text-left hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                                                >
                                                    Insert at cursor
                                                </button>
                                                <button
                                                    onClick={() => onCopy(displayed.output!.text)}
                                                    className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors text-left hover:bg-muted/60"
                                                >
                                                    Copy
                                                </button>
                                                {displayed.inputSnapshot && isAlreadyApplied && (
                                                    <button
                                                        onClick={() => onRevert()}
                                                        className="text-xs text-muted-foreground/60 hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors text-left hover:bg-muted/60"
                                                    >
                                                        Revert to original
                                                    </button>
                                                )}
                                                {isAlreadyApplied && (
                                                    <p className="text-[0.75rem] text-muted-foreground/50 leading-relaxed pt-0.5">
                                                        This result is already applied to the document.
                                                    </p>
                                                )}
                                            </>
                                        )
                                    })()}
                                </div>
                                <p className="text-[0.7rem] text-muted-foreground/60 mt-3 text-right">
                                    Undo with Cmd+Z
                                </p>
                            </>
                        )}

                        {/* Previous results */}
                        {olderGenerations.length > 0 && (
                            <div className="flex flex-col gap-1.5 pt-4 border-t border-border">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium mb-1">
                                Previous
                            </p>
                            <div className="relative">
                                <div className="flex flex-row gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                {olderGenerations.map((g) => (
                                    <button
                                        key={g.id}
                                        onClick={() => onSelectGeneration(g.id)}
                                        className={`text-left rounded-lg px-3 py-2.5 transition-colors border shrink-0 w-[calc(50%-0.25rem)] ${
                                            displayed?.id === g.id
                                                ? "border-border bg-muted"
                                                : "border-border hover:bg-muted/60"
                                        }`}
                                    >
                                        <span className="text-[10px] text-muted-foreground/50 block mb-0.5">
                                            {relativeTime(g.createdAt)}
                                        </span>
                                        <span className="text-xs text-muted-foreground line-clamp-2">
                                            {g.output?.text?.slice(0, 80) ?? "—"}
                                        </span>
                                    </button>
                                ))}
                                </div>
                                {olderGenerations.length > 2 && (
                                    <div className="absolute right-0 top-0 bottom-1 w-8 flex items-center justify-end pointer-events-none">
                                        <div className="absolute inset-y-0 right-0 w-8 bg-linear-to-l from-background to-transparent" />
                                        <ChevronRight size={11} className="relative text-muted-foreground/40" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                        </>
                    )} {/* end !resultCollapsed */}
                </div>
            )}

            {!selectedAction && (
                <p className="text-xs text-muted-foreground/50 leading-relaxed">
                    Select an action to view or generate AI output for this document.
                </p>
            )}
        </div>
    )
}

function DocumentEditor({
    doc,
    documentId,
    workspaceId,
}: {
    doc: Doc
    documentId: string
    workspaceId: string
}) {
    const router = useRouter()
    const { mutate: updateDocument } = useUpdateDocument()
    const { mutate: deleteDocument, isPending: isDeleting } = useDeleteDocument()
    const { mutate: generateAi } = useGenerateAi()
    const { data: generationsData, isLoading: generationsLoading, isError: generationsError, refetch: retryGenerations } = useAiGenerations(documentId)

    const generations = generationsData ?? []

    const [title, setTitle] = useState(doc.title)
    const [content, setContent] = useState(doc.content ?? "")
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
    const [selectedAction, setSelectedAction] = useState<AiAction | null>(null)
    const [selectedGenerationId, setSelectedGenerationId] = useState<string | null>(null)
    const [pendingAction, setPendingAction] = useState<AiAction | null>(null)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)
    const [overflowOpen, setOverflowOpen] = useState(false)
    // Tracks which generation's output is currently shown in the editor (set by handleReplace,
    // cleared by user edits, handleInsertAtCursor, or handleRevert). Used for the revert button.
    const [replacedGenerationId, setReplacedGenerationId] = useState<string | null>(null)

    // Refs for stable access inside useEditor callbacks (avoids stale closure on title/save)
    const titleRef = useRef(title)
    titleRef.current = title
    // Prevents onUpdate from clearing replacedGenerationId on programmatic setContent calls
    const isReplacingRef = useRef(false)
    // HTML snapshot captured right before a Replace Content — used to restore formatting on revert
    const originalHtmlRef = useRef<string | null>(null)

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    function save(nextTitle: string, nextContent: string) {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        setSaveStatus("saving")
        debounceRef.current = setTimeout(() => {
            updateDocument(
                { documentId, title: nextTitle, content: nextContent },
                {
                    onSuccess: () => setSaveStatus("saved"),
                    onError: () => setSaveStatus("error"),
                }
            )
        }, 800)
    }

    const saveRef = useRef(save)
    saveRef.current = save

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [StarterKit],
        content: doc.content ?? "",
        onUpdate: ({ editor }) => {
            const html = editor.getHTML()
            setContent(html)
            saveRef.current(titleRef.current, html)
            // User typed → clear replaced state. Skip when the update came from setContent.
            if (!isReplacingRef.current) {
                setReplacedGenerationId(null)
                originalHtmlRef.current = null
            }
            isReplacingRef.current = false
        },
        editorProps: {
            attributes: {
                class: "outline-none min-h-[60vh] text-[0.95rem] leading-relaxed text-foreground font-light",
            },
        },
    })

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [])

    // Plain text extracted from editor — used for AI calls and staleness comparisons.
    // textBetween with "\n\n" separator matches the format stored in inputSnapshot.
    const textContent = editor
        ? editor.state.doc.textBetween(0, editor.state.doc.content.size, "\n\n")
        : (doc.content ?? "")

    function handleSelectAction(action: AiAction) {
        setSelectedAction(action)
        setSelectedGenerationId(null)
    }

    function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setTitle(e.target.value)
        save(e.target.value, content)
    }

    function handleGenerate(action: AiAction) {
        setPendingAction(action)
        generateAi(
            { documentId, action, content: textContent },
            {
                onSuccess: () => { setPendingAction(null); setSelectedGenerationId(null) },
                onError: () => setPendingAction(null),
            }
        )
    }

    function handleReplace(text: string, generationId: string) {
        originalHtmlRef.current = editor?.getHTML() ?? null
        isReplacingRef.current = true
        setReplacedGenerationId(generationId)
        editor?.commands.setContent(marked.parse(text) as string)
        toast.success("Replaced with AI result")
    }

    function handleInsertAtCursor(text: string) {
        if (!editor) return
        isReplacingRef.current = true
        setReplacedGenerationId(null)
        originalHtmlRef.current = null
        // insertContent uses editor.state.selection, which is preserved even when the editor
        // loses focus (e.g. user clicked the AI panel button) — so the last cursor position is valid
        editor.commands.insertContent(marked.parse(text) as string)
        toast.success("Inserted into document")
    }

    function handleCopy(text: string) {
        navigator.clipboard.writeText(text)
        toast.success("Copied to clipboard")
    }

    function handleRevert() {
        if (!editor || !originalHtmlRef.current) return
        isReplacingRef.current = true
        setReplacedGenerationId(null)
        editor.commands.setContent(originalHtmlRef.current)
        originalHtmlRef.current = null
        toast.success("Restored original content")
    }

    function handleDelete() {
        setDeleteError(null)
        deleteDocument(documentId, {
            onSuccess: () => {
                setDeleteOpen(false)
                router.push(`/workspaces/${workspaceId}`)
            },
            onError: (err) => setDeleteError(err instanceof Error ? err.message : "Something went wrong."),
        })
    }

    const bubbleBtn = (active: boolean) =>
        cn(
            "w-7 h-7 rounded-md flex items-center justify-center transition-colors duration-100",
            active
                ? "bg-foreground/10 text-foreground"
                : "text-foreground/80 hover:text-foreground hover:bg-muted/60"
        )

    const overflowItems = editor
        ? [
              { icon: Pilcrow,      label: "Paragraph",    action: () => editor.chain().focus().setParagraph().run(),               active: editor.isActive("paragraph") && !editor.isActive("bulletList") && !editor.isActive("orderedList") },
              { icon: Heading1,     label: "Heading 1",    action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),   active: editor.isActive("heading", { level: 1 }) },
              { icon: Heading2,     label: "Heading 2",    action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),   active: editor.isActive("heading", { level: 2 }) },
              { icon: Heading3,     label: "Heading 3",    action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),   active: editor.isActive("heading", { level: 3 }) },
              { icon: List,         label: "Bullet list",  action: () => editor.chain().focus().toggleBulletList().run(),            active: editor.isActive("bulletList") },
              { icon: ListOrdered,  label: "Ordered list", action: () => editor.chain().focus().toggleOrderedList().run(),           active: editor.isActive("orderedList") },
              { icon: Quote,        label: "Blockquote",   action: () => editor.chain().focus().toggleBlockquote().run(),            active: editor.isActive("blockquote") },
              { icon: Code2,        label: "Code block",   action: () => editor.chain().focus().toggleCodeBlock().run(),             active: editor.isActive("codeBlock") },
              { icon: Minus,        label: "Divider",      action: () => editor.chain().focus().setHorizontalRule().run(),           active: false },
              null,
              { icon: Undo2,        label: "Undo",         action: () => editor.chain().focus().undo().run(),                       active: false },
              { icon: Redo2,        label: "Redo",         action: () => editor.chain().focus().redo().run(),                       active: false },
          ]
        : []

    return (
        <div className="min-h-full bg-[#FFFEF9] p-4 md:p-6">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start max-w-[1400px] mx-auto">

                {/* Editor surface */}
                <div className="flex-1 min-w-0 bg-card rounded-2xl border border-border shadow-sm px-8 py-10">
                    {/* Back + save status */}
                    <div className="flex items-center justify-between mb-8">
                        <Link
                            href={`/workspaces/${workspaceId}`}
                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft size={12} />
                            Back to workspace
                        </Link>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground/60">
                                {saveStatus === "saving" && "Saving…"}
                                {saveStatus === "saved" && "Saved"}
                                {saveStatus === "error" && "Error saving"}
                            </span>
                            <button
                                onClick={() => setDeleteOpen(true)}
                                className="text-xs text-muted-foreground/50 hover:text-destructive transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>

                    {/* Writing canvas — constrained to a comfortable reading width */}
                    <div className="max-w-[680px] mx-auto">

                    {/* Title */}
                    <input
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        placeholder="Untitled"
                        className="w-full font-serif text-3xl text-foreground tracking-tight placeholder:text-muted-foreground/40 bg-transparent border-none outline-none resize-none mb-2"
                    />

                    {/* Last modified */}
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground/50 mb-5">
                        <Calendar size={11} />
                        Last modified · {formatExactDate(doc.updatedAt)}
                    </p>

                    {/* Divider */}
                    <div className="border-t border-border mb-8" />

                    {/* Tiptap editor */}
                    <div className="tiptap-editor">
                        {editor && (
                            <BubbleMenuReact
                                editor={editor}
                                onHide={() => setOverflowOpen(false)}
                            >
                                {({ flipLeft }) => (
                                    <div style={{ position: "relative" }}>
                                        {/* Primary pill */}
                                        <div className="flex items-center bg-card border border-border/60 shadow-[0_2px_12px_rgba(0,0,0,0.08)] rounded-full px-2 py-1.5 gap-0.5 animate-in fade-in zoom-in-95 duration-150">
                                            <button
                                                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run() }}
                                                className={bubbleBtn(editor.isActive("bold"))}
                                                title="Bold"
                                            >
                                                <Bold size={12} />
                                            </button>
                                            <button
                                                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }}
                                                className={bubbleBtn(editor.isActive("italic"))}
                                                title="Italic"
                                            >
                                                <Italic size={12} />
                                            </button>
                                            <button
                                                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleStrike().run() }}
                                                className={bubbleBtn(editor.isActive("strike"))}
                                                title="Strikethrough"
                                            >
                                                <Strikethrough size={12} />
                                            </button>
                                            <button
                                                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleCode().run() }}
                                                className={bubbleBtn(editor.isActive("code"))}
                                                title="Inline code"
                                            >
                                                <Code size={12} />
                                            </button>
                                            <div className="w-px h-3 bg-border/50 mx-0.5" />
                                            <button
                                                onMouseDown={(e) => { e.preventDefault(); setOverflowOpen((v) => !v) }}
                                                className={bubbleBtn(overflowOpen)}
                                                title="More formatting"
                                            >
                                                <MoreHorizontal size={12} />
                                            </button>
                                        </div>

                                        {/* Overflow panel — floats to the side of the pill */}
                                        {overflowOpen && (
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    ...(flipLeft
                                                        ? { right: "calc(100% + 8px)" }
                                                        : { left: "calc(100% + 8px)" }),
                                                    top: "50%",
                                                    transform: "translateY(-50%)",
                                                }}
                                                className="bg-card border border-border/60 shadow-[0_2px_12px_rgba(0,0,0,0.08)] rounded-xl overflow-hidden py-1.5 min-w-[148px] animate-in fade-in zoom-in-95 duration-150"
                                            >
                                                {overflowItems.map((item, i) =>
                                                    item === null ? (
                                                        <div key={i} className="h-px bg-border my-1 mx-2" />
                                                    ) : (
                                                        <button
                                                            key={item.label}
                                                            onMouseDown={(e) => {
                                                                e.preventDefault()
                                                                item.action()
                                                                setOverflowOpen(false)
                                                            }}
                                                            className={cn(
                                                                "w-full text-left text-xs px-3 py-1.5 transition-colors flex items-center gap-2",
                                                                item.active
                                                                    ? "text-foreground font-medium bg-muted"
                                                                    : "text-foreground/70 hover:text-foreground hover:bg-muted"
                                                            )}
                                                        >
                                                            <item.icon size={12} className="shrink-0" />
                                                            {item.label}
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </BubbleMenuReact>
                        )}
                        <EditorContent editor={editor} />
                    </div>

                    </div> {/* end writing canvas */}
                </div>

                {/* AI panel surface */}
                <div className="w-full lg:w-[380px] lg:shrink-0 bg-[#FFFCEE] rounded-2xl border border-border shadow-sm p-6 lg:sticky lg:top-6">
                    <div className="flex items-center gap-1.5 mb-5">
                        <Sparkles size={13} className="text-lume-amber" />
                        <p className="text-xs font-medium text-foreground">AI Assistant</p>
                    </div>
                    <AiPanel
                        content={textContent}
                        selectedAction={selectedAction}
                        generations={generations}
                        generationsLoading={generationsLoading}
                        generationsError={generationsError}
                        selectedGenerationId={selectedGenerationId}
                        pendingAction={pendingAction}
                        onSelectAction={handleSelectAction}
                        onSelectGeneration={setSelectedGenerationId}
                        onGenerate={handleGenerate}
                        onReplace={handleReplace}
                        replacedGenerationId={replacedGenerationId}
                        onInsertAtCursor={handleInsertAtCursor}
                        onCopy={handleCopy}
                        onRevert={handleRevert}
                        onRetry={retryGenerations}
                    />
                </div>
            </div>

            {/* Delete document dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle>Delete document?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        This will permanently delete this document. This action cannot be undone.
                    </p>
                    {deleteError && (
                        <p className="text-sm text-destructive">{deleteError}</p>
                    )}
                    <DialogFooter showCloseButton>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting…" : "Delete document"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default function DocumentEditorPage({
    params,
}: {
    params: Promise<{ workspaceId: string; documentId: string }>
}) {
    const { workspaceId, documentId } = use(params)
    const { data: doc, isLoading, isError } = useDocument(documentId)

    if (isLoading) {
        return (
            <div className="min-h-full bg-[#FFFEF9] p-4 md:p-6">
                <div className="max-w-3xl mx-auto bg-card rounded-2xl border border-border shadow-sm px-8 py-8 animate-pulse">
                    <div className="h-3 bg-muted rounded w-24 mb-10" />
                    <div className="h-8 bg-muted rounded w-1/2 mb-6" />
                    <div className="space-y-2">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-4 bg-muted rounded" style={{ width: `${85 - i * 5}%` }} />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (isError || !doc) {
        return (
            <div className="min-h-full bg-[#FFFEF9] p-4 md:p-6">
                <div className="max-w-3xl mx-auto bg-card rounded-2xl border border-border shadow-sm px-8 py-8">
                    <Link
                        href={`/workspaces/${workspaceId}`}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-8"
                    >
                        <ArrowLeft size={12} />
                        Back to workspace
                    </Link>
                    <p className="text-sm text-muted-foreground py-16 text-center">
                        Document not found.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <DocumentEditor
            key={documentId}
            doc={doc}
            documentId={documentId}
            workspaceId={workspaceId}
        />
    )
}
