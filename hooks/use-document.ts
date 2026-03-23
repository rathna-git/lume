"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export interface DocumentDetail {
    id: string
    title: string
    content: string | null
    summary: string | null
    createdAt: string
    updatedAt: string
}

interface UpdateDocumentInput {
    documentId: string
    title?: string
    content?: string
}

function documentKey(documentId: string) {
    return ["document", documentId] as const
}

async function fetchDocument(documentId: string): Promise<DocumentDetail> {
    const res = await fetch(`/api/documents/${documentId}`)
    if (!res.ok) throw new Error("Failed to fetch document")
    const data = await res.json()
    return data.document
}

async function updateDocument({ documentId, ...body }: UpdateDocumentInput): Promise<DocumentDetail> {
    const res = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })
    if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to update document")
    }
    const data = await res.json()
    return data.document
}

async function deleteDocument(documentId: string): Promise<void> {
    const res = await fetch(`/api/documents/${documentId}`, { method: "DELETE" })
    if (!res.ok) throw new Error("Failed to delete document")
}

export function useDocument(documentId: string) {
    return useQuery({
        queryKey: documentKey(documentId),
        queryFn: () => fetchDocument(documentId),
        enabled: !!documentId,
    })
}

export function useUpdateDocument() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateDocument,
        onSuccess: (updated) => {
            queryClient.setQueryData(documentKey(updated.id), updated)
        },
    })
}

export function useDeleteDocument() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteDocument,
        onSuccess: (_data, documentId) => {
            queryClient.removeQueries({ queryKey: documentKey(documentId) })
            queryClient.removeQueries({ queryKey: ["aiGenerations", documentId] })
        },
    })
}
