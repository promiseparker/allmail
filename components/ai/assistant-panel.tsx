"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit, X, Send, Loader2, Calendar, Clock,
  CheckCircle, AlertCircle, ChevronRight, Mic, MicOff, Pencil, Trash2,
  Volume2, VolumeX,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Avatar } from "@/components/ui/avatar";

// ── Types ──────────────────────────────────────────────────────────────────────

interface UIMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  toolCalls: ToolCall[];
  isStreaming: boolean;
}
interface ToolCall { name: string; status: "calling" | "done"; data?: unknown; }

interface EventResult {
  id: string; title: string; startsAt: string; endsAt: string;
  isAllDay: boolean; calendar: { name: string; color: string };
}
interface SlotResult {
  startsAt: string; endsAt: string; label: string;
  score: number; durationMinutes: number;
}
interface SummaryResult {
  eventCount: number; totalMeetingHours: number;
  avgMeetingsPerDay: number; conflictCount: number;
}
interface CreateResult {
  success?: boolean; error?: string; title?: string;
  start_time?: string; htmlLink?: string; attendees?: string[];
  reconnect_url?: string;
}
interface UpdateResult {
  success?: boolean; error?: string; title?: string;
  start_time?: string; htmlLink?: string; reconnect_url?: string;
}
interface DeleteResult {
  success?: boolean; error?: string; title?: string; reconnect_url?: string;
}

export interface AssistantPanelProps {
  userName?: string | null;
  userImage?: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmtTime = (iso: string) => { try { return format(parseISO(iso), "h:mm a"); } catch { return iso; } };
const fmtDate = (iso: string) => { try { return format(parseISO(iso), "EEE, MMM d"); } catch { return iso; } };

function toolLabel(name: string) {
  const map: Record<string, string> = {
    get_events: "Checking your calendar…",
    find_free_slots: "Finding free time…",
    create_event: "Creating event…",
    update_event: "Updating event…",
    delete_event: "Deleting event…",
    get_schedule_summary: "Summarising schedule…",
  };
  return map[name] ?? "Working…";
}

// ── Tool Result Cards ──────────────────────────────────────────────────────────

function EventsCard({ data }: { data: { events: EventResult[]; count: number } }) {
  if (!data.events?.length) return null;
  return (
    <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-200 flex items-center gap-1.5">
        <Calendar className="h-3.5 w-3.5 text-gray-500" />
        <span className="text-xs font-semibold text-gray-700">
          {data.count} event{data.count !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="divide-y divide-gray-100">
        {data.events.map((e) => (
          <div key={e.id} className="flex items-start gap-2.5 px-3 py-2">
            <div className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.calendar.color }} />
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{e.title}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {e.isAllDay ? "All day" : `${fmtTime(e.startsAt)} – ${fmtTime(e.endsAt)}`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlotsCard({
  data, onSelect,
}: { data: { slots: SlotResult[]; count: number }; onSelect?: (s: SlotResult) => void }) {
  if (!data.slots?.length) return null;
  return (
    <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-200 flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5 text-gray-500" />
        <span className="text-xs font-semibold text-gray-700">
          {data.count} free slot{data.count !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="divide-y divide-gray-100">
        {data.slots.map((slot, i) => (
          <button
            key={i}
            onClick={() => onSelect?.(slot)}
            className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 transition-colors text-left group"
          >
            <div>
              <p className="text-xs font-medium text-gray-800">{slot.label}</p>
              <p className="text-[11px] text-gray-400">{fmtDate(slot.startsAt)} · {fmtTime(slot.startsAt)} – {fmtTime(slot.endsAt)}</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ data }: { data: SummaryResult }) {
  return (
    <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-200">
        <span className="text-xs font-semibold text-gray-700">Schedule overview</span>
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-gray-100">
        {[
          { v: data.eventCount, l: "Meetings" },
          { v: `${data.totalMeetingHours}h`, l: "In meetings" },
          { v: data.avgMeetingsPerDay, l: "Per day avg" },
          { v: data.conflictCount, l: "Conflicts", alert: data.conflictCount > 0 },
        ].map((item) => (
          <div key={item.l} className="px-3 py-2.5 text-center">
            <p className={`text-sm font-bold ${item.alert ? "text-red-500" : "text-gray-900"}`}>{item.v}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{item.l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionCard({
  icon: Icon, label, sublabel, link, linkText, error, iconClass, reconnectUrl,
}: {
  icon: React.ElementType; label: string; sublabel?: string; link?: string; linkText?: string;
  error?: string; iconClass?: string; reconnectUrl?: string;
}) {
  if (error) {
    return (
      <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-3 flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs text-gray-600">{error}</p>
          {reconnectUrl && (
            <a
              href={reconnectUrl}
              className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold text-white bg-primary hover:bg-primary-600 px-2.5 py-1 rounded-lg transition-colors"
            >
              Reconnect Google Calendar →
            </a>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-3 flex items-start gap-2">
      <Icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${iconClass ?? "text-green-500"}`} />
      <div>
        <p className="text-xs font-semibold text-gray-800">{label}</p>
        {sublabel && <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p>}
        {link && (
          <a href={link} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline mt-0.5 block">
            {linkText ?? "Open →"}
          </a>
        )}
      </div>
    </div>
  );
}

function CreateCard({ data }: { data: CreateResult }) {
  const sublabel = [
    data.title,
    data.start_time ? `${fmtDate(data.start_time)} at ${fmtTime(data.start_time)}` : undefined,
    data.attendees?.length ? `Guests: ${data.attendees.join(", ")}` : undefined,
  ].filter(Boolean).join(" · ");
  return (
    <ActionCard
      icon={CheckCircle}
      label="Event created"
      sublabel={sublabel}
      link={data.htmlLink}
      linkText="Open in Google Calendar →"
      error={data.error}
      reconnectUrl={data.reconnect_url}
    />
  );
}

function UpdateCard({ data }: { data: UpdateResult }) {
  return (
    <ActionCard
      icon={CheckCircle}
      label="Event updated"
      sublabel={data.title}
      link={data.htmlLink}
      linkText="Open in Google Calendar →"
      error={data.error}
      reconnectUrl={data.reconnect_url}
    />
  );
}

function DeleteCard({ data }: { data: DeleteResult }) {
  return (
    <ActionCard
      icon={CheckCircle}
      label={data.error ? "Delete failed" : "Event deleted"}
      sublabel={data.title}
      error={data.error}
      iconClass="text-red-400"
      reconnectUrl={data.reconnect_url}
    />
  );
}

function ToolResult({ tc, onSlotSelect }: { tc: ToolCall; onSlotSelect?: (s: SlotResult) => void }) {
  if (tc.status !== "done" || !tc.data) return null;
  switch (tc.name) {
    case "get_events":           return <EventsCard data={tc.data as { events: EventResult[]; count: number }} />;
    case "find_free_slots":      return <SlotsCard data={tc.data as { slots: SlotResult[]; count: number }} onSelect={onSlotSelect} />;
    case "get_schedule_summary": return <SummaryCard data={tc.data as SummaryResult} />;
    case "create_event":         return <CreateCard data={tc.data as CreateResult} />;
    case "update_event":         return <UpdateCard data={tc.data as UpdateResult} />;
    case "delete_event":         return <DeleteCard data={tc.data as DeleteResult} />;
    default: return null;
  }
}

// ── Message Bubble ─────────────────────────────────────────────────────────────

function Bubble({
  msg, onSlotSelect,
}: { msg: UIMessage; onSlotSelect: (s: SlotResult) => void }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.14 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[82%] ${isUser ? "" : "w-full"}`}>
        {(msg.text || msg.isStreaming) && (
          <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-primary text-white rounded-br-md"
              : "bg-gray-100 text-gray-800 rounded-bl-md"
          }`}>
            {msg.text}
            {msg.isStreaming && !msg.text && (
              <span className="inline-flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 bg-primary-300 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-primary-300 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-primary-300 rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            )}
            {msg.isStreaming && msg.text && (
              <span className="inline-block w-0.5 h-3.5 bg-primary-400 ml-0.5 animate-pulse align-text-bottom" />
            )}
          </div>
        )}
        {!isUser && msg.toolCalls.map((tc, i) => (
          <div key={i}>
            {tc.status === "calling" && (
              <div className="mt-1.5 flex items-center gap-2 text-[11px] text-primary-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                {toolLabel(tc.name)}
              </div>
            )}
            <ToolResult tc={tc} onSlotSelect={onSlotSelect} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  { icon: Calendar,     label: "Today's schedule",   prompt: "What do I have today?" },
  { icon: Clock,        label: "Find a free slot",    prompt: "Find me a 1-hour free slot this week" },
  { icon: Pencil,       label: "Update an event",     prompt: "I need to reschedule a meeting this week" },
  { icon: Trash2,       label: "Delete an event",     prompt: "Help me remove an event from my calendar" },
];

function EmptyState({ onSend }: { onSend: (p: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-5 py-6">
      <div className="w-11 h-11 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
        <BrainCircuit className="h-5 w-5 text-primary" />
      </div>
      <p className="text-sm font-semibold text-gray-800 mb-1">AI Scheduling Assistant</p>
      <p className="text-xs text-gray-400 text-center mb-6 leading-relaxed max-w-[220px]">
        Ask anything about your calendar — I can check, plan, and book for you.
      </p>
      <div className="grid grid-cols-2 gap-2 w-full">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            onClick={() => onSend(s.prompt)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-primary-50 hover:border-primary-200 transition-all text-left group"
          >
            <s.icon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 group-hover:text-primary transition-colors" />
            <span className="text-xs text-gray-600 font-medium leading-tight">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Voice Hook ─────────────────────────────────────────────────────────────────

function useSpeech(onResult: (t: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    setIsSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  const start = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    setVoiceError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: any = new SR();
    rec.continuous = false; rec.interimResults = false; rec.lang = "en-US";
    rec.onstart = () => setIsRecording(true);
    rec.onend   = () => setIsRecording(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => {
      setIsRecording(false);
      if (e.error === "not-allowed" || e.error === "permission-denied") {
        setVoiceError("Mic blocked — allow access in your browser settings.");
      } else if (e.error === "no-speech") {
        setVoiceError("No speech detected. Try again.");
      } else {
        setVoiceError("Voice error. Try again.");
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      setVoiceError(null);
      onResult(e.results[0]?.[0]?.transcript ?? "");
    };
    try {
      rec.start();
      ref.current = rec;
    } catch {
      setIsRecording(false);
      setVoiceError("Could not start voice input. Try again.");
    }
  }, [onResult]);

  const stop = useCallback(() => { ref.current?.stop(); setIsRecording(false); }, []);

  return { isRecording, isSupported, start, stop, voiceError };
}

// ── Audio Hook ─────────────────────────────────────────────────────────────────

function useAudio(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback((): AudioContext | null => {
    if (!enabled || typeof window === "undefined") return null;
    if (!ctxRef.current) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AC) return null;
        ctxRef.current = new AC() as AudioContext;
      } catch { return null; }
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume().catch(() => {});
    return ctxRef.current;
  }, [enabled]);

  // Single tone with gain envelope
  const n = useCallback((
    ac: AudioContext, freq: number, t0: number, dur: number,
    gain = 0.2, type: OscillatorType = "sine"
  ) => {
    const osc = ac.createOscillator(); const gn = ac.createGain();
    osc.connect(gn); gn.connect(ac.destination);
    osc.type = type;
    const t = ac.currentTime + t0;
    osc.frequency.setValueAtTime(freq, t);
    gn.gain.setValueAtTime(0, t);
    gn.gain.linearRampToValueAtTime(gain, t + 0.01);
    gn.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t); osc.stop(t + dur + 0.05);
  }, []);

  // Frequency sweep with gain envelope
  const sw = useCallback((
    ac: AudioContext, f0: number, f1: number, t0: number, dur: number,
    gain = 0.18, type: OscillatorType = "sine"
  ) => {
    const osc = ac.createOscillator(); const gn = ac.createGain();
    osc.connect(gn); gn.connect(ac.destination);
    osc.type = type;
    const t = ac.currentTime + t0;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
    gn.gain.setValueAtTime(0, t);
    gn.gain.linearRampToValueAtTime(gain, t + 0.01);
    gn.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t); osc.stop(t + dur + 0.05);
  }, []);

  // Send: quick rising ping
  const playSend     = useCallback(() => { const ac = getCtx(); if (!ac) return; sw(ac, 380, 760, 0, 0.1, 0.16); n(ac, 880, 0.08, 0.12, 0.1); }, [getCtx, n, sw]);
  // Receive: soft descending chime
  const playReceive  = useCallback(() => { const ac = getCtx(); if (!ac) return; n(ac, 659, 0, 0.22, 0.15); n(ac, 523, 0.11, 0.28, 0.1); }, [getCtx, n]);
  // Thinking: 3 quiet ticks
  const playThinking = useCallback(() => { const ac = getCtx(); if (!ac) return; [0, 0.15, 0.30].forEach((t) => n(ac, 320, t, 0.07, 0.07, "triangle")); }, [getCtx, n]);
  // Success: C-E-G arpeggio
  const playSuccess  = useCallback(() => { const ac = getCtx(); if (!ac) return; n(ac, 523, 0, 0.2, 0.2); n(ac, 659, 0.1, 0.2, 0.16); n(ac, 784, 0.2, 0.3, 0.14); }, [getCtx, n]);
  // Delete: descending sweep
  const playDelete   = useCallback(() => { const ac = getCtx(); if (!ac) return; sw(ac, 440, 180, 0, 0.22, 0.16); }, [getCtx, sw]);
  // Panel open: bubble pop up
  const playOpen     = useCallback(() => { const ac = getCtx(); if (!ac) return; sw(ac, 180, 560, 0, 0.07, 0.14); n(ac, 700, 0.06, 0.13, 0.1); }, [getCtx, n, sw]);
  // Panel close: pop down
  const playClose    = useCallback(() => { const ac = getCtx(); if (!ac) return; sw(ac, 480, 200, 0, 0.1, 0.12); }, [getCtx, sw]);
  // Mic on: rising beep
  const playMicOn    = useCallback(() => { const ac = getCtx(); if (!ac) return; n(ac, 440, 0, 0.07, 0.18); n(ac, 660, 0.07, 0.1, 0.14); }, [getCtx, n]);
  // Mic off: falling beep
  const playMicOff   = useCallback(() => { const ac = getCtx(); if (!ac) return; n(ac, 440, 0, 0.07, 0.14); n(ac, 330, 0.07, 0.12, 0.1); }, [getCtx, n]);
  // Error: low warning dip
  const playError    = useCallback(() => { const ac = getCtx(); if (!ac) return; n(ac, 220, 0, 0.28, 0.18, "triangle"); n(ac, 196, 0.15, 0.28, 0.13, "triangle"); }, [getCtx, n]);

  return useMemo(
    () => ({ playSend, playReceive, playThinking, playSuccess, playDelete, playOpen, playClose, playMicOn, playMicOff, playError }),
    [playSend, playReceive, playThinking, playSuccess, playDelete, playOpen, playClose, playMicOn, playMicOff, playError]
  );
}

// ── Panel ──────────────────────────────────────────────────────────────────────

export function AssistantPanel({ userName, userImage }: AssistantPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const endRef   = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const displayName = userName ?? "there";

  // Always-current ref so sendMessage doesn't need sounds in its dep array
  const sounds = useAudio(soundEnabled);
  const soundsRef = useRef(sounds);
  soundsRef.current = sounds;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 180);
  }, [isOpen]);

  const { isRecording, isSupported, start: startRec, stop: stopRec, voiceError } = useSpeech(
    useCallback((text: string) => {
      setInput(text);
      inputRef.current?.focus();
    }, [])
  );

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    setInput("");
    setIsLoading(true);

    const userMsg: UIMessage = { id: crypto.randomUUID(), role: "user",      text: text.trim(), toolCalls: [], isStreaming: false };
    const asstMsg: UIMessage = { id: crypto.randomUUID(), role: "assistant", text: "",          toolCalls: [], isStreaming: true  };

    setMessages((prev) => [...prev, userMsg, asstMsg]);
    soundsRef.current.playSend();

    const history = [...messages, userMsg]
      .filter((m) => m.text.trim())
      .map((m) => ({ role: m.role, content: m.text }));

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, timezone }),
      });
      if (!res.ok || !res.body) throw new Error("Could not reach AI assistant");

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let hasPlayedReceive = false;
      let hasPlayedThinking = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const ev = JSON.parse(line.slice(6)) as {
              type: string; delta?: string; name?: string; data?: unknown; message?: string;
            };

            // 🔊 Sound triggers (outside setMessages to avoid closure issues)
            if (ev.type === "text" && ev.delta && !hasPlayedReceive) {
              soundsRef.current.playReceive(); hasPlayedReceive = true;
            } else if (ev.type === "tool_call" && !hasPlayedThinking) {
              soundsRef.current.playThinking(); hasPlayedThinking = true;
            } else if (ev.type === "tool_result") {
              const d = ev.data as Record<string, unknown> | undefined;
              if (d?.success) {
                if (ev.name === "delete_event") soundsRef.current.playDelete();
                else soundsRef.current.playSuccess();
              }
            } else if (ev.type === "error") {
              soundsRef.current.playError();
            }

            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (!last || last.role !== "assistant") return prev;
              const u = { ...last };
              if (ev.type === "text" && ev.delta)          u.text = last.text + ev.delta;
              else if (ev.type === "tool_call" && ev.name) u.toolCalls = [...last.toolCalls, { name: ev.name, status: "calling" }];
              else if (ev.type === "tool_result" && ev.name)
                u.toolCalls = last.toolCalls.map((tc) =>
                  tc.name === ev.name && tc.status === "calling" ? { ...tc, status: "done", data: ev.data } : tc
                );
              else if (ev.type === "done")  u.isStreaming = false;
              else if (ev.type === "error") { u.text = ev.message ?? "Something went wrong."; u.isStreaming = false; }
              next[next.length - 1] = u;
              return next;
            });
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      soundsRef.current.playError();
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === "assistant")
          next[next.length - 1] = { ...last, text: err instanceof Error ? err.message : "Something went wrong.", isStreaming: false };
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages]);

  const handleSlotSelect = useCallback((slot: SlotResult) => {
    setInput(`Schedule a meeting on ${fmtDate(slot.startsAt)} at ${fmtTime(slot.startsAt)}`);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <>
      {/* ── Floating button ── */}
      <motion.button
        onClick={() => {
          if (!isOpen) soundsRef.current.playOpen();
          else soundsRef.current.playClose();
          setIsOpen((o) => !o);
        }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        aria-label="AI Assistant"
        className="fixed bottom-10 right-6 z-50 w-13 h-13 flex items-center justify-center rounded-2xl bg-primary hover:bg-primary-600 transition-colors"
        style={{ width: 52, height: 52 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.14 }}>
              <X className="h-5 w-5 text-white" />
            </motion.div>
          ) : (
            <motion.div key="b" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.14 }}>
              <BrainCircuit className="h-5 w-5 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{   opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed bottom-[92px] right-6 z-50 flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden"
            style={{ width: 380, height: 560 }}
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 h-14 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center">
                  <BrainCircuit className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900 leading-none">AI Assistant</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-none">
                    {isLoading ? (
                      <span className="flex items-center gap-1">
                        <span className="inline-block w-1 h-1 bg-primary-300 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="inline-block w-1 h-1 bg-primary-300 rounded-full animate-bounce [animation-delay:100ms]" />
                        <span className="inline-block w-1 h-1 bg-primary-300 rounded-full animate-bounce [animation-delay:200ms]" />
                      </span>
                    ) : "Powered by Claude"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSoundEnabled((s) => !s)}
                  title={soundEnabled ? "Mute sounds" : "Enable sounds"}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {soundEnabled
                    ? <Volume2 className="h-3.5 w-3.5" />
                    : <VolumeX className="h-3.5 w-3.5" />}
                </button>
                <Avatar
                  src={userImage ?? undefined}
                  name={displayName}
                  size="sm"
                />
                <button
                  onClick={() => { soundsRef.current.playClose(); setIsOpen(false); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages / Empty state */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {messages.length === 0 ? (
                <EmptyState onSend={sendMessage} />
              ) : (
                <div className="px-4 py-4 space-y-3">
                  {messages.map((msg) => (
                    <Bubble key={msg.id} msg={msg} onSlotSelect={handleSlotSelect} />
                  ))}
                  <div ref={endRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex-shrink-0 border-t border-gray-100 p-3">
              <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-primary-300 focus-within:bg-white transition-all">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
                  }}
                  onKeyDown={onKey}
                  placeholder={isRecording ? "Listening…" : "Ask about your schedule…"}
                  disabled={isLoading || isRecording}
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none leading-5 max-h-24 disabled:opacity-50"
                  style={{ height: "20px" }}
                />

                {/* Mic */}
                {isSupported && (
                  <button
                    onClick={() => {
                      if (isRecording) { stopRec(); soundsRef.current.playMicOff(); }
                      else { startRec(); soundsRef.current.playMicOn(); }
                    }}
                    disabled={isLoading}
                    title={isRecording ? "Stop recording" : voiceError ? voiceError : "Voice input"}
                    className={`relative flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      isRecording
                        ? "bg-red-500"
                        : voiceError
                        ? "text-red-400 hover:text-red-500 hover:bg-red-50"
                        : "text-gray-400 hover:text-primary hover:bg-primary-50"
                    }`}
                  >
                    {isRecording && (
                      <span className="absolute inset-0 rounded-lg bg-red-400 animate-ping opacity-50" />
                    )}
                    {isRecording ? (
                      <Mic className="h-3.5 w-3.5 relative z-10 text-white" />
                    ) : voiceError ? (
                      <MicOff className="h-3.5 w-3.5 relative z-10" />
                    ) : (
                      <Mic className="h-3.5 w-3.5 relative z-10" />
                    )}
                  </button>
                )}

                {/* Send */}
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary hover:bg-primary-600 disabled:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  {isLoading
                    ? <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                    : <Send    className="h-3.5 w-3.5 text-white" />
                  }
                </button>
              </div>
              {voiceError ? (
                <p className="text-center text-[10px] text-red-400 mt-1.5">{voiceError}</p>
              ) : (
                <p className="text-center text-[10px] text-gray-300 mt-1.5">
                  Enter to send · Shift+Enter for new line
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
