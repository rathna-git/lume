import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireCurrentDbUser } from "@/lib/auth"

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
