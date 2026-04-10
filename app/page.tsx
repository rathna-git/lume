import Link from "next/link"
import { ArrowRight, Sparkles, FileText, Zap } from "lucide-react"
import { LumeLogo } from "@/components/logo"

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

        {/* Wordmark + tagline — floating in the sky */}
        <div className="absolute top-[18%] left-0 right-0 z-10 text-center px-6">
          <h1
            className="font-serif italic text-white/90 mb-3"
            style={{ fontSize: "clamp(3rem, 8vw, 5.5rem)" }}
          >
            Lume
          </h1>
          <p
            className="font-serif italic text-white/65"
            style={{ fontSize: "clamp(1rem, 2vw, 1.35rem)" }}
          >
            Think clearly. Write better. Learn faster.
          </p>
        </div>

        {/* Sun + curved text container */}
        <div
          className="absolute left-1/2 -translate-x-1/2 z-5"
          style={{ top: "38%", width: "30vh", height: "30vh" }}
        >
          {/* Sun glow */}
          <div
            className="absolute -inset-[35%] rounded-full"
            style={{
              background: "radial-gradient(circle, #F5A62340 0%, #F5A62315 40%, transparent 70%)",
            }}
          />
          {/* Sun disc */}
          <div
            className="w-full h-full rounded-full"
            style={{
              background: "radial-gradient(ellipse at 38% 35%, #F7C948, #F5A623 50%, #E8724A)",
              boxShadow: "0 0 60px #F5A62344, 0 0 120px #F5A62322",
            }}
          />
        </div>

        {/* Hills — stretched SVG, always full width */}
        <svg
          className="absolute bottom-0 left-0 w-full h-[45vh] pointer-events-none z-6"
          viewBox="0 0 1440 400"
          preserveAspectRatio="none"
        >
          {/* Back hills */}
          <path
            d="M0,180 C120,120 240,90 360,100 C480,110 540,160 720,150 C900,140 960,100 1080,105 C1200,110 1340,145 1440,160 L1440,400 L0,400 Z"
            fill="#1A2417"
          />
          {/* Mid hills */}
          <path
            d="M0,240 C80,200 200,165 340,175 C480,185 580,230 740,220 C900,210 1000,170 1140,178 C1280,186 1380,215 1440,230 L1440,400 L0,400 Z"
            fill="#111A0E"
          />
          {/* Front hills */}
          <path
            d="M0,310 C100,275 230,250 400,260 C570,270 660,305 830,295 C1000,285 1120,255 1290,262 C1370,266 1420,280 1440,290 L1440,400 L0,400 Z"
            fill="#090E09"
          />
        </svg>

        {/* CTA — above the hills */}
        <div className="absolute bottom-[8%] left-0 right-0 z-10 flex justify-center px-6">
          <Link
            href="/sign-up"
            className="flex items-center gap-2 text-sm font-light text-white/60 hover:text-white/90 transition-colors tracking-wide"
          >
            Start for free <ArrowRight size={13} className="mt-px" />
          </Link>
        </div>
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
