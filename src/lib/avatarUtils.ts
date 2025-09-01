import { supabase } from "@/lib/supabase";

export interface AvatarUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload a user's avatar to Supabase storage
 * @param file - The image file or blob to upload
 * @param userId - The user's ID (for organizing files)
 * @returns Promise with upload result including public URL
 */
export async function uploadAvatar(
  file: File | Blob,
  userId: string,
): Promise<AvatarUploadResult> {
  try {
    // Generate a unique filename
    const fileExt = file instanceof File ? file.name.split(".").pop() : "jpg";
    const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

    // Upload the file to the avatars bucket
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, {
        upsert: true,
        contentType: file instanceof File ? file.type : "image/jpeg",
      });

    if (uploadError) {
      console.error("Avatar upload error:", uploadError);
      return { success: false, error: uploadError.message };
    }

    // Get the public URL for the uploaded file
    const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);

    if (!data.publicUrl) {
      return { success: false, error: "Failed to get public URL" };
    }

    return { success: true, url: data.publicUrl };
  } catch (error) {
    console.error("Avatar upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload avatar",
    };
  }
}

/**
 * Delete a user's current avatar from Supabase storage
 * @param avatarUrl - The current avatar URL to extract filename from
 * @param userId - The user's ID
 * @returns Promise with deletion result
 */
export async function deleteAvatar(
  avatarUrl: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Extract filename from the URL
    // URL format: https://[project].supabase.co/storage/v1/object/public/avatars/[userId]/avatar-[timestamp].ext
    const urlParts = avatarUrl.split("/");
    const fileName = urlParts.slice(-2).join("/"); // Get the last two parts: userId/filename

    const { error } = await supabase.storage.from("avatars").remove([fileName]);

    if (error) {
      console.error("Avatar deletion error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Avatar deletion error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete avatar",
    };
  }
}

/**
 * Get the current user's avatar URL from their profile metadata
 * @param user - The current user object
 * @returns The avatar URL or null if none exists
 */
export function getUserAvatarUrl(user: any): string | null {
  return user?.user_metadata?.avatar_url || null;
}

/**
 * Upload a speaker's avatar to Supabase storage for events
 * @param file - The image file or blob to upload
 * @param eventId - The event's ID (for organizing files)
 * @param roleId - The role's ID (for unique identification)
 * @returns Promise with upload result including public URL
 */
export async function uploadSpeakerAvatar(
  file: File | Blob,
  eventId: string,
  roleId: string,
): Promise<AvatarUploadResult> {
  try {
    // Generate a unique filename for speaker avatar
    const fileExt = file instanceof File ? file.name.split(".").pop() : "jpg";
    const fileName = `speakers/${eventId}/role-${roleId}-${Date.now()}.${fileExt}`;

    // Upload the file to the avatars bucket (reusing the same bucket)
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, {
        upsert: true,
        contentType: file instanceof File ? file.type : "image/jpeg",
      });

    if (uploadError) {
      console.error("Speaker avatar upload error:", uploadError);
      return { success: false, error: uploadError.message };
    }

    // Get the public URL for the uploaded file
    const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);

    if (!data.publicUrl) {
      return { success: false, error: "Failed to get public URL" };
    }

    return { success: true, url: data.publicUrl };
  } catch (error) {
    console.error("Speaker avatar upload error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to upload speaker avatar",
    };
  }
}

/**
 * Check if the avatars bucket exists and create setup instructions
 * @returns Setup information for the storage bucket
 */
export function getStorageSetupInstructions(): string {
  return `
To set up avatar storage, you need to create the 'avatars' bucket in Supabase:

1. Go to your Supabase dashboard
2. Navigate to Storage > Buckets
3. Create a new bucket called 'avatars' with public access
4. Add these storage policies:

-- Allow users to upload their own avatar
CREATE POLICY "Users can upload own avatar" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update own avatar" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete own avatar" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to avatars
CREATE POLICY "Public avatar access" ON storage.objects 
FOR SELECT USING (bucket_id = 'avatars');

-- Allow authenticated users to upload speaker avatars for events
CREATE POLICY "Users can upload speaker avatars" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = 'speakers'
);
`;
}
