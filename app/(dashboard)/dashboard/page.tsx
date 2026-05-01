"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { FileText, Plus, LayoutGrid } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useRecentDocuments, useCreateDocument } from "@/hooks/use-documents"
import { useWorkspaces, useCreateWorkspace, type Workspace } from "@/hooks/use-workspaces"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const MotionLink = motion(Link)

type TimeOfDay = "morning" | "afternoon" | "evening" | "night"

function getTimeOfDay(): TimeOfDay {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return "morning"
    if (hour >= 12 && hour < 17) return "afternoon"
    if (hour >= 17 && hour < 21) return "evening"
    return "night"
}

function getGreeting(): string {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
}

const orbConfig: Record<TimeOfDay, { gradient: string; shadow: string }> = {
    morning: {
        gradient: "bg-linear-to-br from-lume-gold to-lume-amber",
        shadow: "shadow-[0_0_14px_rgba(247,201,72,0.45)] dark:shadow-[0_0_20px_rgba(247,201,72,0.25)]",
    },
    afternoon: {
        gradient: "bg-linear-to-br from-amber-400 to-yellow-500",
        shadow: "shadow-[0_0_14px_rgba(251,191,36,0.5)] dark:shadow-[0_0_20px_rgba(251,191,36,0.3)]",
    },
    evening: {
        gradient: "bg-linear-to-br from-violet-400 to-rose-300",
        shadow: "shadow-[0_0_14px_rgba(167,139,250,0.45)] dark:shadow-[0_0_20px_rgba(167,139,250,0.3)]",
    },
    night: {
        gradient: "bg-linear-to-br from-indigo-500 to-violet-500",
        shadow: "shadow-[0_0_14px_rgba(99,102,241,0.4)] dark:shadow-[0_0_20px_rgba(99,102,241,0.25)]",
    },
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

function NewPageDialog({
    open,
    onOpenChange,
    workspaces,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    workspaces: Workspace[]
}) {
    const router = useRouter()
    const { mutate: createDocument, isPending } = useCreateDocument()

    function handleSelect(workspaceId: string) {
        createDocument(
            { workspaceId },
            {
                onSuccess: (doc) => {
                    onOpenChange(false)
                    router.push(`/workspaces/${workspaceId}/documents/${doc.id}`)
                },
            }
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New page</DialogTitle>
                </DialogHeader>
                {workspaces.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                        No workspaces yet. Create a workspace first.
                    </p>
                ) : (
                    <div className="mt-1 space-y-0.5">
                        <p className="text-xs text-muted-foreground mb-3">Choose a workspace</p>
                        {workspaces.map(ws => (
                            <button
                                key={ws.id}
                                onClick={() => handleSelect(ws.id)}
                                disabled={isPending}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-neutral-50 dark:hover:bg-muted/40 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="text-lg leading-none shrink-0">{ws.emoji ?? "📝"}</span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-neutral-700 dark:text-foreground truncate">
                                        {ws.name}
                                    </p>
                                    <p className="text-xs text-neutral-400 dark:text-muted-foreground mt-0.5">
                                        {ws._count.documents} page{ws._count.documents !== 1 ? "s" : ""}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

export default function HomePage() {
    const { user, isLoaded: userLoaded } = useUser()
    const { data: recentDocs, isLoading: loadingRecent } = useRecentDocuments()
    const { data: workspaces, isLoading: loadingWorkspaces } = useWorkspaces()
    const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false)
    const [newPageDialogOpen, setNewPageDialogOpen] = useState(false)

    const firstName = user?.firstName || null
const shouldReduceMotion = useReducedMotion()
    const ease = [0.22, 1, 0.36, 1] as const
    const container = {
        hidden: {},
        show: {
            transition: { staggerChildren: shouldReduceMotion ? 0 : 0.22 },
        },
    }
    const item = {
        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
        show: {
            opacity: 1,
            y: 0,
            transition: { duration: 1.0, ease: [0, 0, 0.58, 1] as const },
        },
    }
    const hoverRow = shouldReduceMotion ? {} : { y: -1 }
    const hoverCard = shouldReduceMotion ? {} : { y: -2 }
    const tapButton = shouldReduceMotion ? {} : { scale: 0.98 }
    const hoverTransition = { duration: 0.18, ease }

    return (
        <motion.div
            className="max-w-6xl mx-auto px-8 py-12"
            variants={container}
            initial="hidden"
            animate={userLoaded ? "show" : "hidden"}
        >
            {/* Greeting */}
            <motion.div className="mb-10" variants={item}>
                <motion.div
                    className={`w-8 h-8 rounded-full mb-4 ${orbConfig[getTimeOfDay()].gradient} ${orbConfig[getTimeOfDay()].shadow}`}
                    initial={shouldReduceMotion ? {} : { scale: 0.75 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1, ease }}
                />
                <h1 className="font-serif text-3xl text-foreground tracking-tight">
                    {getGreeting()}{firstName ? `, ${firstName}` : ""}
                </h1>
                <p className="mt-1.5 text-sm text-neutral-400 dark:text-muted-foreground">
                    Pick up where you left off, or start something new.
                </p>
            </motion.div>

<motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-6" variants={item}>
                {/* Left column: Recent pages */}
                <div className="lg:col-span-2">
                    <section>
                        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-muted-foreground/50 mb-3">
                            Recent pages
                        </p>
                        <div className="rounded-xl border border-neutral-200 dark:border-border bg-white dark:bg-card overflow-hidden">
                            {loadingRecent && (
                                <div className="divide-y divide-neutral-100 dark:divide-border/50">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="px-4 py-3.5 flex items-start gap-3">
                                            <div className="w-4 h-4 rounded bg-neutral-100 dark:bg-muted/60 animate-pulse shrink-0 mt-0.5" />
                                            <div className="flex-1 space-y-1.5">
                                                <div className="h-3.5 rounded bg-neutral-100 dark:bg-muted/60 animate-pulse w-3/4" />
                                                <div className="h-3 rounded bg-neutral-100 dark:bg-muted/60 animate-pulse w-1/3" />
                                            </div>
                                            <div className="w-12 h-3 rounded bg-neutral-100 dark:bg-muted/60 animate-pulse shrink-0 mt-0.5" />
                                        </div>
                                    ))}
                                </div>
                            )}
                            {!loadingRecent && (!recentDocs || recentDocs.length === 0) && (
                                <div className="px-4 py-10 text-center">
                                    <FileText size={24} className="mx-auto mb-2 text-neutral-200 dark:text-muted-foreground/20" />
                                    <p className="text-sm text-neutral-400 dark:text-muted-foreground">
                                        No pages yet. Create your first page inside a workspace.
                                    </p>
                                </div>
                            )}
                            {!loadingRecent && recentDocs && recentDocs.length > 0 && (
                                <div className="divide-y divide-neutral-100 dark:divide-border/50">
                                    {recentDocs.map(doc => (
                                        <MotionLink
                                            key={doc.id}
                                            href={`/workspaces/${doc.workspace.id}/documents/${doc.id}`}
                                            className="flex items-start gap-3 px-4 py-3.5 hover:bg-neutral-50 dark:hover:bg-muted/30 transition-colors duration-150"
                                            whileHover={hoverRow}
                                            transition={hoverTransition}
                                        >
                                            <FileText size={14} className="text-neutral-300 dark:text-muted-foreground/40 shrink-0 mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-neutral-700 dark:text-foreground truncate">
                                                    {doc.title || "Untitled"}
                                                </p>
                                                <p className="text-xs text-neutral-400 dark:text-muted-foreground mt-0.5 truncate">
                                                    {doc.workspace.emoji ?? "📝"} {doc.workspace.name}
                                                </p>
                                            </div>
                                            <span className="text-xs text-neutral-300 dark:text-muted-foreground/40 shrink-0 tabular-nums mt-0.5">
                                                {relativeTime(doc.updatedAt)}
                                            </span>
                                        </MotionLink>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Right column: Quick actions + Workspaces */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Quick actions */}
                    {/* Future: support Inbox pages with nullable workspaceId or a system Inbox view */}
                    <section>
                        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-muted-foreground/50 mb-3">
                            Quick actions
                        </p>
                        <div className="space-y-2">
                            <motion.button
                                onClick={() => setWorkspaceDialogOpen(true)}
                                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-border bg-white dark:bg-card text-sm text-neutral-600 dark:text-muted-foreground hover:text-neutral-900 dark:hover:text-foreground hover:bg-neutral-50 dark:hover:bg-muted/40 transition-colors duration-150"
                                whileTap={tapButton}
                                transition={hoverTransition}
                            >
                                <Plus size={14} />
                                New workspace
                            </motion.button>
                            <motion.button
                                onClick={() => setNewPageDialogOpen(true)}
                                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-border bg-white dark:bg-card text-sm text-neutral-600 dark:text-muted-foreground hover:text-neutral-900 dark:hover:text-foreground hover:bg-neutral-50 dark:hover:bg-muted/40 transition-colors duration-150"
                                whileTap={tapButton}
                                transition={hoverTransition}
                            >
                                <Plus size={14} />
                                New page…
                            </motion.button>
                        </div>
                    </section>

                    {/* Workspaces */}
                    <section>
                        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-muted-foreground/50 mb-3">
                            Workspaces
                        </p>
                        {loadingWorkspaces && (
                            <div className="space-y-2">
                                {[1, 2].map(i => (
                                    <div key={i} className="h-16 rounded-xl bg-neutral-100 dark:bg-muted/40 animate-pulse" />
                                ))}
                            </div>
                        )}
                        {!loadingWorkspaces && (!workspaces || workspaces.length === 0) && (
                            <div className="rounded-xl border border-neutral-200 dark:border-border bg-white dark:bg-card px-4 py-6 text-center">
                                <LayoutGrid size={20} className="mx-auto mb-2 text-neutral-200 dark:text-muted-foreground/20" />
                                <p className="text-sm text-neutral-400 dark:text-muted-foreground">
                                    No workspaces yet.
                                </p>
                            </div>
                        )}
                        {!loadingWorkspaces && workspaces && workspaces.length > 0 && (
                            <div className="space-y-2">
                                {workspaces.map(ws => (
                                    <MotionLink
                                        key={ws.id}
                                        href={`/workspaces/${ws.id}`}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-neutral-200 dark:border-border bg-white dark:bg-card hover:bg-neutral-50 dark:hover:bg-muted/40 hover:border-neutral-300 dark:hover:border-border/80 hover:shadow-sm transition-colors duration-150"
                                        whileHover={hoverCard}
                                        transition={hoverTransition}
                                    >
                                        <span className="text-xl leading-none shrink-0">{ws.emoji ?? "📝"}</span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-neutral-700 dark:text-foreground truncate">
                                                {ws.name}
                                            </p>
                                            <p className="text-xs text-neutral-400 dark:text-muted-foreground mt-0.5">
                                                {ws._count.documents} page{ws._count.documents !== 1 ? "s" : ""}
                                            </p>
                                        </div>
                                    </MotionLink>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </motion.div>

            <CreateWorkspaceDialog open={workspaceDialogOpen} onOpenChange={setWorkspaceDialogOpen} />
            <NewPageDialog
                open={newPageDialogOpen}
                onOpenChange={setNewPageDialogOpen}
                workspaces={workspaces ?? []}
            />
        </motion.div>
    )
}
