"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { format, parseISO } from "date-fns";

// ── Types ─────────────────────────────────────────────────────────────────────

interface UIMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  toolCalls: ToolCall[];
  isStreaming: boolean;
}

interface ToolCall {
  name: string;
  status: "calling" | "done";
  data?: unknown;
}

interface EventResult {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  isAllDay: boolean;
  location?: string | null;
  calendar: { name: string; color: string };
}

interface SlotResult {
  startsAt: string;
  endsAt: string;
  label: string;
  score: number;
  durationMinutes: number;
}

interface SummaryResult {
  eventCount: number;
  totalMeetingHours: number;
  avgMeetingsPerDay: number;
  conflictCount: number;
  nextEvents: Array<{ title: string; startsAt: string; endsAt: string }>;
}

interface CreateResult {
  success?: boolean;
  error?: string;
  title?: string;
  start_time?: string;
  htmlLink?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  try {
    return format(parseISO(iso), "h:mm a");
  } catch {
    return iso;
  }
}

function fmtDate(iso: string) {
  try {
    return format(parseISO(iso), "EEE, MMM d");
  } catch {
    return iso;
  }
}

function toolLabel(name: string) {
  switch (name) {
    case "get_events":
      return "Checking your calendar…";
    case "find_free_slots":
      return "Finding free time…";
    case "create_event":
      return "Creating event…";
    case "get_schedule_summary":
      return "Summarising schedule…";
    default:
      return "Working…";
  }
}

// ── Tool Result Cards ─────────────────────────────────────────────────────────

function EventCard({ event }: { event: EventResult }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b last:border-0 border-gray-100">
      <div
        className="mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: event.calendar.color }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-800 truncate">{event.title}</p>
        <p className="text-xs text-gray-500">
          {event.isAllDay
            ? "All day"
            : `${fmtTime(event.startsAt)} – ${fmtTime(event.endsAt)}`}
        </p>
      </div>
    </div>
  );
}

function EventsResultCard({ data }: { data: { events: EventResult[]; count: number } }) {
  if (!data.events || data.events.length === 0) return null;
  return (
    <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 p-3">
      <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1.5">
        <Calendar className="h-3.5 w-3.5" />
        {data.count} event{data.count !== 1 ? "s" : ""}
      </p>
      {data.events.map((e) => (
        <EventCard key={e.id} event={e} />
      ))}
    </div>
  );
}

function SlotsResultCard({
  data,
  onSelect,
}: {
  data: { slots: SlotResult[]; count: number };
  onSelect?: (slot: SlotResult) => void;
}) {
  if (!data.slots || data.slots.length === 0) return null;
  return (
    <div className="mt-2 rounded-lg border border-green-100 bg-green-50 p-3">
      <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" />
        {data.count} free slot{data.count !== 1 ? "s" : ""} found
      </p>
      {data.slots.map((slot, i) => (
        <button
          key={i}
          onClick={() => onSelect?.(slot)}
          className="w-full flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-green-100 text-left transition-colors group"
        >
          <div>
            <p className="text-xs font-medium text-gray-800">{slot.label}</p>
            <p className="text-xs text-gray-500">
              {fmtDate(slot.startsAt)} · {fmtTime(slot.startsAt)} – {fmtTime(slot.endsAt)}
            </p>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-green-600 transition-colors" />
        </button>
      ))}
    </div>
  );
}

function SummaryResultCard({ data }: { data: SummaryResult }) {
  return (
    <div className="mt-2 rounded-lg border border-purple-100 bg-purple-50 p-3">
      <p className="text-xs font-semibold text-purple-700 mb-2">Schedule overview</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-md p-2 text-center">
          <p className="text-base font-bold text-gray-900">{data.eventCount}</p>
          <p className="text-xs text-gray-500">meetings</p>
        </div>
        <div className="bg-white rounded-md p-2 text-center">
          <p className="text-base font-bold text-gray-900">{data.totalMeetingHours}h</p>
          <p className="text-xs text-gray-500">in meetings</p>
        </div>
        <div className="bg-white rounded-md p-2 text-center">
          <p className="text-base font-bold text-gray-900">{data.avgMeetingsPerDay}</p>
          <p className="text-xs text-gray-500">avg / day</p>
        </div>
        <div
          className={`bg-white rounded-md p-2 text-center ${data.conflictCount > 0 ? "border border-red-200" : ""}`}
        >
          <p
            className={`text-base font-bold ${data.conflictCount > 0 ? "text-red-600" : "text-gray-900"}`}
          >
            {data.conflictCount}
          </p>
          <p className="text-xs text-gray-500">conflicts</p>
        </div>
      </div>
    </div>
  );
}

function CreateResultCard({ data }: { data: CreateResult }) {
  if (data.error) {
    return (
      <div className="mt-2 rounded-lg border border-red-100 bg-red-50 p-3 flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-red-700">{data.error}</p>
      </div>
    );
  }
  return (
    <div className="mt-2 rounded-lg border border-green-100 bg-green-50 p-3 flex items-start gap-2">
      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-medium text-green-800">Event created!</p>
        {data.title && <p className="text-xs text-gray-600 mt-0.5">{data.title}</p>}
        {data.start_time && (
          <p className="text-xs text-gray-500">{fmtDate(data.start_time)} at {fmtTime(data.start_time)}</p>
        )}
        {data.htmlLink && (
          <a
            href={data.htmlLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline mt-0.5 block"
          >
            View in Google Calendar →
          </a>
        )}
      </div>
    </div>
  );
}

function ToolResultRenderer({
  toolCall,
  onSlotSelect,
}: {
  toolCall: ToolCall;
  onSlotSelect?: (slot: SlotResult) => void;
}) {
  if (toolCall.status !== "done" || !toolCall.data) return null;

  switch (toolCall.name) {
    case "get_events":
      return <EventsResultCard data={toolCall.data as { events: EventResult[]; count: number }} />;
    case "find_free_slots":
      return (
        <SlotsResultCard
          data={toolCall.data as { slots: SlotResult[]; count: number }}
          onSelect={onSlotSelect}
        />
      );
    case "get_schedule_summary":
      return <SummaryResultCard data={toolCall.data as SummaryResult} />;
    case "create_event":
      return <CreateResultCard data={toolCall.data as CreateResult} />;
    default:
      return null;
  }
}

// ── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({
  message,
  onSlotSelect,
}: {
  message: UIMessage;
  onSlotSelect: (slot: SlotResult) => void;
}) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[85%] ${isUser ? "" : "w-full"}`}>
        {/* Bubble */}
        {(message.text || message.isStreaming) && (
          <div
            className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
              isUser
                ? "bg-blue-600 text-white rounded-br-sm"
                : "bg-gray-100 text-gray-800 rounded-bl-sm"
            }`}
          >
            {message.text}
            {message.isStreaming && !message.text && (
              <span className="inline-flex gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            )}
            {message.isStreaming && message.text && (
              <span className="inline-block w-0.5 h-3.5 bg-gray-500 ml-0.5 animate-pulse align-text-bottom" />
            )}
          </div>
        )}

        {/* Tool calls */}
        {!isUser && (
          <>
            {message.toolCalls.map((tc, i) => (
              <div key={i}>
                {tc.status === "calling" && (
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {toolLabel(tc.name)}
                  </div>
                )}
                <ToolResultRenderer toolCall={tc} onSlotSelect={onSlotSelect} />
              </div>
            ))}
          </>
        )}
      </div>
    </motion.div>
  );
}

// ── Suggested Prompts ─────────────────────────────────────────────────────────

const SUGGESTIONS = [
  "What do I have today?",
  "Find me a 1-hour slot this week",
  "Show my schedule for tomorrow",
  "How busy am I this week?",
];

// ── Main Component ────────────────────────────────────────────────────────────

export function AssistantPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const addUserMessage = (text: string): UIMessage[] => {
    const userMsg: UIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text,
      toolCalls: [],
      isStreaming: false,
    };
    const assistantMsg: UIMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      text: "",
      toolCalls: [],
      isStreaming: true,
    };
    const next = [...messages, userMsg, assistantMsg];
    setMessages(next);
    return next;
  };

  const handleSlotSelect = useCallback(
    (slot: SlotResult) => {
      const time = `${fmtDate(slot.startsAt)} at ${fmtTime(slot.startsAt)}`;
      setInput(`Schedule a meeting on ${time}`);
      inputRef.current?.focus();
    },
    []
  );

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setInput("");
    setIsLoading(true);
    const updatedMessages = addUserMessage(text.trim());

    // Build API payload from conversation history (exclude the streaming assistant msg)
    const historyMessages = updatedMessages
      .slice(0, -1) // exclude the new empty assistant message
      .filter((m) => m.text.trim() !== "")
      .map((m) => ({ role: m.role, content: m.text }));

    // Get user timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyMessages, timezone }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to reach AI assistant");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6)) as {
              type: string;
              delta?: string;
              name?: string;
              data?: unknown;
              message?: string;
            };

            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (!last || last.role !== "assistant") return prev;

              const updated = { ...last };

              if (event.type === "text" && event.delta) {
                updated.text = last.text + event.delta;
              } else if (event.type === "tool_call" && event.name) {
                updated.toolCalls = [
                  ...last.toolCalls,
                  { name: event.name, status: "calling" },
                ];
              } else if (event.type === "tool_result" && event.name) {
                updated.toolCalls = last.toolCalls.map((tc) =>
                  tc.name === event.name && tc.status === "calling"
                    ? { ...tc, status: "done", data: event.data }
                    : tc
                );
              } else if (event.type === "done") {
                updated.isStreaming = false;
              } else if (event.type === "error") {
                updated.text = event.message ?? "Something went wrong. Please try again.";
                updated.isStreaming = false;
              }

              next[next.length - 1] = updated;
              return next;
            });
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (error) {
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === "assistant") {
          next[next.length - 1] = {
            ...last,
            text: error instanceof Error ? error.message : "Something went wrong.",
            isStreaming: false,
          };
        }
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setIsOpen((o) => !o)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors ${
          isOpen
            ? "bg-gray-700 hover:bg-gray-600"
            : "bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600"
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="AI Scheduling Assistant"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-5 w-5 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Sparkles className="h-6 w-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed bottom-24 right-6 z-50 w-[380px] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
            style={{ height: "560px" }}
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 flex-shrink-0">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">AI Scheduling Assistant</p>
                <p className="text-xs text-blue-200">Powered by Claude</p>
              </div>
              {isLoading && (
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce [animation-delay:0ms]" />
                  <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce [animation-delay:150ms]" />
                  <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
              {isEmpty && (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                    <Sparkles className="h-6 w-6 text-blue-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-800 mb-1">
                    Your scheduling assistant
                  </p>
                  <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                    Ask me about your schedule, find free time, or create events — all with plain English.
                  </p>
                  <div className="w-full space-y-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="w-full text-left text-xs px-3 py-2 rounded-lg bg-gray-50 hover:bg-blue-50 hover:text-blue-700 text-gray-600 border border-gray-200 hover:border-blue-200 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onSlotSelect={handleSlotSelect}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 border-t border-gray-100 px-3 py-3 bg-gray-50">
              <div className="flex items-end gap-2 bg-white rounded-xl border border-gray-200 shadow-sm px-3 py-2 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100 transition-all">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your schedule…"
                  disabled={isLoading}
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none leading-5 max-h-24 disabled:opacity-50"
                  style={{ height: "20px" }}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 text-white disabled:text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-center text-[10px] text-gray-400 mt-1.5">
                Press Enter to send · Shift+Enter for new line
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
