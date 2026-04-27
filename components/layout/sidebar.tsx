"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutGrid, Settings, FileText, Search, Layers, Users, Trash2, Plus } from "lucide-react"
import { UserButton, useUser } from "@clerk/nextjs"
import { useTheme } from "next-themes"
import { useQuery } from "@tanstack/react-query"
import { LumeLogo } from "@/components/logo"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { useDocuments, useCreateDocument } from "@/hooks/use-documents"

function getWorkspaceId(pathname: string): string | null {
    const match = pathname.match(/^\/workspaces\/([^\/]+)/)
    return match ? match[1] : null
}

function getDocumentId(pathname: string): string | null {
    const match = pathname.match(/\/documents\/([^\/]+)/)
    return match ? match[1] : null
}

interface WorkspaceData {
    id: string
    name: string
    emoji: string | null
}

function WorkspaceTree({
    workspaceId,
    currentDocId,
}: {
    workspaceId: string
    currentDocId: string | null
}) {
    const { data: workspace } = useQuery<WorkspaceData>({
        queryKey: ["workspace", workspaceId],
        queryFn: async () => {
            const res = await fetch(`/api/workspaces/${workspaceId}`)
            if (!res.ok) throw new Error("Failed to fetch workspace")
            return (await res.json()).workspace
        },
    })
    const { data: documents } = useDocuments(workspaceId)

    if (!workspace) return null

    return (
        <div className="px-2 mt-1">
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-muted-foreground/50">
                Workspace
            </p>
            {/* Workspace parent row */}
            <Link
                href={`/workspaces/${workspaceId}`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-neutral-700 dark:text-foreground/75 hover:bg-neutral-100 dark:hover:bg-muted hover:text-neutral-900 dark:hover:text-foreground mb-1"
            >
                <span className="text-sm leading-none shrink-0">{workspace.emoji ?? "📝"}</span>
                <span className="truncate font-medium text-[0.8125rem]">{workspace.name}</span>
            </Link>
            {/* Document children */}
            {documents && documents.length > 0 && (
                <div className="ml-4 pl-2.5 border-l border-neutral-200 dark:border-border space-y-0.5">
                    {documents.slice(0, 12).map(doc => (
                        <Link
                            key={doc.id}
                            href={`/workspaces/${workspaceId}/documents/${doc.id}`}
                            className={cn(
                                "flex items-center gap-2 px-2 py-1 rounded-md text-xs transition-colors",
                                doc.id === currentDocId
                                    ? "text-primary font-medium"
                                    : "text-neutral-500 dark:text-muted-foreground hover:text-neutral-800 dark:hover:text-foreground hover:bg-neutral-100 dark:hover:bg-muted/70"
                            )}
                        >
                            {doc.id === currentDocId
                                ? <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                : <FileText size={11} className="shrink-0 opacity-40" />
                            }
                            <span className="truncate">{doc.title || "Untitled"}</span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { resolvedTheme } = useTheme()
    const { user } = useUser()
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    const workspaceId = getWorkspaceId(pathname)
    const documentId = getDocumentId(pathname)

    const { mutate: createDocument, isPending: isCreating } = useCreateDocument()

    function handleNewDocument() {
        if (workspaceId) {
            createDocument(
                { workspaceId },
                {
                    onSuccess: (doc) => {
                        router.push(`/workspaces/${workspaceId}/documents/${doc.id}`)
                    },
                }
            )
        } else {
            router.push("/workspaces")
        }
    }

    // Active state helpers
    const onDocumentPage = !!documentId
    const onWorkspacePage = pathname.startsWith("/workspaces") && !onDocumentPage
    const onSettingsPage = pathname.startsWith("/settings")

    return (
        <aside className="w-56 flex flex-col border-r border-neutral-200 dark:border-sidebar-border bg-white dark:bg-sidebar shrink-0">
            {/* Logo */}
            <div className="px-5 h-14 flex items-center border-b border-neutral-200 dark:border-sidebar-border">
                <LumeLogo size="sm" variant={mounted && resolvedTheme === "light" ? "light" : "dark"} />
            </div>

            {/* New document button */}
            <div className="px-3 pt-4 pb-2">
                <button
                    onClick={handleNewDocument}
                    disabled={isCreating}
                    className="w-full flex items-center gap-2 px-3 h-10 rounded-lg text-sm font-medium
                        border border-amber-200 dark:border-amber-900/40
                        text-neutral-500 dark:text-muted-foreground
                        hover:border-amber-300 dark:hover:border-amber-700
                        hover:bg-amber-50 dark:hover:bg-amber-950/20
                        hover:text-amber-700 dark:hover:text-amber-400
                        transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus size={14} className="text-primary shrink-0" />
                    {isCreating ? "Creating…" : "New document"}
                </button>
            </div>

            {/* Primary nav */}
            <nav className="flex-1 overflow-y-auto px-3 pt-1 pb-2 space-y-0.5">
                {/* Workspaces */}
                <Link
                    href="/workspaces"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                        onWorkspacePage
                            ? "bg-amber-50 dark:bg-primary/10 text-amber-700 dark:text-primary font-medium"
                            : "text-neutral-500 dark:text-muted-foreground hover:text-neutral-900 dark:hover:text-foreground hover:bg-neutral-100 dark:hover:bg-muted"
                    )}
                >
                    <LayoutGrid size={16} />
                    Workspaces
                </Link>

                {/* Documents — active on document editor pages */}
                <Link
                    href="/workspaces"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                        onDocumentPage
                            ? "bg-amber-50 dark:bg-primary/10 text-amber-700 dark:text-primary font-medium"
                            : "text-neutral-500 dark:text-muted-foreground hover:text-neutral-900 dark:hover:text-foreground hover:bg-neutral-100 dark:hover:bg-muted"
                    )}
                >
                    <FileText size={16} />
                    Documents
                </Link>

                {/* Search — TODO: search feature not yet implemented */}
                <span className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-300 dark:text-neutral-600 cursor-not-allowed select-none">
                    <Search size={16} />
                    Search
                </span>

                {/* Templates — TODO: templates feature not yet implemented */}
                <span className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-300 dark:text-neutral-600 cursor-not-allowed select-none">
                    <Layers size={16} />
                    Templates
                </span>

                {/* Settings */}
                <Link
                    href="/settings"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                        onSettingsPage
                            ? "bg-amber-50 dark:bg-primary/10 text-amber-700 dark:text-primary font-medium"
                            : "text-neutral-500 dark:text-muted-foreground hover:text-neutral-900 dark:hover:text-foreground hover:bg-neutral-100 dark:hover:bg-muted"
                    )}
                >
                    <Settings size={16} />
                    Settings
                </Link>

                {/* Workspace/document tree — shown when in workspace context */}
                {workspaceId && (
                    <div className="pt-3 mt-1 border-t border-neutral-100 dark:border-border/50">
                        <WorkspaceTree workspaceId={workspaceId} currentDocId={documentId} />
                    </div>
                )}
            </nav>

            {/* Lower items — intentional placeholders, routes not yet built */}
            <div className="px-3 pb-3 pt-3 border-t border-neutral-100 dark:border-border/50 space-y-0.5">
                {/* TODO: "Shared with me" feature not yet implemented */}
                <span className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-400 dark:text-neutral-600 cursor-not-allowed select-none">
                    <Users size={16} />
                    Shared with me
                </span>
                {/* TODO: "Trash" feature not yet implemented */}
                <span className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-400 dark:text-neutral-600 cursor-not-allowed select-none">
                    <Trash2 size={16} />
                    Trash
                </span>
            </div>

            {/* User profile */}
            <div className="px-4 py-3 border-t border-neutral-200 dark:border-sidebar-border flex items-center gap-3 min-w-0">
                <UserButton />
                {mounted && user && (
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-neutral-700 dark:text-foreground truncate leading-tight">
                            {user.fullName || user.firstName || "User"}
                        </p>
                        <p className="text-[10px] text-neutral-400 dark:text-muted-foreground truncate leading-tight mt-0.5">
                            {user.primaryEmailAddress?.emailAddress}
                        </p>
                    </div>
                )}
            </div>
        </aside>
    )
}
