"use client"

import { use, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useDocument, useUpdateDocument } from "@/hooks/use-document"

type SaveStatus = "idle" | "saving" | "saved" | "error"

export default function DocumentEditorPage({
    params,
}: {
    params: Promise<{ workspaceId: string; documentId: string }>
}) {
    const { workspaceId, documentId } = use(params)

    const { data: document, isLoading, isError } = useDocument(documentId)
    const { mutate: updateDocument } = useUpdateDocument()

    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
    const [initialized, setInitialized] = useState(false)

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Seed local state once document loads
    useEffect(() => {
        if (document && !initialized) {
            setTitle(document.title)
            setContent(document.content ?? "")
            setInitialized(true)
        }
    }, [document, initialized])

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

    // Loading
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

    // Error / not found
    if (isError || !document) {
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
                <span className="text-xs text-muted-foreground/60">
                    {saveStatus === "saving" && "Saving…"}
                    {saveStatus === "saved" && "Saved"}
                    {saveStatus === "error" && "Error saving"}
                </span>
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
    )
}
