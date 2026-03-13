import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireCurrentDbUser } from "@/lib/auth"

const patchDocumentSchema = z.object({
    title: z.string().trim().max(255).optional(),
    content: z.string().optional(),
})

async function getOwnedDocument(documentId: string, userId: string) {
    return prisma.document.findFirst({
        where: {
            id: documentId,
            workspace: { userId },
        },
    })
}

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ documentId: string }> }
) {
    const user = await requireCurrentDbUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { documentId } = await params
    const document = await getOwnedDocument(documentId, user.id)
    if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 })

    return NextResponse.json({ document })
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ documentId: string }> }
) {
    const user = await requireCurrentDbUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { documentId } = await params
    const existing = await getOwnedDocument(documentId, user.id)
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const body = await req.json()
    const parsed = patchDocumentSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
            { status: 400 }
        )
    }

    const document = await prisma.document.update({
        where: { id: documentId },
        data: {
            ...(parsed.data.title !== undefined && { title: parsed.data.title }),
            ...(parsed.data.content !== undefined && { content: parsed.data.content }),
        },
        select: {
            id: true,
            title: true,
            content: true,
            summary: true,
            createdAt: true,
            updatedAt: true,
        },
    })

    return NextResponse.json({ document })
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ documentId: string }> }
) {
    const user = await requireCurrentDbUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { documentId } = await params
    const existing = await getOwnedDocument(documentId, user.id)
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await prisma.document.delete({ where: { id: documentId } })

    return NextResponse.json({ success: true })
}
