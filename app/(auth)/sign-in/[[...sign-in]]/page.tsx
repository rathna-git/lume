import { SignIn } from "@clerk/nextjs"
import { ThemeToggle } from "@/components/theme-toggle"

export default function SignInPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="absolute top-6 right-8">
                <ThemeToggle />
            </div>
            <SignIn />
        </div>
    )
}