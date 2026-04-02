"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export interface Document {
    id: string
    title: string
    summary: string | null
    content: string | null
    createdAt: string
    updatedAt: string
}

interface CreateDocumentInput {
    workspaceId: string
    title?: string
}

function documentsKey(workspaceId: string) {
    return ["documents", workspaceId] as const
}

async function fetchDocuments(workspaceId: string): Promise<Document[]> {
    const res = await fetch(`/api/documents?workspaceId=${workspaceId}`)
    if (!res.ok) throw new Error("Failed to fetch documents")
    const data = await res.json()
    return data.documents
}

async function createDocument(input: CreateDocumentInput): Promise<Document> {
    const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    })
    if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to create document")
    }
    const data = await res.json()
    return data.document
}

export function useDocuments(workspaceId: string) {
    return useQuery({
        queryKey: documentsKey(workspaceId),
        queryFn: () => fetchDocuments(workspaceId),
        enabled: !!workspaceId,
    })
}

export function useCreateDocument() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createDocument,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: documentsKey(variables.workspaceId) })
        },
    })
}
