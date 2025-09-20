"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageSquare, Camera, ArrowLeft } from "lucide-react";
import { useEventDetails } from "@/lib/api/hooks";
import {
  fetchEventSessionForUser,
  type QnaQuestion,
  type SessionPhoto,
  type PollWithOptions,
  type UploadResult,
  getPhotoVersionUrls,
  fetchVisibleSessionPhotos,
  deleteSessionPhoto,
} from "@/lib/api/eventSessions";
import { useAuth } from "@/contexts/AuthContext";
import ImageGallery from "@/components/ImageGallery";
import { supabase } from "@/lib/supabase";
import PollsSection from "@/components/polls/PollsSection";
import PhotoUpload from "@/components/PhotoUpload";
import { checkUserMembership } from "@/lib/api/members";
import { toast } from "sonner";
import {
  acceptSessionPhoto,
  rejectSessionPhoto,
} from "@/lib/api/eventSessions";

export default function CompletedEventArchivePage() {
  const router = useRouter();
  const params = useParams();
  const pageId = params.id as string;
  const eventId = params.eventId as string;
  const { user } = useAuth();

  const {
    data: details,
    isLoading: loading,
    error,
  } = useEventDetails(pageId, eventId);

  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0);
  const [activeToolTab, setActiveToolTab] = useState<
    "agenda" | "qna" | "photos" | "polls"
  >("agenda");
  const [userRole, setUserRole] = useState<"admin" | "member" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(min-width: 1024px)");
    setActiveToolTab((prev) => (media.matches ? "qna" : "agenda"));
    const onChange = (e: MediaQueryListEvent) => {
      setActiveToolTab((prev) => {
        if (e.matches && prev === "agenda") return "qna";
        if (!e.matches && prev === "qna") return "agenda";
        return prev;
      });
    };
    if (media.addEventListener) media.addEventListener("change", onChange);
    else media.addListener(onChange);
    return () => {
      if (media.removeEventListener)
        media.removeEventListener("change", onChange);
      else media.removeListener(onChange);
    };
  }, []);

  const [qnaMessages, setQnaMessages] = useState<QnaQuestion[]>([]);
  const [photos, setPhotos] = useState<
    Array<{
      id: string;
      url: string;
      photo: SessionPhoto;
      selected?: boolean;
      thumbnailUrl?: string;
      originalUrl?: string;
    }>
  >([]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const openGallery = (index: number) => {
    setGalleryInitialIndex(index);
    setGalleryOpen(true);
  };

  const [polls, setPolls] = useState<PollWithOptions[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});

  // Upload handlers (enable updating images in archive)
  const handleUploadComplete = (results: UploadResult[]) => {
    const newPhotos = results.map((result) => ({
      id: result.photo.id,
      url: result.urls.medium,
      photo: result.photo,
      selected: false,
      thumbnailUrl: result.urls.thumbnail,
      originalUrl: result.urls.original,
    }));
    setPhotos((prev = []) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const unique = newPhotos.filter((p) => !existingIds.has(p.id));
      return [...unique, ...prev];
    });
  };

  const handleUploadError = (error: string) => {
    console.error("Archive upload error:", error);
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (userRole !== "admin") return;
    try {
      await deleteSessionPhoto(photoId);
      setPhotos((prev = []) => prev.filter((p) => p.id !== photoId));
      toast.success("Photo deleted");
    } catch (e) {
      console.error("Failed to delete photo:", e);
      toast.error("Failed to delete photo");
    }
  };

  const handleAcceptPhoto = async (photoId: string) => {
    if (userRole !== "admin" || !user?.id) return;
    try {
      await acceptSessionPhoto(photoId, user.id);
      setPhotos((prev = []) =>
        prev.map((p) =>
          p.id === photoId
            ? {
                ...p,
                photo: {
                  ...p.photo,
                  status: "accepted",
                  approved: true,
                } as any,
              }
            : p,
        ),
      );
      toast.success("Photo accepted");
    } catch (e) {
      console.error("Error accepting photo:", e);
      toast.error("Failed to accept photo");
    }
  };

  const handleRejectPhoto = async (photoId: string) => {
    if (userRole !== "admin") return;
    try {
      await rejectSessionPhoto(photoId);
      setPhotos((prev = []) =>
        prev.map((p) =>
          p.id === photoId
            ? { ...p, photo: { ...p.photo, status: "rejected" } as any }
            : p,
        ),
      );
      toast.success("Photo rejected");
    } catch (e) {
      console.error("Error rejecting photo:", e);
      toast.error("Failed to reject photo");
    }
  };

  // Load readonly session content (questions, photos, polls)
  useEffect(() => {
    const loadSession = async () => {
      if (!eventId) return;
      try {
        const {
          questions,
          photos: sessionPhotos,
          polls: sessionPolls,
        } = await fetchEventSessionForUser(eventId, userRole === "admin");
        setQnaMessages(questions);
        setPolls(sessionPolls);
        if (sessionPhotos.length > 0) {
          const photosWithUrls = await Promise.all(
            sessionPhotos.map(async (photo) => {
              const urls = await getPhotoVersionUrls(photo);
              return {
                id: photo.id,
                url: urls.medium,
                photo,
                selected: false,
                thumbnailUrl: urls.thumbnail,
                originalUrl: urls.original,
              };
            }),
          );
          setPhotos(photosWithUrls);
        } else {
          setPhotos([]);
        }
      } catch (e) {
        console.error("Error loading archive content", e);
        setPhotos([]);
      }
    };
    loadSession();
  }, [eventId, userRole]);

  // Determine role (archive)
  useEffect(() => {
    const checkRole = async () => {
      if (!user || !pageId) return;
      try {
        const membership = await checkUserMembership(pageId, user.id);
        setUserRole(membership.role || "member");
      } catch (e) {
        console.error("Error checking user role:", e);
        setUserRole("member");
      }
    };
    checkRole();
  }, [user, pageId]);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <p className="text-gray-500">Loading...</p>
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
          onClick={() => router.push(`/page/${pageId}/event/${eventId}`)}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Event Details
        </Button>
      </main>
    );
  }

  const currentSpeaker =
    details?.schedule[currentSpeakerIndex]?.speakerName || "Unknown Speaker";

  return (
    <main className="mx-auto max-w-6xl px-6 py-8 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="text-2xl font-semibold">{details.title}</div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              {new Date(details.date).toLocaleDateString("en-GB")} • Event
              Archive
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left: Agenda only (no timer in archive) */}
        <div className="hidden lg:block lg:col-span-7 space-y-6 overflow-y-auto pr-2 h-full pb-6">
          <div>
            <h3 className="font-semibold mb-3">Meeting Agenda</h3>
            <div className="space-y-3">
              {details.schedule.map((item, idx) => (
                <Card
                  key={item.id}
                  className={
                    idx === currentSpeakerIndex
                      ? "border-emerald-600"
                      : undefined
                  }
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 text-left">
                        <img
                          src={item.speakerAvatar || "/next.svg"}
                          alt="avatar"
                          className="h-8 w-8 rounded-full border-2 border-gray-300"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "/next.svg";
                          }}
                        />
                        <div>
                          <div className="font-medium text-sm">
                            {item.speakerName || "Unknown Speaker"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.title}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {idx < currentSpeakerIndex ? (
                          <Badge className="bg-emerald-100 text-emerald-700">
                            Done
                          </Badge>
                        ) : idx === currentSpeakerIndex ? (
                          <Badge className="bg-emerald-100 text-emerald-700">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Session Tools */}
        <div className="lg:col-span-5 space-y-4 flex-shrink-0 h-fit">
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3">Session Tools</h4>
              <div className={`flex items-center gap-2 flex-wrap`}>
                <Button
                  variant={activeToolTab === "agenda" ? "secondary" : "outline"}
                  size="sm"
                  className={`md:hidden block text-sm ${
                    activeToolTab === "agenda" ? "bg-purple-900 text-white" : ""
                  }`}
                  onClick={() => setActiveToolTab("agenda")}
                >
                  <Calendar className="h-4 w-4 mr-1 hidden md:block" /> Agenda
                </Button>
                <Button
                  variant={activeToolTab === "qna" ? "secondary" : "outline"}
                  size="sm"
                  className={`text-sm ${
                    activeToolTab === "qna" ? "bg-purple-900 text-white" : ""
                  }`}
                  onClick={() => setActiveToolTab("qna")}
                >
                  <MessageSquare className="h-4 w-4 mr-1 hidden md:block" /> Q&A
                </Button>
                <Button
                  variant={activeToolTab === "photos" ? "secondary" : "outline"}
                  size="sm"
                  className={`text-sm ${
                    activeToolTab === "photos" ? "bg-purple-900 text-white" : ""
                  }`}
                  onClick={() => setActiveToolTab("photos")}
                >
                  <Camera className="h-4 w-4 mr-1 hidden md:block" /> Photos
                </Button>
                <Button
                  variant={activeToolTab === "polls" ? "secondary" : "outline"}
                  size="sm"
                  className={`text-sm ${
                    activeToolTab === "polls" ? "bg-purple-900 text-white" : ""
                  }`}
                  onClick={() => setActiveToolTab("polls")}
                >
                  Polls
                </Button>
              </div>

              {activeToolTab === "agenda" && (
                <div className="mt-4">
                  <div className="font-medium mb-3">Meeting Agenda</div>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {details.schedule.map((item, idx) => (
                      <Card
                        key={item.id}
                        className={
                          idx === currentSpeakerIndex
                            ? "border-emerald-600"
                            : undefined
                        }
                      >
                        <CardContent className="!px-3 !py-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 text-left">
                              <img
                                src={item.speakerAvatar || "/next.svg"}
                                alt="avatar"
                                className="size-10 lg:size-20 rounded-full border-2 border-gray-300 flex-shrink-0"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src =
                                    "/next.svg";
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-xs sm:text-sm truncate">
                                  {item.speakerName || "Unknown Speaker"}
                                </div>
                                <div className="w-40 text-xs text-gray-500 truncate">
                                  {item.title}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {idx < currentSpeakerIndex ? (
                                <Badge className="bg-emerald-100 text-emerald-700">
                                  Done
                                </Badge>
                              ) : idx === currentSpeakerIndex ? (
                                <Badge className="bg-emerald-100 text-emerald-700">
                                  Active
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-600">
                                  Pending
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {activeToolTab === "qna" && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium">Q&A Session</div>
                    <Badge variant="secondary" className="text-xs">
                      {qnaMessages.length} question
                      {qnaMessages.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  {/* Questions list only - no input in archive */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {qnaMessages.length === 0 ? (
                      <div className="text-center text-gray-500 text-sm py-8">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <div>No questions</div>
                      </div>
                    ) : (
                      qnaMessages.map((msg) => {
                        const isRejected = msg.status === "rejected";
                        const isAnswered =
                          msg.status === "answered" || msg.answered;
                        return (
                          <Card
                            key={msg.id}
                            className={`p-3 ${
                              isAnswered
                                ? "bg-green-50 border-green-200"
                                : isRejected
                                  ? "opacity-30 bg-red-50 border-red-200"
                                  : "bg-white"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="text-sm font-medium text-gray-900">
                                    {msg.question}
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(
                                    msg.created_at || "",
                                  ).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {activeToolTab === "photos" && (
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">Photo Gallery</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {photos?.length || 0} photo
                          {(photos?.length || 0) !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Upload (allowed in archive) */}
                  <div className="mt-3">
                    <PhotoUpload
                      eventId={eventId}
                      isAdmin={false}
                      onUploadComplete={handleUploadComplete}
                      onUploadError={handleUploadError}
                      disabled={false}
                    />
                  </div>

                  {/* Thumbs */}
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    {(photos || []).map((photo, index) => (
                      <div
                        key={photo.id}
                        className={`relative aspect-square rounded-md overflow-hidden border group cursor-pointer ${
                          photo.photo.status === "pending" &&
                          userRole !== "admin"
                            ? "border-gray-200 opacity-50"
                            : photo.photo.status === "rejected"
                              ? "border-red-200 opacity-30"
                              : "border-gray-200"
                        }`}
                        onClick={() => openGallery(index)}
                      >
                        <img
                          src={(photo as any).thumbnailUrl || photo.url}
                          alt={photo.photo.file_name}
                          className={`h-full w-full object-cover transition-opacity duration-200 ${
                            photo.photo.status === "pending" &&
                            userRole !== "admin"
                              ? "grayscale"
                              : ""
                          }`}
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== photo.url)
                              target.src = photo.url;
                          }}
                        />

                        {/* Status overlay for non-admins */}
                        {photo.photo.status === "pending" &&
                          userRole !== "admin" && (
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                              <Badge className="bg-yellow-500 text-white text-xs">
                                Pending
                              </Badge>
                            </div>
                          )}
                        {photo.photo.status === "rejected" && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <Badge className="bg-red-500 text-white text-xs">
                              Rejected
                            </Badge>
                          </div>
                        )}

                        {/* Admin approval controls for pending photos */}
                        {userRole === "admin" &&
                          photo.photo.status === "pending" && (
                            <div className="absolute bottom-1 left-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAcceptPhoto(photo.id);
                                }}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs py-1 h-auto rounded"
                              >
                                Accept
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRejectPhoto(photo.id);
                                }}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs py-1 h-auto rounded"
                              >
                                Reject
                              </button>
                            </div>
                          )}

                        {/* Admin delete button */}
                        {userRole === "admin" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePhoto(photo.id);
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete photo"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeToolTab === "polls" && (
                <div className="mt-4">
                  <PollsSection
                    polls={polls}
                    onCreatePoll={async () => {
                      /* disabled in archive */
                    }}
                    onVote={async () => {
                      /* disabled in archive */
                    }}
                    onToggleActive={async () => {
                      /* disabled in archive */
                    }}
                    onDeletePoll={async () => {
                      /* disabled in archive */
                    }}
                    userVotes={userVotes}
                    isLoading={false}
                    canManage={false}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Gallery */}
      <ImageGallery
        photos={photos || []}
        initialIndex={galleryInitialIndex}
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />
    </main>
  );
}
