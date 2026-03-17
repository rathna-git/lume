import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { openai } from "@/lib/openai"
import { requireCurrentDbUser } from "@/lib/auth"

const generateSchema = z.object({
    documentId: z.string().min(1),
    action: z.enum(["summarize", "rewrite", "expand"]),
    content: z.string().min(1),
    instructions: z.string().optional(),
})

const ACTION_TYPE_MAP = {
    summarize: "SUMMARIZE",
    rewrite: "REWRITE",
    expand: "EXPAND",
} as const

function buildPrompt(
    action: "summarize" | "rewrite" | "expand",
    content: string,
    instructions?: string
): string {
    const extra = instructions ? `\n\nAdditional instructions: ${instructions}` : ""
    switch (action) {
        case "summarize":
            return `Summarize the following document concisely. Return only the summary, no preamble.${extra}\n\n${content}`
        case "rewrite":
            return `Rewrite the following document to improve clarity, flow, and quality. Preserve the original meaning and tone. Return only the rewritten text.${extra}\n\n${content}`
        case "expand":
            return `Expand the following document with more detail, depth, and supporting ideas. Return only the expanded text.${extra}\n\n${content}`
    }
}

export async function POST(req: Request) {
    const user = await requireCurrentDbUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const parsed = generateSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
            { status: 400 }
        )
    }

    const { documentId, action, content, instructions } = parsed.data

    const document = await prisma.document.findFirst({
        where: { id: documentId, workspace: { userId: user.id } },
        select: { id: true },
    })
    if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const prompt = buildPrompt(action, content, instructions)

    const generation = await prisma.aiGeneration.create({
        data: {
            documentId,
            type: ACTION_TYPE_MAP[action],
            status: "PENDING",
            model: "gpt-4o",
            prompt,
            inputSnapshot: content,
        },
    })

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
        })

        const text = response.choices[0]?.message?.content ?? ""

        const updated = await prisma.aiGeneration.update({
            where: { id: generation.id },
            data: { status: "SUCCESS", output: { text } },
            select: { id: true, type: true, status: true, output: true },
        })

        return NextResponse.json({ generation: updated })
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        await prisma.aiGeneration.update({
            where: { id: generation.id },
            data: { status: "ERROR", errorMessage },
        })
        return NextResponse.json({ error: "AI generation failed" }, { status: 500 })
    }
}
