import Link from "next/link"
import { type Document } from "@/hooks/use-documents"

interface DocumentCardProps {
    document: Document
    workspaceId: string
    accentIndex?: number
}

// Accent bar colors — soft, muted tones like Notion covers
const CARD_ACCENTS = [
    "bg-rose-300/40",
    "bg-amber-300/40",
    "bg-teal-300/40",
    "bg-violet-300/40",
    "bg-blue-300/40",
    "bg-emerald-300/40",
] as const

function relativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60_000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function exactDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit",
    })
}

export function DocumentCard({ document, workspaceId, accentIndex = 0 }: DocumentCardProps) {
    const accent = CARD_ACCENTS[accentIndex % CARD_ACCENTS.length]

    return (
        <Link
            href={`/workspaces/${workspaceId}/documents/${document.id}`}
            className="group flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
        >
            {/* Accent bar */}
            <div className={`h-10 ${accent}`} />

            <div className="flex flex-col gap-1.5 px-5 py-4">
                <h3 className="font-medium text-card-foreground text-[0.95rem] tracking-tight truncate">
                    {document.title || "Untitled document"}
                </h3>
                {(document.summary || document.content) ? (
                    <p className="text-[0.8125rem] text-muted-foreground leading-relaxed line-clamp-2">
                        {document.summary || document.content?.replace(/<[^>]*>/g, "").slice(0, 120)}
                    </p>
                ) : (
                    <p className="text-[0.8125rem] text-muted-foreground/60 leading-relaxed italic">
                        Start writing…
                    </p>
                )}
                <p
                    className="text-xs text-muted-foreground/70 mt-auto pt-2"
                    title={exactDate(document.updatedAt)}
                >
                    {relativeTime(document.updatedAt)}
                </p>
            </div>
        </Link>
    )
}
