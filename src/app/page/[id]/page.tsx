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
  Trash2,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  usePage,
  usePageEvents,
  usePageMembers,
  useDeletePage,
  useDeleteEvent,
  useLeavePage,
} from "@/lib/api/hooks";

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
  const deletePage = useDeletePage();
  const deleteEventMutation = useDeleteEvent();
  const leavePageMutation = useLeavePage();

  const handleBackClick = () => {
    router.push("/");
  };

  const handleCreateEvent = () => {
    router.push(`/page/${pageId}/create-event`);
  };

  const handleDeletePage = async () => {
    try {
      await deletePage.mutateAsync(pageId);
      router.push("/");
    } catch (error) {
      console.error("Failed to delete page:", error);
    }
  };

  const handleDeleteEvent = async (
    eventId: string,
    e?: React.MouseEvent<HTMLButtonElement | HTMLDivElement>
  ) => {
    if (e) e.stopPropagation();
    try {
      await deleteEventMutation.mutateAsync(eventId);
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  const handleLeavePage = async () => {
    try {
      await leavePageMutation.mutateAsync(pageId);
      router.push("/");
    } catch (error) {
      console.error("Failed to leave page:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
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
      <main className="min-h-screen justify-center items-center px-6 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      </main>
    );
  }

  if (pageError || !page) {
    return (
      <main className="min-h-screen justify-center items-center px-6 py-8">
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
        <div className="flex flex-col items-start justify-between">
          <div className="flex items-center justify-between gap-3">
            <div className="text-2xl">{page.title}</div>
            <div className="flex items-center gap-3">
              <Badge
                className={
                  page.role === "admin"
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                }
              >
                {page.role}
              </Badge>
              {page.role === "admin" ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Page</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{page.title}"? This
                        action cannot be undone. All events and data associated
                        with this page will be permanently removed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeletePage}
                        disabled={deletePage.isPending}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                      >
                        {deletePage.isPending ? "Deleting..." : "Delete Page"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                    >
                      Leave Page
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Leave Page</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to leave "{page.title}"? You will
                        no longer have access to this page or its events.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleLeavePage}
                        disabled={leavePageMutation.isPending}
                        className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                      >
                        {leavePageMutation.isPending
                          ? "Leaving..."
                          : "Leave Page"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
          <p className="text-base mt-2">{page.desc}</p>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-600 pt-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>
              {members.length} {members.length === 1 ? "member" : "members"}
            </span>
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
                          <CardTitle className="text-lg">
                            {event.title}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {event.description}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(event.status)}>
                            {event.status}
                          </Badge>
                          {page?.role === "admin" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent
                                onClick={(e) => e.stopPropagation()}
                              >
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Event
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "
                                    {event.title}
                                    "? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={(e) =>
                                      handleDeleteEvent(event.id, e)
                                    }
                                    disabled={deleteEventMutation.isPending}
                                    className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                                  >
                                    {deleteEventMutation.isPending
                                      ? "Deleting..."
                                      : "Delete Event"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col md:flex-row items-start md:gap-6 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(event.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{event.time}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
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
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 md:h-12 md:w-12">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className="bg-green-100 text-green-600">
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-1">
                          <CardTitle className="text-xs md:text-lg leading-none">
                            {member.name || "Unnamed Member"}
                          </CardTitle>
                          <CardDescription className="text-xs md:text-base leading-none">
                            {member.email || "No email provided"}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 hidden md:block">
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
