import type { Database } from "../database.types";

// Database types
export type DbPage = Database["public"]["Tables"]["pages"]["Row"];
export type DbEvent = Database["public"]["Tables"]["events"]["Row"];
export type DbPageMember = Database["public"]["Tables"]["page_members"]["Row"];
export type DbEventScheduleItem =
  Database["public"]["Tables"]["event_schedule_items"]["Row"];

// API response types (compatible with existing mock API)
export interface PageData {
  id: string;
  title: string;
  desc: string;
  members: number;
  events: number;
  role: "admin" | "member";
  imageUrl?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  status: "upcoming" | "ongoing" | "completed" | "draft";
}

export interface EventScheduleItem {
  id: string;
  order: number;
  title: string;
  role: string;
  allocatedMinutes: number;
  minMinutes?: number;
  targetMinutes?: number;
  maxMinutes?: number;
  status?: "pending" | "completed" | "cancelled";
  speakerName?: string;
  speakerEmail?: string;
  speakerBio?: string;
  speakerAvatar?: string;
  socialMediaLinks?: any;
}

export interface EventDetails extends Event {
  estimatedMinutes: number;
  rolesCount: number;
  configured: boolean;
  allowFeedback?: boolean;
  anonymousFeedback?: boolean;
  detailedSpeakerProfiles?: boolean;
  schedule: EventScheduleItem[];
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  joinedDate: string;
  avatar?: string;
  bio?: string;
  socialMediaLinks?: { platform: string; url: string }[];
  linkedin?: string;
}

// Insert types for database operations
export type PageInsert = Database["public"]["Tables"]["pages"]["Insert"];
export type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
export type PageMemberInsert =
  Database["public"]["Tables"]["page_members"]["Insert"];
export type EventScheduleItemInsert =
  Database["public"]["Tables"]["event_schedule_items"]["Insert"];

// Update types for database operations
export type PageUpdate = Database["public"]["Tables"]["pages"]["Update"];
export type EventUpdate = Database["public"]["Tables"]["events"]["Update"];
export type PageMemberUpdate =
  Database["public"]["Tables"]["page_members"]["Update"];
export type EventScheduleItemUpdate =
  Database["public"]["Tables"]["event_schedule_items"]["Update"];

// Session data types
export type QnaQuestionInsert =
  Database["public"]["Tables"]["event_qna_questions"]["Insert"];
export type QnaQuestionUpdate =
  Database["public"]["Tables"]["event_qna_questions"]["Update"];
export type SessionPhotoInsert =
  Database["public"]["Tables"]["event_session_photos"]["Insert"];
export type SessionDataInsert =
  Database["public"]["Tables"]["event_session_data"]["Insert"];
export type SessionDataUpdate =
  Database["public"]["Tables"]["event_session_data"]["Update"];
