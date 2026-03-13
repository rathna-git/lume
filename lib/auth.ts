import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function requireCurrentDbUser() {
    const { userId } = await auth()
    if (!userId) return null

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true },
    })

    return user ?? null
}
