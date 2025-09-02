"use client";

import React, { useState, useRef } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCreatePage } from "@/lib/api/hooks";
import PageImagePicker from "@/components/PageImagePicker";

interface PageFormData {
  title: string;
  description: string;
  pageType: "public" | "private";
  pin: string;
  imageBlob?: Blob | null;
}

export default function CreatePageModal() {
  const { isModalOpen, closeModal } = useModal();
  const createPage = useCreatePage();
  const [formData, setFormData] = useState<PageFormData>({
    title: "",
    description: "",
    pageType: "public",
    pin: "",
    imageBlob: null,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePageTypeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      pageType: value as "public" | "private",
      pin: value === "public" ? "" : prev.pin,
    }));
  };

  const handleImageChange = (blob: Blob | null) => {
    setFormData((prev) => ({ ...prev, imageBlob: blob }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      return;
    }

    if (formData.pageType === "private" && !formData.pin.trim()) {
      return;
    }

    try {
      await createPage.mutateAsync({
        pageData: {
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          is_private: formData.pageType === "private",
          pin: formData.pageType === "private" ? formData.pin.trim() : null,
        },
        imageFile: formData.imageBlob
          ? new File([formData.imageBlob], "page-image.jpg", {
              type: "image/jpeg",
            })
          : undefined,
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        pageType: "public",
        pin: "",
        imageBlob: null,
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
        pageType: "public",
        pin: "",
        imageBlob: null,
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

          <div className="space-y-2">
            <Label>Page Banner (Optional)</Label>
            <PageImagePicker
              onImageChange={handleImageChange}
              maxSize={5 * 1024 * 1024}
              aspectRatio={16 / 9}
            />
          </div>

          <div className="space-y-3">
            <Label>Page Type</Label>
            <RadioGroup
              value={formData.pageType}
              onValueChange={handlePageTypeChange}
              disabled={createPage.isPending}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public" className="cursor-pointer">
                  Public
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private" className="cursor-pointer">
                  Private (requires PIN)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {formData.pageType === "private" && (
            <div className="space-y-2">
              <Label htmlFor="pin">Enter PIN</Label>
              <Input
                id="pin"
                name="pin"
                type="text"
                placeholder="Enter PIN for private page"
                value={formData.pin}
                onChange={handleInputChange}
                disabled={createPage.isPending}
                required
              />
            </div>
          )}

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
              disabled={
                createPage.isPending ||
                !formData.title.trim() ||
                (formData.pageType === "private" && !formData.pin.trim())
              }
            >
              {createPage.isPending ? "Creating..." : "Create Page"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
