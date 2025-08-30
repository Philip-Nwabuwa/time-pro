"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Plus } from "lucide-react";

interface AddTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (additionalSeconds: number) => void;
  currentTime: string;
  isLoading?: boolean;
}

export default function AddTimeModal({
  isOpen,
  onClose,
  onConfirm,
  currentTime,
  isLoading = false,
}: AddTimeModalProps) {
  const [additionalTime, setAdditionalTime] = useState("30");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    const seconds = Number(additionalTime);

    if (isNaN(seconds) || seconds < 0) {
      setError("Please enter a valid number of seconds");
      return;
    }

    if (seconds > 3600) {
      // Max 1 hour
      setError("Maximum additional time is 3600 seconds (1 hour)");
      return;
    }

    setError("");
    onConfirm(seconds);
  };

  const handleCancel = () => {
    if (!isLoading) {
      setError("");
      setAdditionalTime("30");
      onClose();
    }
  };

  const handleSkip = () => {
    if (!isLoading) {
      setError("");
      setAdditionalTime("30");
      onConfirm(0); // Add 0 seconds (skip)
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdditionalTime(e.target.value);
    if (error) setError("");
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const presetTimes = [15, 30, 60, 120, 300]; // 15s, 30s, 1m, 2m, 5m

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 text-blue-500">
              <Clock className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Add Time to Clock
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-600 mt-2">
            Timer stopped at <span className="font-medium">{currentTime}</span>.
            Would you like to add additional time to the clock?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="additionalTime">Additional time (seconds)</Label>
            <Input
              id="additionalTime"
              type="number"
              value={additionalTime}
              onChange={handleInputChange}
              placeholder="Enter seconds"
              min="0"
              max="3600"
              disabled={isLoading}
              className={error ? "border-red-500 focus:ring-red-500" : ""}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-600">Quick presets:</Label>
            <div className="flex flex-wrap gap-2">
              {presetTimes.map((seconds) => (
                <Button
                  key={seconds}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAdditionalTime(seconds.toString())}
                  disabled={isLoading}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {formatTime(seconds)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
            disabled={isLoading}
            className="flex-1 sm:flex-none"
          >
            Skip
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
          >
            {isLoading ? "Adding..." : "Add Time"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
