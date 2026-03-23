"use client"

import { use, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Sparkles } from "lucide-react"
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
}

const ACTION_LABEL: Record<AiAction, string> = {
    summarize: "Summarize",
    rewrite: "Rewrite",
    expand: "Expand",
}

function relativeTime(dateStr: string) {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
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
    onInsertBelow,
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
    onReplace: (text: string) => void
    onInsertBelow: (text: string) => void
    onCopy: (text: string) => void
    onRevert: (text: string) => void
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

    const outputText = displayed?.output != null && typeof (displayed.output as { text?: string }).text === "string"
        ? (displayed.output as { text: string }).text
        : null
    const isStale = isViewingLatest && !!(
        displayed?.inputSnapshot != null &&
        displayed.inputSnapshot !== content &&
        outputText !== content
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
                <div className="flex flex-col gap-3 pt-4 border-t border-border">
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
                        </div>
                    </div>

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
                                <p className="text-xs text-muted-foreground/60 italic leading-relaxed">
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
                            <div className="flex flex-col gap-1.5 pt-3 border-t border-border">
                                <button
                                    onClick={() => onReplace(displayed.output!.text)}
                                    className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors text-left hover:bg-muted/60"
                                >
                                    Replace content
                                </button>
                                <button
                                    onClick={() => onInsertBelow(displayed.output!.text)}
                                    className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors text-left hover:bg-muted/60"
                                >
                                    Insert below
                                </button>
                                <button
                                    onClick={() => onCopy(displayed.output!.text)}
                                    className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors text-left hover:bg-muted/60"
                                >
                                    Copy
                                </button>
                                {displayed.inputSnapshot && content === outputText && (
                                    <button
                                        onClick={() => onRevert(displayed.inputSnapshot!)}
                                        className="text-xs text-muted-foreground/60 hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors text-left hover:bg-muted/60"
                                    >
                                        Revert to original
                                    </button>
                                )}
                            </div>
                        </>
                    )}

                    {/* Previous results */}
                    {olderGenerations.length > 0 && (
                        <div className="flex flex-col gap-1 pt-3 border-t border-border">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium mb-1">
                                Previous
                            </p>
                            {olderGenerations.map((g) => (
                                <button
                                    key={g.id}
                                    onClick={() => onSelectGeneration(g.id)}
                                    className={`text-left rounded-lg px-2.5 py-2 transition-colors border ${
                                        displayed?.id === g.id
                                            ? "border-border bg-muted"
                                            : "border-transparent hover:bg-muted/60"
                                    }`}
                                >
                                    <span className="text-[10px] text-muted-foreground/50 block mb-0.5">
                                        {relativeTime(g.createdAt)}
                                    </span>
                                    <span className="text-xs text-muted-foreground line-clamp-1">
                                        {g.output?.text?.slice(0, 80) ?? "—"}
                                    </span>
                                </button>
                            ))}
                        </div>
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

    function handleSelectAction(action: AiAction) {
        setSelectedAction(action)
        setSelectedGenerationId(null)
    }

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
                onSuccess: () => { setPendingAction(null); setSelectedGenerationId(null) },
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

    function handleRevert(snapshot: string) {
        setContent(snapshot)
        save(title, snapshot)
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
                                onClick={() => setDeleteOpen(true)}
                                className="text-xs text-muted-foreground/50 hover:text-destructive transition-colors"
                            >
                                Delete
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
                        generationsLoading={generationsLoading}
                        generationsError={generationsError}
                        selectedGenerationId={selectedGenerationId}
                        pendingAction={pendingAction}
                        onSelectAction={handleSelectAction}
                        onSelectGeneration={setSelectedGenerationId}
                        onGenerate={handleGenerate}
                        onReplace={handleReplace}
                        onInsertBelow={handleInsertBelow}
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
