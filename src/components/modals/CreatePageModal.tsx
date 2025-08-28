"use client";

import React, { useState } from "react";
import { useModal } from "@/contexts/ModalContext";
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
import { Textarea } from "@/components/ui/textarea";
import { useCreatePage } from "@/lib/api/hooks";

interface PageFormData {
  title: string;
  description: string;
}

export default function CreatePageModal() {
  const { isModalOpen, closeModal } = useModal();
  const createPage = useCreatePage();
  const [formData, setFormData] = useState<PageFormData>({
    title: "",
    description: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      return;
    }

    try {
      await createPage.mutateAsync({
        title: formData.title.trim(),
        description: formData.description.trim() || null,
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
      });

      // Close modal
      closeModal();
    } catch (error) {
      // Error handling is done in the hook with toast notifications
      console.error("Failed to create page:", error);
    }
  };

  const handleClose = () => {
    if (!createPage.isPending) {
      setFormData({
        title: "",
        description: "",
      });
      closeModal();
    }
  };

  return (
    <Dialog open={isModalOpen("CREATE_PAGE")} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Page</DialogTitle>
          <DialogDescription>
            Create a new event page to start managing your events.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Page Title</Label>
            <Input
              id="title"
              name="title"
              type="text"
              placeholder="Enter page title"
              value={formData.title}
              onChange={handleInputChange}
              disabled={createPage.isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe your event page..."
              value={formData.description}
              onChange={handleInputChange}
              disabled={createPage.isPending}
              className="min-h-[80px]"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createPage.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createPage.isPending || !formData.title.trim()}
              className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
            >
              {createPage.isPending ? "Creating..." : "Create Page"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
