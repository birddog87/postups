// src/components/league/quick-setup-wizard.tsx

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, Input } from "@/components/ui";
import { Send, Loader2, Check, ChevronRight } from "lucide-react";
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
  },
  {
    id: "teams",
    question: "How many teams? You can list team names or just give me a number.",
    placeholder: "e.g., 8 teams or Thunderbolts, Red Wings, Warriors...",
  },
  {
    id: "schedule",
    question: "What days and times do you play?",
    placeholder: "e.g., Mondays at 6pm and 8pm",
  },
  {
    id: "dates",
    question: "When does the season start and end?",
    placeholder: "e.g., January 15 to March 30",
  },
  {
    id: "location",
    question: "Where are games played?",
    placeholder: "e.g., Central Recreation Center",
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
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-0">
        {/* Progress indicator */}
        <div className="flex items-center gap-2 p-4 border-b border-surface-border">
          {WIZARD_STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  index < currentStep
                    ? "bg-brand-500 text-white"
                    : index === currentStep
                    ? "bg-brand-500/20 text-brand-500 border-2 border-brand-500"
                    : "bg-surface-border text-gray-500"
                }`}
              >
                {index < currentStep ? (
                  <Check className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < WIZARD_STEPS.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-500 mx-1" />
              )}
            </div>
          ))}
        </div>

        {/* Chat messages */}
        <div className="h-[400px] overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.role === "user"
                    ? "bg-brand-500 text-white"
                    : "bg-surface-raised text-white border border-surface-border"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Preview section */}
        {generatedSchedule && (
          <div className="p-4 border-t border-surface-border space-y-4">
            <h3 className="font-semibold text-white">Preview</h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-surface-raised p-3 rounded-lg border border-surface-border">
                <p className="text-gray-400">Teams</p>
                <p className="text-white font-medium">
                  {generatedSchedule.teams.length} teams
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {generatedSchedule.teams.slice(0, 4).map((team, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-xs"
                      style={{ backgroundColor: team.color + "20", color: team.color }}
                    >
                      {team.name}
                    </span>
                  ))}
                  {generatedSchedule.teams.length > 4 && (
                    <span className="text-gray-500 text-xs">
                      +{generatedSchedule.teams.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-surface-raised p-3 rounded-lg border border-surface-border">
                <p className="text-gray-400">Schedule</p>
                <p className="text-white font-medium">
                  {generatedSchedule.games.length} games
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {generatedSchedule.games[0]?.date} to{" "}
                  {generatedSchedule.games[generatedSchedule.games.length - 1]?.date}
                </p>
              </div>
            </div>

            <Button
              onClick={handleCreate}
              loading={creating}
              className="w-full"
              size="lg"
            >
              Create League
            </Button>
          </div>
        )}

        {/* Input area */}
        {!generatedSchedule && (
          <div className="p-4 border-t border-surface-border">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={WIZARD_STEPS[currentStep]?.placeholder || "Type your answer..."}
                disabled={loading}
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={loading || !input.trim()}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
