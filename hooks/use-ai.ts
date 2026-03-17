"use client"

import { useMutation } from "@tanstack/react-query"

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

export function useGenerateAi() {
    return useMutation({ mutationFn: generateAi })
}
