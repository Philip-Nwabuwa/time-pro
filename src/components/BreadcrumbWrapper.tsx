"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { fetchEventDetails, fetchPageById, type EventDetails, type PageData } from "@/lib/mockApi";

interface BreadcrumbData {
  title: string;
  href?: string;
}

export default function BreadcrumbWrapper() {
  const pathname = usePathname();
  const router = useRouter();
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [pageDetails, setPageDetails] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(false);

  // Parse pathname to extract dynamic segments
  const pathSegments = pathname.split("/").filter(Boolean);

  // Don't show breadcrumb on root pages or auth pages
  const publicPaths = ["/signin", "/signup", "/verify-otp", "/forgot-password"];
  const isPublicPath = publicPaths.includes(pathname);
  const isRootPath = pathname === "/";

  useEffect(() => {
    const loadDetails = async () => {
      // Load page details if we're on any page route
      if (pathSegments[0] === "page" && pathSegments[1]) {
        const pageId = pathSegments[1];
        
        setLoading(true);
        try {
          // Load page details
          const pageData = await fetchPageById(pageId);
          setPageDetails(pageData);
          
          // Also load event details if we're on an event page
          if (
            pathSegments.length >= 4 &&
            pathSegments[2] === "event" &&
            pathSegments[3]
          ) {
            const eventId = pathSegments[3];
            const eventData = await fetchEventDetails(pageId, eventId);
            setEventDetails(eventData);
          }
        } catch (error) {
          console.error("Failed to load details:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadDetails();
  }, [pathname, pathSegments]);

  // Generate breadcrumb items based on current path
  const generateBreadcrumbs = (): BreadcrumbData[] => {
    const breadcrumbs: BreadcrumbData[] = [];

    if (pathSegments[0] === "discovery") {
      breadcrumbs.push({ title: "Discovery" });
    } else if (pathSegments[0] === "page" && pathSegments[1]) {
      const pageId = pathSegments[1];

      // Always add Home as the first breadcrumb for page routes
      breadcrumbs.push({
        title: "Home",
        href: "/",
      });

      // Get the page title for breadcrumb
      const pageTitle = loading ? "Loading..." : pageDetails?.title || "Dashboard";

      // If we're on a specific page dashboard
      if (pathSegments.length === 2) {
        // This is the dashboard page (/page/[id])
        breadcrumbs.push({ title: pageTitle });
      } else {
        // We're deeper in the page, so page becomes a link
        breadcrumbs.push({
          title: pageTitle,
          href: `/page/${pageId}`,
        });

        // Event level
        if (pathSegments[2] === "event" && pathSegments[3]) {
          const eventTitle = loading
            ? "Loading..."
            : eventDetails?.title || "Event";
          breadcrumbs.push({
            title: eventTitle,
            href: `/page/${pageId}/event/${pathSegments[3]}`,
          });

          // Event run level
          if (pathSegments[4] === "run") {
            breadcrumbs.push({ title: "Meeting Run" });
          }
        } else if (pathSegments[2] === "create-event") {
          breadcrumbs.push({ title: "Create Event" });
        }
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumb if no breadcrumbs to show or on public/root paths
  if (breadcrumbs.length === 0 || isPublicPath || isRootPath) {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 pt-4 pb-2">
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((breadcrumb, index) => (
            <div key={index} className="contents">
              <BreadcrumbItem>
                {breadcrumb.href ? (
                  <BreadcrumbLink asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
                      onClick={() => router.push(breadcrumb.href!)}
                    >
                      {breadcrumb.title}
                    </Button>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{breadcrumb.title}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
