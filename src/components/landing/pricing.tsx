// src/components/landing/pricing.tsx
"use client";

import { useState } from "react";
import { Check, Sparkles, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

const pricingData = {
  monthly: {
    starter: 19,
    pro: 49,
    enterprise: 149,
  },
  annual: {
    starter: 190,
    pro: 490,
    enterprise: 1490,
  },
};

const tiers = [
  {
    name: "Starter",
    id: "starter",
    description: "Perfect for getting started",
    features: [
      "1 active league",
      "Unlimited teams & games",
      "Public standings page",
      "Email support",
      "Basic analytics",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Pro",
    id: "pro",
    description: "Best for serious leagues",
    features: [
      "5 active leagues",
      "Everything in Starter",
      "Custom branding & colors",
      "Priority email support",
      "Advanced analytics",
      "Remove 'Powered by PostUps'",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    id: "enterprise",
    description: "For organizations at scale",
    features: [
      "Unlimited leagues",
      "Everything in Pro",
      "White-label solution",
      "Dedicated account manager",
      "API access",
      "Custom integrations",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const trustBadges = [
  {
    icon: Clock,
    text: "14-day free trial",
  },
  {
    icon: Shield,
    text: "No credit card required",
  },
  {
    icon: Check,
    text: "Cancel anytime",
  },
];

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  const getPrice = (tierId: string) => {
    const prices = annual ? pricingData.annual : pricingData.monthly;
    return prices[tierId as keyof typeof prices];
  };

  const getSavings = (tierId: string) => {
    const monthly = pricingData.monthly[tierId as keyof typeof pricingData.monthly];
    const annual = pricingData.annual[tierId as keyof typeof pricingData.annual];
    return monthly * 12 - annual;
  };

  return (
    <section id="pricing" className="py-24 px-6 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface via-surface-raised to-surface pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        {/* Section header */}
        <div className="text-center mb-12">
          <Badge variant="success" className="mb-4 px-4 py-2 text-sm font-semibold">
            Pricing
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            Free to set up and test. Pay when you go live.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-4 p-1 bg-surface-raised border border-surface-border rounded-full">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all duration-200",
                !annual
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-500/25"
                  : "text-gray-400 hover:text-white"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 relative",
                annual
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-500/25"
                  : "text-gray-400 hover:text-white"
              )}
            >
              Annual
              <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full font-bold">
                Save
              </span>
            </button>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={cn(
                "relative rounded-2xl p-8 transition-all duration-300",
                tier.popular
                  ? "bg-gradient-to-b from-surface-raised to-surface-overlay border-2 border-brand-500 shadow-2xl shadow-brand-500/20 scale-105 md:scale-110"
                  : "bg-surface-raised border border-surface-border hover:border-brand-500/50"
              )}
            >
              {/* Popular badge */}
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge
                    variant="success"
                    className="px-4 py-1.5 text-sm font-bold shadow-lg shadow-brand-500/50 animate-pulse-subtle"
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    MOST POPULAR
                  </Badge>
                </div>
              )}

              {/* Tier header */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {tier.name}
                </h3>
                <p className="text-gray-400 text-sm">{tier.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-white">
                    ${getPrice(tier.id)}
                  </span>
                  <span className="text-gray-400">
                    /{annual ? "year" : "month"}
                  </span>
                </div>
                {annual && (
                  <p className="text-brand-400 text-sm mt-2 font-medium">
                    Save ${getSavings(tier.id)} per year
                  </p>
                )}
              </div>

              {/* CTA */}
              <Button
                variant={tier.popular ? "primary" : "secondary"}
                size="lg"
                className="w-full mb-6 font-semibold"
              >
                {tier.cta}
              </Button>

              {/* Features */}
              <div className="space-y-3">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3 text-brand-400" />
                    </div>
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Gradient border effect on hover */}
              {!tier.popular && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-brand-500/0 via-brand-500/0 to-brand-500/0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-10 blur-xl" />
              )}
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-8 pt-8 border-t border-surface-border">
          {trustBadges.map((badge) => (
            <div
              key={badge.text}
              className="flex items-center gap-2 text-gray-400"
            >
              <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center">
                <badge.icon className="w-4 h-4 text-brand-400" />
              </div>
              <span className="text-sm font-medium">{badge.text}</span>
            </div>
          ))}
        </div>

        {/* Additional trust message */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            All plans include a 14-day free trial. No credit card required to start.
          </p>
        </div>
      </div>
    </section>
  );
}
