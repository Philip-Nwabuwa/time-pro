import { supabase } from "../supabase";
import type {
  Event,
  EventDetails,
  EventInsert,
  EventUpdate,
  EventScheduleItemInsert,
  EventScheduleItemUpdate,
} from "./types";

export async function fetchEventsByPageId(pageId: string): Promise<Event[]> {
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .eq("page_id", pageId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description || "",
    date: event.event_date,
    time: event.event_time,
    location: event.location || "",
    attendees: event.attendees_count || 0,
    status: event.status as "upcoming" | "ongoing" | "completed" | "draft",
  }));
}

export async function fetchEventDetails(
  pageId: string,
  eventId: string,
): Promise<EventDetails | null> {
  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("page_id", pageId)
    .single();

  if (error || !event) return null;

  // Fetch schedule items
  const { data: scheduleItems, error: scheduleError } = await supabase
    .from("event_schedule_items")
    .select("*")
    .eq("event_id", eventId)
    .order("order_index", { ascending: true });

  if (scheduleError) throw scheduleError;

  return {
    id: event.id,
    title: event.title,
    description: event.description || "",
    date: event.event_date,
    time: event.event_time,
    location: event.location || "",
    attendees: event.attendees_count || 0,
    status: event.status as "upcoming" | "ongoing" | "completed" | "draft",
    estimatedMinutes: event.estimated_minutes || 60,
    rolesCount: event.roles_count || 0,
    configured: event.configured || false,
    allowFeedback: event.allow_feedback ?? true,
    anonymousFeedback: event.anonymous_feedback ?? false,
    detailedSpeakerProfiles: event.detailed_speaker_profiles ?? true,
    schedule: scheduleItems.map((item) => ({
      id: item.id,
      order: item.order_index,
      title: item.title,
      role: item.role,
      allocatedMinutes: item.allocated_minutes,
      minMinutes: item.min_minutes || undefined,
      targetMinutes: item.target_minutes || undefined,
      maxMinutes: item.max_minutes || undefined,
      speakerName: item.speaker_name || undefined,
      speakerEmail: item.speaker_email || undefined,
      speakerBio: item.speaker_bio || undefined,
      speakerAvatar: item.speaker_avatar || undefined,
      socialMediaLinks: item.social_media_links || undefined,
    })),
  };
}

export async function cloneEvent(
  eventId: string,
  pageId: string,
): Promise<Event> {
  // First, get the original event details
  const originalEvent = await fetchEventDetails(pageId, eventId);
  if (!originalEvent) {
    throw new Error("Event not found");
  }

  // Create new event data based on the original
  const clonedEventData: Omit<EventInsert, "created_by"> = {
    title: `${originalEvent.title} (Copy)`,
    event_date: originalEvent.date,
    event_time: originalEvent.time,
    location: originalEvent.location,
    page_id: pageId,
    allow_feedback: originalEvent.allowFeedback ?? true,
    anonymous_feedback: originalEvent.anonymousFeedback ?? false,
    detailed_speaker_profiles: originalEvent.detailedSpeakerProfiles ?? true,
    estimated_minutes: originalEvent.estimatedMinutes,
    roles_count: originalEvent.rolesCount,
    status: "upcoming", // Start as upcoming so it can be edited
    configured: originalEvent.configured,
  };

  // Create the new event
  const newEvent = await createEvent(clonedEventData);

  // Clone the schedule items
  if (originalEvent.schedule && originalEvent.schedule.length > 0) {
    const scheduleItems: EventScheduleItemInsert[] = originalEvent.schedule.map(
      (item) => ({
        event_id: newEvent.id,
        title: item.title,
        role: item.role,
        order_index: item.order,
        allocated_minutes: item.allocatedMinutes,
        speaker_name: item.speakerName || null,
        speaker_email: item.speakerEmail || null,
        speaker_bio: item.speakerBio || null,
        speaker_avatar: item.speakerAvatar || null,
        min_minutes: item.minMinutes || null,
        target_minutes: item.targetMinutes || null,
        max_minutes: item.maxMinutes || null,
        social_media_links: item.socialMediaLinks || null,
      }),
    );

    // Create all schedule items
    await Promise.all(
      scheduleItems.map((item) => createScheduleItem(newEvent.id, item)),
    );
  }

  return newEvent;
}

export async function createEvent(
  eventData: Omit<EventInsert, "created_by">,
): Promise<Event> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      ...eventData,
      created_by: user.user.id,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: event.id,
    title: event.title,
    description: event.description || "",
    date: event.event_date,
    time: event.event_time,
    location: event.location || "",
    attendees: event.attendees_count || 0,
    status: event.status as "upcoming" | "ongoing" | "completed" | "draft",
  };
}

export async function updateEvent(
  id: string,
  updates: EventUpdate,
): Promise<Event> {
  const { data: event, error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: event.id,
    title: event.title,
    description: event.description || "",
    date: event.event_date,
    time: event.event_time,
    location: event.location || "",
    attendees: event.attendees_count || 0,
    status: event.status as "upcoming" | "ongoing" | "completed" | "draft",
  };
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) throw error;
}

export async function startEvent(id: string): Promise<Event> {
  const { data: event, error } = await supabase
    .from("events")
    .update({ status: "ongoing" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: event.id,
    title: event.title,
    description: event.description || "",
    date: event.event_date,
    time: event.event_time,
    location: event.location || "",
    attendees: event.attendees_count || 0,
    status: event.status as "upcoming" | "ongoing" | "completed" | "draft",
  };
}

// Schedule items
export async function createScheduleItem(
  eventId: string,
  itemData: Omit<EventScheduleItemInsert, "event_id">,
): Promise<void> {
  const { error } = await supabase.from("event_schedule_items").insert({
    ...itemData,
    event_id: eventId,
  });

  if (error) throw error;
}

export async function updateScheduleItem(
  id: string,
  updates: EventScheduleItemUpdate,
): Promise<void> {
  const { error } = await supabase
    .from("event_schedule_items")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteScheduleItem(id: string): Promise<void> {
  const { error } = await supabase
    .from("event_schedule_items")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
