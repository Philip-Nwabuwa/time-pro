"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TimeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function TimeInput({
  label,
  value,
  onChange,
  placeholder = "0:05",
}: TimeInputProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const parseAndFormatTime = (
    input: string,
  ): { formatted: string; isValid: boolean } => {
    if (!input.trim()) {
      return { formatted: "", isValid: true };
    }

    // Remove any non-digit and non-colon characters
    const cleaned = input.replace(/[^\d:]/g, "");

    // Handle different input formats
    if (cleaned.includes(":")) {
      // Format: HH:MM or H:MM
      const parts = cleaned.split(":");
      const hours = parseInt(parts[0] || "0", 10);
      const minutes = parseInt(parts[1] || "0", 10);

      if (isNaN(hours) || isNaN(minutes) || minutes >= 60 || hours > 999) {
        return { formatted: input, isValid: false };
      }

      return {
        formatted: `${hours}:${minutes.toString().padStart(2, "0")}`,
        isValid: true,
      };
    } else {
      // Just numbers - treat as minutes, convert to hours:minutes
      const totalMinutes = parseInt(cleaned, 10);

      if (isNaN(totalMinutes) || totalMinutes > 59999) {
        return { formatted: input, isValid: false };
      }

      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      return {
        formatted: `${hours}:${minutes.toString().padStart(2, "0")}`,
        isValid: true,
      };
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setDisplayValue(input);

    const { formatted, isValid } = parseAndFormatTime(input);
    setIsValid(isValid);

    if (isValid) {
      onChange(formatted);
    }
  };

  const handleBlur = () => {
    if (isValid && displayValue) {
      const { formatted } = parseAndFormatTime(displayValue);
      setDisplayValue(formatted);
    }
  };

  const getMinutesFromTimeString = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(":").map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  };

  const minutes = getMinutesFromTimeString(displayValue);

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        {label}
        {minutes > 0 && (
          <span className="text-xs text-gray-500 font-normal">
            ({minutes}m)
          </span>
        )}
      </Label>
      <Input
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`${!isValid ? "border-red-500" : ""}`}
      />
      {!isValid && (
        <p className="text-xs text-red-500">
          Enter time as minutes (e.g., "5" for 5 minutes) or HH:MM format
        </p>
      )}
      <p className="text-xs text-gray-500">
        Format: HH:MM (e.g., "0:05" for 5 minutes, or just "5" for 5 minutes)
      </p>
    </div>
  );
}
