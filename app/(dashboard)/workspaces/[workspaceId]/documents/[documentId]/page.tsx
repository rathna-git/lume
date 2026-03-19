"use client"

import { use, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Sparkles } from "lucide-react"
import { useDocument, useUpdateDocument, useDeleteDocument } from "@/hooks/use-document"
import { useGenerateAi, useAiGenerations, type AiAction, type AiGeneration } from "@/hooks/use-ai"

type SaveStatus = "idle" | "saving" | "saved" | "error"

type Doc = {
    id: string
    title: string
    content: string | null
}

const ACTION_LABEL: Record<AiAction, string> = {
    summarize: "Summarize",
    rewrite: "Rewrite",
    expand: "Expand",
}

function AiPanel({
    content,
    selectedAction,
    generations,
    pendingAction,
    onSelectAction,
    onGenerate,
    onReplace,
    onInsertBelow,
    onCopy,
}: {
    content: string
    selectedAction: AiAction | null
    generations: AiGeneration[]
    pendingAction: AiAction | null
    onSelectAction: (action: AiAction) => void
    onGenerate: (action: AiAction) => void
    onReplace: (text: string) => void
    onInsertBelow: (text: string) => void
    onCopy: (text: string) => void
}) {
    const persisted = selectedAction
        ? (generations.find(
              (g) => g.type === selectedAction.toUpperCase() && g.status === "SUCCESS"
          ) ?? null)
        : null

    const isStale = !!(
        persisted?.inputSnapshot != null && persisted.inputSnapshot !== content
    )
    const isPending = pendingAction === selectedAction && selectedAction !== null
    const anyPending = pendingAction !== null

    return (
        <div className="flex flex-col gap-5">
            {/* Action tabs */}
            <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium mb-2">
                    Actions
                </p>
                <div className="flex flex-col gap-1.5">
                    {(["summarize", "rewrite", "expand"] as const).map((action) => (
                        <button
                            key={action}
                            onClick={() => onSelectAction(action)}
                            className={`text-xs rounded-lg px-3 py-2 text-left transition-colors border ${
                                selectedAction === action
                                    ? "border-border bg-muted text-foreground font-medium"
                                    : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
                            }`}
                        >
                            {ACTION_LABEL[action]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Result area for selected action */}
            {selectedAction && (
                <div className="flex flex-col gap-3 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">
                            {ACTION_LABEL[selectedAction]}
                        </span>
                        {persisted && (
                            <button
                                onClick={() => onGenerate(selectedAction)}
                                disabled={anyPending || !content.trim()}
                                className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isPending ? "Running…" : "Regenerate"}
                            </button>
                        )}
                    </div>

                    {/* Pending, no existing result */}
                    {isPending && !persisted && (
                        <p className="text-xs text-muted-foreground/50">Running…</p>
                    )}

                    {/* Empty state */}
                    {!persisted && !isPending && (
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

                    {/* Persisted result */}
                    {persisted?.output?.text && (
                        <>
                            {isStale && (
                                <p className="text-xs text-muted-foreground/60 italic leading-relaxed">
                                    This result may be outdated. It was generated from an earlier version of this document.
                                </p>
                            )}
                            <div className="max-h-[40vh] overflow-y-auto">
                                <p className="text-[0.875rem] leading-relaxed text-foreground whitespace-pre-wrap">
                                    {persisted.output.text}
                                </p>
                            </div>
                            <div className="flex flex-col gap-1.5 pt-3 border-t border-border">
                                <button
                                    onClick={() => onReplace(persisted.output!.text)}
                                    className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors text-left hover:bg-muted/60"
                                >
                                    Replace content
                                </button>
                                <button
                                    onClick={() => onInsertBelow(persisted.output!.text)}
                                    className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors text-left hover:bg-muted/60"
                                >
                                    Insert below
                                </button>
                                <button
                                    onClick={() => onCopy(persisted.output!.text)}
                                    className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors text-left hover:bg-muted/60"
                                >
                                    Copy
                                </button>
                            </div>
                        </>
                    )}
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
    const { mutate: deleteDocument, isPending: deletePending } = useDeleteDocument()
    const { mutate: generateAi } = useGenerateAi()
    const { data: generationsData } = useAiGenerations(documentId)

    const generations = generationsData ?? []

    const [title, setTitle] = useState(doc.title)
    const [content, setContent] = useState(doc.content ?? "")
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
    const [selectedAction, setSelectedAction] = useState<AiAction | null>(null)
    const [pendingAction, setPendingAction] = useState<AiAction | null>(null)

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

    function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setTitle(e.target.value)
        save(e.target.value, content)
    }

    function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
        setContent(e.target.value)
        save(title, e.target.value)
    }

    function handleGenerate(action: AiAction) {
        setPendingAction(action)
        generateAi(
            { documentId, action, content },
            {
                onSuccess: () => setPendingAction(null),
                onError: () => setPendingAction(null),
            }
        )
    }

    function handleReplace(text: string) {
        setContent(text)
        save(title, text)
    }

    function handleInsertBelow(text: string) {
        const next = content ? `${content}\n\n${text}` : text
        setContent(next)
        save(title, next)
    }

    function handleCopy(text: string) {
        navigator.clipboard.writeText(text)
    }

    function handleDelete() {
        if (!confirm("Delete this document? This cannot be undone.")) return
        deleteDocument(documentId, {
            onSuccess: () => router.push(`/workspaces/${workspaceId}`),
        })
    }

    return (
        <div className="min-h-full bg-muted p-4 md:p-6">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start max-w-[1400px] mx-auto">

                {/* Editor surface */}
                <div className="flex-1 min-w-0 bg-card rounded-2xl border border-border shadow-sm px-8 py-8">
                    {/* Back + save status */}
                    <div className="flex items-center justify-between mb-10">
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
                                onClick={handleDelete}
                                disabled={deletePending}
                                className="text-xs text-muted-foreground/50 hover:text-destructive transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {deletePending ? "Deleting…" : "Delete"}
                            </button>
                        </div>
                    </div>

                    {/* Title */}
                    <input
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        placeholder="Untitled"
                        className="w-full font-serif text-3xl text-foreground tracking-tight placeholder:text-muted-foreground/40 bg-transparent border-none outline-none resize-none mb-8"
                    />

                    {/* Divider */}
                    <div className="border-t border-border mb-8" />

                    {/* Content */}
                    <textarea
                        value={content}
                        onChange={handleContentChange}
                        placeholder="Start writing…"
                        className="w-full min-h-[60vh] text-[0.95rem] leading-relaxed text-foreground placeholder:text-muted-foreground/40 bg-transparent border-none outline-none resize-none font-light"
                    />
                </div>

                {/* AI panel surface */}
                <div className="w-full lg:w-[380px] lg:shrink-0 bg-background rounded-2xl border border-border shadow-sm p-6 lg:sticky lg:top-6">
                    <div className="flex items-center gap-1.5 mb-5">
                        <Sparkles size={13} className="text-lume-amber" />
                        <p className="text-xs font-medium text-foreground">AI Assistant</p>
                    </div>
                    <AiPanel
                        content={content}
                        selectedAction={selectedAction}
                        generations={generations}
                        pendingAction={pendingAction}
                        onSelectAction={setSelectedAction}
                        onGenerate={handleGenerate}
                        onReplace={handleReplace}
                        onInsertBelow={handleInsertBelow}
                        onCopy={handleCopy}
                    />
                </div>
            </div>
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
            <div className="min-h-full bg-muted p-4 md:p-6">
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
            <div className="min-h-full bg-muted p-4 md:p-6">
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
