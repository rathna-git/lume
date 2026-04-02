import Link from "next/link"
import { type Document } from "@/hooks/use-documents"

interface DocumentCardProps {
    document: Document
    workspaceId: string
    accentIndex?: number
}

// Each entry: [rest-bg, hover-bg, border-color]
const CARD_ACCENTS = [
    ["bg-amber-50/60",  "hover:bg-amber-50/80",  "hover:border-amber-200/60"],
    ["bg-teal-50/50",   "hover:bg-teal-50/70",   "hover:border-teal-200/60"],
    ["bg-violet-50/50", "hover:bg-violet-50/70",  "hover:border-violet-200/60"],
    ["bg-rose-50/50",   "hover:bg-rose-50/70",    "hover:border-rose-200/60"],
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
    const [restBg, hoverBg, hoverBorder] = CARD_ACCENTS[accentIndex % CARD_ACCENTS.length]

    return (
        <Link
            href={`/workspaces/${workspaceId}/documents/${document.id}`}
            className={`group flex flex-col gap-1.5 ${restBg} ${hoverBg} ${hoverBorder} border border-border/40 rounded-xl px-5 py-5 shadow-[0_1px_4px_rgba(107,79,58,0.06)] hover:shadow-[0_4px_16px_rgba(107,79,58,0.10)] transition-all duration-200`}
        >
            <h3 className="font-medium text-foreground text-[0.95rem] tracking-tight truncate">
                {document.title || "Untitled"}
            </h3>
            {(document.summary || document.content) && (
                <p className="text-[0.8125rem] text-muted-foreground/60 leading-relaxed line-clamp-2">
                    {document.summary || document.content?.replace(/<[^>]*>/g, "").slice(0, 120)}
                </p>
            )}
            <p
                className="text-xs text-muted-foreground/50 mt-auto pt-1"
                title={exactDate(document.updatedAt)}
            >
                {relativeTime(document.updatedAt)}
            </p>
        </Link>
    )
}
