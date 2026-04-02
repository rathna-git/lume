import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireCurrentDbUser } from "@/lib/auth"

const createDocumentSchema = z.object({
    workspaceId: z.string().min(1),
    title: z.string().trim().max(255).optional().default(""),
})

export async function GET(req: Request) {
    const user = await requireCurrentDbUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const workspaceId = searchParams.get("workspaceId")

    if (!workspaceId) {
        return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    }

    // Verify workspace belongs to user
    const workspace = await prisma.workspace.findFirst({
        where: { id: workspaceId, userId: user.id },
        select: { id: true },
    })

    if (!workspace) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const documents = await prisma.document.findMany({
        where: { workspaceId },
        select: {
            id: true,
            title: true,
            summary: true,
            content: true,
            createdAt: true,
            updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({ documents })
}

export async function POST(req: Request) {
    const user = await requireCurrentDbUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const parsed = createDocumentSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
            { status: 400 }
        )
    }

    // Verify workspace belongs to user
    const workspace = await prisma.workspace.findFirst({
        where: { id: parsed.data.workspaceId, userId: user.id },
        select: { id: true },
    })

    if (!workspace) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const document = await prisma.document.create({
        data: {
            title: parsed.data.title,
            content: "",
            workspaceId: parsed.data.workspaceId,
        },
        select: {
            id: true,
            title: true,
            summary: true,
            createdAt: true,
            updatedAt: true,
        },
    })

    return NextResponse.json({ document }, { status: 201 })
}
