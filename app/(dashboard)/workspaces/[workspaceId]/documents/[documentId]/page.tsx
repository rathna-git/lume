"use client"

import { use, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useDocument, useUpdateDocument, useDeleteDocument } from "@/hooks/use-document"
import { useGenerateAi, type AiAction, type AiGenerationResult } from "@/hooks/use-ai"

type SaveStatus = "idle" | "saving" | "saved" | "error"

type Doc = {
    id: string
    title: string
    content: string | null
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
    const { mutate: generateAi, isPending: aiPending } = useGenerateAi()

    const [title, setTitle] = useState(doc.title)
    const [content, setContent] = useState(doc.content ?? "")
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
    const [activeAction, setActiveAction] = useState<AiAction | null>(null)
    const [aiResult, setAiResult] = useState<AiGenerationResult | null>(null)

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

    function handleAiAction(action: AiAction) {
        setActiveAction(action)
        setAiResult(null)
        generateAi(
            { documentId, action, content },
            {
                onSuccess: (result) => {
                    setAiResult(result)
                    setActiveAction(null)
                },
                onError: () => setActiveAction(null),
            }
        )
    }

    function handleReplace(text: string) {
        setContent(text)
        save(title, text)
        setAiResult(null)
    }

    function handleInsertBelow(text: string) {
        const next = content ? `${content}\n\n${text}` : text
        setContent(next)
        save(title, next)
        setAiResult(null)
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
        <div className="max-w-3xl mx-auto px-6 py-10">
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

            {/* AI toolbar */}
            <div className="flex items-center justify-end gap-1.5 mb-5">
                {(["summarize", "rewrite", "expand"] as const).map((action) => (
                    <button
                        key={action}
                        onClick={() => handleAiAction(action)}
                        disabled={aiPending || !content.trim()}
                        className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed capitalize"
                    >
                        {aiPending && activeAction === action
                            ? "Running…"
                            : action.charAt(0).toUpperCase() + action.slice(1)}
                    </button>
                ))}
            </div>

            {/* Content */}
            <textarea
                value={content}
                onChange={handleContentChange}
                placeholder="Start writing…"
                className="w-full min-h-[60vh] text-[0.95rem] leading-relaxed text-foreground placeholder:text-muted-foreground/40 bg-transparent border-none outline-none resize-none font-light"
            />

            {/* AI result */}
            {aiResult?.output?.text && (
                <div className="mt-8 border border-border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                            {aiResult.type.charAt(0) + aiResult.type.slice(1).toLowerCase()}
                        </span>
                        <button
                            onClick={() => setAiResult(null)}
                            className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                        >
                            Dismiss
                        </button>
                    </div>
                    <p className="text-[0.95rem] leading-relaxed text-foreground whitespace-pre-wrap">
                        {aiResult.output.text}
                    </p>
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                        <button
                            onClick={() => handleReplace(aiResult.output!.text)}
                            className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1 transition-colors"
                        >
                            Replace content
                        </button>
                        <button
                            onClick={() => handleInsertBelow(aiResult.output!.text)}
                            className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1 transition-colors"
                        >
                            Insert below
                        </button>
                        <button
                            onClick={() => handleCopy(aiResult.output!.text)}
                            className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1 transition-colors"
                        >
                            Copy
                        </button>
                    </div>
                </div>
            )}
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
            <div className="max-w-3xl mx-auto px-6 py-10 animate-pulse">
                <div className="h-3 bg-muted rounded w-24 mb-10" />
                <div className="h-8 bg-muted rounded w-1/2 mb-6" />
                <div className="space-y-2">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-4 bg-muted rounded" style={{ width: `${85 - i * 5}%` }} />
                    ))}
                </div>
            </div>
        )
    }

    if (isError || !doc) {
        return (
            <div className="max-w-3xl mx-auto px-6 py-10">
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
