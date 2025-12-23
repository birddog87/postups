// src/components/landing/features.tsx
import { Card } from "@/components/ui";
import { Zap, Eye, Smartphone, Shield } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Setup in minutes",
    description:
      "Create your league, add teams, build your schedule. Go live in under 5 minutes.",
  },
  {
    icon: Eye,
    title: "Instant standings",
    description:
      "Standings update automatically when scores are entered. No formulas, no errors.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first",
    description:
      "Beautiful on every device. Players can check standings from the parking lot.",
  },
  {
    icon: Shield,
    title: "Reliable & fast",
    description:
      "Built on modern infrastructure. Your standings page loads in milliseconds.",
  },
];

export function Features() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Everything you need, nothing you don&apos;t
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            We focused on doing one thing perfectly: making your league visible.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="group hover:border-brand-500/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 group-hover:bg-brand-500/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-brand-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
