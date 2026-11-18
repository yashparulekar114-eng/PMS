"use client";

import React, { useState } from "react";
import { BookOpen, Loader2, MessageCircle, Send, X } from "lucide-react";
import { useAuth } from "@/lib/auth/user-context";
import { dataStore } from "@/lib/data-store";
import { FAQ_ITEMS } from "@/lib/faq";
import { buildStatusFacts, type StatusFacts } from "@/lib/ai/ask-pms";
import { localDateString } from "@/lib/ai/reminders";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  citations?: string[];
  mode?: "faq" | "status" | "none";
}

const STARTERS = [
  "What is my status?",
  "How many days are left in the cycle?",
  "What is the 85% weightage rule?",
  "How do I print my certificate?",
];

// Floating "Ask PMS" panel. It answers process questions from the FAQ and shows only the signed-in user's own status.
export function AskPmsPanel() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Ask me about the appraisal process, or about your own status in the current cycle.",
    },
  ]);

  // Read-only: builds status from the user's own goals and review. Nothing is created or written.
  const loadOwnStatus = async (): Promise<StatusFacts | null> => {
    if (!user) return null;
    const cycle = await dataStore.getActiveCycle();
    const goals = cycle ? await dataStore.getGoals(user.id, cycle.id) : [];
    const reviews = cycle ? await dataStore.getReviewsForCycle(cycle.id) : [];
    const own = reviews.find((r) => r.employee_id === user.id);
    return buildStatusFacts({
      cycle: cycle ? { name: cycle.name, end_date: cycle.end_date } : null,
      goals: goals.map((g) => ({ status: g.status, weightage: Number(g.weightage) })),
      reviewStatus: own?.status ?? null,
      today: localDateString(),
    });
  };

  const ask = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || sending) return;
    setInput("");
    setSending(true);
    const userMessage: ChatMessage = { id: `u-${Date.now()}`, role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const status = await loadOwnStatus();
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, status }),
      });
      const data = await res.json();
      const reply: ChatMessage = res.ok
        ? {
            id: `a-${Date.now()}`,
            role: "assistant",
            text: data.answer,
            citations: Array.isArray(data.citations) ? data.citations : [],
            mode: data.mode,
          }
        : { id: `a-${Date.now()}`, role: "assistant", text: data.error || "Something went wrong. Please try again.", mode: "none" };
      setMessages((prev) => [...prev, reply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", text: "The assistant could not be reached. Please try again.", mode: "none" },
      ]);
    } finally {
      setSending(false);
    }
  };

  const faqTitle = (id: string) => FAQ_ITEMS.find((f) => f.id === id)?.question ?? id;

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700"
        >
          <MessageCircle className="w-4 h-4" />
          Ask PMS
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-40 w-[22rem] max-w-[calc(100vw-2.5rem)] h-[32rem] flex flex-col bg-white border border-slate-200 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-bold text-slate-900">Ask PMS</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="p-1 rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-xs">
            {messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 leading-relaxed ${
                    m.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-800"
                  }`}
                >
                  <p>{m.text}</p>
                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-2 space-y-1 border-t border-slate-200 pt-1.5">
                      {m.citations.map((c) => (
                        <p key={c} className="flex items-start gap-1 text-[10px] text-slate-500">
                          <BookOpen className="w-3 h-3 flex-shrink-0 mt-px" />
                          <span>From FAQ: {faqTitle(c)}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Checking...
              </div>
            )}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => ask(s)}
                    className="px-2.5 py-1 rounded-full border border-indigo-200 text-indigo-700 text-[11px] font-medium hover:bg-indigo-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="flex items-center gap-2 px-3 py-3 border-t border-slate-100"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={500}
              placeholder="Ask a question..."
              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              aria-label="Send"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
