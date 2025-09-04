"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ImagePlus, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  validateBatchUpload,
  processBatchToVersions,
  isImageFile,
  type ProcessedImageVersions,
} from "@/lib/utils/fileUtils";
import {
  uploadSessionPhotosBatch,
  type UploadResult,
  type BatchUploadProgressCallback,
} from "@/lib/api/eventSessions";

interface PhotoUploadProps {
  eventId: string;
  isAdmin: boolean;
  onUploadComplete: (results: UploadResult[]) => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

interface FileProgress {
  file: File;
  status: "pending" | "processing" | "uploading" | "completed" | "error";
  progress: number;
  processedVersions?: ProcessedImageVersions;
  uploadResult?: UploadResult;
  error?: string;
}

export default function PhotoUpload({
  eventId,
  isAdmin,
  onUploadComplete,
  onUploadError,
  disabled = false,
  className = "",
}: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileProgresses, setFileProgresses] = useState<FileProgress[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);

  const resetState = () => {
    setFileProgresses([]);
    setOverallProgress(0);
    setIsUploading(false);
  };

  const updateFileProgress = (
    index: number,
    updates: Partial<FileProgress>,
  ) => {
    setFileProgresses((prev) => {
      const newProgresses = [...prev];
      newProgresses[index] = { ...newProgresses[index], ...updates };
      return newProgresses;
    });
  };

  const calculateOverallProgress = (progresses: FileProgress[]) => {
    if (progresses.length === 0) return 0;

    const totalProgress = progresses.reduce((sum, fp) => {
      return sum + fp.progress;
    }, 0);

    return Math.round(totalProgress / progresses.length);
  };

  const handleFiles = async (files: File[]) => {
    if (disabled || isUploading) return;

    // Validate batch
    const validation = validateBatchUpload(files);

    if (validation.errors.length > 0) {
      validation.errors.forEach((error) => toast.error(error));
      return;
    }

    if (validation.validFiles.length === 0) {
      toast.error("No valid image files found");
      return;
    }

    setIsUploading(true);

    // Initialize progress tracking
    const initialProgresses: FileProgress[] = validation.validFiles.map(
      (file) => ({
        file,
        status: "pending",
        progress: 0,
      }),
    );
    setFileProgresses(initialProgresses);

    try {
      // Phase 1: Process images (convert to three tiers)
      toast.info(
        `Processing ${validation.validFiles.length} image${validation.validFiles.length > 1 ? "s" : ""}...`,
      );

      const processedVersions = await processBatchToVersions(
        validation.validFiles,
        (fileIndex, fileProgress, fileName) => {
          updateFileProgress(fileIndex, {
            status: "processing",
            progress: Math.round(fileProgress * 0.6), // Processing takes 60% of total progress
          });

          // Update overall progress
          setFileProgresses((current) => {
            const newProgresses = [...current];
            newProgresses[fileIndex] = {
              ...newProgresses[fileIndex],
              status: "processing",
              progress: Math.round(fileProgress * 0.6),
            };
            setOverallProgress(calculateOverallProgress(newProgresses));
            return newProgresses;
          });
        },
        (fileIndex, result, fileName) => {
          updateFileProgress(fileIndex, {
            processedVersions: result,
            progress: 60, // Processing complete
          });
        },
        2, // Process 2 files concurrently
      );

      // Phase 2: Upload processed versions
      toast.info("Uploading photos...");

      const uploadData = processedVersions.map((versions, index) => ({
        versions,
        originalFileName: validation.validFiles[index].name,
      }));

      const batchProgressCallback: BatchUploadProgressCallback = (
        fileIndex,
        fileProgress,
        fileName,
        phase,
      ) => {
        const baseProgress = 60; // Processing was 60%
        const uploadProgress = Math.round((fileProgress / 100) * 40); // Upload is remaining 40%

        updateFileProgress(fileIndex, {
          status: phase === "uploading" ? "uploading" : "uploading",
          progress: baseProgress + uploadProgress,
        });

        // Update overall progress
        setFileProgresses((current) => {
          const newProgresses = [...current];
          newProgresses[fileIndex] = {
            ...newProgresses[fileIndex],
            status: phase === "uploading" ? "uploading" : "uploading",
            progress: baseProgress + uploadProgress,
          };
          setOverallProgress(calculateOverallProgress(newProgresses));
          return newProgresses;
        });
      };

      const uploadResults = await uploadSessionPhotosBatch(
        eventId,
        uploadData,
        isAdmin,
        batchProgressCallback,
        2, // Upload 2 files concurrently
      );

      // Mark all as completed
      uploadResults.forEach((result, index) => {
        updateFileProgress(index, {
          status: "completed",
          progress: 100,
          uploadResult: result,
        });
      });

      setOverallProgress(100);

      // Success feedback
      const successMessage = isAdmin
        ? `Successfully uploaded ${uploadResults.length} photo${uploadResults.length > 1 ? "s" : ""}!`
        : `Uploaded ${uploadResults.length} photo${uploadResults.length > 1 ? "s" : ""} - awaiting admin approval`;

      toast.success(successMessage);
      onUploadComplete(uploadResults);

      // Clean up after a delay
      setTimeout(() => {
        resetState();
      }, 3000);
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload photos";

      // Mark current files as error
      setFileProgresses((prev) =>
        prev.map((fp) => ({
          ...fp,
          status: fp.status === "completed" ? "completed" : "error",
          error: errorMessage,
        })),
      );

      toast.error(errorMessage);
      onUploadError?.(errorMessage);

      // Clean up after delay
      setTimeout(() => {
        resetState();
      }, 5000);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(isImageFile);
    if (imageFiles.length > 0) {
      handleFiles(imageFiles);
    }
    // Reset input so same files can be selected again
    if (e.target) e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files || []);
    const imageFiles = files.filter(isImageFile);
    if (imageFiles.length > 0) {
      handleFiles(imageFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleCancel = () => {
    // Note: We can't actually cancel ongoing processing/uploads easily
    // But we can reset the UI state
    resetState();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        role="button"
        className={`
          w-full border-2 border-dashed rounded-md p-6 text-center transition-colors cursor-pointer
          ${isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"}
          ${disabled || isUploading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}
          ${isUploading ? "bg-gray-50" : ""}
        `}
        onClick={() =>
          !disabled && !isUploading && fileInputRef.current?.click()
        }
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="flex flex-col items-center gap-2">
          <ImagePlus
            className={`h-8 w-8 ${isUploading ? "text-gray-400" : "text-gray-600"}`}
          />
          <div className="font-medium">
            {isUploading ? "Processing & Uploading..." : "Upload Photos"}
          </div>
          <div className="text-sm text-gray-500">
            {isUploading
              ? "Please wait while we optimize your images"
              : "Drag & drop up to 10 images or click to browse"}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Supports JPG, PNG, WebP, HEIC/HEIF • Max 10MB per file • Max 50MB
            total
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          className="hidden"
          onChange={handleFileInput}
          disabled={disabled || isUploading}
        />
      </div>

      {/* Overall Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">
              Overall Progress (
              {fileProgresses.filter((fp) => fp.status === "completed").length}/
              {fileProgresses.length})
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{overallProgress}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      )}

      {/* Individual File Progress */}
      {fileProgresses.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <div className="text-sm font-medium">File Progress</div>
          {fileProgresses.map((fp, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-2 bg-gray-50 rounded-md"
            >
              <div className="flex-shrink-0">
                {fp.status === "completed" && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                {fp.status === "error" && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                {!["completed", "error"].includes(fp.status) && (
                  <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div
                    className="text-xs font-medium truncate"
                    title={fp.file.name}
                  >
                    {fp.file.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${getStatusColor(fp.status)}`}
                    >
                      {getStatusLabel(fp.status)}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {fp.progress}%
                    </span>
                  </div>
                </div>
                <Progress value={fp.progress} className="h-1 mt-1" />
                {fp.error && (
                  <div className="text-xs text-red-500 mt-1">{fp.error}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getStatusColor(status: FileProgress["status"]): string {
  switch (status) {
    case "completed":
      return "bg-green-50 text-green-700 border-green-200";
    case "error":
      return "bg-red-50 text-red-700 border-red-200";
    case "uploading":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "processing":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

function getStatusLabel(status: FileProgress["status"]): string {
  switch (status) {
    case "pending":
      return "Waiting";
    case "processing":
      return "Processing";
    case "uploading":
      return "Uploading";
    case "completed":
      return "Complete";
    case "error":
      return "Error";
    default:
      return "Unknown";
  }
}
