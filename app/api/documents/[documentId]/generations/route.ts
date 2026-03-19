import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireCurrentDbUser } from "@/lib/auth"

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ documentId: string }> }
) {
    const user = await requireCurrentDbUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { documentId } = await params

    const document = await prisma.document.findFirst({
        where: { id: documentId, workspace: { userId: user.id } },
        select: { id: true },
    })
    if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const generations = await prisma.aiGeneration.findMany({
        where: { documentId },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            type: true,
            status: true,
            model: true,
            output: true,
            createdAt: true,
        },
    })

    return NextResponse.json({ generations })
}
