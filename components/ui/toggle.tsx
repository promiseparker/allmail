"use client";

import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  id?: string;
}

export function Toggle({ checked, onChange, disabled = false, label, description, id }: ToggleProps) {
  const inputId = id ?? label;

  return (
    <div className="flex items-center justify-between gap-4 py-1">
      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && (
            <label
              htmlFor={inputId}
              className={cn(
                "text-sm text-gray-700 cursor-pointer select-none",
                disabled && "text-gray-400 cursor-not-allowed"
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-gray-400 mt-0.5">{description}</p>
          )}
        </div>
      )}
      <button
        id={inputId}
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={cn(
          "relative inline-flex w-9 h-5 rounded-full flex-shrink-0 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
          checked ? "bg-primary" : "bg-gray-200",
          disabled && "opacity-40 cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked && "translate-x-4"
          )}
        />
      </button>
    </div>
  );
}
