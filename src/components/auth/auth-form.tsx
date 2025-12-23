"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { Mail, ArrowLeft } from "lucide-react";

interface AuthFormProps {
  mode: "login" | "signup";
}

const config = {
  login: {
    title: "Welcome back",
    description: "Sign in to manage your leagues",
    submitText: "Send magic link",
    switchText: "Don't have an account?",
    switchLink: "/signup",
    switchLinkText: "Sign up",
  },
  signup: {
    title: "Create your account",
    description: "Start managing your league in minutes",
    submitText: "Send magic link",
    switchText: "Already have an account?",
    switchLink: "/login",
    switchLinkText: "Sign in",
  },
};

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const { title, description, submitText, switchText, switchLink, switchLinkText } = config[mode];

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Check your email for the magic link!" });
    }

    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    setOauthLoading(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
      setOauthLoading(false);
    }
    // Don't reset loading on success - page will redirect
  };

  return (
    <>
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Back to home
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Google OAuth */}
          <Button
            variant="secondary"
            className="w-full"
            onClick={handleGoogleAuth}
            loading={oauthLoading}
            disabled={loading || oauthLoading}
          >
            <GoogleIcon />
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-surface-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface-raised px-2 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          {/* Email Magic Link */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <Input
              id="email"
              type="email"
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || oauthLoading}
            />

            {message && (
              <p
                className={`text-sm ${
                  message.type === "success" ? "text-brand-400" : "text-red-400"
                }`}
                role="alert"
              >
                {message.text}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={loading || oauthLoading}
            >
              <Mail className="w-4 h-4" aria-hidden="true" />
              {submitText}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-400">
            {switchText}{" "}
            <Link href={switchLink} className="text-brand-500 hover:text-brand-400">
              {switchLinkText}
            </Link>
          </p>
        </CardContent>
      </Card>
    </>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
