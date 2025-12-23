// src/components/landing/hero.tsx
import Link from "next/link";
import { Button } from "@/components/ui";
import { ArrowRight, Trophy, Calendar, Users } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-500/10 via-transparent to-transparent" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.15) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-surface-raised border border-surface-border rounded-full px-4 py-2 mb-8 animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
          </span>
          <span className="text-sm text-gray-300">Now in beta — free to try</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-slide-up">
          <span className="text-white">Your league,</span>
          <br />
          <span className="bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
            posted.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-12 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          The simplest way to track standings, scores, and schedules.
          No spreadsheets. No group chat chaos. Just clarity.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Link href="/signup">
            <Button size="lg" className="w-full sm:w-auto">
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/demo">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              See demo league
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-20 max-w-xl mx-auto animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl bg-surface-raised border border-surface-border">
              <Trophy className="w-6 h-6 text-brand-500" />
            </div>
            <div className="text-2xl font-bold text-white">100+</div>
            <div className="text-sm text-gray-500">Leagues</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl bg-surface-raised border border-surface-border">
              <Users className="w-6 h-6 text-brand-500" />
            </div>
            <div className="text-2xl font-bold text-white">1,000+</div>
            <div className="text-sm text-gray-500">Teams</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl bg-surface-raised border border-surface-border">
              <Calendar className="w-6 h-6 text-brand-500" />
            </div>
            <div className="text-2xl font-bold text-white">5,000+</div>
            <div className="text-sm text-gray-500">Games</div>
          </div>
        </div>
      </div>
    </section>
  );
}
