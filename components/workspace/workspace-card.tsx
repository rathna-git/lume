import Link from "next/link"
import { type Workspace } from "@/hooks/use-workspaces"

interface WorkspaceCardProps {
    workspace: Workspace
}

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
    return (
        <Link
            href={`/workspaces/${workspace.id}`}
            className="group block bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200"
        >
            <div className="text-2xl mb-4">{workspace.emoji ?? "📝"}</div>
            <h3 className="font-medium text-foreground text-[0.95rem] tracking-tight mb-1 group-hover:text-primary transition-colors">
                {workspace.name}
            </h3>
            {workspace.description && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {workspace.description}
                </p>
            )}
        </Link>
    )
}
