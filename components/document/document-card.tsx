import Link from "next/link"
import { type Document } from "@/hooks/use-documents"

interface DocumentCardProps {
    document: Document
    workspaceId: string
    accentIndex?: number
}

// Each entry: [left-border class, hover-bg class, hover-shadow rgba]
const CARD_ACCENTS = [
    ["border-l-amber-400/70",  "hover:bg-amber-50/50",  "rgba(245,166,35,0.10)"],
    ["border-l-teal-500/50",   "hover:bg-teal-50/50",   "rgba(45,162,140,0.08)"],
    ["border-l-violet-400/50", "hover:bg-violet-50/50", "rgba(139,92,246,0.08)"],
    ["border-l-rose-400/50",   "hover:bg-rose-50/50",   "rgba(244,114,114,0.08)"],
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
    const [borderClass, hoverBgClass, hoverShadowColor] = CARD_ACCENTS[accentIndex % CARD_ACCENTS.length]

    return (
        <Link
            href={`/workspaces/${workspaceId}/documents/${document.id}`}
            className={`group flex flex-col gap-1.5 bg-card border border-border/60 border-l-2 ${borderClass} ${hoverBgClass} rounded-xl px-5 py-4 shadow-[0_2px_8px_rgba(107,79,58,0.10),0_1px_3px_rgba(107,79,58,0.06)] transition-all duration-200`}
            style={{
                ["--hover-shadow" as string]: `0 6px 20px ${hoverShadowColor}, 0 2px 6px rgba(107,79,58,0.05)`,
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 6px 20px ${hoverShadowColor}, 0 2px 6px rgba(107,79,58,0.05)`)}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(107,79,58,0.10),0 1px 3px rgba(107,79,58,0.06)")}
        >
            <h3 className="font-medium text-foreground text-[0.95rem] tracking-tight truncate">
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
