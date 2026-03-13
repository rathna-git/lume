import Link from "next/link"
import { type Document } from "@/hooks/use-documents"

interface DocumentCardProps {
    document: Document
    workspaceId: string
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
            <p className="text-xs text-muted-foreground/60 mt-0.5">
                {new Date(document.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                })}
            </p>
        </Link>
    )
}
