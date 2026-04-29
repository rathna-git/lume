import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireCurrentDbUser } from "@/lib/auth"

export async function GET() {
    const user = await requireCurrentDbUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const documents = await prisma.document.findMany({
        where: {
            workspace: { userId: user.id },
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
            id: true,
            title: true,
            updatedAt: true,
            workspace: {
                select: { id: true, name: true, emoji: true },
            },
        },
    })

    return NextResponse.json({ documents })
}
