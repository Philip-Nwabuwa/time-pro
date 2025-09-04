import heic2any from "heic2any";
import imageCompression from "browser-image-compression";

/**
 * Check if a file is a supported image format
 */
export function isImageFile(file: File): boolean {
  // Check MIME type
  if (file.type.startsWith("image/")) {
    return true;
  }

  // Check file extension for HEIC/HEIF files (sometimes browsers don't set correct MIME type)
  const extension = file.name.toLowerCase().split(".").pop() || "";
  const heicExtensions = ["heic", "heif"];

  return heicExtensions.includes(extension);
}

/**
 * Check if a file is HEIC/HEIF format
 */
export function isHeicFile(file: File): boolean {
  // Check MIME type
  if (file.type === "image/heic" || file.type === "image/heif") {
    return true;
  }

  // Check file extension
  const extension = file.name.toLowerCase().split(".").pop() || "";
  return ["heic", "heif"].includes(extension);
}

/**
 * Convert HEIC/HEIF file to JPEG with higher quality for processing
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  try {
    const convertedBlob = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9, // Higher quality for better processing results
    });

    // heic2any returns Blob or Blob[], we want a single Blob
    const blob = Array.isArray(convertedBlob)
      ? convertedBlob[0]
      : convertedBlob;

    // Create new File with .jpg extension
    const newFileName = file.name.replace(/\.(heic|heif)$/i, ".jpg");

    return new File([blob], newFileName, {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch (error) {
    console.error("Error converting HEIC file:", error);
    throw new Error(
      "Failed to convert HEIC file. Please try a different format.",
    );
  }
}

/**
 * Upload progress callback type
 */
export type UploadProgressCallback = (progress: number) => void;

/**
 * Image version type
 */
export type ImageVersion = "thumbnail" | "medium" | "original";

/**
 * Processed image versions
 */
export interface ProcessedImageVersions {
  thumbnail: File;
  medium: File;
  original: File;
  metadata: {
    originalSize: number;
    thumbnailSize: number;
    mediumSize: number;
    originalDimensions: { width: number; height: number };
    wasConverted: boolean;
    originalFormat: string;
  };
}

/**
 * File validation result
 */
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  file?: File;
}

/**
 * Batch validation result
 */
export interface BatchValidationResult {
  validFiles: File[];
  errors: string[];
  totalSize: number;
}

/**
 * Validate file upload limits and constraints
 */
export function validateFileUpload(file: File): FileValidationResult {
  // Check if it's an image
  if (!isImageFile(file)) {
    return {
      isValid: false,
      error: `"${file.name}" is not a supported image format`,
    };
  }

  // Check file size (10MB limit per file)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `"${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max size is 10MB`,
    };
  }

  return {
    isValid: true,
    file,
  };
}

/**
 * Validate batch of files for upload
 */
export function validateBatchUpload(files: File[]): BatchValidationResult {
  const maxFiles = 10;
  const maxTotalSize = 50 * 1024 * 1024; // 50MB total

  const validFiles: File[] = [];
  const errors: string[] = [];
  let totalSize = 0;

  // Check file count limit
  if (files.length > maxFiles) {
    errors.push(
      `Too many files selected. Maximum ${maxFiles} files allowed, got ${files.length}`,
    );
    return { validFiles: [], errors, totalSize: 0 };
  }

  // Validate each file
  for (const file of files) {
    const validation = validateFileUpload(file);
    if (validation.isValid && validation.file) {
      validFiles.push(validation.file);
      totalSize += file.size;
    } else if (validation.error) {
      errors.push(validation.error);
    }
  }

  // Check total size limit
  if (totalSize > maxTotalSize) {
    errors.push(
      `Total file size too large (${(totalSize / (1024 * 1024)).toFixed(1)}MB). Maximum 50MB total allowed`,
    );
    return { validFiles: [], errors, totalSize };
  }

  return { validFiles, errors, totalSize };
}

/**
 * Get image dimensions from file
 */
export async function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Create thumbnail version (256x256 square, cropped and centered)
 */
export async function createThumbnail(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.04, // 40KB max
    maxWidthOrHeight: 256,
    useWebWorker: false,
    fileType: "image/webp" as const,
    initialQuality: 0.6,
    preserveExif: false,
  };

  const compressedFile = await imageCompression(file, options);

  // Create square crop using canvas
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = 256;
  canvas.height = 256;

  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = URL.createObjectURL(compressedFile);
  });

  // Calculate crop dimensions (center crop)
  const size = Math.min(img.width, img.height);
  const x = (img.width - size) / 2;
  const y = (img.height - size) / 2;

  // Draw cropped image
  ctx.drawImage(img, x, y, size, size, 0, 0, 256, 256);
  URL.revokeObjectURL(img.src);

  // Convert canvas to WebP file
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        const fileName = file.name.replace(/\.[^/.]+$/, "_thumb.webp");
        resolve(
          new File([blob!], fileName, {
            type: "image/webp",
            lastModified: file.lastModified,
          }),
        );
      },
      "image/webp",
      0.6,
    );
  });
}

/**
 * Create medium version (1600px max dimension)
 */
export async function createMediumImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.3, // 300KB max
    maxWidthOrHeight: 1600,
    useWebWorker: false,
    fileType: "image/webp" as const,
    initialQuality: 0.75,
    preserveExif: false,
  };

  const compressedFile = await imageCompression(file, options);
  const fileName = file.name.replace(/\.[^/.]+$/, "_medium.webp");

  return new File([compressedFile], fileName, {
    type: "image/webp",
    lastModified: file.lastModified,
  });
}

/**
 * Create original version (preserve original, but optionally limit to 4000px)
 */
export async function createOriginalImage(file: File): Promise<File> {
  // If it's already under 4000px and reasonably sized, keep as-is
  const dimensions = await getImageDimensions(file);
  const maxDimension = Math.max(dimensions.width, dimensions.height);

  // If image is reasonable size and format, keep original
  if (maxDimension <= 4000 && file.size <= 5 * 1024 * 1024) {
    return file;
  }

  // Compress large images while preserving quality
  const options = {
    maxSizeMB: 5, // 5MB max for originals
    maxWidthOrHeight: 4000,
    useWebWorker: false,
    initialQuality: 0.9,
    preserveExif: true, // Keep metadata for originals
  };

  return await imageCompression(file, options);
}

/**
 * Process single file into three versions
 */
export async function processImageToVersions(
  file: File,
  onProgress?: UploadProgressCallback,
): Promise<ProcessedImageVersions> {
  let processedFile = file;
  let wasConverted = false;
  const originalFormat = file.type;
  const originalSize = file.size;

  onProgress?.(10); // Initial progress

  // Convert HEIC to JPEG first if needed
  if (isHeicFile(file)) {
    processedFile = await convertHeicToJpeg(file);
    wasConverted = true;
  }

  onProgress?.(30); // HEIC conversion done

  // Get original dimensions
  const originalDimensions = await getImageDimensions(processedFile);

  onProgress?.(40); // Dimensions calculated

  // Process three versions in parallel for better performance
  const [thumbnail, medium, original] = await Promise.all([
    createThumbnail(processedFile),
    createMediumImage(processedFile),
    createOriginalImage(processedFile),
  ]);

  onProgress?.(100); // Complete

  return {
    thumbnail,
    medium,
    original,
    metadata: {
      originalSize,
      thumbnailSize: thumbnail.size,
      mediumSize: medium.size,
      originalDimensions,
      wasConverted,
      originalFormat,
    },
  };
}

/**
 * Process uploaded files, converting HEIC to JPEG if needed (legacy function for compatibility)
 */
export async function processUploadedFiles(files: File[]): Promise<File[]> {
  const processedFiles: File[] = [];

  for (const file of files) {
    if (!isImageFile(file)) {
      continue; // Skip non-image files
    }

    if (isHeicFile(file)) {
      try {
        const convertedFile = await convertHeicToJpeg(file);
        processedFiles.push(convertedFile);
      } catch (error) {
        console.error(`Failed to convert HEIC file ${file.name}:`, error);
        // Continue with other files instead of failing completely
      }
    } else {
      processedFiles.push(file);
    }
  }

  return processedFiles;
}

/**
 * Process batch of files with concurrency limit
 */
export async function processBatchToVersions(
  files: File[],
  onProgress?: (
    fileIndex: number,
    fileProgress: number,
    fileName: string,
  ) => void,
  onComplete?: (
    fileIndex: number,
    result: ProcessedImageVersions,
    fileName: string,
  ) => void,
  concurrency: number = 2,
): Promise<ProcessedImageVersions[]> {
  const results: ProcessedImageVersions[] = [];
  const processing: Promise<void>[] = [];

  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);

    const batchPromises = batch.map(async (file, batchIndex) => {
      const fileIndex = i + batchIndex;

      try {
        const result = await processImageToVersions(file, (progress) => {
          onProgress?.(fileIndex, progress, file.name);
        });

        results[fileIndex] = result;
        onComplete?.(fileIndex, result, file.name);
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        throw error;
      }
    });

    await Promise.all(batchPromises);
  }

  return results;
}
