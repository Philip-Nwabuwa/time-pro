import heic2any from "heic2any";

/**
 * Check if a file is a supported image format
 */
export function isImageFile(file: File): boolean {
  // Check MIME type
  if (file.type.startsWith("image/")) {
    return true;
  }
  
  // Check file extension for HEIC/HEIF files (sometimes browsers don't set correct MIME type)
  const extension = file.name.toLowerCase().split('.').pop() || '';
  const heicExtensions = ['heic', 'heif'];
  
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
  const extension = file.name.toLowerCase().split('.').pop() || '';
  return ['heic', 'heif'].includes(extension);
}

/**
 * Convert HEIC/HEIF file to JPEG
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  try {
    const convertedBlob = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.8
    });

    // heic2any returns Blob or Blob[], we want a single Blob
    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    
    // Create new File with .jpg extension
    const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
    
    return new File([blob], newFileName, {
      type: "image/jpeg",
      lastModified: file.lastModified
    });
  } catch (error) {
    console.error("Error converting HEIC file:", error);
    throw new Error("Failed to convert HEIC file. Please try a different format.");
  }
}

/**
 * Process uploaded files, converting HEIC to JPEG if needed
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