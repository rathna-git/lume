"use client"

import { useEffect, useRef } from "react"

export function ParallaxHills() {
  const farRef = useRef<SVGPathElement>(null)
  const backRef = useRef<SVGPathElement>(null)
  const midRef = useRef<SVGPathElement>(null)
  const frontRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    let ticking = false

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        if (farRef.current) farRef.current.style.transform = `translateY(${y * 0.02}px)`
        if (backRef.current) backRef.current.style.transform = `translateY(${y * 0.04}px)`
        if (midRef.current) midRef.current.style.transform = `translateY(${y * 0.06}px)`
        if (frontRef.current) frontRef.current.style.transform = `translateY(${y * 0.08}px)`
        ticking = false
      })
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <svg
      className="absolute bottom-0 left-0 w-full h-[52vh] pointer-events-none z-6"
      viewBox="0 0 1440 500"
      preserveAspectRatio="none"
    >
      {/* Far back hills — subtle depth */}
      <path
        ref={farRef}
        d="M0,200 C100,155 200,130 320,140 C440,150 520,185 660,175 C800,165 880,130 1020,138 C1160,146 1300,175 1440,185 L1440,500 L0,500 Z"
        fill="#1E2B1A"
      />
      {/* Back hills */}
      <path
        ref={backRef}
        d="M0,240 C80,190 180,155 300,165 C420,175 500,220 660,210 C820,200 900,160 1060,168 C1220,176 1360,210 1440,225 L1440,500 L0,500 Z"
        fill="#182315"
      />
      {/* Mid hills — more dramatic curves */}
      <path
        ref={midRef}
        d="M0,300 C60,260 160,225 290,235 C420,245 520,290 680,280 C840,270 940,230 1100,238 C1260,246 1380,275 1440,290 L1440,500 L0,500 Z"
        fill="#111A0E"
      />
      {/* Front hills */}
      <path
        ref={frontRef}
        d="M0,380 C90,345 210,315 370,325 C530,335 640,370 810,360 C980,350 1100,320 1270,328 C1370,333 1420,350 1440,360 L1440,500 L0,500 Z"
        fill="#090E09"
      />
    </svg>
  )
}
