import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Pricing } from "@/components/landing/pricing";

export default function HomePage() {
  return (
    <main className="bg-surface min-h-screen">
      <Hero />
      <Features />
      <Pricing />

      {/* Simple footer */}
      <footer className="py-12 px-6 border-t border-surface-border">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} PostUps. Built for leagues that want clarity.
          </p>
        </div>
      </footer>
    </main>
  );
}
