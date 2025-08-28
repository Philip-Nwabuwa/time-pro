// Re-export all API functions
export * from "./pages";
export * from "./events";
export * from "./members";
export * from "./types";

// For backward compatibility with existing mock API imports
export {
  fetchPages,
  fetchPageById,
} from "./pages";

export {
  fetchEventsByPageId,
  fetchEventDetails,
} from "./events";

export { fetchMembersByPageId } from "./members";

// Legacy aliases
export { fetchEventsByPageId as getEvents } from "./events";
export { fetchEventDetails as getEventDetails } from "./events";
export { fetchPages as getPages } from "./pages";
export { fetchPageById as getPageDetails } from "./pages";
export { fetchMembersByPageId as getMembers } from "./members";
