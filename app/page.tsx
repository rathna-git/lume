import Link from "next/link"
import { ArrowRight, Sparkles, FileText, Zap } from "lucide-react"
import { LumeLogo } from "@/components/logo"
import { ParallaxHills } from "@/components/landing/parallax-hills"

const features = [
  {
    icon: FileText,
    title: "Structured workspaces",
    description:
      "Organize your thinking into clean, focused workspaces. Every project, every idea — in its place.",
  },
  {
    icon: Sparkles,
    title: "AI that understands context",
    description:
      "Generate, summarize, rewrite, and expand. Lume's AI works with your content, not around it.",
  },
  {
    icon: Zap,
    title: "Instant clarity",
    description:
      "Turn rough notes into polished writing. Transform complex sources into sharp, usable knowledge.",
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-[#090E09] text-white">
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
            <Link
              href="/sign-in"
              className="text-sm text-white/50 hover:text-white/80 transition-colors font-light tracking-wide"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="text-sm px-4 py-2 rounded-full border border-white/20 hover:border-white/40 hover:bg-white/10 transition-all font-light tracking-wide backdrop-blur-sm"
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
      <section id="features" className="max-w-4xl mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/4 border border-white/4 rounded-2xl overflow-hidden">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="bg-[#0F0C09] p-8 hover:bg-white/2 transition-colors">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-5"
                style={{ background: "linear-gradient(135deg, #F7C94818, #E8724A12)" }}
              >
                <Icon size={15} className="text-lume-amber" />
              </div>
              <h3 className="font-medium text-white/85 mb-2 text-sm tracking-wide">{title}</h3>
              <p className="text-sm text-white/35 font-light leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/4 px-8 py-8 max-w-6xl mx-auto flex items-center justify-between">
        <LumeLogo size="sm" variant="gradient" />
        <p className="text-[0.65rem] tracking-[0.15em] uppercase text-white/20">
          lumenotes.com
        </p>
      </footer>
    </div>
  )
}
