import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchPages,
  fetchAllPages,
  fetchPageById,
  createPage,
  updatePage,
  deletePage,
} from "./pages";
import {
  fetchEventsByPageId,
  fetchEventDetails,
  createEvent,
  updateEvent,
  deleteEvent,
} from "./events";
import {
  fetchMembersByPageId,
  addPageMember,
  updatePageMemberRole,
  removePageMember,
  joinPage,
  leavePage,
} from "./members";
import type { PageInsert, PageUpdate, EventInsert, EventUpdate } from "./types";

// Query keys
export const queryKeys = {
  pages: ["pages"] as const,
  allPages: ["pages", "all"] as const,
  page: (id: string) => ["pages", id] as const,
  pageEvents: (pageId: string) => ["pages", pageId, "events"] as const,
  pageMembers: (pageId: string) => ["pages", pageId, "members"] as const,
  eventDetails: (pageId: string, eventId: string) =>
    ["pages", pageId, "events", eventId] as const,
};

// Pages hooks
export function usePages() {
  return useQuery({
    queryKey: queryKeys.pages,
    queryFn: fetchPages,
  });
}

export function useAllPages() {
  return useQuery({
    queryKey: queryKeys.allPages,
    queryFn: fetchAllPages,
  });
}

export function usePage(id: string) {
  return useQuery({
    queryKey: queryKeys.page(id),
    queryFn: () => fetchPageById(id),
    enabled: !!id,
  });
}

export function useCreatePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pageData,
      imageFile,
    }: {
      pageData: Omit<PageInsert, "created_by">;
      imageFile?: File;
    }) => createPage(pageData, imageFile),
    onSuccess: (data) => {
      // Invalidate all page-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.pages });
      queryClient.invalidateQueries({ queryKey: queryKeys.allPages });
      
      // Also invalidate the specific page query if we have the ID
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.page(data.id) });
      }
      
      toast.success("Page created successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create page: ${error.message}`);
    },
  });
}

export function useUpdatePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: PageUpdate }) =>
      updatePage(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pages });
      queryClient.invalidateQueries({ queryKey: queryKeys.page(data.id) });
      toast.success("Page updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update page: ${error.message}`);
    },
  });
}

export function useDeletePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pages });
      toast.success("Page deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete page: ${error.message}`);
    },
  });
}

// Events hooks
export function usePageEvents(pageId: string) {
  return useQuery({
    queryKey: queryKeys.pageEvents(pageId),
    queryFn: () => fetchEventsByPageId(pageId),
    enabled: !!pageId,
  });
}

export function useEventDetails(pageId: string, eventId: string) {
  return useQuery({
    queryKey: queryKeys.eventDetails(pageId, eventId),
    queryFn: () => fetchEventDetails(pageId, eventId),
    enabled: !!pageId && !!eventId,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventData: Omit<EventInsert, "created_by">) =>
      createEvent(eventData),
    onSuccess: (data, variables) => {
      if (variables.page_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.pageEvents(variables.page_id),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.page(variables.page_id),
        });
      }
      toast.success("Event created successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create event: ${error.message}`);
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: EventUpdate }) =>
      updateEvent(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      toast.success("Event updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update event: ${error.message}`);
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      toast.success("Event deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete event: ${error.message}`);
    },
  });
}

// Members hooks
export function usePageMembers(pageId: string) {
  return useQuery({
    queryKey: queryKeys.pageMembers(pageId),
    queryFn: () => fetchMembersByPageId(pageId),
    enabled: !!pageId,
  });
}

export function useAddPageMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pageId,
      userId,
      role,
    }: {
      pageId: string;
      userId: string;
      role?: "admin" | "member";
    }) => addPageMember(pageId, userId, role),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pageMembers(variables.pageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.page(variables.pageId),
      });
      toast.success("Member added successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to add member: ${error.message}`);
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      role,
    }: {
      memberId: string;
      role: "admin" | "member";
    }) => updatePageMemberRole(memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      toast.success("Member role updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update member role: ${error.message}`);
    },
  });
}

export function useRemovePageMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removePageMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      toast.success("Member removed successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove member: ${error.message}`);
    },
  });
}

export function useJoinPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pageId, pin }: { pageId: string; pin?: string }) =>
      joinPage(pageId, pin),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pages });
      queryClient.invalidateQueries({
        queryKey: queryKeys.page(variables.pageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pageMembers(variables.pageId),
      });
      toast.success("Successfully joined the page!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to join page: ${error.message}`);
    },
  });
}

export function useLeavePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leavePage,
    onSuccess: (data, pageId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pages });
      queryClient.invalidateQueries({ queryKey: queryKeys.page(pageId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pageMembers(pageId),
      });
      toast.success("Successfully left the page!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to leave page: ${error.message}`);
    },
  });
}
