"use client";

import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TimeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function TimeInput({ label, value, onChange }: TimeInputProps) {
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");

  const hoursRef = useRef<HTMLInputElement>(null);
  const minutesRef = useRef<HTMLInputElement>(null);
  const secondsRef = useRef<HTMLInputElement>(null);

  // Parse incoming value and update individual fields
  useEffect(() => {
    const isValidTime = (v: string) =>
      /^(\d{1,3}):(\d{1,2}):(\d{1,2})$/.test(v);
    if (!value || !isValidTime(value)) {
      // Default or invalid external value → show empty inputs
      setHours("");
      setMinutes("");
      setSeconds("");
      return;
    }

    const parts = value.split(":");
    // Clamp and normalize
    const h = Math.max(0, Math.min(24, parseInt(parts[0] || "0", 10)));
    const m = Math.max(0, Math.min(59, parseInt(parts[1] || "0", 10)));
    const s = Math.max(0, Math.min(59, parseInt(parts[2] || "0", 10)));
    setHours(h.toString());
    setMinutes(m.toString());
    setSeconds(s.toString());
  }, [value]);

  // Update parent component when any field changes
  const updateParent = (h: string, m: string, s: string) => {
    const anyVal =
      (h?.length || 0) > 0 || (m?.length || 0) > 0 || (s?.length || 0) > 0;
    if (!anyVal) {
      onChange("");
      return;
    }
    const hh = h && h.length > 0 ? h.padStart(2, "0") : "00";
    const mm = m && m.length > 0 ? m.padStart(2, "0") : "00";
    const ss = s && s.length > 0 ? s.padStart(2, "0") : "00";
    onChange(`${hh}:${mm}:${ss}`);
  };

  // Validate and constrain input values
  const validateInput = (value: string, max: number): string => {
    if (value.trim() === "") return "";
    const num = parseInt(value, 10);
    if (isNaN(num)) return "";
    return Math.min(Math.max(0, num), max).toString().padStart(2, "0");
  };

  // Handle input changes with auto-navigation
  const handleInputChange = (
    value: string,
    setter: (val: string) => void,
    nextRef: React.RefObject<HTMLInputElement | null> | null,
  ) => {
    // Only allow digits
    const numericValue = value.replace(/\D/g, "");

    // Limit to 2 digits
    const limitedValue = numericValue.slice(0, 2);

    setter(limitedValue);

    // Auto-advance to next field when 2 digits are entered
    if (limitedValue.length === 2 && nextRef?.current) {
      nextRef.current.focus();
      nextRef.current.select();
    }

    // Update parent with current values
    const currentHours = setter === setHours ? limitedValue : hours;
    const currentMinutes = setter === setMinutes ? limitedValue : minutes;
    const currentSeconds = setter === setSeconds ? limitedValue : seconds;

    updateParent(currentHours, currentMinutes, currentSeconds);
  };

  // Handle blur events with validation and padding
  const handleBlur = (
    value: string,
    setter: (val: string) => void,
    maxValue: number,
  ) => {
    const validatedValue = validateInput(value, maxValue);
    setter(validatedValue);

    const currentHours = setter === setHours ? validatedValue : hours;
    const currentMinutes = setter === setMinutes ? validatedValue : minutes;
    const currentSeconds = setter === setSeconds ? validatedValue : seconds;

    updateParent(currentHours, currentMinutes, currentSeconds);
  };

  // Handle keyboard navigation
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    currentRef: React.RefObject<HTMLInputElement | null>,
    nextRef: React.RefObject<HTMLInputElement | null> | null,
    prevRef: React.RefObject<HTMLInputElement | null> | null,
    value: string,
    setter: (val: string) => void,
    maxValue: number,
  ) => {
    switch (e.key) {
      case ":":
        e.preventDefault();
        if (nextRef?.current) {
          nextRef.current.focus();
          nextRef.current.select();
        }
        break;

      case "Backspace":
        if (value === "" && prevRef?.current) {
          e.preventDefault();
          prevRef.current.focus();
          prevRef.current.select();
        }
        break;

      case "ArrowUp":
        e.preventDefault();
        const currentUp = parseInt(value || "0", 10);
        const newUpValue = Math.min(currentUp + 1, maxValue);
        setter(newUpValue.toString().padStart(2, "0"));
        updateParent(
          setter === setHours ? newUpValue.toString().padStart(2, "0") : hours,
          setter === setMinutes
            ? newUpValue.toString().padStart(2, "0")
            : minutes,
          setter === setSeconds
            ? newUpValue.toString().padStart(2, "0")
            : seconds,
        );
        break;

      case "ArrowDown":
        e.preventDefault();
        const currentDown = parseInt(value || "0", 10);
        const newDownValue = Math.max(currentDown - 1, 0);
        setter(newDownValue.toString().padStart(2, "0"));
        updateParent(
          setter === setHours
            ? newDownValue.toString().padStart(2, "0")
            : hours,
          setter === setMinutes
            ? newDownValue.toString().padStart(2, "0")
            : minutes,
          setter === setSeconds
            ? newDownValue.toString().padStart(2, "0")
            : seconds,
        );
        break;

      case "ArrowLeft":
        if (currentRef.current?.selectionStart === 0 && prevRef?.current) {
          e.preventDefault();
          prevRef.current.focus();
          prevRef.current.setSelectionRange(
            prevRef.current.value.length,
            prevRef.current.value.length,
          );
        }
        break;

      case "ArrowRight":
        if (
          currentRef.current?.selectionStart ===
            currentRef.current?.value.length &&
          nextRef?.current
        ) {
          e.preventDefault();
          nextRef.current.focus();
          nextRef.current.setSelectionRange(0, 0);
        }
        break;
    }
  };

  // Calculate total minutes for display
  const safeParse = (v: string) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : 0;
  };
  const totalMinutes =
    safeParse(hours) * 60 + safeParse(minutes) + safeParse(seconds) / 60;

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        {label}
        {totalMinutes > 0 && (
          <span className="text-xs text-gray-500 font-normal">
            ({totalMinutes.toFixed(1)}m)
          </span>
        )}
      </Label>

      <div className="flex items-center gap-1">
        {/* Hours */}
        <div className="flex flex-col items-center">
          <Input
            ref={hoursRef}
            type="text"
            inputMode="numeric"
            value={hours}
            onChange={(e) =>
              handleInputChange(e.target.value, setHours, minutesRef)
            }
            onBlur={(e) => handleBlur(e.target.value, setHours, 24)}
            onKeyDown={(e) =>
              handleKeyDown(e, hoursRef, minutesRef, null, hours, setHours, 24)
            }
            onFocus={(e) => e.target.select()}
            className="w-16 text-center"
            maxLength={2}
            placeholder="00"
          />
          <span className="text-xs text-gray-500 mt-1">HH</span>
        </div>

        <span className="text-lg font-mono pb-5">:</span>

        {/* Minutes */}
        <div className="flex flex-col items-center">
          <Input
            ref={minutesRef}
            type="text"
            inputMode="numeric"
            value={minutes}
            onChange={(e) =>
              handleInputChange(e.target.value, setMinutes, secondsRef)
            }
            onBlur={(e) => handleBlur(e.target.value, setMinutes, 59)}
            onKeyDown={(e) =>
              handleKeyDown(
                e,
                minutesRef,
                secondsRef,
                hoursRef,
                minutes,
                setMinutes,
                59,
              )
            }
            onFocus={(e) => e.target.select()}
            className="w-16 text-center"
            maxLength={2}
            placeholder="00"
          />
          <span className="text-xs text-gray-500 mt-1">MM</span>
        </div>

        <span className="text-lg font-mono pb-5">:</span>

        {/* Seconds */}
        <div className="flex flex-col items-center">
          <Input
            ref={secondsRef}
            type="text"
            inputMode="numeric"
            value={seconds}
            onChange={(e) =>
              handleInputChange(e.target.value, setSeconds, null)
            }
            onBlur={(e) => handleBlur(e.target.value, setSeconds, 59)}
            onKeyDown={(e) =>
              handleKeyDown(
                e,
                secondsRef,
                null,
                minutesRef,
                seconds,
                setSeconds,
                59,
              )
            }
            onFocus={(e) => e.target.select()}
            className="w-16 text-center"
            maxLength={2}
            placeholder="00"
          />
          <span className="text-xs text-gray-500 mt-1">SS</span>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Enter time in HH:MM:SS format. Use : to move forward, arrow keys to
        adjust values.
      </p>
    </div>
  );
}
