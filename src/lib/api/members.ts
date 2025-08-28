import { supabase } from "../supabase";
import type { Member, PageMemberInsert, PageMemberUpdate } from "./types";

export async function fetchMembersByPageId(pageId: string): Promise<Member[]> {
  const { data: members, error } = await supabase
    .from("page_members")
    .select(`
      id,
      role,
      joined_at,
      user_id
    `)
    .eq("page_id", pageId);

  if (error) throw error;

  // Get user details from auth.users (this would typically be done with a view or stored user profile data)
  // For now, we'll create mock data based on user IDs since auth.users is not directly accessible
  const transformedMembers: Member[] = members.map((member, index) => ({
    id: member.id,
    name: `User ${member.user_id?.slice(-4)}`, // Placeholder name
    email: `user${index + 1}@example.com`, // Placeholder email
    role: member.role as "admin" | "member",
    joinedDate: member.joined_at || new Date().toISOString(),
    avatar: undefined,
  }));

  return transformedMembers;
}

export async function addPageMember(
  pageId: string,
  userId: string,
  role: "admin" | "member" = "member",
): Promise<Member> {
  const { data: member, error } = await supabase
    .from("page_members")
    .insert({
      page_id: pageId,
      user_id: userId,
      role,
    })
    .select()
    .single();

  if (error) throw error;

  // Return transformed member (with placeholder data for now)
  return {
    id: member.id,
    name: `User ${userId.slice(-4)}`,
    email: "user@example.com",
    role: member.role as "admin" | "member",
    joinedDate: member.joined_at || new Date().toISOString(),
  };
}

export async function updatePageMemberRole(
  memberId: string,
  role: "admin" | "member",
): Promise<Member> {
  const { data: member, error } = await supabase
    .from("page_members")
    .update({ role })
    .eq("id", memberId)
    .select()
    .single();

  if (error) throw error;

  return {
    id: member.id,
    name: `User ${member.user_id?.slice(-4)}`,
    email: "user@example.com",
    role: member.role as "admin" | "member",
    joinedDate: member.joined_at || new Date().toISOString(),
  };
}

export async function removePageMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from("page_members")
    .delete()
    .eq("id", memberId);

  if (error) throw error;
}

export async function checkUserMembership(
  pageId: string,
  userId: string,
): Promise<{ isMember: boolean; role?: "admin" | "member" }> {
  const { data: member, error } = await supabase
    .from("page_members")
    .select("role")
    .eq("page_id", pageId)
    .eq("user_id", userId)
    .single();

  if (error || !member) {
    return { isMember: false };
  }

  return {
    isMember: true,
    role: member.role as "admin" | "member",
  };
}
