"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error";

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ message, variant = "success", onDismiss, duration = 3000 }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation on mount
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 200);
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onDismiss]);

  return (
    <div
      className={cn(
        "fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-white border rounded-xl shadow-modal px-4 py-3 text-sm font-medium transition-all duration-200",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        variant === "success" ? "border-green-200 text-green-800" : "border-red-200 text-red-800"
      )}
    >
      {variant === "success" ? (
        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
      ) : (
        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
      )}
      <span>{message}</span>
      <button onClick={() => { setVisible(false); setTimeout(onDismiss, 200); }} className="ml-1 text-gray-400 hover:text-gray-600">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// Hook for managing toast state
export function useToast() {
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const show = (message: string, variant: ToastVariant = "success") => {
    setToast({ message, variant });
  };

  const dismiss = () => setToast(null);

  return { toast, show, dismiss };
}
