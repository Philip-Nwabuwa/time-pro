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
import { ImageIcon, X } from "lucide-react";

interface PageFormData {
  title: string;
  description: string;
  pageType: "public" | "private";
  pin: string;
  image?: File;
}

export default function CreatePageModal() {
  const { isModalOpen, closeModal } = useModal();
  const createPage = useCreatePage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<PageFormData>({
    title: "",
    description: "",
    pageType: "public",
    pin: "",
    image: undefined,
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

  const handlePageTypeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      pageType: value as "public" | "private",
      pin: value === "public" ? "" : prev.pin,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        return;
      }

      setFormData((prev) => ({ ...prev, image: file }));

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image: undefined }));
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
        imageFile: formData.image,
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        pageType: "public",
        pin: "",
        image: undefined,
      });
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

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
        image: undefined,
      });
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
            <Label htmlFor="image">Page Image (Optional)</Label>
            <div className="space-y-2">
              {previewUrl ? (
                <div className="relative inline-block">
                  <img
                    src={previewUrl}
                    alt="Page preview"
                    className="h-24 w-24 rounded-lg object-cover border"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    disabled={createPage.isPending}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    Click to upload an image
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Max 5MB • JPG, PNG, GIF
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={createPage.isPending}
                className="hidden"
              />
            </div>
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
