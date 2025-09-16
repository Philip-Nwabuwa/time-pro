import { supabase } from "../supabase";
import type { Database } from "../database.types";

export type QnaQuestion =
  Database["public"]["Tables"]["event_qna_questions"]["Row"];
export type QnaQuestionInsert =
  Database["public"]["Tables"]["event_qna_questions"]["Insert"];
export type QnaQuestionUpdate =
  Database["public"]["Tables"]["event_qna_questions"]["Update"];

export type SessionPhoto =
  Database["public"]["Tables"]["event_session_photos"]["Row"];
export type SessionPhotoInsert =
  Database["public"]["Tables"]["event_session_photos"]["Insert"];

export type SessionData =
  Database["public"]["Tables"]["event_session_data"]["Row"];
export type SessionDataInsert =
  Database["public"]["Tables"]["event_session_data"]["Insert"];
export type SessionDataUpdate =
  Database["public"]["Tables"]["event_session_data"]["Update"];

export type EventPoll = Database["public"]["Tables"]["event_polls"]["Row"];
export type EventPollInsert =
  Database["public"]["Tables"]["event_polls"]["Insert"];
export type EventPollUpdate =
  Database["public"]["Tables"]["event_polls"]["Update"];

export type PollOption =
  Database["public"]["Tables"]["event_poll_options"]["Row"];
export type PollOptionInsert =
  Database["public"]["Tables"]["event_poll_options"]["Insert"];
export type PollOptionUpdate =
  Database["public"]["Tables"]["event_poll_options"]["Update"];

export type PollResponse =
  Database["public"]["Tables"]["event_poll_responses"]["Row"];
export type PollResponseInsert =
  Database["public"]["Tables"]["event_poll_responses"]["Insert"];

export interface PollWithOptions extends EventPoll {
  options: PollOption[];
}

// Q&A Questions
export async function fetchQnaQuestions(
  eventId: string
): Promise<QnaQuestion[]> {
  const { data, error } = await supabase
    .from("event_qna_questions")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createQnaQuestion(
  question: Omit<QnaQuestionInsert, "id">
): Promise<QnaQuestion> {
  const { data, error } = await supabase
    .from("event_qna_questions")
    .insert({
      ...question,
      status: "pending", // New questions start as pending
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateQnaQuestion(
  id: string,
  updates: QnaQuestionUpdate
): Promise<QnaQuestion> {
  const { data, error } = await supabase
    .from("event_qna_questions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteQnaQuestion(id: string): Promise<void> {
  const { error } = await supabase
    .from("event_qna_questions")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// Question approval functions
export async function acceptQnaQuestion(
  id: string,
  approvedBy: string
): Promise<QnaQuestion> {
  const { data, error } = await supabase
    .from("event_qna_questions")
    .update({
      status: "accepted",
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function rejectQnaQuestion(id: string): Promise<QnaQuestion> {
  const { data, error } = await supabase
    .from("event_qna_questions")
    .update({
      status: "rejected",
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function markQuestionAsAnswered(id: string): Promise<QnaQuestion> {
  const { data, error } = await supabase
    .from("event_qna_questions")
    .update({
      status: "answered",
      answered: true,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Fetch questions by status
export async function fetchQnaQuestionsByStatus(
  eventId: string,
  status?: "pending" | "accepted" | "answered" | "rejected"
): Promise<QnaQuestion[]> {
  let query = supabase
    .from("event_qna_questions")
    .select("*")
    .eq("event_id", eventId);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query.order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

// Fetch visible questions for regular users (accepted and answered)
export async function fetchVisibleQnaQuestions(
  eventId: string
): Promise<QnaQuestion[]> {
  const { data, error } = await supabase
    .from("event_qna_questions")
    .select("*")
    .eq("event_id", eventId)
    .in("status", ["accepted", "answered"])
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

// Fetch questions needing approval (for admins)
export async function fetchPendingQnaQuestions(
  eventId: string
): Promise<QnaQuestion[]> {
  const { data, error } = await supabase
    .from("event_qna_questions")
    .select("*")
    .eq("event_id", eventId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

// Session Photos
export async function fetchSessionPhotos(
  eventId: string
): Promise<SessionPhoto[]> {
  const { data, error } = await supabase
    .from("event_session_photos")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Enhanced photo upload result with three versions
 */
export interface UploadResult {
  photo: SessionPhoto;
  urls: {
    thumbnail: string;
    medium: string;
    original: string;
  };
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
 * Upload progress callback for batch uploads
 */
export type BatchUploadProgressCallback = (
  fileIndex: number,
  fileProgress: number,
  fileName: string,
  phase: "processing" | "uploading" | "saving"
) => void;

export async function uploadSessionPhoto(
  eventId: string,
  file: File,
  isAdmin: boolean = false
): Promise<{ photo: SessionPhoto; publicUrl: string }> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.${fileExt}`;
  const filePath = `${eventId}/${fileName}`;

  // Upload file to storage
  const { error: uploadError } = await supabase.storage
    .from("event-photos")
    .upload(filePath, file, {
      metadata: {
        uploadedBy: user.user.id,
      },
    });

  if (uploadError) throw uploadError;

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("event-photos").getPublicUrl(filePath);

  // Save photo metadata to database
  const { data: photo, error: dbError } = await supabase
    .from("event_session_photos")
    .insert({
      event_id: eventId,
      file_name: fileName,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: user.user.id,
      status: isAdmin ? "accepted" : "pending", // New status-based approval
      approved: isAdmin ? true : null, // Keep for backwards compatibility
      approved_by: isAdmin ? user.user.id : null,
      approved_at: isAdmin ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (dbError) throw dbError;

  return { photo, publicUrl };
}

/**
 * Upload session photo with three-tier compression system
 */
export async function uploadSessionPhotoEnhanced(
  eventId: string,
  processedVersions: import("../utils/fileUtils").ProcessedImageVersions,
  originalFileName: string,
  isAdmin: boolean = false,
  onProgress?: (phase: "uploading" | "saving", progress: number) => void
): Promise<UploadResult> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const photoId = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
  const basePath = `${eventId}/images/${photoId}`;

  onProgress?.("uploading", 10);

  // Upload all three versions in parallel
  const uploadPromises = [
    supabase.storage
      .from("event-photos")
      .upload(`${basePath}/thumb.webp`, processedVersions.thumbnail, {
        metadata: { uploadedBy: user.user.id, version: "thumbnail" },
      }),
    supabase.storage
      .from("event-photos")
      .upload(`${basePath}/medium.webp`, processedVersions.medium, {
        metadata: { uploadedBy: user.user.id, version: "medium" },
      }),
    supabase.storage
      .from("event-photos")
      .upload(
        `${basePath}/original${getFileExtension(
          processedVersions.original.name
        )}`,
        processedVersions.original,
        {
          metadata: { uploadedBy: user.user.id, version: "original" },
        }
      ),
  ];

  const uploadResults = await Promise.all(uploadPromises);

  // Check for upload errors
  for (const result of uploadResults) {
    if (result.error) {
      throw result.error;
    }
  }

  onProgress?.("uploading", 70);

  // Get public URLs for all versions
  const thumbnailUrl = supabase.storage
    .from("event-photos")
    .getPublicUrl(`${basePath}/thumb.webp`).data.publicUrl;
  const mediumUrl = supabase.storage
    .from("event-photos")
    .getPublicUrl(`${basePath}/medium.webp`).data.publicUrl;
  const originalUrl = supabase.storage
    .from("event-photos")
    .getPublicUrl(
      `${basePath}/original${getFileExtension(processedVersions.original.name)}`
    ).data.publicUrl;

  onProgress?.("saving", 80);

  // Save photo metadata to database with enhanced structure
  const { data: photo, error: dbError } = await supabase
    .from("event_session_photos")
    .insert({
      event_id: eventId,
      file_name: originalFileName,
      file_path: `${basePath}/medium.webp`, // Default to medium for backward compatibility
      file_size: processedVersions.metadata.originalSize,
      mime_type: processedVersions.metadata.originalFormat,
      uploaded_by: user.user.id,
      status: isAdmin ? "accepted" : "pending",
      approved: isAdmin ? true : null,
      approved_by: isAdmin ? user.user.id : null,
      approved_at: isAdmin ? new Date().toISOString() : null,
      // Note: metadata column may not exist in current schema
      // We'll store version info in file_path for now and can add metadata column later
      // metadata: {
      //   versions: {
      //     thumbnail: `${basePath}/thumb.webp`,
      //     medium: `${basePath}/medium.webp`,
      //     original: `${basePath}/original${getFileExtension(processedVersions.original.name)}`
      //   },
      //   sizes: {
      //     thumbnail: processedVersions.thumbnail.size,
      //     medium: processedVersions.medium.size,
      //     original: processedVersions.original.size
      //   },
      //   dimensions: processedVersions.metadata.originalDimensions,
      //   wasConverted: processedVersions.metadata.wasConverted,
      //   originalFormat: processedVersions.metadata.originalFormat,
      //   photoId
      // }
    })
    .select()
    .single();

  if (dbError) throw dbError;

  onProgress?.("saving", 100);

  return {
    photo,
    urls: {
      thumbnail: thumbnailUrl,
      medium: mediumUrl,
      original: originalUrl,
    },
    metadata: processedVersions.metadata,
  };
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  if (!filename || typeof filename !== "string") {
    return ".jpg"; // Default to .jpg for processed images
  }
  const lastDot = filename.lastIndexOf(".");
  return lastDot !== -1 ? filename.substring(lastDot) : ".jpg";
}

/**
 * Batch upload multiple processed photos with concurrency control
 */
export async function uploadSessionPhotosBatch(
  eventId: string,
  processedFiles: Array<{
    versions: import("../utils/fileUtils").ProcessedImageVersions;
    originalFileName: string;
  }>,
  isAdmin: boolean = false,
  onProgress?: BatchUploadProgressCallback,
  concurrency: number = 2
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (let i = 0; i < processedFiles.length; i += concurrency) {
    const batch = processedFiles.slice(i, i + concurrency);

    const batchPromises = batch.map(async (processedFile, batchIndex) => {
      const fileIndex = i + batchIndex;

      try {
        const result = await uploadSessionPhotoEnhanced(
          eventId,
          processedFile.versions,
          processedFile.originalFileName,
          isAdmin,
          (phase, progress) => {
            onProgress?.(
              fileIndex,
              progress,
              processedFile.originalFileName,
              phase
            );
          }
        );

        results[fileIndex] = result;
        return result;
      } catch (error) {
        console.error(
          `Failed to upload ${processedFile.originalFileName}:`,
          error
        );
        throw error;
      }
    });

    await Promise.all(batchPromises);
  }

  return results;
}

export async function deleteSessionPhoto(photoId: string): Promise<void> {
  // First get the photo details
  const { data: photo, error: fetchError } = await supabase
    .from("event_session_photos")
    .select("file_path")
    .eq("id", photoId)
    .single();

  if (fetchError) throw fetchError;

  // Collect all file paths to delete
  const pathsToDelete = [photo.file_path]; // Always include main file path

  // Check if this is an enhanced photo with multiple versions
  const isEnhancedPhoto =
    photo.file_path.includes("/images/") &&
    photo.file_path.includes("medium.webp");

  if (isEnhancedPhoto) {
    const basePath = photo.file_path.replace("/medium.webp", "");

    // Add all possible versions
    pathsToDelete.push(`${basePath}/thumb.webp`);
    pathsToDelete.push(`${basePath}/original.jpg`); // We'll try common extensions
    pathsToDelete.push(`${basePath}/original.jpeg`);
    pathsToDelete.push(`${basePath}/original.png`);
    pathsToDelete.push(`${basePath}/original.webp`);
  }

  // Delete all files from storage
  const { error: storageError } = await supabase.storage
    .from("event-photos")
    .remove(pathsToDelete);

  if (storageError) {
    console.warn(
      "Some files may not have been deleted from storage:",
      storageError
    );
    // Don't throw here - we still want to delete from database
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from("event_session_photos")
    .delete()
    .eq("id", photoId);

  if (dbError) throw dbError;
}

export async function getPhotoPublicUrl(filePath: string): Promise<string> {
  const { data } = supabase.storage.from("event-photos").getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Get URLs for all versions of a photo
 */
export async function getPhotoVersionUrls(photo: SessionPhoto): Promise<{
  thumbnail: string;
  medium: string;
  original: string;
}> {
  // For now, check if the photo uses the new path structure
  // Enhanced photos will have paths like: "eventId/images/photoId/medium.webp"
  const isEnhancedPhoto =
    photo.file_path.includes("/images/") &&
    photo.file_path.includes("medium.webp");

  if (isEnhancedPhoto) {
    // Extract the base path from the medium file path
    const basePath = photo.file_path.replace("/medium.webp", "");

    return {
      thumbnail: supabase.storage
        .from("event-photos")
        .getPublicUrl(`${basePath}/thumb.webp`).data.publicUrl,
      medium: supabase.storage
        .from("event-photos")
        .getPublicUrl(`${basePath}/medium.webp`).data.publicUrl,
      original: supabase.storage
        .from("event-photos")
        .getPublicUrl(`${basePath}/original.jpg`).data.publicUrl, // Assume .jpg for now
    };
  }

  // Fallback for legacy photos - use main file_path for all versions
  const mainUrl = supabase.storage
    .from("event-photos")
    .getPublicUrl(photo.file_path).data.publicUrl;

  return {
    thumbnail: mainUrl,
    medium: mainUrl,
    original: mainUrl,
  };
}

/**
 * Get thumbnail URL for a photo (prioritizes actual thumbnail if available)
 */
export async function getPhotoThumbnailUrl(
  photo: SessionPhoto
): Promise<string> {
  const urls = await getPhotoVersionUrls(photo);
  return urls.thumbnail;
}

/**
 * Get medium URL for a photo (prioritizes actual medium if available)
 */
export async function getPhotoMediumUrl(photo: SessionPhoto): Promise<string> {
  const urls = await getPhotoVersionUrls(photo);
  return urls.medium;
}

/**
 * Get original URL for a photo
 */
export async function getPhotoOriginalUrl(
  photo: SessionPhoto
): Promise<string> {
  const urls = await getPhotoVersionUrls(photo);
  return urls.original;
}

// Photo approval functions
export async function approveSessionPhoto(
  photoId: string,
  approvedBy: string
): Promise<SessionPhoto> {
  const { data, error } = await supabase
    .from("event_session_photos")
    .update({
      status: "accepted",
      approved: true, // Keep for backwards compatibility
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    })
    .eq("id", photoId)
    .select()
    .maybeSingle();
  if (error && (error as any).code !== "PGRST116") throw error;
  if (data) return data as SessionPhoto;

  // Fallback: fetch the updated row explicitly (handles RLS/no-return cases)
  const { data: fetched, error: fetchError } = await supabase
    .from("event_session_photos")
    .select("*")
    .eq("id", photoId)
    .single();
  if (fetchError) throw fetchError;
  return fetched as SessionPhoto;
}

export async function rejectSessionPhoto(
  photoId: string
): Promise<SessionPhoto> {
  const { data, error } = await supabase
    .from("event_session_photos")
    .update({
      status: "rejected",
    })
    .eq("id", photoId)
    .select()
    .maybeSingle();

  if (error && (error as any).code !== "PGRST116") throw error;
  if (data) return data as SessionPhoto;

  // Fallback: fetch the updated row explicitly
  const { data: fetched, error: fetchError } = await supabase
    .from("event_session_photos")
    .select("*")
    .eq("id", photoId)
    .single();
  if (fetchError) throw fetchError;
  return fetched as SessionPhoto;
}

export async function acceptSessionPhoto(
  photoId: string,
  approvedBy: string
): Promise<SessionPhoto> {
  return approveSessionPhoto(photoId, approvedBy);
}

// Fetch photos with approval status
export async function fetchSessionPhotosWithApproval(
  eventId: string
): Promise<SessionPhoto[]> {
  const { data, error } = await supabase
    .from("event_session_photos")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Fetch only approved photos (for regular users)
export async function fetchApprovedSessionPhotos(
  eventId: string
): Promise<SessionPhoto[]> {
  const { data, error } = await supabase
    .from("event_session_photos")
    .select("*")
    .eq("event_id", eventId)
    .eq("status", "accepted")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Fetch photos by status
export async function fetchSessionPhotosByStatus(
  eventId: string,
  status?: "pending" | "accepted" | "rejected"
): Promise<SessionPhoto[]> {
  let query = supabase
    .from("event_session_photos")
    .select("*")
    .eq("event_id", eventId);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Fetch visible photos for regular users (accepted only)
export async function fetchVisibleSessionPhotos(
  eventId: string
): Promise<SessionPhoto[]> {
  return fetchApprovedSessionPhotos(eventId);
}

// Fetch photos needing approval (for admins)
export async function fetchPendingSessionPhotos(
  eventId: string
): Promise<SessionPhoto[]> {
  const { data, error } = await supabase
    .from("event_session_photos")
    .select("*")
    .eq("event_id", eventId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Session Data (for storing timer states, notes, etc.)
export async function fetchSessionData(
  eventId: string
): Promise<SessionData | null> {
  const { data, error } = await supabase
    .from("event_session_data")
    .select("*")
    .eq("event_id", eventId)
    .single();

  if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows returned
  return data;
}

export async function upsertSessionData(
  eventId: string,
  sessionData: any
): Promise<SessionData> {
  const sessionRecord = {
    event_id: eventId,
    session_data: sessionData,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("event_session_data")
    .upsert(sessionRecord, {
      onConflict: "event_id",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Event Polls
export async function fetchEventPolls(
  eventId: string
): Promise<PollWithOptions[]> {
  const { data, error } = await supabase
    .from("event_polls")
    .select(
      `
      *,
      options:event_poll_options(*)
    `
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createPoll(pollData: {
  eventId: string;
  title: string;
  description?: string;
  options: string[];
  anonymous?: boolean;
}): Promise<PollWithOptions> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  // Create the poll first
  const { data: poll, error: pollError } = await supabase
    .from("event_polls")
    .insert({
      event_id: pollData.eventId,
      title: pollData.title,
      description: pollData.description || null,
      anonymous: pollData.anonymous ?? true,
      active: false, // Start polls as inactive
    })
    .select()
    .single();

  if (pollError) throw pollError;

  // Create poll options
  const optionsData: PollOptionInsert[] = pollData.options.map(
    (option, index) => ({
      poll_id: poll.id,
      option_text: option,
      order_index: index,
      vote_count: 0,
    })
  );

  const { data: options, error: optionsError } = await supabase
    .from("event_poll_options")
    .insert(optionsData)
    .select();

  if (optionsError) throw optionsError;

  return { ...poll, options: options || [] };
}

export async function updatePoll(
  pollId: string,
  updates: EventPollUpdate
): Promise<EventPoll> {
  const { data, error } = await supabase
    .from("event_polls")
    .update(updates)
    .eq("id", pollId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePoll(pollId: string): Promise<void> {
  // Delete poll (options and responses will be deleted via cascade)
  const { error } = await supabase
    .from("event_polls")
    .delete()
    .eq("id", pollId);

  if (error) throw error;
}

export async function submitPollVote(
  pollId: string,
  optionId: string,
  respondentId?: string
): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  const actualRespondentId = respondentId || user.user?.id || null;

  // Insert vote response
  const { error: responseError } = await supabase
    .from("event_poll_responses")
    .insert({
      poll_id: pollId,
      option_id: optionId,
      respondent_id: actualRespondentId,
    });

  if (responseError) throw responseError;

  // Get current vote count and increment
  const { data: option, error: fetchError } = await supabase
    .from("event_poll_options")
    .select("vote_count")
    .eq("id", optionId)
    .single();

  if (fetchError) throw fetchError;

  const { error: incrementError } = await supabase
    .from("event_poll_options")
    .update({ vote_count: (option.vote_count || 0) + 1 })
    .eq("id", optionId);

  if (incrementError) throw incrementError;
}

export async function getUserPollVotes(
  eventId: string,
  userId?: string
): Promise<Record<string, string>> {
  const { data: user } = await supabase.auth.getUser();
  const actualUserId = userId || user.user?.id;

  if (!actualUserId) return {};

  const { data, error } = await supabase
    .from("event_poll_responses")
    .select(
      `
      poll_id,
      option_id,
      poll:event_polls!inner(event_id)
    `
    )
    .eq("respondent_id", actualUserId)
    .eq("poll.event_id", eventId);

  if (error) throw error;

  const votes: Record<string, string> = {};
  data?.forEach((response: any) => {
    votes[response.poll_id] = response.option_id;
  });

  return votes;
}

// Bulk operations for better performance
export async function fetchEventSessionAll(eventId: string): Promise<{
  questions: QnaQuestion[];
  photos: SessionPhoto[];
  polls: PollWithOptions[];
  sessionData: SessionData | null;
}> {
  const [questionsResult, photosResult, pollsResult, sessionDataResult] =
    await Promise.allSettled([
      fetchQnaQuestions(eventId),
      fetchSessionPhotos(eventId),
      fetchEventPolls(eventId),
      fetchSessionData(eventId),
    ]);

  return {
    questions:
      questionsResult.status === "fulfilled" ? questionsResult.value : [],
    photos: photosResult.status === "fulfilled" ? photosResult.value : [],
    polls: pollsResult.status === "fulfilled" ? pollsResult.value : [],
    sessionData:
      sessionDataResult.status === "fulfilled" ? sessionDataResult.value : null,
  };
}

// Bulk operations with role-based filtering
export async function fetchEventSessionForUser(
  eventId: string,
  isAdmin: boolean = false
): Promise<{
  questions: QnaQuestion[];
  photos: SessionPhoto[];
  polls: PollWithOptions[];
  sessionData: SessionData | null;
}> {
  const [questionsResult, photosResult, pollsResult, sessionDataResult] =
    await Promise.allSettled([
      isAdmin ? fetchQnaQuestions(eventId) : fetchVisibleQnaQuestions(eventId),
      isAdmin
        ? fetchSessionPhotos(eventId)
        : fetchVisibleSessionPhotos(eventId),
      fetchEventPolls(eventId),
      fetchSessionData(eventId),
    ]);

  return {
    questions:
      questionsResult.status === "fulfilled" ? questionsResult.value : [],
    photos: photosResult.status === "fulfilled" ? photosResult.value : [],
    polls: pollsResult.status === "fulfilled" ? pollsResult.value : [],
    sessionData:
      sessionDataResult.status === "fulfilled" ? sessionDataResult.value : null,
  };
}
