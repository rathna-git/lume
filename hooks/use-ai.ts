"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export type AiAction = "summarize" | "rewrite" | "expand"

export interface GenerateAiInput {
    documentId: string
    action: AiAction
    content: string
    instructions?: string
}

export interface AiGenerationResult {
    id: string
    type: string
    status: string
    output: { text: string } | null
}

export interface AiGeneration {
    id: string
    type: string
    status: string
    model: string
    output: { text: string } | null
    createdAt: string
}

async function generateAi(input: GenerateAiInput): Promise<AiGenerationResult> {
    const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    })
    if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "AI generation failed")
    }
    const data = await res.json()
    return data.generation
}

async function fetchAiGenerations(documentId: string): Promise<AiGeneration[]> {
    const res = await fetch(`/api/documents/${documentId}/generations`)
    if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to fetch generations")
    }
    const data = await res.json()
    return data.generations
}

export function useGenerateAi() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: generateAi,
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["aiGenerations", variables.documentId] })
        },
    })
}

export function useAiGenerations(documentId: string | undefined) {
    return useQuery({
        queryKey: ["aiGenerations", documentId],
        queryFn: () => fetchAiGenerations(documentId!),
        enabled: !!documentId,
    })
}
