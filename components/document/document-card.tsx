import Link from "next/link"
import { type Document } from "@/hooks/use-documents"

interface DocumentCardProps {
    document: Document
    workspaceId: string
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
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function exactDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit",
    })
}

export function DocumentCard({ document, workspaceId }: DocumentCardProps) {
    return (
        <Link
            href={`/workspaces/${workspaceId}/documents/${document.id}`}
            className="group flex flex-col gap-1.5 bg-card border border-border rounded-xl px-5 py-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200"
        >
            <h3 className="font-medium text-foreground text-[0.95rem] tracking-tight group-hover:text-primary transition-colors truncate">
                {document.title || "Untitled"}
            </h3>
            {document.summary && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {document.summary}
                </p>
            )}
            <p
                className="text-xs text-muted-foreground/60 mt-0.5"
                title={exactDate(document.updatedAt)}
            >
                Last modified · {relativeTime(document.updatedAt)}
            </p>
        </Link>
    )
}
