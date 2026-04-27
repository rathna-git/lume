import Link from "next/link"
import { ArrowRight, Sparkles, FileText, PenLine } from "lucide-react"
import { LumeLogo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { ParallaxHills } from "@/components/landing/parallax-hills"

const features = [
  {
    icon: FileText,
    title: "Structured workspaces",
    description:
      "Organize drafts, projects, and ideas into focused workspaces.",
  },
  {
    icon: Sparkles,
    title: "AI that works with your draft",
    description:
      "Summarize, rewrite, and expand directly from the document you're working in.",
  },
  {
    icon: PenLine,
    title: "Rewrite, summarize, and refine",
    description:
      "Turn rough notes into clearer writing and sharpen your thinking over time.",
  },
]

export default function Home() {
  return (
    <div className="min-h-screen dark:bg-[#090E09] bg-white">
      {/* Hero — full viewport landscape scene */}
      <section
        className="relative w-full h-screen overflow-hidden"
        style={{
          background: "linear-gradient(to bottom, #E8724A 0%, #C9A4BE 30%, #B0A8D4 50%, #6B6E8A 75%, #090E09 100%)",
        }}
      >
        {/* Nav */}
        <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
          <LumeLogo size="md" variant="dark" />
          <nav className="flex items-center gap-6">
            <ThemeToggle className="text-white/50 hover:text-white/80 hover:bg-white/10" />
            <Link
              href="/sign-in"
              className="text-sm text-white/50 hover:text-white/80 transition-colors font-light tracking-wide"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="text-sm px-4 py-2 rounded-full border border-white/20 hover:border-white/40 hover:bg-white/10 transition-all font-light tracking-wide backdrop-blur-sm text-white/80 hover:text-white"
            >
              Get started
            </Link>
          </nav>
        </header>

        {/* Hero content — headline, subheadline, CTA */}
        <div
          className="absolute top-[13%] md:top-[18%] left-0 right-0 z-10 text-center px-6 flex flex-col items-center"
          style={{ animation: "lume-float-in 2.5s 0.3s cubic-bezier(0.16,1,0.3,1) both" }}
        >
          <h1
            className="font-sans font-light tracking-tight text-white"
            style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", textShadow: "0 1px 30px rgba(0,0,0,0.15)" }}
          >
            Think clearly. Write better. Learn faster.
          </h1>
          <p
            className="mt-4 text-white/70 font-light max-w-xl leading-relaxed"
            style={{ fontSize: "clamp(0.875rem, 1.4vw, 1.05rem)" }}
          >
            A calm writing workspace for drafting, rewriting, and learning with AI.
          </p>
          <Link
            href="/sign-up"
            className="mt-6 flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/5 border border-white/25 hover:border-white/40 hover:bg-white/10 transition-all text-sm text-white/80 hover:text-white font-light tracking-wide backdrop-blur-sm"
          >
            Start writing <ArrowRight size={14} className="mt-px" />
          </Link>
        </div>

        {/* Sun container — outer div centers, inner div animates */}
        <div
          className="absolute left-1/2 -translate-x-1/2 z-5 top-[39%] md:top-[42%]"
          style={{ width: "36vh", height: "36vh" }}
        >
        <div
          className="w-full h-full"
          style={{
            animation: "lume-sun-rise 6s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          {/* Sun glow */}
          <div
            className="absolute -inset-[40%] rounded-full"
            style={{
              background: "radial-gradient(circle, #F5A62338 0%, #F5A62318 35%, transparent 65%)",
            }}
          />
          {/* Sun disc */}
          <div
            className="w-full h-full rounded-full"
            style={{
              background: "radial-gradient(ellipse at 38% 35%, #F7C948, #F5A623 50%, #E8724A)",
              boxShadow: "0 0 80px #F5A62350, 0 0 160px #F5A62325",
            }}
          />
        </div>
        </div>

        {/* Hills — parallax on scroll */}
        <ParallaxHills />

      </section>

      {/* Features */}
      <div className="shadow-[inset_0_14px_32px_-10px_rgba(0,0,0,0.07)] dark:shadow-none">
      <section id="features" className="relative z-10 max-w-4xl mx-auto px-6 pb-20 md:pb-28 pt-12 md:pt-16">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] dark:text-white/75 text-stone-700 mb-3">
            › Built for writing
          </p>
          <p className="text-sm dark:text-white/65 text-stone-600 font-light max-w-lg mx-auto leading-relaxed">
            Lume keeps your drafts, revisions, and AI help in one focused workspace.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="relative bg-[#FDFAF7] dark:bg-[#111810] border border-stone-300 dark:border-white/9 rounded-xl p-8 text-center shadow-sm dark:hover:bg-[#141C11] hover:shadow-md transition-shadow"
            >
              {/* Inner top highlight — subtle tactile signature */}
              <div className="absolute top-0 inset-x-0 h-px bg-white/80 dark:bg-white/[0.07] rounded-t-xl" />
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-6 mx-auto"
                style={{ background: "linear-gradient(135deg, #F7C94828, #E8724A1C)" }}
              >
                <Icon size={16} className="text-lume-amber" />
              </div>
              <h3 className="font-medium dark:text-white/90 text-stone-800 mb-3 text-sm tracking-wide">{title}</h3>
              <p className="text-sm dark:text-white/65 text-stone-600 font-light leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>
      </div>

      {/* Footer */}
      <footer className="dark:border-white/4 border-t border-black/8 px-8 py-8 max-w-6xl mx-auto flex items-center justify-between">
        <LumeLogo size="sm" variant="gradient" />
        <p className="text-[0.65rem] tracking-[0.15em] uppercase dark:text-white/20 text-stone-300">
          lumenotes.com
        </p>
      </footer>
    </div>
  )
}
