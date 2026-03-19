import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireCurrentDbUser } from "@/lib/auth"

const patchWorkspaceSchema = z.object({
    name: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().optional(),
    emoji: z.string().optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
})

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ workspaceId: string }> }
) {
    const user = await requireCurrentDbUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { workspaceId } = await params

    const workspace = await prisma.workspace.findFirst({
        where: { id: workspaceId, userId: user.id },
        select: {
            id: true,
            name: true,
            description: true,
            emoji: true,
            createdAt: true,
            updatedAt: true,
        },
    })

    if (!workspace) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({ workspace })
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ workspaceId: string }> }
) {
    const user = await requireCurrentDbUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { workspaceId } = await params
    const existing = await prisma.workspace.findFirst({
        where: { id: workspaceId, userId: user.id },
    })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await prisma.workspace.delete({ where: { id: workspaceId } })

    return new NextResponse(null, { status: 204 })
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ workspaceId: string }> }
) {
    const user = await requireCurrentDbUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { workspaceId } = await params
    const existing = await prisma.workspace.findFirst({
        where: { id: workspaceId, userId: user.id },
    })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const body = await req.json()
    const parsed = patchWorkspaceSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
            { status: 400 }
        )
    }

    const workspace = await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
            ...(parsed.data.name !== undefined && { name: parsed.data.name }),
            ...(parsed.data.description !== undefined && { description: parsed.data.description }),
            ...(parsed.data.emoji !== undefined && { emoji: parsed.data.emoji }),
        },
        select: {
            id: true,
            name: true,
            description: true,
            emoji: true,
            createdAt: true,
            updatedAt: true,
        },
    })

    return NextResponse.json({ workspace })
}
