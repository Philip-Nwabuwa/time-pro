import type { EventDetails } from "@/lib/api/types";

export type EventRouteDestination = "upcoming" | "live" | "completed";

/**
 * Determines the appropriate route destination based on event status
 */
export function getEventRouteDestination(
  event: EventDetails,
): EventRouteDestination {
  switch (event.status) {
    case "upcoming":
    case "draft":
      return "upcoming";
    case "ongoing":
      return "live";
    case "completed":
      return "completed";
    default:
      // Default to upcoming for unknown status
      return "upcoming";
  }
}

/**
 * Generates the correct route path for an event based on its status
 */
export function getEventRoutePath(
  pageId: string,
  eventId: string,
  event: EventDetails,
): string {
  const destination = getEventRouteDestination(event);

  switch (destination) {
    case "upcoming":
      return `/page/${pageId}/event/${eventId}`;
    case "live":
      return `/page/${pageId}/event/${eventId}/run`;
    default:
      return `/page/${pageId}/event/${eventId}`;
  }
}

/**
 * Checks if the current route matches the expected route for the event status
 */
export function isCorrectRouteForEventStatus(
  currentPath: string,
  pageId: string,
  eventId: string,
  event: EventDetails,
): boolean {
  const expectedPath = getEventRoutePath(pageId, eventId, event);
  return currentPath === expectedPath || currentPath.startsWith(expectedPath);
}

/**
 * Gets user-friendly status label
 */
export function getEventStatusLabel(status: string): string {
  switch (status) {
    case "upcoming":
      return "Upcoming";
    case "ongoing":
      return "Live";
    case "completed":
      return "Completed";
    case "draft":
      return "Draft";
    default:
      return "Unknown";
  }
}

/**
 * Gets status badge styling
 */
export function getEventStatusBadgeClass(status: string): string {
  switch (status) {
    case "upcoming":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100";
    case "ongoing":
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case "completed":
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    case "draft":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
}

/**
 * Hook to automatically redirect to the correct event route
 * Usage: Call this in components that show events to ensure users land on the right page
 */
export function useEventRouting(
  pageId: string,
  eventId: string,
  event: EventDetails | null,
) {
  // This would be used in components like event cards to ensure correct navigation
  return {
    getCorrectPath: () =>
      event
        ? getEventRoutePath(pageId, eventId, event)
        : `/page/${pageId}/event/${eventId}`,
    shouldRedirect: (currentPath: string) =>
      event
        ? !isCorrectRouteForEventStatus(currentPath, pageId, eventId, event)
        : false,
  };
}
