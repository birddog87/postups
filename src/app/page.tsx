import Link from "next/link";
import Image from "next/image";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Pricing } from "@/components/landing/pricing";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="bg-surface min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="PostUps"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-xl font-bold text-white">PostUps</span>
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <Link
                href="/dashboard"
                className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

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
