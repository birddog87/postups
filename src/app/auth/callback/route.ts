import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Allowed redirect paths (must be relative paths starting with /)
const ALLOWED_REDIRECTS = ["/dashboard", "/leagues", "/settings", "/"];

function isValidRedirect(path: string): boolean {
  // Must be a relative path starting with /
  if (!path.startsWith("/")) return false;
  // Must not contain protocol or double slashes (prevent //evil.com)
  if (path.includes("//") || path.includes(":")) return false;
  // Check against whitelist or allow any path under our domain
  return ALLOWED_REDIRECTS.some(allowed => path.startsWith(allowed));
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Validate redirect path
  const redirectPath = isValidRedirect(next) ? next : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  // Return the user to login page with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
