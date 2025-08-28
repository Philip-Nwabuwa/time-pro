import { supabase } from "../supabase";
import type { PageData, PageInsert, PageUpdate } from "./types";

export async function fetchPages(): Promise<PageData[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  // Get pages the user created (these will be returned by RLS automatically)
  const { data: ownedPages, error: ownedError } = await supabase
    .from("pages")
    .select("id, title, description, created_by");

  if (ownedError) throw ownedError;

  // Get pages where user is a member
  const { data: membershipData, error: memberError } = await supabase
    .from("page_members")
    .select(`
      page_id,
      role,
      pages!inner (
        id,
        title,
        description,
        created_by
      )
    `)
    .eq("user_id", user.user.id);

  if (memberError) throw memberError;

  // Combine both sets of pages, avoiding duplicates
  const allPageIds = new Set<string>();
  const allPages: Array<{
    id: string;
    title: string;
    description: string | null;
    created_by: string | null;
    userRole?: string;
  }> = [];

  // Add owned pages
  ownedPages.forEach((page) => {
    allPageIds.add(page.id);
    allPages.push({
      ...page,
      userRole: "admin",
    });
  });

  // Add member pages (if not already included as owned)
  membershipData.forEach((membership) => {
    const page = membership.pages;
    if (!allPageIds.has(page.id)) {
      allPageIds.add(page.id);
      allPages.push({
        ...page,
        userRole: membership.role,
      });
    }
  });

  // Transform to PageData format with counts
  const transformedPages: PageData[] = await Promise.all(
    allPages.map(async (page) => {
      // Get member count - this will work because we can see pages we're associated with
      const { count: memberCount } = await supabase
        .from("page_members")
        .select("*", { count: "exact", head: true })
        .eq("page_id", page.id);

      // Get event count
      const { count: eventCount } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("page_id", page.id);

      return {
        id: page.id,
        title: page.title,
        desc: page.description || "",
        members: memberCount || 0,
        events: eventCount || 0,
        role: page.userRole as "admin" | "member",
      };
    }),
  );

  return transformedPages;
}

export async function fetchPageById(id: string): Promise<PageData | null> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data: page, error } = await supabase
    .from("pages")
    .select(`
      id,
      title,
      description,
      created_by
    `)
    .eq("id", id)
    .single();

  if (error || !page) return null;

  // Get member count
  const { count: memberCount } = await supabase
    .from("page_members")
    .select("*", { count: "exact", head: true })
    .eq("page_id", page.id);

  // Get event count
  const { count: eventCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("page_id", page.id);

  // Get user's role
  const { data: memberData } = await supabase
    .from("page_members")
    .select("role")
    .eq("page_id", page.id)
    .eq("user_id", user.user.id)
    .single();

  const isCreator = page.created_by === user.user.id;
  const role = isCreator
    ? "admin"
    : (memberData?.role as "admin" | "member") || "member";

  return {
    id: page.id,
    title: page.title,
    desc: page.description || "",
    members: memberCount || 0,
    events: eventCount || 0,
    role,
  };
}

export async function createPage(
  pageData: Omit<PageInsert, "created_by">,
): Promise<PageData> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  // Create page
  const { data: page, error } = await supabase
    .from("pages")
    .insert({
      ...pageData,
      created_by: user.user.id,
    })
    .select()
    .single();

  if (error) throw error;

  // Add creator as admin member
  const { error: memberError } = await supabase.from("page_members").insert({
    page_id: page.id,
    user_id: user.user.id,
    role: "admin",
  });

  if (memberError) throw memberError;

  return {
    id: page.id,
    title: page.title,
    desc: page.description || "",
    members: 1,
    events: 0,
    role: "admin",
  };
}

export async function updatePage(
  id: string,
  updates: PageUpdate,
): Promise<PageData> {
  const { data: page, error } = await supabase
    .from("pages")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // Fetch updated page data
  const updatedPage = await fetchPageById(id);
  if (!updatedPage) throw new Error("Page not found after update");

  return updatedPage;
}

export async function deletePage(id: string): Promise<void> {
  const { error } = await supabase.from("pages").delete().eq("id", id);

  if (error) throw error;
}
