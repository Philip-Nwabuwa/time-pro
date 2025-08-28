"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  MapPin,
  Loader2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { usePage, usePageEvents, usePageMembers } from "@/lib/api/hooks";

export default function PageDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const pageId = params.id as string;

  const {
    data: page,
    isLoading: pageLoading,
    error: pageError,
  } = usePage(pageId);
  const { data: events = [], isLoading: eventsLoading } = usePageEvents(pageId);
  const { data: members = [], isLoading: membersLoading } =
    usePageMembers(pageId);

  const handleBackClick = () => {
    router.push("/");
  };

  const handleCreateEvent = () => {
    router.push(`/page/${pageId}/create-event`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-700";
      case "ongoing":
        return "bg-green-100 text-green-700";
      case "completed":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (pageLoading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Loading page details...</span>
        </div>
      </main>
    );
  }

  if (pageError || !page) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center justify-center py-12">
          <span className="text-red-500">
            Failed to load page details. Please try again.
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-4">
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-2xl">{page.title}</div>
            <p className="text-base mt-2">{page.desc}</p>
          </div>
          <Badge
            className={
              page.role === "admin"
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                : "bg-gray-100 text-gray-700 hover:bg-gray-100"
            }
          >
            {page.role}
          </Badge>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-600 pt-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{page.members} members</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{page.events} events</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="events" className="space-y-6">
        <TabsList>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Events</h2>
            {page?.role === "admin" && (
              <Button onClick={handleCreateEvent} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Event
              </Button>
            )}
          </div>

          {eventsLoading ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                  <span className="ml-2 text-gray-500">Loading events...</span>
                </div>
              </CardContent>
            </Card>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <div className="text-gray-500">
                    No events found for this page.
                  </div>
                  {page?.role === "admin" && (
                    <Button
                      onClick={handleCreateEvent}
                      variant="outline"
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create Your First Event
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {events.map((event) => (
                <Card
                  key={event.id}
                  className="hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() =>
                    router.push(`/page/${pageId}/event/${event.id}`)
                  }
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {event.description}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{event.attendees} attendees</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          {membersLoading ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                  <span className="ml-2 text-gray-500">Loading members...</span>
                </div>
              </CardContent>
            </Card>
          ) : members.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  No members found for this page.
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {members.map((member) => (
                <Card
                  key={member.id}
                  className="hover:shadow-sm transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{member.name}</CardTitle>
                        <CardDescription>{member.email}</CardDescription>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">
                          Joined {formatDate(member.joinedDate)}
                        </span>
                        <Badge
                          className={
                            member.role === "admin"
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                          }
                        >
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
