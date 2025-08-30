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
import { Lock } from "lucide-react";

interface JoinPrivatePageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (pin: string) => Promise<void>;
  pageTitle: string;
  isLoading: boolean;
}

export default function JoinPrivatePageModal({
  isOpen,
  onClose,
  onJoin,
  pageTitle,
  isLoading,
}: JoinPrivatePageModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pin.trim()) {
      setError("PIN is required");
      return;
    }

    try {
      setError("");
      await onJoin(pin.trim());
      setPin("");
      onClose();
    } catch (error) {
      setError("Invalid PIN. Please try again.");
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setPin("");
      setError("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Lock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <DialogTitle>Join Private Page</DialogTitle>
              <DialogDescription className="mt-1">
                Enter the PIN to join "{pageTitle}"
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              name="pin"
              type="text"
              placeholder="Enter the page PIN"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (error) setError("");
              }}
              disabled={isLoading}
              required
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !pin.trim()}
              className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
            >
              {isLoading ? "Joining..." : "Join Page"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}