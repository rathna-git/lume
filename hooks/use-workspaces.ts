"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export interface Workspace {
    id: string
    name: string
    description: string | null
    emoji: string | null
    createdAt: string
    updatedAt: string
}

interface CreateWorkspaceInput {
    name: string
    description?: string
    emoji?: string
}

interface UpdateWorkspaceInput {
    workspaceId: string
    name?: string
    description?: string
    emoji?: string
}

const WORKSPACES_KEY = ["workspaces"] as const

async function fetchWorkspaces(): Promise<Workspace[]> {
    const res = await fetch("/api/workspaces")
    if (!res.ok) throw new Error("Failed to fetch workspaces")
    const data = await res.json()
    return data.workspaces
}

async function createWorkspace(input: CreateWorkspaceInput): Promise<Workspace> {
    const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    })
    if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to create workspace")
    }
    const data = await res.json()
    return data.workspace
}

async function deleteWorkspace(workspaceId: string): Promise<void> {
    const res = await fetch(`/api/workspaces/${workspaceId}`, { method: "DELETE" })
    if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to delete workspace")
    }
}

async function updateWorkspace({ workspaceId, ...body }: UpdateWorkspaceInput): Promise<Workspace> {
    const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })
    if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to update workspace")
    }
    const data = await res.json()
    return data.workspace
}

export function useWorkspaces() {
    return useQuery({
        queryKey: WORKSPACES_KEY,
        queryFn: fetchWorkspaces,
    })
}

export function useCreateWorkspace() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createWorkspace,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY })
        },
    })
}

export function useUpdateWorkspace() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateWorkspace,
        onSuccess: (updated) => {
            queryClient.setQueryData(["workspace", updated.id], updated)
            queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY })
        },
    })
}

export function useDeleteWorkspace() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteWorkspace,
        onSuccess: (_data, workspaceId) => {
            queryClient.removeQueries({ queryKey: ["workspace", workspaceId] })
            queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY })
        },
    })
}
