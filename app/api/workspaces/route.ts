import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireCurrentDbUser } from "@/lib/auth"

const createWorkspaceSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(100),
    description: z.string().trim().max(500).optional(),
    emoji: z.string().trim().optional().default("📝"),
})

export async function GET() {
    const user = await requireCurrentDbUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const workspaces = await prisma.workspace.findMany({
        where: { userId: user.id },
        select: {
            id: true,
            name: true,
            description: true,
            emoji: true,
            createdAt: true,
            updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({ workspaces })
}

export async function POST(req: Request) {
    const user = await requireCurrentDbUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const parsed = createWorkspaceSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
            { status: 400 }
        )
    }

    const workspace = await prisma.workspace.create({
        data: {
            name: parsed.data.name,
            description: parsed.data.description,
            emoji: parsed.data.emoji,
            userId: user.id,
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

    return NextResponse.json({ workspace }, { status: 201 })
}
