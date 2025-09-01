"use client";

import { useParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  Users2,
  Clock,
  BadgeCheck,
  Play,
  Pencil,
  ArrowLeft,
} from "lucide-react";
import { useEventDetails, queryKeys } from "@/lib/api/hooks";
import { useEffect, useState } from "react";
import { checkUserMembership } from "@/lib/api/members";
import { useAuth } from "@/contexts/AuthContext";
import { startEvent } from "@/lib/api/events";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  getEventRouteDestination,
  getEventRoutePath,
  isCorrectRouteForEventStatus,
  getEventStatusLabel,
  getEventStatusBadgeClass,
} from "@/lib/utils/eventRouting";

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const pageId = params.id as string;
  const eventId = params.eventId as string;

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [userRole, setUserRole] = useState<"admin" | "member" | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const {
    data: details,
    isLoading: loading,
    error,
  } = useEventDetails(pageId, eventId);

  // Check if we need to redirect based on event status
  useEffect(() => {
    if (!details || loading) return;

    const shouldRedirect = !isCorrectRouteForEventStatus(
      pathname,
      pageId,
      eventId,
      details
    );

    if (shouldRedirect) {
      const correctPath = getEventRoutePath(pageId, eventId, details);
      router.replace(correctPath);
    }
  }, [details, loading, pathname, pageId, eventId, router]);

  useEffect(() => {
    const checkRole = async () => {
      if (!user || !pageId) return;

      try {
        const membership = await checkUserMembership(pageId, user.id);
        setUserRole(membership.role || "member");
      } catch (error) {
        console.error("Error checking user role:", error);
        setUserRole("member"); // Default to member on error
      }
    };

    checkRole();
  }, [user, pageId]);

  const handleStartEvent = async () => {
    if (!details || userRole !== "admin") {
      toast.error("Only administrators can start events");
      return;
    }

    setIsStarting(true);
    try {
      await startEvent(eventId);
      // Invalidate and refetch the event details and related queries
      await queryClient.invalidateQueries({
        queryKey: queryKeys.eventDetails(pageId, eventId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.pageEvents(pageId),
      });
      toast.success("Event started successfully!");
      // The useEffect will handle the redirect to the run page
    } catch (error) {
      console.error("Error starting event:", error);
      toast.error("Failed to start event. Please try again.");
    } finally {
      setIsStarting(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <p className="text-gray-500">Loading event...</p>
      </main>
    );
  }

  if (error || !details) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <p className="text-red-500">
          {error ? `Error loading event: ${error.message}` : "Event not found."}
        </p>
        <Button
          variant="outline"
          onClick={() => router.push(`/page/${pageId}`)}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Page
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {details.title}
              </h1>
              <div className="flex items-center gap-6 text-sm text-gray-600 mt-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(details.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={getEventStatusBadgeClass(details.status)}>
                {getEventStatusLabel(details.status)}
              </Badge>
            </div>
          </div>
          {userRole === "admin" &&
            (details.status === "upcoming" || details.status === "draft") && (
              <div className="mt-6 flex items-center gap-3">
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleStartEvent}
                  disabled={isStarting}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isStarting ? "Starting..." : "Start Event"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(`/page/${pageId}/event/${eventId}/edit`)
                  }
                >
                  <Pencil className="h-4 w-4 mr-2" /> Edit Event
                </Button>
              </div>
            )}
          {userRole === "admin" && details.status === "ongoing" && (
            <div className="mt-6 flex items-center gap-3">
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() =>
                  router.push(`/page/${pageId}/event/${eventId}/run`)
                }
              >
                <Play className="h-4 w-4 mr-2" />
                Continue Event
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/page/${pageId}/event/${eventId}/edit`)
                }
              >
                <Pencil className="h-4 w-4 mr-2" /> Edit Event
              </Button>
            </div>
          )}
          {userRole === "member" &&
            (details.status === "upcoming" || details.status === "draft") && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-1">Event Status</h4>
                <p className="text-sm text-blue-700">
                  This event hasn't started yet. You'll be automatically
                  redirected to the live event page when it begins.
                </p>
              </div>
            )}
          {userRole === "member" && details.status === "ongoing" && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-1">Event Live!</h4>
              <p className="text-sm text-green-700">
                This event is currently live. You'll be redirected to the live
                event page automatically.
              </p>
            </div>
          )}
          {details.status === "completed" && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-1">Event Status</h4>
              <p className="text-sm text-gray-700">
                This event has been completed. You can view session materials,
                photos, Q&A, and poll results in the completed event archive.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() =>
                  router.push(`/page/${pageId}/event/${eventId}/completed`)
                }
              >
                View Event Archive
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Event Schedule</h2>
        <p className="text-sm text-gray-500">
          Preview of speakers and their allocated time slots
        </p>
      </div>

      <div className="space-y-4">
        {details.schedule.map((item) => (
          <Card key={item.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-sm font-semibold text-blue-800">
                    {item.order}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {item.title}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <BadgeCheck className="h-3 w-3" /> {item.role}
                    </div>
                    {item.speakerName && (
                      <div className="text-xs text-gray-600 mt-1">
                        Speaker: {item.speakerName}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {item.allocatedMinutes}m
                  </div>
                  <div className="text-xs text-gray-500">allocated</div>
                  {item.minMinutes && item.maxMinutes && (
                    <div className="text-xs text-gray-400 mt-1">
                      {item.minMinutes}m - {item.maxMinutes}m range
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Event Information */}
      <Card className="mt-6 bg-gray-50">
        <CardContent className="py-4">
          <h3 className="font-medium text-gray-900 mb-2">Event Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-700">Total Duration</div>
              <div className="text-gray-600">
                {details.estimatedMinutes} minutes
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-700">
                Number of Speakers
              </div>
              <div className="text-gray-600">{details.rolesCount} roles</div>
            </div>
            {details.location && (
              <div>
                <div className="font-medium text-gray-700">Location</div>
                <div className="text-gray-600">{details.location}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
