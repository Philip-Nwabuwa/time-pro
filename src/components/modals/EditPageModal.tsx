"use client";

import React, { useState, useEffect } from "react";
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
import { useUpdatePage } from "@/lib/api/hooks";
import { uploadPageImage } from "@/lib/api/pages";
import PageImagePicker from "@/components/PageImagePicker";
import type { PageData } from "@/lib/api/types";

interface EditPageFormData {
  title: string;
  description: string;
  pageType: "public" | "private";
  pin: string;
  imageBlob?: Blob | null;
}

interface EditPageModalProps {
  pageData: PageData | null;
  onClose: () => void;
}

export default function EditPageModal({
  pageData,
  onClose,
}: EditPageModalProps) {
  const { isModalOpen } = useModal();
  const updatePage = useUpdatePage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<EditPageFormData>({
    title: "",
    description: "",
    pageType: "public",
    pin: "",
    imageBlob: null,
  });

  // Initialize form data when pageData changes
  useEffect(() => {
    if (pageData) {
      setFormData({
        title: pageData.title,
        description: pageData.desc || "",
        pageType: "public", // We'll need to determine this from the API
        pin: "",
        imageBlob: null,
      });
    }
  }, [pageData]);

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

    if (!pageData || !formData.title.trim()) {
      return;
    }

    if (formData.pageType === "private" && !formData.pin.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);
      // Prepare update data - only include fields that have changed
      const updates: any = {};

      if (formData.title.trim() !== pageData.title) {
        updates.title = formData.title.trim();
      }

      if ((formData.description.trim() || null) !== pageData.desc) {
        updates.description = formData.description.trim() || null;
      }

      // Handle image upload if a new image was selected
      if (formData.imageBlob) {
        const blobType = (formData.imageBlob as any).type || "image/jpeg";
        const ext = blobType.split("/")[1] || "jpg";
        const imageFile = new File([formData.imageBlob], `page-image.${ext}`, {
          type: blobType,
        });

        const { filePath, publicUrl } = await uploadPageImage(
          imageFile,
          pageData.id
        );
        updates.image_url = publicUrl;
        updates.image_file_path = filePath;
      }

      // Add private page logic when needed
      if (formData.pageType === "private" && formData.pin.trim()) {
        updates.is_private = true;
        updates.pin = formData.pin.trim();
      }

      // If nothing changed, just close without calling the API
      if (Object.keys(updates).length === 0) {
        onClose();
        return;
      }

      await updatePage.mutateAsync({ id: pageData.id, updates });

      // Reset form and close modal
      setFormData({
        title: "",
        description: "",
        pageType: "public",
        pin: "",
        imageBlob: null,
      });
      onClose();
    } catch (error) {
      // Error handling is done in the hook with toast notifications
      console.error("Failed to update page:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!updatePage.isPending) {
      setFormData({
        title: "",
        description: "",
        pageType: "public",
        pin: "",
        imageBlob: null,
      });
      onClose();
    }
  };

  if (!pageData) {
    return null;
  }

  return (
    <Dialog open={isModalOpen("EDIT_PAGE")} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Page</DialogTitle>
          <DialogDescription>
            Update your event page information.
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
              disabled={isSubmitting || updatePage.isPending}
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
              disabled={isSubmitting || updatePage.isPending}
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Page Banner</Label>
            <PageImagePicker
              initialImageUrl={pageData.imageUrl || null}
              onImageChange={handleImageChange}
              maxSize={5 * 1024 * 1024}
              aspectRatio={16 / 9}
            />
          </div>

          {/* Future: Add page type section when private pages are fully implemented
          <div className="space-y-3">
            <Label>Page Type</Label>
            <RadioGroup
              value={formData.pageType}
              onValueChange={handlePageTypeChange}
              disabled={updatePage.isPending}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="public" id="edit-public" />
                <Label htmlFor="edit-public" className="cursor-pointer">
                  Public
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="private" id="edit-private" />
                <Label htmlFor="edit-private" className="cursor-pointer">
                  Private (requires PIN)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {formData.pageType === "private" && (
            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                name="pin"
                type="text"
                placeholder="Enter PIN for private page"
                value={formData.pin}
                onChange={handleInputChange}
                disabled={updatePage.isPending}
                required
              />
            </div>
          )} */}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || updatePage.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting || updatePage.isPending || !formData.title.trim()
              }
              className="bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
            >
              {isSubmitting || updatePage.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                    aria-hidden
                  />
                  Updating...
                </span>
              ) : (
                "Update Page"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
