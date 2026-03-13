import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { userId } = await auth()
    if (!userId) redirect("/sign-in")

    const clerkUser = await currentUser()
    if (!clerkUser) redirect("/sign-in")

    // Bootstrap: create user + default workspace on first request only
    const existing = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true },
    })

    if (!existing) {
        const email = clerkUser.emailAddresses[0]?.emailAddress ?? ""
        const name = `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null
        const imageUrl = clerkUser.imageUrl ?? null

        await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: { clerkId: userId, email, name, imageUrl },
            })
            await tx.workspace.create({
                data: { name: "My Workspace", emoji: "📝", userId: user.id },
            })
        })
    }

    return (
        <div className="flex h-screen bg-background">
            <Sidebar />
            <div className="flex flex-col flex-1 min-w-0">
                <Header />
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
