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
    .order("event_date", { ascending: true });

  if (error) throw error;

  return events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description || "",
    date: event.event_date,
    time: event.event_time,
    location: event.location || "",
    attendees: event.attendees_count || 0,
    status: event.status as "upcoming" | "ongoing" | "completed",
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
    status: event.status as "upcoming" | "ongoing" | "completed",
    estimatedMinutes: event.estimated_minutes || 60,
    rolesCount: event.roles_count || 0,
    configured: event.configured || false,
    schedule: scheduleItems.map((item) => ({
      id: item.id,
      order: item.order_index,
      title: item.title,
      role: item.role,
      allocatedMinutes: item.allocated_minutes,
    })),
  };
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
    status: event.status as "upcoming" | "ongoing" | "completed",
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
    status: event.status as "upcoming" | "ongoing" | "completed",
  };
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) throw error;
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
