import { supabase } from "../supabase";
import type { Member } from "./types";

// Type for our database function result
interface PageMemberWithUserData {
  id: string;
  role: string;
  joined_at: string;
  user_id: string;
  user_email: string;
  user_first_name: string;
  user_last_name: string;
  user_avatar_url: string;
}

export async function fetchMembersByPageId(pageId: string): Promise<Member[]> {
  // Use database function to get members with user data
  // biome-ignore lint/suspicious/noExplicitAny: Required for custom RPC function that returns user data
  const { data, error } = await (supabase as any).rpc(
    "get_page_members_with_user_data",
    { page_id_param: pageId },
  );

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Transform the data to match Member interface with real user information
  const transformedMembers: Member[] = (data as PageMemberWithUserData[]).map(
    (row) => {
      // Extract user information from the function result
      const firstName = row.user_first_name || "";
      const lastName = row.user_last_name || "";
      const name =
        firstName && lastName
          ? `${firstName} ${lastName}`.trim()
          : row.user_email?.split("@")[0] || "Unknown User";

      const email = row.user_email || "no-email@example.com";
      const avatar =
        row.user_avatar_url ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;

      return {
        id: row.id,
        name,
        email,
        role: row.role as "admin" | "member",
        joinedDate: row.joined_at || new Date().toISOString(),
        avatar,
      };
    },
  );

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

  // Fetch the complete member data using our function
  const members = await fetchMembersByPageId(pageId);
  const addedMember = members.find((m) => m.id === member.id);

  if (!addedMember) {
    throw new Error("Failed to retrieve added member data");
  }

  return addedMember;
}

export async function updatePageMemberRole(
  memberId: string,
  role: "admin" | "member",
): Promise<Member> {
  // Get the page_id first so we can fetch updated member data
  const { data: memberData, error: fetchError } = await supabase
    .from("page_members")
    .select("page_id")
    .eq("id", memberId)
    .single();

  if (fetchError || !memberData) throw fetchError || new Error("Member not found");

  // Update the role
  const { error } = await supabase
    .from("page_members")
    .update({ role })
    .eq("id", memberId);

  if (error) throw error;

  // Ensure page_id is not null
  if (!memberData.page_id) throw new Error("Member has no associated page");

  // Fetch the complete member data using our function
  const members = await fetchMembersByPageId(memberData.page_id);
  const updatedMember = members.find((m) => m.id === memberId);

  if (!updatedMember) {
    throw new Error("Failed to retrieve updated member data");
  }

  return updatedMember;
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

export async function joinPage(pageId: string, pin?: string): Promise<Member> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  // Check if user is already a member
  const membership = await checkUserMembership(pageId, user.user.id);
  if (membership.isMember) {
    throw new Error("You are already a member of this page");
  }

  // Check if page is private and verify PIN
  const { data: page, error: pageError } = await supabase
    .from("pages")
    .select("is_private, pin")
    .eq("id", pageId)
    .single();

  if (pageError || !page) {
    throw new Error("Page not found");
  }

  if (page.is_private) {
    if (!pin) {
      throw new Error("PIN is required for private pages");
    }
    if (page.pin !== pin.trim()) {
      throw new Error("Invalid PIN");
    }
  }

  return addPageMember(pageId, user.user.id, "member");
}

export async function leavePage(pageId: string): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  // Find the user's membership record
  const { data: member, error: findError } = await supabase
    .from("page_members")
    .select("id")
    .eq("page_id", pageId)
    .eq("user_id", user.user.id)
    .single();

  if (findError || !member) {
    throw new Error("You are not a member of this page");
  }

  await removePageMember(member.id);
}
