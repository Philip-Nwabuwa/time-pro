"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Photo {
  id: string;
  url: string; // Medium version URL for main display
  photo: any;
  selected?: boolean;
  thumbnailUrl?: string; // Thumbnail version URL
  originalUrl?: string; // Original version URL for downloads
}

interface ImageGalleryProps {
  photos: Photo[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageGallery({
  photos,
  initialIndex = 0,
  isOpen,
  onClose,
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          goToPrevious();
          break;
        case "ArrowRight":
          goToNext();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  const handleDownload = async () => {
    if (!photos[currentIndex]) return;

    try {
      const currentPhoto = photos[currentIndex];
      // Use original URL for download if available, fallback to medium version
      const downloadUrl = currentPhoto.originalUrl || currentPhoto.url;

      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Use original filename with proper extension
      const fileName =
        currentPhoto.photo.file_name || `photo-${currentIndex + 1}.jpg`;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];

  return (
    <div className="fixed inset-0 z-[60] bg-black bg-opacity-90 flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="text-white text-sm">
          {currentIndex + 1} of {photos.length}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="text-white hover:bg-white/20"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation Arrows */}
      {photos.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="lg"
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12 rounded-full"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12 rounded-full"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Main Image */}
      <div className="relative w-full h-full flex items-center justify-center p-8">
        <img
          src={currentPhoto.url} // Uses medium version for preview
          alt={currentPhoto.photo.file_name || `Photo ${currentIndex + 1}`}
          className="max-w-[calc(100vw-4rem)] max-h-[calc(100vh-8rem)] object-contain transition-opacity duration-300"
          onClick={(e) => e.stopPropagation()}
          loading="lazy"
        />
      </div>

      {/* Thumbnail Strip */}
      {photos.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/50 to-transparent p-4">
          <div className="flex justify-center gap-2 overflow-x-auto max-w-full">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? "border-white"
                    : "border-transparent opacity-60 hover:opacity-80"
                }`}
              >
                <img
                  src={photo.thumbnailUrl || photo.url} // Use thumbnail in strip
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover transition-opacity duration-200"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to medium/main URL if thumbnail fails
                    const target = e.target as HTMLImageElement;
                    if (target.src !== photo.url) {
                      target.src = photo.url;
                    }
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}
