"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { FileText, Plus } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useRecentDocuments, useCreateDocument } from "@/hooks/use-documents"
import { useWorkspaces, useCreateWorkspace } from "@/hooks/use-workspaces"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function getGreeting(): string {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
}

function relativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString()
}

function CreateWorkspaceDialog({
    open,
    onOpenChange,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const [name, setName] = useState("")
    const [emoji, setEmoji] = useState("")
    const { mutate: createWorkspace, isPending } = useCreateWorkspace()

    function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!name.trim()) return
        createWorkspace(
            { name: name.trim(), emoji: emoji.trim() || undefined },
            {
                onSuccess: () => {
                    onOpenChange(false)
                    setName("")
                    setEmoji("")
                },
            }
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New workspace</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-3 mt-1">
                    <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                            Name
                        </label>
                        <Input
                            placeholder="e.g. Research, Writing, Work"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                            Emoji <span className="normal-case font-normal">(optional)</span>
                        </label>
                        <Input
                            placeholder="📝"
                            value={emoji}
                            onChange={(e) => setEmoji(e.target.value)}
                        />
                    </div>
                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending || !name.trim()}>
                            {isPending ? "Creating…" : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default function HomePage() {
    const router = useRouter()
    const { user } = useUser()
    const { data: recentDocs, isLoading: loadingRecent } = useRecentDocuments()
    const { data: workspaces, isLoading: loadingWorkspaces } = useWorkspaces()
    const { mutate: createDocument, isPending: isCreatingDoc } = useCreateDocument()
    const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false)

    const firstName = user?.firstName || null
    const mostRecentWorkspaceId = recentDocs?.[0]?.workspace.id ?? null

    function handleNewPage() {
        if (!mostRecentWorkspaceId) return
        createDocument(
            { workspaceId: mostRecentWorkspaceId },
            {
                onSuccess: (doc) => {
                    router.push(`/workspaces/${mostRecentWorkspaceId}/documents/${doc.id}`)
                },
            }
        )
    }

    return (
        <div className="max-w-3xl mx-auto px-6 py-10">
            {/* Greeting */}
            <div className="mb-10">
                <h1 className="font-serif text-3xl text-foreground tracking-tight">
                    {getGreeting()}{firstName ? `, ${firstName}` : ""}
                </h1>
            </div>

            {/* Recent pages */}
            <section className="mb-10">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-muted-foreground/50 mb-3">
                    Recent pages
                </p>
                {loadingRecent && (
                    <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-11 rounded-lg bg-neutral-100 dark:bg-muted/40 animate-pulse" />
                        ))}
                    </div>
                )}
                {!loadingRecent && (!recentDocs || recentDocs.length === 0) && (
                    <p className="text-sm text-neutral-400 dark:text-muted-foreground font-light">
                        No pages yet. Create your first page inside a workspace.
                    </p>
                )}
                {!loadingRecent && recentDocs && recentDocs.length > 0 && (
                    <div className="space-y-0.5">
                        {recentDocs.map(doc => (
                            <Link
                                key={doc.id}
                                href={`/workspaces/${doc.workspace.id}/documents/${doc.id}`}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-muted/40 transition-colors"
                            >
                                <FileText size={14} className="text-neutral-300 dark:text-muted-foreground/40 shrink-0" />
                                <span className="flex-1 text-sm text-neutral-700 dark:text-foreground truncate">
                                    {doc.title || "Untitled"}
                                </span>
                                <span className="text-xs text-neutral-400 dark:text-muted-foreground/60 shrink-0">
                                    {doc.workspace.emoji ?? "📝"}&nbsp;{doc.workspace.name}
                                </span>
                                <span className="text-xs text-neutral-300 dark:text-muted-foreground/40 shrink-0 ml-2">
                                    {relativeTime(doc.updatedAt)}
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* Workspaces */}
            <section className="mb-10">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-muted-foreground/50 mb-3">
                    Workspaces
                </p>
                {loadingWorkspaces && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[1, 2].map(i => (
                            <div key={i} className="h-14 rounded-xl bg-neutral-100 dark:bg-muted/40 animate-pulse" />
                        ))}
                    </div>
                )}
                {!loadingWorkspaces && (!workspaces || workspaces.length === 0) && (
                    <p className="text-sm text-neutral-400 dark:text-muted-foreground font-light">
                        No workspaces yet.
                    </p>
                )}
                {!loadingWorkspaces && workspaces && workspaces.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {workspaces.map(ws => (
                            <Link
                                key={ws.id}
                                href={`/workspaces/${ws.id}`}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-neutral-200 dark:border-border bg-white dark:bg-card hover:bg-neutral-50 dark:hover:bg-muted/40 transition-colors"
                            >
                                <span className="text-xl leading-none shrink-0">{ws.emoji ?? "📝"}</span>
                                <span className="text-sm font-medium text-neutral-700 dark:text-foreground truncate">
                                    {ws.name}
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* Quick actions */}
            <section>
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-muted-foreground/50 mb-3">
                    Quick actions
                </p>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setWorkspaceDialogOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 dark:border-border text-sm text-neutral-600 dark:text-muted-foreground hover:text-neutral-900 dark:hover:text-foreground hover:bg-neutral-50 dark:hover:bg-muted/40 transition-colors"
                    >
                        <Plus size={14} />
                        New workspace
                    </button>
                    {mostRecentWorkspaceId && (
                        <button
                            onClick={handleNewPage}
                            disabled={isCreatingDoc}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 dark:border-border text-sm text-neutral-600 dark:text-muted-foreground hover:text-neutral-900 dark:hover:text-foreground hover:bg-neutral-50 dark:hover:bg-muted/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus size={14} />
                            {isCreatingDoc ? "Creating…" : "New page"}
                        </button>
                    )}
                </div>
            </section>

            <CreateWorkspaceDialog open={workspaceDialogOpen} onOpenChange={setWorkspaceDialogOpen} />
        </div>
    )
}
