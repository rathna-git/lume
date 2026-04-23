import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Sidebar } from "@/components/layout/sidebar"
import { Toaster } from "sonner"

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
<main className="flex-1 overflow-y-auto bg-background">
                    {children}
                </main>
            </div>
            <Toaster
                position="bottom-right"
                duration={2500}
                toastOptions={{
                    style: {
                        background: '#FFF8F0',
                        border: '1px solid #F0E8DF',
                        color: '#1A1410',
                        fontSize: '0.8125rem',
                        boxShadow: '0 2px 8px rgba(26,20,16,0.07)',
                    },
                }}
            />
        </div>
    )
}
