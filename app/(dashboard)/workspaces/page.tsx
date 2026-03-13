"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { useCreateWorkspace, useWorkspaces } from "@/hooks/use-workspaces"
import { WorkspaceCard } from "@/components/workspace/workspace-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"

function CreateWorkspaceDialog() {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [emoji, setEmoji] = useState("")
    const { mutate: createWorkspace, isPending } = useCreateWorkspace()

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!name.trim()) return
        createWorkspace(
            { name: name.trim(), description: description.trim() || undefined, emoji: emoji.trim() || undefined },
            {
                onSuccess: () => {
                    setOpen(false)
                    setName("")
                    setDescription("")
                    setEmoji("")
                },
            }
        )
    }

    return (
        <>
            <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
                <Plus size={14} />
                New Workspace
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
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
                            Description <span className="normal-case font-normal">(optional)</span>
                        </label>
                        <Input
                            placeholder="What's this workspace for?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
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
                            className="w-24"
                        />
                    </div>
                    <DialogFooter className="mt-2">
                        <Button type="submit" disabled={isPending || !name.trim()}>
                            {isPending ? "Creating…" : "Create workspace"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
        </>
    )
}

function WorkspaceSkeleton() {
    return (
        <div className="bg-card border border-border rounded-xl p-6 animate-pulse">
            <div className="w-8 h-8 bg-muted rounded mb-4" />
            <div className="h-4 bg-muted rounded w-2/3 mb-2" />
            <div className="h-3 bg-muted rounded w-full" />
        </div>
    )
}

export default function WorkspacesPage() {
    const { data: workspaces, isLoading, isError } = useWorkspaces()

    return (
        <div className="max-w-5xl mx-auto px-6 py-10">
            {/* Page header */}
            <div className="flex items-start justify-between mb-10">
                <div>
                    <p className="text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground/60 mb-2">
                        Lume
                    </p>
                    <h1 className="font-serif text-3xl text-foreground tracking-tight mb-1.5">
                        Workspaces
                    </h1>
                    <p className="text-sm text-muted-foreground font-light">
                        Organize your thinking into focused spaces.
                    </p>
                </div>
                <CreateWorkspaceDialog />
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => <WorkspaceSkeleton key={i} />)}
                </div>
            )}

            {/* Error */}
            {isError && (
                <div className="text-sm text-muted-foreground py-16 text-center">
                    Something went wrong. Please refresh the page.
                </div>
            )}

            {/* Empty */}
            {!isLoading && !isError && workspaces?.length === 0 && (
                <div className="text-center py-24">
                    <p className="text-3xl mb-4">📝</p>
                    <p className="font-serif text-lg text-foreground mb-1">No workspaces yet</p>
                    <p className="text-sm text-muted-foreground mb-6">
                        Create your first workspace to start organizing your work.
                    </p>
                </div>
            )}

            {/* Grid */}
            {!isLoading && !isError && workspaces && workspaces.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {workspaces.map((workspace) => (
                        <WorkspaceCard key={workspace.id} workspace={workspace} />
                    ))}
                </div>
            )}
        </div>
    )
}
