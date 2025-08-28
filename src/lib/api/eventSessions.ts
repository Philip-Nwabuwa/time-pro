import { supabase } from "../supabase";
import type { Database } from "../database.types";

export type QnaQuestion = Database["public"]["Tables"]["event_qna_questions"]["Row"];
export type QnaQuestionInsert = Database["public"]["Tables"]["event_qna_questions"]["Insert"];
export type QnaQuestionUpdate = Database["public"]["Tables"]["event_qna_questions"]["Update"];

export type SessionPhoto = Database["public"]["Tables"]["event_session_photos"]["Row"];
export type SessionPhotoInsert = Database["public"]["Tables"]["event_session_photos"]["Insert"];

export type SessionData = Database["public"]["Tables"]["event_session_data"]["Row"];
export type SessionDataInsert = Database["public"]["Tables"]["event_session_data"]["Insert"];
export type SessionDataUpdate = Database["public"]["Tables"]["event_session_data"]["Update"];

// Q&A Questions
export async function fetchQnaQuestions(eventId: string): Promise<QnaQuestion[]> {
  const { data, error } = await supabase
    .from("event_qna_questions")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createQnaQuestion(question: Omit<QnaQuestionInsert, "id">): Promise<QnaQuestion> {
  const { data, error } = await supabase
    .from("event_qna_questions")
    .insert(question)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateQnaQuestion(id: string, updates: QnaQuestionUpdate): Promise<QnaQuestion> {
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

// Session Photos
export async function fetchSessionPhotos(eventId: string): Promise<SessionPhoto[]> {
  const { data, error } = await supabase
    .from("event_session_photos")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function uploadSessionPhoto(
  eventId: string,
  file: File
): Promise<{ photo: SessionPhoto; publicUrl: string }> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${eventId}/${fileName}`;

  // Upload file to storage
  const { error: uploadError } = await supabase.storage
    .from('event-photos')
    .upload(filePath, file, {
      metadata: {
        uploadedBy: user.user.id
      }
    });

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('event-photos')
    .getPublicUrl(filePath);

  // Save photo metadata to database
  const { data: photo, error: dbError } = await supabase
    .from("event_session_photos")
    .insert({
      event_id: eventId,
      file_name: fileName,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: user.user.id
    })
    .select()
    .single();

  if (dbError) throw dbError;

  return { photo, publicUrl };
}

export async function deleteSessionPhoto(photoId: string): Promise<void> {
  // First get the photo details
  const { data: photo, error: fetchError } = await supabase
    .from("event_session_photos")
    .select("file_path")
    .eq("id", photoId)
    .single();

  if (fetchError) throw fetchError;

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('event-photos')
    .remove([photo.file_path]);

  if (storageError) throw storageError;

  // Delete from database
  const { error: dbError } = await supabase
    .from("event_session_photos")
    .delete()
    .eq("id", photoId);

  if (dbError) throw dbError;
}

export async function getPhotoPublicUrl(filePath: string): Promise<string> {
  const { data } = supabase.storage
    .from('event-photos')
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}

// Session Data (for storing timer states, notes, etc.)
export async function fetchSessionData(eventId: string): Promise<SessionData | null> {
  const { data, error } = await supabase
    .from("event_session_data")
    .select("*")
    .eq("event_id", eventId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
  return data;
}

export async function upsertSessionData(eventId: string, sessionData: any): Promise<SessionData> {
  const { data, error } = await supabase
    .from("event_session_data")
    .upsert(
      {
        event_id: eventId,
        session_data: sessionData,
        updated_at: new Date().toISOString()
      },
      { 
        onConflict: "event_id" 
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Bulk operations for better performance
export async function fetchEventSessionAll(eventId: string): Promise<{
  questions: QnaQuestion[];
  photos: SessionPhoto[];
  sessionData: SessionData | null;
}> {
  const [questionsResult, photosResult, sessionDataResult] = await Promise.allSettled([
    fetchQnaQuestions(eventId),
    fetchSessionPhotos(eventId),
    fetchSessionData(eventId)
  ]);

  return {
    questions: questionsResult.status === 'fulfilled' ? questionsResult.value : [],
    photos: photosResult.status === 'fulfilled' ? photosResult.value : [],
    sessionData: sessionDataResult.status === 'fulfilled' ? sessionDataResult.value : null
  };
}