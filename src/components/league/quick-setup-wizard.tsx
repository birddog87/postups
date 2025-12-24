// src/components/league/quick-setup-wizard.tsx

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent } from "@/components/ui";
import { Send, Loader2, Check, Sparkles, Users, Calendar, MapPin, Trophy } from "lucide-react";
import {
  QuickSetupData,
  ChatMessage,
  GeneratedSchedule,
} from "@/lib/types/quick-setup";

const WIZARD_STEPS = [
  {
    id: "league",
    question: "What's your league called and what sport do you play?",
    placeholder: "e.g., Sunday Night Hockey League",
    icon: Trophy,
    label: "League",
  },
  {
    id: "teams",
    question: "How many teams? You can list team names or just give me a number.",
    placeholder: "e.g., 8 teams or Thunderbolts, Red Wings, Warriors...",
    icon: Users,
    label: "Teams",
  },
  {
    id: "schedule",
    question: "What days and times do you play?",
    placeholder: "e.g., Mondays at 6pm and 8pm",
    icon: Calendar,
    label: "Schedule",
  },
  {
    id: "dates",
    question: "When does the season start and end?",
    placeholder: "e.g., January 15 to March 30",
    icon: Calendar,
    label: "Dates",
  },
  {
    id: "location",
    question: "Where are games played?",
    placeholder: "e.g., Central Recreation Center",
    icon: MapPin,
    label: "Location",
  },
];

export function QuickSetupWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: WIZARD_STEPS[0].question,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [setupData, setSetupData] = useState<Partial<QuickSetupData>>({});
  const [generatedSchedule, setGeneratedSchedule] = useState<GeneratedSchedule | null>(null);
  const [creating, setCreating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    // Add user message
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, timestamp: new Date() },
    ]);

    try {
      // Parse with AI
      const parseRes = await fetch("/api/quick-setup/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          step: WIZARD_STEPS[currentStep].id,
          existingData: setupData,
        }),
      });

      const parseResult = await parseRes.json();

      if (!parseResult.success) {
        // AI needs clarification
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: parseResult.clarification || "Sorry, I didn't understand that. Could you try again?",
            timestamp: new Date(),
          },
        ]);
        setLoading(false);
        return;
      }

      // Merge parsed data
      const newData = { ...setupData, ...parseResult.data };
      setSetupData(newData);

      // Move to next step
      const nextStep = currentStep + 1;

      if (nextStep < WIZARD_STEPS.length) {
        setCurrentStep(nextStep);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Got it! ${WIZARD_STEPS[nextStep].question}`,
            timestamp: new Date(),
          },
        ]);
      } else {
        // All steps complete - generate preview
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Perfect! Let me generate your league setup...",
            timestamp: new Date(),
          },
        ]);

        // Call generate API
        const genRes = await fetch("/api/quick-setup/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: newData }),
        });

        const genResult = await genRes.json();

        if (genResult.success) {
          setGeneratedSchedule(genResult.data);
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `Here's your league preview! ${genResult.data.teams.length} teams and ${genResult.data.games.length} games ready to go.`,
              timestamp: new Date(),
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "Sorry, there was an error generating your schedule. Please try again.",
              timestamp: new Date(),
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Wizard error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
          timestamp: new Date(),
        },
      ]);
    }

    setLoading(false);
  };

  const handleCreate = async () => {
    if (!generatedSchedule || creating) return;

    setCreating(true);

    try {
      const res = await fetch("/api/quick-setup/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setupData,
          generatedSchedule,
        }),
      });

      const result = await res.json();

      if (result.success) {
        router.push(`/leagues/${result.data.league.slug}`);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Error creating league: ${result.error}`,
            timestamp: new Date(),
          },
        ]);
        setCreating(false);
      }
    } catch (error) {
      console.error("Create error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Failed to create league. Please try again.",
          timestamp: new Date(),
        },
      ]);
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header with AI badge */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-500 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Setup Assistant</h2>
              <p className="text-white/80 text-sm">Answer a few questions and we&apos;ll create your league</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-surface-raised border-b border-surface-border">
          <div className="flex items-center justify-between">
            {WIZARD_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isComplete = index < currentStep;
              const isCurrent = index === currentStep;
              return (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <div className="flex items-center w-full">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isComplete
                          ? "bg-brand-500 text-white"
                          : isCurrent
                          ? "bg-brand-500/20 text-brand-500 ring-2 ring-brand-500"
                          : "bg-surface-border text-gray-500"
                      }`}
                    >
                      {isComplete ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    {index < WIZARD_STEPS.length - 1 && (
                      <div
                        className={`flex-1 h-1 mx-2 rounded ${
                          isComplete ? "bg-brand-500" : "bg-surface-border"
                        }`}
                      />
                    )}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${
                    isCurrent ? "text-brand-500" : isComplete ? "text-white" : "text-gray-500"
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat messages */}
        <div className="h-[350px] overflow-y-auto p-6 space-y-4 bg-surface">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center mr-3 flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-brand-500" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-brand-500 text-white rounded-br-md"
                    : "bg-surface-raised text-white border border-surface-border rounded-bl-md"
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center mr-3">
                <Sparkles className="w-4 h-4 text-brand-500" />
              </div>
              <div className="bg-surface-raised border border-surface-border rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Preview section */}
        {generatedSchedule && (
          <div className="p-6 border-t border-surface-border bg-surface-raised space-y-4">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-brand-500" />
              <h3 className="font-semibold text-white">Your League Preview</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface p-4 rounded-xl border border-surface-border">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-brand-500" />
                  <p className="text-gray-400 text-sm">Teams</p>
                </div>
                <p className="text-2xl font-bold text-white">
                  {generatedSchedule.teams.length}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {generatedSchedule.teams.slice(0, 4).map((team, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded-lg text-xs font-medium"
                      style={{ backgroundColor: team.color + "20", color: team.color }}
                    >
                      {team.name}
                    </span>
                  ))}
                  {generatedSchedule.teams.length > 4 && (
                    <span className="px-2 py-1 text-gray-500 text-xs">
                      +{generatedSchedule.teams.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-surface p-4 rounded-xl border border-surface-border">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-brand-500" />
                  <p className="text-gray-400 text-sm">Games</p>
                </div>
                <p className="text-2xl font-bold text-white">
                  {generatedSchedule.games.length}
                </p>
                <p className="text-gray-500 text-xs mt-3">
                  {generatedSchedule.games[0]?.date} → {generatedSchedule.games[generatedSchedule.games.length - 1]?.date}
                </p>
              </div>
            </div>

            <Button
              onClick={handleCreate}
              loading={creating}
              className="w-full"
              size="lg"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Create League
            </Button>
          </div>
        )}

        {/* Input area */}
        {!generatedSchedule && (
          <div className="p-4 border-t border-surface-border bg-surface-raised">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={WIZARD_STEPS[currentStep]?.placeholder || "Type your answer..."}
                disabled={loading}
                className="flex-1 bg-surface border border-surface-border rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
              <Button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-4"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
