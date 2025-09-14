"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DateTimePickerFormProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onDateChange: (date: Date | null) => void;
  onTimeChange: (time: string | null) => void;
}

export default function DateTimePickerForm({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
}: DateTimePickerFormProps) {
  const today = new Date();
  const [date, setDate] = useState<Date>(selectedDate || today);
  const [time, setTime] = useState<string | null>(selectedTime);

  // Update local state when props change
  useEffect(() => {
    if (selectedDate) setDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    setTime(selectedTime);
  }, [selectedTime]);

  // Generate 24-hour time slots from 00:00 to 23:30
  const timeSlots = Array.from({ length: 48 }, (_, index) => {
    const hour = Math.floor(index / 2);
    const minute = (index % 2) * 30;
    const timeString = `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
    return { time: timeString, available: true };
  });

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      onDateChange(newDate);
      // Reset time when date changes
      setTime(null);
      onTimeChange(null);
    }
  };

  const handleTimeSelect = (timeSlot: string) => {
    setTime(timeSlot);
    onTimeChange(timeSlot);
  };

  return (
    <div className="rounded-md border">
      <div className="flex max-sm:flex-col">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          className="p-2 sm:pe-5"
          disabled={[
            { before: today }, // Dates before today
          ]}
        />
        <div className="relative w-full max-sm:h-48 sm:w-40">
          <div className="absolute inset-0 py-4 max-sm:border-t">
            <ScrollArea className="h-full sm:border-s">
              <div className="space-y-3">
                <div className="flex h-5 shrink-0 items-center px-5">
                  <p className="text-sm font-medium">
                    {format(date, "EEEE, d")}
                  </p>
                </div>
                <div className="grid gap-1.5 px-5 max-sm:grid-cols-2">
                  {timeSlots.map(({ time: timeSlot, available }) => (
                    <Button
                      key={timeSlot}
                      variant={time === timeSlot ? "default" : "outline"}
                      size="sm"
                      className="w-full"
                      onClick={() => handleTimeSelect(timeSlot)}
                      disabled={!available}
                    >
                      {timeSlot}
                    </Button>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
