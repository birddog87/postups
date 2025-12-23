"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Starter",
    price: { monthly: 19, annual: 190 },
    description: "Perfect for getting started",
    features: [
      "1 active league",
      "Unlimited teams & games",
      "Public standings page",
      "Email support",
      "Basic analytics",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: { monthly: 49, annual: 490 },
    description: "Best for serious leagues",
    features: [
      "5 active leagues",
      "Everything in Starter",
      "Custom branding & colors",
      "Priority email support",
      "Advanced analytics",
      "Remove 'Powered by PostUps'",
    ],
    cta: "Get Started",
    popular: true,
  },
  {
    name: "Enterprise",
    price: { monthly: 149, annual: 1490 },
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

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block bg-brand-500/10 text-brand-400 text-sm font-semibold px-4 py-2 rounded-full mb-4">
            Pricing
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Free to set up and test. Pay when you go live.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center bg-surface-raised border border-surface-border rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-medium transition-all",
                !annual
                  ? "bg-white text-black"
                  : "text-gray-400 hover:text-white"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                annual
                  ? "bg-white text-black"
                  : "text-gray-400 hover:text-white"
              )}
            >
              Annual
              <span className="bg-brand-500 text-white text-xs px-2 py-0.5 rounded-full">
                -17%
              </span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-8 items-start">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "relative rounded-3xl p-8 h-full",
                tier.popular
                  ? "bg-white text-black ring-4 ring-brand-500"
                  : "bg-surface-raised border border-surface-border"
              )}
            >
              {/* Popular badge */}
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <span className="inline-flex items-center gap-1.5 bg-brand-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                    <Sparkles className="w-4 h-4" />
                    MOST POPULAR
                  </span>
                </div>
              )}

              {/* Content */}
              <div className={tier.popular ? "pt-4" : ""}>
                {/* Tier name */}
                <h3 className={cn(
                  "text-xl font-bold mb-2",
                  tier.popular ? "text-black" : "text-white"
                )}>
                  {tier.name}
                </h3>
                <p className={cn(
                  "text-sm mb-6",
                  tier.popular ? "text-gray-600" : "text-gray-400"
                )}>
                  {tier.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className={cn(
                      "text-5xl font-bold tracking-tight",
                      tier.popular ? "text-black" : "text-white"
                    )}>
                      ${annual ? tier.price.annual : tier.price.monthly}
                    </span>
                    <span className={tier.popular ? "text-gray-500" : "text-gray-400"}>
                      /{annual ? "year" : "mo"}
                    </span>
                  </div>
                  {annual && (
                    <p className="text-brand-500 text-sm mt-1 font-medium">
                      Save ${tier.price.monthly * 12 - tier.price.annual}/year
                    </p>
                  )}
                </div>

                {/* CTA */}
                <Button
                  variant={tier.popular ? "primary" : "secondary"}
                  size="lg"
                  className={cn(
                    "w-full mb-8",
                    tier.popular && "bg-black text-white hover:bg-gray-800"
                  )}
                >
                  {tier.cta}
                </Button>

                {/* Features */}
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className={cn(
                        "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5",
                        tier.popular ? "bg-brand-500" : "bg-brand-500/20"
                      )}>
                        <Check className={cn(
                          "w-3 h-3",
                          tier.popular ? "text-white" : "text-brand-400"
                        )} />
                      </div>
                      <span className={cn(
                        "text-sm",
                        tier.popular ? "text-gray-700" : "text-gray-300"
                      )}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Trust */}
        <div className="mt-16 text-center space-y-2">
          <p className="text-gray-500">
            Free to set up • No credit card required • Pay only when you go live
          </p>
          <p className="text-gray-600 text-xs">
            All prices in USD
          </p>
        </div>
      </div>
    </section>
  );
}
