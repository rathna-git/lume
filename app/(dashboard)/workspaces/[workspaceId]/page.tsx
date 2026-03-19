"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, ArrowLeft, Pencil, Trash2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useDocuments, useCreateDocument, type Document } from "@/hooks/use-documents"
import { useUpdateWorkspace, useDeleteWorkspace } from "@/hooks/use-workspaces"
import { DocumentCard } from "@/components/document/document-card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import Link from "next/link"

interface Workspace {
    id: string
    name: string
    description: string | null
    emoji: string | null
}

function useWorkspace(workspaceId: string) {
    return useQuery<Workspace>({
        queryKey: ["workspace", workspaceId],
        queryFn: async () => {
            const res = await fetch(`/api/workspaces/${workspaceId}`)
            if (!res.ok) throw new Error("Failed to fetch workspace")
            const data = await res.json()
            return data.workspace
        },
        enabled: !!workspaceId,
    })
}

function DocumentSkeleton() {
    return (
        <div className="bg-card border border-border rounded-xl px-5 py-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2 mb-2" />
            <div className="h-3 bg-muted rounded w-full mb-1" />
            <div className="h-3 bg-muted rounded w-3/4" />
        </div>
    )
}

export default function WorkspaceDetailPage({
    params,
}: {
    params: Promise<{ workspaceId: string }>
}) {
    const { workspaceId } = use(params)
    const router = useRouter()

    const { data: workspace, isLoading: workspaceLoading, isError: workspaceError } = useWorkspace(workspaceId)
    const { data: documents, isLoading: docsLoading, isError: docsError } = useDocuments(workspaceId)
    const { mutate: createDocument, isPending: isCreating } = useCreateDocument()
    const { mutate: updateWorkspace, isPending: isSaving } = useUpdateWorkspace()
    const { mutate: deleteWorkspace, isPending: isDeleting } = useDeleteWorkspace()

    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)
    const [editName, setEditName] = useState("")
    const [editDescription, setEditDescription] = useState("")
    const [editEmoji, setEditEmoji] = useState("")

    function handleOpenEdit() {
        if (!workspace) return
        setEditName(workspace.name)
        setEditDescription(workspace.description ?? "")
        setEditEmoji(workspace.emoji ?? "")
        setEditOpen(true)
    }

    function handleSaveEdit(e: { preventDefault(): void }) {
        e.preventDefault()
        if (!editName.trim()) return
        updateWorkspace(
            { workspaceId, name: editName.trim(), description: editDescription.trim(), emoji: editEmoji },
            { onSuccess: () => setEditOpen(false) }
        )
    }

    function handleDelete() {
        setDeleteError(null)
        deleteWorkspace(workspaceId, {
            onSuccess: () => router.push("/workspaces"),
            onError: (err) => setDeleteError(err instanceof Error ? err.message : "Something went wrong."),
        })
    }

    function handleNewDocument() {
        createDocument(
            { workspaceId },
            {
                onSuccess: (doc: Document) => {
                    router.push(`/workspaces/${workspaceId}/documents/${doc.id}`)
                },
            }
        )
    }

    const isLoading = workspaceLoading || docsLoading
    const isError = workspaceError || docsError

    return (
        <div className="max-w-5xl mx-auto px-6 py-10">
            {/* Back link */}
            <Link
                href="/workspaces"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
                <ArrowLeft size={12} />
                Workspaces
            </Link>

            {/* Header */}
            <div className="flex items-start justify-between mb-10">
                <div>
                    {workspaceLoading ? (
                        <div className="animate-pulse">
                            <div className="h-3 bg-muted rounded w-16 mb-2" />
                            <div className="h-8 bg-muted rounded w-48 mb-2" />
                            <div className="h-3 bg-muted rounded w-64" />
                        </div>
                    ) : workspace ? (
                        <>
                            <div className="flex items-center gap-3 mb-1.5">
                                <span className="text-3xl leading-none">{workspace.emoji ?? "📝"}</span>
                                <h1 className="font-serif text-3xl text-foreground tracking-tight leading-none">
                                    {workspace.name}
                                </h1>
                                <button
                                    onClick={handleOpenEdit}
                                    className="text-muted-foreground/40 hover:text-muted-foreground transition-colors mt-1"
                                    aria-label="Edit workspace"
                                >
                                    <Pencil size={14} />
                                </button>
                                <button
                                    onClick={() => setDeleteOpen(true)}
                                    className="text-muted-foreground/40 hover:text-destructive transition-colors mt-1"
                                    aria-label="Delete workspace"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            {workspace.description && (
                                <p className="text-sm text-muted-foreground font-light">
                                    {workspace.description}
                                </p>
                            )}
                        </>
                    ) : null}
                </div>
                <Button
                    size="sm"
                    className="gap-2"
                    onClick={handleNewDocument}
                    disabled={isCreating}
                >
                    <Plus size={14} />
                    {isCreating ? "Creating…" : "New Document"}
                </Button>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => <DocumentSkeleton key={i} />)}
                </div>
            )}

            {/* Error */}
            {isError && !isLoading && (
                <div className="text-sm text-muted-foreground py-16 text-center">
                    Something went wrong. Please refresh the page.
                </div>
            )}

            {/* Empty */}
            {!isLoading && !isError && documents?.length === 0 && (
                <div className="text-center py-24">
                    <p className="text-3xl mb-4">📄</p>
                    <p className="font-serif text-lg text-foreground mb-1">No documents yet</p>
                    <p className="text-sm text-muted-foreground mb-6">
                        Create your first document to start writing.
                    </p>
                </div>
            )}

            {/* Grid */}
            {!isLoading && !isError && documents && documents.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                        <DocumentCard key={doc.id} document={doc} workspaceId={workspaceId} />
                    ))}
                </div>
            )}

            {/* Delete workspace dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle>Delete workspace?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        This will permanently delete this workspace and all documents inside it. This action cannot be undone.
                    </p>
                    {deleteError && (
                        <p className="text-sm text-destructive">{deleteError}</p>
                    )}
                    <DialogFooter showCloseButton>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting…" : "Delete workspace"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit workspace dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit workspace</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveEdit} className="flex flex-col gap-4 pt-1">
                        <div className="flex gap-3">
                            <Input
                                value={editEmoji}
                                onChange={(e) => setEditEmoji(e.target.value)}
                                placeholder="📝"
                                className="w-16 text-center text-lg"
                                maxLength={2}
                            />
                            <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Workspace name"
                                required
                                className="flex-1"
                            />
                        </div>
                        <Input
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Description (optional)"
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={isSaving || !editName.trim()}>
                                {isSaving ? "Saving…" : "Save"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
