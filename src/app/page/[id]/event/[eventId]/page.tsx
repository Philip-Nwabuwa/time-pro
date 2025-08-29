"use client";

import { useParams, useRouter } from "next/navigation";
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
import { useEventDetails } from "@/lib/api/hooks";

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const pageId = params.id as string;
  const eventId = params.eventId as string;

  const {
    data: details,
    isLoading: loading,
    error,
  } = useEventDetails(pageId, eventId);

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
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{details.estimatedMinutes}m estimated</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users2 className="h-4 w-4" />
                  <span>{details.rolesCount} roles</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                className={
                  details.status === "completed"
                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                    : details.status === "upcoming"
                    ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                }
              >
                {details.status === "upcoming" ? "Upcoming" :
                 details.status === "completed" ? "Completed" :
                 details.status === "draft" ? "Draft" : "Unknown"}
              </Badge>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() =>
                router.push(`/page/${pageId}/event/${eventId}/run`)
              }
            >
              <Play className="h-4 w-4 mr-2" /> Start Event
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/page/${pageId}/event/${eventId}/edit`)}
            >
              <Pencil className="h-4 w-4 mr-2" /> Edit Event
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Schedule */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Event Schedule</h2>
        <p className="text-sm text-gray-500">
          Speakers and their allocated time slots
        </p>
      </div>

      <div className="space-y-4">
        {details.schedule.map((item) => (
          <Card key={item.id}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
                    {item.order}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {item.title}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <BadgeCheck className="h-3 w-3" /> {item.role}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {item.allocatedMinutes}m
                  <span className="ml-1 text-gray-400">allocated</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
