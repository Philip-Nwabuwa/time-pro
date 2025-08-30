"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EndMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pendingItems: Array<{
    id: string;
    title: string;
    role: string;
  }>;
  isLoading?: boolean;
}

export default function EndMeetingModal({
  isOpen,
  onClose,
  onConfirm,
  pendingItems,
  isLoading = false,
}: EndMeetingModalProps) {
  const hasPendingItems = pendingItems.length > 0;

  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`flex-shrink-0 ${hasPendingItems ? "text-yellow-500" : "text-green-500"}`}
            >
              {hasPendingItems ? (
                <AlertTriangle className="h-6 w-6" />
              ) : (
                <CheckCircle className="h-6 w-6" />
              )}
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              End Meeting
            </DialogTitle>
          </div>

          {hasPendingItems ? (
            <DialogDescription className="text-gray-600 mt-2">
              This meeting still has{" "}
              <span className="font-medium text-yellow-600">
                {pendingItems.length} pending item(s)
              </span>
              . Ending the meeting will automatically mark these items as
              cancelled.
            </DialogDescription>
          ) : (
            <DialogDescription className="text-gray-600 mt-2">
              All agenda items have been completed. Are you sure you want to end
              this meeting?
            </DialogDescription>
          )}
        </DialogHeader>

        {hasPendingItems && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">
              Pending items:
            </div>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {pendingItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-yellow-50 rounded-md border border-yellow-200"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-gray-900">{item.title}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs text-yellow-700 border-yellow-300"
                  >
                    {item.role}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-md">
              💡 These items will be marked as "Cancelled" and can be reviewed
              later.
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-3 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 sm:flex-none"
          >
            Continue Meeting
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 sm:flex-none ${
              hasPendingItems
                ? "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500"
                : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
            }`}
          >
            {isLoading ? "Ending Meeting..." : "End Meeting"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
