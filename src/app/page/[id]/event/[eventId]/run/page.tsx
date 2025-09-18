"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Calendar,
  MessageSquare,
  Camera,
  Maximize2,
  ArrowLeft,
  X,
  Play,
  Download,
  Trash2,
  ImagePlus,
  CheckSquare,
  SquareMinus,
  SquarePen,
  SkipBack,
  Check,
} from "lucide-react";
import { useEventDetails } from "@/lib/api/hooks";
import {
  fetchEventSessionAll,
  fetchEventSessionForUser,
  fetchQnaQuestions,
  createQnaQuestion,
  updateQnaQuestion,
  deleteQnaQuestion,
  acceptQnaQuestion,
  rejectQnaQuestion,
  markQuestionAsAnswered,
  fetchVisibleQnaQuestions,
  fetchPendingQnaQuestions,
  uploadSessionPhoto,
  deleteSessionPhoto,
  getPhotoPublicUrl,
  getPhotoVersionUrls,
  getPhotoThumbnailUrl,
  getPhotoMediumUrl,
  getPhotoOriginalUrl,
  acceptSessionPhoto,
  rejectSessionPhoto,
  fetchSessionPhotos,
  fetchVisibleSessionPhotos,
  fetchPendingSessionPhotos,
  upsertSessionData,
  createPoll,
  updatePoll,
  deletePoll,
  submitPollVote,
  getUserPollVotes,
  type QnaQuestion,
  type SessionPhoto,
  type PollWithOptions,
} from "@/lib/api/eventSessions";
import { toast } from "sonner";
import PollsSection from "@/components/polls/PollsSection";
import { useAuth } from "@/contexts/AuthContext";
import { updateEvent } from "@/lib/api/events";
import ImageGallery from "@/components/ImageGallery";
import AddTimeModal from "@/components/modals/AddTimeModal";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import EndMeetingModal from "@/components/modals/EndMeetingModal";
import { checkUserMembership } from "@/lib/api/members";
import { supabase } from "@/lib/supabase";
import { isImageFile } from "@/lib/utils/fileUtils";
import PhotoUpload from "@/components/PhotoUpload";
import { type UploadResult } from "@/lib/api/eventSessions";

function formatSeconds(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
}

interface TimerCardProps {
  currentSlot?: { title: string; role: string };
  currentSpeaker?: string;
  seconds: number;
  addedTime: number;
  onTimeState: string;
  isRunning: boolean;
  hasStarted: boolean;
  onToggleTimer: () => void;
  onNextSpeaker: () => void;
  onPreviousSpeaker: () => void;
  onAddTime: (seconds: number) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  timerBackgroundColor: string;
  timerTextColor: string;
  min: number;
  target: number;
  max: number;
  hideTimeDetails: boolean;
  onToggleHideDetails: () => void;
  isAdmin: boolean;
  currentSpeakerIndex: number;
  totalSpeakers: number;
}

function TimerCard({
  currentSlot,
  currentSpeaker,
  seconds,
  addedTime,
  onTimeState,
  isRunning,
  hasStarted,
  onToggleTimer,
  onNextSpeaker,
  onPreviousSpeaker,
  onAddTime,
  isFullscreen = false,
  onToggleFullscreen,
  timerBackgroundColor,
  timerTextColor,
  min,
  target,
  max,
  hideTimeDetails,
  onToggleHideDetails,
  isAdmin,
  currentSpeakerIndex,
  totalSpeakers,
}: TimerCardProps) {
  return (
    <Card className={isFullscreen ? "h-full" : ""}>
      <CardContent
        className={`p-6 ${timerBackgroundColor} ${timerTextColor} rounded-md ${
          isFullscreen ? "h-full flex flex-col justify-center" : ""
        } ${
          hideTimeDetails
            ? "min-h-[200px] flex items-center justify-center"
            : ""
        }`}
      >
        <div className="flex items-start justify-between">
          {!hideTimeDetails && (
            <div>
              <div
                className={
                  isFullscreen
                    ? "text-lg truncate w-40"
                    : "text-sm truncate w-40 "
                }
              >
                {currentSlot?.title || "Table Topics Master"}
              </div>
              <div
                className={`opacity-80 ${isFullscreen ? "text-sm" : "text-xs"}`}
              >
                {currentSpeaker || "Unknown Speaker"}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {!isFullscreen && (
              <div className="flex items-center gap-2">
                <label
                  className="text-xs opacity-80 cursor-pointer"
                  htmlFor="hide-details-switch"
                >
                  Hide Details
                </label>
                <Switch
                  id="hide-details-switch"
                  checked={hideTimeDetails}
                  onCheckedChange={onToggleHideDetails}
                  className="data-[state=checked]:bg-white/30 data-[state=unchecked]:bg-white/10"
                />
              </div>
            )}
            <button
              className="opacity-80 hover:opacity-100"
              onClick={onToggleFullscreen}
            >
              {isFullscreen ? (
                <X className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {!hideTimeDetails && (
          <div className="text-center my-8">
            <div
              className={`font-semibold tabular-nums tracking-tight ${
                isFullscreen ? "text-[128px]" : "text-[64px]"
              }`}
            >
              {formatSeconds(seconds + addedTime)}
            </div>
            <div
              className={`mt-2 flex items-center justify-center gap-6 ${
                isFullscreen ? "text-base" : "text-sm"
              }`}
            >
              <div>
                Min:{" "}
                <span className="font-mono border border-white rounded-full px-2 py-1">
                  {formatSeconds(min)}
                </span>
              </div>
              <div>
                Target:{" "}
                <span className="font-mono border border-white rounded-full px-2 py-1">
                  {formatSeconds(target)}
                </span>
              </div>
              <div>
                Max:{" "}
                <span className="font-mono border border-white rounded-full px-2 py-1">
                  {formatSeconds(max)}
                </span>
              </div>
            </div>
            <Badge
              variant="secondary"
              className={`mt-3 bg-white/20 text-white border-white/20 ${
                isFullscreen ? "text-base px-4 py-2" : ""
              }`}
            >
              {onTimeState}
            </Badge>
          </div>
        )}

        {!hideTimeDetails && (
          <>
            {/* Timer controls - only show for admins */}
            {isAdmin && (
              <div
                className={`grid grid-cols-3 gap-3 w-full items-center justify-center ${
                  isFullscreen ? "gap-6" : ""
                }`}
              >
                <Button
                  variant="secondary"
                  size={isFullscreen ? "default" : "default"}
                  className="bg-white/10 text-white hover:bg-white/20"
                  onClick={onPreviousSpeaker}
                  disabled={currentSpeakerIndex === 0}
                >
                  <SkipBack className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <Button
                  onClick={onToggleTimer}
                  size={isFullscreen ? "default" : "default"}
                  className="bg-emerald-700 hover:bg-emerald-800"
                >
                  {isRunning ? "Stop" : hasStarted ? "Resume" : "Start Timer"}
                </Button>
                <Button
                  variant="secondary"
                  size={isFullscreen ? "default" : "default"}
                  className="bg-white/10 text-white hover:bg-white/20"
                  onClick={onNextSpeaker}
                  disabled={currentSpeakerIndex >= totalSpeakers - 1}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Next
                </Button>
              </div>
            )}

            {/* Non-admin message */}
            {!isAdmin && (
              <div className="text-center text-white/70 text-sm">
                Timer controls are available to administrators only
                <div className="text-xs mt-1 opacity-75">
                  Timer is synchronized across all participants
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function RunEventPage() {
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

  // Debug: Log the details when they change
  useEffect(() => {
    if (details) {
      console.log("Event details loaded:", details);
      console.log(
        "Schedule items with speaker avatars:",
        details.schedule.map((item) => ({
          name: item.speakerName,
          avatar: item.speakerAvatar,
        }))
      );
    }
  }, [details]);

  // User role state
  const [userRole, setUserRole] = useState<"admin" | "member" | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  // Real-time timer synchronization state
  const [isTimerSynced, setIsTimerSynced] = useState(false);
  const [lastTimerUpdate, setLastTimerUpdate] = useState<Date | null>(null);
  const [sessionHydrated, setSessionHydrated] = useState(false);

  // Fullscreen modal state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Timer state
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [accumulatedMs, setAccumulatedMs] = useState(0);
  const [lastResumedAt, setLastResumedAt] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Speaker management
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0);
  const [addedTime, setAddedTime] = useState(0);

  // Hide time details state (per user)
  const [hideTimeDetails, setHideTimeDetails] = useState(false);

  // Q&A Session state
  const [qnaQuestion, setQnaQuestion] = useState("");
  const [qnaMessages, setQnaMessages] = useState<QnaQuestion[]>([]);
  const [loadingQna, setLoadingQna] = useState(false);

  const [activeToolTab, setActiveToolTab] = useState<
    "agenda" | "qna" | "photos" | "polls"
  >("agenda");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(min-width: 1024px)");

    // Apply on mount
    setActiveToolTab((prev) => (media.matches ? "qna" : "agenda"));

    // Update on breakpoint changes; don't override other user selections
    const onChange = (e: MediaQueryListEvent) => {
      setActiveToolTab((prev) => {
        if (e.matches && prev === "agenda") return "qna"; // mobile -> lg
        if (!e.matches && prev === "qna") return "agenda"; // lg -> mobile
        return prev;
      });
    };

    if (media.addEventListener) {
      media.addEventListener("change", onChange);
    } else {
      // Safari fallback
      media.addListener(onChange);
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", onChange);
      } else {
        media.removeListener(onChange);
      }
    };
  }, []);
  const [photos, setPhotos] = useState<
    Array<{
      id: string;
      url: string;
      photo: SessionPhoto;
      selected?: boolean;
    }>
  >();
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper function to deduplicate photos by ID
  const deduplicatePhotos = (
    photos: Array<{
      id: string;
      url: string;
      photo: SessionPhoto;
      selected?: boolean;
      thumbnailUrl?: string;
      originalUrl?: string;
    }>
  ) => {
    const seen = new Set<string>();
    return photos.filter((photo) => {
      if (seen.has(photo.id)) {
        return false;
      }
      seen.add(photo.id);
      return true;
    });
  };

  // Modal states
  const [showAddTimeModal, setShowAddTimeModal] = useState(false);
  const [showEndMeetingModal, setShowEndMeetingModal] = useState(false);
  const [stoppedTime, setStoppedTime] = useState<string>("");

  // Polls state
  const [polls, setPolls] = useState<PollWithOptions[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [loadingPolls, setLoadingPolls] = useState(false);
  // User details modal state
  const [selectedUser, setSelectedUser] = useState<{
    name: string;
    roleTitle: string;
    bio?: string;
    email?: string;
    avatar?: string;
    completed?: boolean;
    linkedin?: string;
    socialLinks?: Array<{ platform: string; url: string }>;
  } | null>(null);

  const currentSlot = details?.schedule[currentSpeakerIndex];
  const min = (currentSlot?.minMinutes || 3) * 60; // Use minMinutes from schedule
  const target =
    (currentSlot?.targetMinutes || currentSlot?.allocatedMinutes || 5) * 60 +
    addedTime; // Use targetMinutes or allocatedMinutes + added time
  const max = (currentSlot?.maxMinutes || 7) * 60 + addedTime; // Use maxMinutes + added time

  // Get current speaker from schedule data
  const currentSpeaker =
    details?.schedule[currentSpeakerIndex]?.speakerName || "Unknown Speaker";

  const onTimeState = useMemo(() => {
    if (seconds < min) return "On Time";
    if (seconds > max) return "Overtime";
    return "On Time";
  }, [seconds, min, max]);

  // Timer colors based on time thresholds
  const { timerBackgroundColor, timerTextColor } = useMemo(() => {
    if (seconds < min) {
      return {
        timerBackgroundColor: "bg-green-600",
        timerTextColor: "text-white",
      };
    } else if (seconds > max) {
      return {
        timerBackgroundColor: "bg-red-600",
        timerTextColor: "text-white",
      };
    } else if (seconds > target) {
      return {
        timerBackgroundColor: "bg-yellow-600",
        timerTextColor: "text-white",
      };
    } else {
      // Between min and target - should be green (on time)
      return {
        timerBackgroundColor: "bg-green-600",
        timerTextColor: "text-white",
      };
    }
  }, [seconds, min, target, max]);

  // Next speaker function - only for admins
  const handleNextSpeaker = async () => {
    if (userRole !== "admin") {
      toast.error("Only administrators can control speaker transitions");
      return;
    }

    if (!details?.schedule) return;

    const nextIndex = currentSpeakerIndex + 1;
    if (nextIndex < details.schedule.length) {
      // Save current speaker's final time before switching
      await saveSessionState();

      setCurrentSpeakerIndex(nextIndex);
      setSeconds(0); // Reset display seconds
      setAddedTime(0); // Reset added time
      setIsRunning(false); // Stop timer
      setHasStarted(false); // Reset timer started state
      setAccumulatedMs(0);
      setLastResumedAt(null);

      // Broadcast speaker change to all users
      await broadcastTimerState({
        isRunning: false,
        hasStarted: false,
        currentSpeakerIndex: nextIndex,
        addedTime: 0,
        lastUpdate: new Date().toISOString(),
        accumulatedMs: 0,
        lastResumedAt: null,
        controlledBy: user?.id,
      });
    }
  };

  // Previous speaker function - only for admins
  const handlePreviousSpeaker = async () => {
    if (userRole !== "admin") {
      toast.error("Only administrators can control speaker transitions");
      return;
    }

    if (!details?.schedule) return;

    const prevIndex = currentSpeakerIndex - 1;
    if (prevIndex >= 0) {
      // Save current speaker's final time before switching
      await saveSessionState();

      setCurrentSpeakerIndex(prevIndex);
      setSeconds(0); // Reset display seconds
      setAddedTime(0); // Reset added time
      setIsRunning(false); // Stop timer
      setHasStarted(false); // Reset timer started state
      setAccumulatedMs(0);
      setLastResumedAt(null);

      // Broadcast speaker change to all users
      await broadcastTimerState({
        isRunning: false,
        hasStarted: false,
        currentSpeakerIndex: prevIndex,
        addedTime: 0,
        lastUpdate: new Date().toISOString(),
        accumulatedMs: 0,
        lastResumedAt: null,
        controlledBy: user?.id,
      });
    }
  };

  // Add time function
  const handleAddTime = (timeToAdd: number) => {
    const newAddedTime = addedTime + timeToAdd;
    setAddedTime(newAddedTime);
    // Broadcast added time so all clients stay in sync
    broadcastTimerState({
      isRunning,
      hasStarted,
      currentSpeakerIndex,
      addedTime: newAddedTime,
      lastUpdate: new Date().toISOString(),
      accumulatedMs,
      lastResumedAt,
      controlledBy: user?.id,
    });
  };

  // Timer toggle function - only for admins
  const handleToggleTimer = async () => {
    if (userRole !== "admin") {
      toast.error("Only administrators can control the timer");
      return;
    }

    const nowIso = new Date().toISOString();
    if (!isRunning) {
      // Start or resume
      setHasStarted(true);
      setIsRunning(true);
      setLastResumedAt(nowIso);
      await broadcastTimerState({
        isRunning: true,
        hasStarted: true,
        currentSpeakerIndex,
        addedTime,
        lastUpdate: nowIso,
        accumulatedMs,
        lastResumedAt: nowIso,
        controlledBy: user?.id,
      });
    } else {
      // Pause: add elapsed since last resume to accumulated
      const lastResumeTime = lastResumedAt ? Date.parse(lastResumedAt) : null;
      const nowMs = Date.now();
      const elapsed = lastResumeTime ? Math.max(0, nowMs - lastResumeTime) : 0;
      const newAccumulated = accumulatedMs + elapsed;
      const currentTime = Math.floor(newAccumulated / 1000);
      setIsRunning(false);
      setAccumulatedMs(newAccumulated);
      setLastResumedAt(null);
      setStoppedTime(formatSeconds(currentTime));
      setShowAddTimeModal(true);
      await broadcastTimerState({
        isRunning: false,
        hasStarted: true,
        currentSpeakerIndex,
        addedTime,
        lastUpdate: nowIso,
        accumulatedMs: newAccumulated,
        lastResumedAt: null,
        controlledBy: user?.id,
      });
    }
  };

  const handleAddTimeFromModal = (additionalSeconds: number) => {
    if (additionalSeconds > 0) {
      const newAddedTime = addedTime + additionalSeconds;
      setAddedTime(newAddedTime);
      // Broadcast added time change from modal confirmation
      broadcastTimerState({
        isRunning,
        hasStarted,
        currentSpeakerIndex,
        addedTime: newAddedTime,
        lastUpdate: new Date().toISOString(),
        accumulatedMs,
        lastResumedAt,
        controlledBy: user?.id,
      });
    }
    setShowAddTimeModal(false);
  };

  const handleCloseAddTimeModal = () => {
    setShowAddTimeModal(false);
  };

  // Hide details toggle function
  const handleToggleHideDetails = () => {
    const newHideState = !hideTimeDetails;
    setHideTimeDetails(newHideState);

    // Save preference immediately (only if user is loaded)
    if (user?.id) {
      saveUserPreference(user.id, "hideTimeDetails", newHideState);
    } else {
      console.warn("Cannot save hide time details preference: user not loaded");
    }
  };

  // End Meeting function
  const handleEndMeeting = () => {
    if (!details || !eventId) return;
    setShowEndMeetingModal(true);
  };

  const confirmEndMeeting = async () => {
    if (!details || !eventId) return;

    try {
      // Update event status to completed
      await updateEvent(eventId, { status: "completed" });

      // Mark any uncompleted items as cancelled
      // TODO: Implement schedule item status updates

      toast.success("Meeting ended successfully!");
      setShowEndMeetingModal(false);
      window.location.href = `/page/${pageId}`;
    } catch (error) {
      console.error("Error ending meeting:", error);
      toast.error("Failed to end meeting. Please try again.");
    }
  };

  const cancelEndMeeting = () => {
    setShowEndMeetingModal(false);
  };

  // Q&A functions
  const handleSendQuestion = async () => {
    if (!qnaQuestion.trim() || !eventId) return;

    setLoadingQna(true);
    try {
      const newQuestion = await createQnaQuestion({
        event_id: eventId,
        question: qnaQuestion.trim(),
        answered: false,
      });
      setQnaMessages((prev) => [...prev, newQuestion]);
      setQnaQuestion("");
      if (userRole === "admin") {
        toast.success("Question added");
      } else {
        toast.success("Question submitted - awaiting admin approval");
      }
    } catch (error) {
      console.error("Error creating question:", error);
      toast.error("Failed to add question");
    } finally {
      setLoadingQna(false);
    }
  };

  const toggleQuestionAnswered = async (questionId: string) => {
    const question = qnaMessages.find((q) => q.id === questionId);
    if (!question) return;

    try {
      const updated = await updateQnaQuestion(questionId, {
        answered: !question.answered,
      });
      setQnaMessages((prev) =>
        prev.map((msg) => (msg.id === questionId ? updated : msg))
      );
      toast.success(
        updated.answered ? "Marked as answered" : "Marked as unanswered"
      );
    } catch (error) {
      console.error("Error updating question:", error);
      toast.error("Failed to update question");
    }
  };

  // New approval functions
  const handleAcceptQuestion = async (questionId: string) => {
    if (userRole !== "admin" || !user?.id) {
      toast.error("Only administrators can accept questions");
      return;
    }

    try {
      const updated = await acceptQnaQuestion(questionId, user.id);
      setQnaMessages((prev) =>
        prev.map((msg) => (msg.id === questionId ? updated : msg))
      );
      toast.success("Question accepted");
    } catch (error) {
      console.error("Error accepting question:", error);
      toast.error("Failed to accept question");
    }
  };

  const handleRejectQuestion = async (questionId: string) => {
    if (userRole !== "admin") {
      toast.error("Only administrators can reject questions");
      return;
    }

    try {
      const updated = await rejectQnaQuestion(questionId);
      setQnaMessages((prev) =>
        prev.map((msg) => (msg.id === questionId ? updated : msg))
      );
      toast.success("Question rejected");
    } catch (error) {
      console.error("Error rejecting question:", error);
      toast.error("Failed to reject question");
    }
  };

  const handleMarkAsAnswered = async (questionId: string) => {
    if (userRole !== "admin") {
      toast.error("Only administrators can mark questions as answered");
      return;
    }

    try {
      const updated = await markQuestionAsAnswered(questionId);
      setQnaMessages((prev) =>
        prev.map((msg) => (msg.id === questionId ? updated : msg))
      );
      toast.success("Question marked as answered");
    } catch (error) {
      console.error("Error marking question as answered:", error);
      toast.error("Failed to mark question as answered");
    }
  };

  const handleAcceptPhoto = async (photoId: string) => {
    if (userRole !== "admin" || !user?.id) {
      toast.error("Only administrators can accept photos");
      return;
    }

    try {
      await acceptSessionPhoto(photoId, user.id);

      // Optimistic update: flip status locally so controls disappear immediately
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
            : p
        )
      );

      // Background refresh to ensure consistency
      const updatedPhotos =
        userRole === "admin"
          ? await fetchSessionPhotos(eventId)
          : await fetchVisibleSessionPhotos(eventId);
      const photosWithUrls = await Promise.all(
        updatedPhotos.map(async (photo) => {
          const urls = await getPhotoVersionUrls(photo);
          return {
            id: photo.id,
            url: urls.medium, // Use medium version for display
            photo,
            selected: false,
            thumbnailUrl: urls.thumbnail,
            originalUrl: urls.original,
          };
        })
      );
      setPhotos(deduplicatePhotos(photosWithUrls));
      toast.success("Photo accepted");
    } catch (error) {
      console.error("Error accepting photo:", error);
      toast.error("Failed to accept photo");
    }
  };

  const handleRejectPhoto = async (photoId: string) => {
    if (userRole !== "admin") {
      toast.error("Only administrators can reject photos");
      return;
    }

    try {
      await rejectSessionPhoto(photoId);

      // Optimistic update
      setPhotos((prev = []) =>
        prev.map((p) =>
          p.id === photoId
            ? { ...p, photo: { ...p.photo, status: "rejected" } as any }
            : p
        )
      );

      // Background refresh
      const updatedPhotos =
        userRole === "admin"
          ? await fetchSessionPhotos(eventId)
          : await fetchVisibleSessionPhotos(eventId);
      const photosWithUrls = await Promise.all(
        updatedPhotos.map(async (photo) => {
          const urls = await getPhotoVersionUrls(photo);
          return {
            id: photo.id,
            url: urls.medium, // Use medium version for display
            photo,
            selected: false,
            thumbnailUrl: urls.thumbnail,
            originalUrl: urls.original,
          };
        })
      );
      setPhotos(deduplicatePhotos(photosWithUrls));
      toast.success("Photo rejected");
    } catch (error) {
      console.error("Error rejecting photo:", error);
      toast.error("Failed to reject photo");
    }
  };

  // Enhanced photo upload handler
  const handleUploadComplete = (results: UploadResult[]) => {
    const newPhotos = results.map((result) => ({
      id: result.photo.id,
      url: result.urls.medium, // Use medium version for display
      photo: result.photo,
      selected: false,
      thumbnailUrl: result.urls.thumbnail,
      originalUrl: result.urls.original,
    }));

    setPhotos((prev = []) => {
      // Deduplicate by photo ID to prevent duplicates
      const existingIds = new Set(prev.map((p) => p.id));
      const uniqueNewPhotos = newPhotos.filter(
        (photo) => !existingIds.has(photo.id)
      );
      return [...uniqueNewPhotos, ...prev]; // Add new photos to the beginning
    });
  };

  const handleUploadError = (error: string) => {
    console.error("Enhanced upload error:", error);
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await deleteSessionPhoto(photoId);
      setPhotos((prev = []) => prev.filter((p) => p.id !== photoId));
      toast.success("Photo deleted");
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast.error("Failed to delete photo");
    }
  };

  // Save user preference
  const saveUserPreference = async (
    userId: string,
    key: string,
    value: any
  ) => {
    if (!eventId) return;

    try {
      // Get current session data first
      const { sessionData: currentData } = await fetchEventSessionAll(eventId);
      const currentSessionState =
        currentData?.session_data &&
        typeof currentData.session_data === "object" &&
        !Array.isArray(currentData.session_data)
          ? (currentData.session_data as Record<string, any>)
          : {};

      // Update user preferences
      const userPreferences =
        currentSessionState.userPreferences &&
        typeof currentSessionState.userPreferences === "object" &&
        !Array.isArray(currentSessionState.userPreferences)
          ? (currentSessionState.userPreferences as Record<string, any>)
          : {};
      userPreferences[userId] = {
        ...userPreferences[userId],
        [key]: value,
      };

      // Save updated session data - preserve timer state
      const updatedSessionState = {
        ...currentSessionState,
        userPreferences,
        savedAt: new Date().toISOString(),
      };

      await upsertSessionData(eventId, updatedSessionState);
    } catch (error) {
      console.error("Error saving user preference:", error);
    }
  };

  // Broadcast timer state to all users via real-time using atomic function
  const broadcastTimerState = async (timerState: {
    isRunning: boolean;
    hasStarted: boolean;
    currentSpeakerIndex: number;
    addedTime: number;
    lastUpdate: string;
    accumulatedMs: number;
    lastResumedAt: string | null;
    controlledBy?: string;
  }) => {
    if (!eventId || !user?.id) return;

    try {
      // Use atomic function to prevent race conditions
      const { data, error } = await supabase.rpc('update_timer_state', {
        p_event_id: eventId,
        p_is_running: timerState.isRunning,
        p_has_started: timerState.hasStarted,
        p_current_speaker_index: timerState.currentSpeakerIndex,
        p_added_time: timerState.addedTime,
        p_accumulated_ms: timerState.accumulatedMs,
        p_last_resumed_at: timerState.lastResumedAt ? new Date(timerState.lastResumedAt).toISOString() : '',
        p_controlled_by: timerState.controlledBy || user.id
      });

      if (error) {
        console.error("RPC Error:", error);
        toast.error("Failed to sync timer state: " + error.message);
        return;
      }

      setLastTimerUpdate(new Date());
    } catch (error) {
      console.error("Error broadcasting timer state:", error);
      toast.error("Failed to sync timer state");
    }
  };

  // Save session state periodically - only if we're authorized
  const saveSessionState = async () => {
    if (!eventId || !user?.id) return;
    
    // Only save if we're admin or controlling the timer
    if (userRole !== "admin") return;

    try {
      const nowMs = Date.now();
      const lastResumeTime = lastResumedAt ? Date.parse(lastResumedAt) : null;
      const snapshotAccumulated =
        isRunning && lastResumeTime
          ? accumulatedMs + Math.max(0, nowMs - lastResumeTime)
          : accumulatedMs;

      // Use atomic function for consistency
      await broadcastTimerState({
        isRunning,
        hasStarted,
        currentSpeakerIndex,
        addedTime,
        lastUpdate: new Date().toISOString(),
        accumulatedMs: snapshotAccumulated,
        lastResumedAt: isRunning ? lastResumedAt : null,
        controlledBy: user.id,
      });
    } catch (error) {
      console.error("Error saving session state:", error);
    }
  };

  // Photo selection functions
  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  const selectAllPhotos = () => {
    if (!photos) return;
    const allPhotoIds = photos.map((p) => p.id);
    setSelectedPhotos(new Set(allPhotoIds));
  };

  const deselectAllPhotos = () => {
    setSelectedPhotos(new Set());
  };

  const downloadSelectedPhotos = async () => {
    if (!photos || selectedPhotos.size === 0) return;

    const selectedPhotoData = photos.filter((photo) =>
      selectedPhotos.has(photo.id)
    );

    // Download original quality versions
    for (const photo of selectedPhotoData) {
      try {
        // Use original URL if available, fallback to medium/main URL
        const downloadUrl = (photo as any).originalUrl || photo.url;
        const response = await fetch(downloadUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        // Use original filename or create one with proper extension
        const fileName = photo.photo.file_name || `photo-${photo.id}.jpg`;
        link.download = fileName;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error(`Error downloading ${photo.photo.file_name}:`, error);
        toast.error(`Failed to download ${photo.photo.file_name}`);
      }
    }

    toast.success(
      `Downloaded ${selectedPhotos.size} original quality photo${
        selectedPhotos.size > 1 ? "s" : ""
      }`
    );
  };

  const openGallery = (index: number) => {
    setGalleryInitialIndex(index);
    setGalleryOpen(true);
  };

  const deleteSelectedPhotos = async () => {
    if (selectedPhotos.size === 0) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedPhotos.size} selected photo${
        selectedPhotos.size > 1 ? "s" : ""
      }?`
    );

    if (!confirmDelete) return;

    try {
      await Promise.all(
        Array.from(selectedPhotos).map((photoId) => deleteSessionPhoto(photoId))
      );

      setPhotos((prev) => prev?.filter((p) => !selectedPhotos.has(p.id)));
      setSelectedPhotos(new Set());
      toast.success(
        `Deleted ${selectedPhotos.size} photo${
          selectedPhotos.size > 1 ? "s" : ""
        }`
      );
    } catch (error) {
      console.error("Error deleting photos:", error);
      toast.error("Failed to delete some photos");
    }
  };

  // Poll functions
  const handleCreatePoll = async (pollData: {
    title: string;
    description: string;
    options: string[];
    anonymous: boolean;
  }) => {
    if (!eventId) return;

    setLoadingPolls(true);
    try {
      const newPoll = await createPoll({
        eventId,
        title: pollData.title,
        description: pollData.description,
        options: pollData.options,
        anonymous: pollData.anonymous,
      });
      setPolls((prev) => [newPoll, ...prev]);
      toast.success("Poll created successfully");
    } catch (error) {
      console.error("Error creating poll:", error);
      toast.error("Failed to create poll");
    } finally {
      setLoadingPolls(false);
    }
  };

  const handleVotePoll = async (pollId: string, optionId: string) => {
    setLoadingPolls(true);
    try {
      await submitPollVote(pollId, optionId);

      // Update local state
      setUserVotes((prev) => ({ ...prev, [pollId]: optionId }));
      setPolls((prev) =>
        prev.map((poll) => {
          if (poll.id === pollId) {
            return {
              ...poll,
              options: poll.options.map((option) => ({
                ...option,
                vote_count:
                  option.id === optionId
                    ? (option.vote_count || 0) + 1
                    : option.vote_count,
              })),
            };
          }
          return poll;
        })
      );
      toast.success("Vote submitted");
    } catch (error) {
      console.error("Error voting on poll:", error);
      toast.error("Failed to submit vote");
    } finally {
      setLoadingPolls(false);
    }
  };

  const handleTogglePollActive = async (pollId: string, active: boolean) => {
    try {
      const updatedPoll = await updatePoll(pollId, { active });
      setPolls((prev) =>
        prev.map((poll) => (poll.id === pollId ? { ...poll, active } : poll))
      );
      toast.success(`Poll ${active ? "activated" : "deactivated"}`);
    } catch (error) {
      console.error("Error toggling poll:", error);
      toast.error("Failed to update poll");
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this poll?"
    );
    if (!confirmDelete) return;

    try {
      await deletePoll(pollId);
      setPolls((prev) => prev.filter((poll) => poll.id !== pollId));
      toast.success("Poll deleted");
    } catch (error) {
      console.error("Error deleting poll:", error);
      toast.error("Failed to delete poll");
    }
  };

  // Check user role
  useEffect(() => {
    const checkRole = async () => {
      if (!user || !pageId) return;

      try {
        const membership = await checkUserMembership(pageId, user.id);
        setUserRole(membership.role || "member");
      } catch (error) {
        console.error("Error checking user role:", error);
        setUserRole("member"); // Default to member on error
      } finally {
        setIsLoadingRole(false);
      }
    };

    checkRole();
  }, [user, pageId]);

  // Real-time timer synchronization - Only update if not controlling timer
  useEffect(() => {
    if (!eventId || !user) return;

    const channel = supabase
      .channel(`timer-sync-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "event_session_data",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const sessionData = payload.new.session_data;
          if (!sessionData) return;

          // Get the controlling user
          const controlledBy = sessionData.controlledBy;
          const isControlledByMe = controlledBy === user.id;
          const lastUpdate = sessionData.lastUpdate;
          
          // Only apply updates if not controlling or if this is a fresh state
          // This prevents flickering when the controlling user makes changes
          if (!isControlledByMe || !lastTimerUpdate || 
              (lastUpdate && new Date(lastUpdate) > lastTimerUpdate)) {
            
            // Apply state changes
            if (sessionData.currentSpeakerIndex !== undefined) {
              setCurrentSpeakerIndex(sessionData.currentSpeakerIndex);
            }
            if (sessionData.addedTime !== undefined) {
              setAddedTime(sessionData.addedTime);
            }
            if (sessionData.hasStarted !== undefined) {
              setHasStarted(sessionData.hasStarted);
            }

            const wasRunning = !!sessionData.isRunning;
            const lastAt = sessionData.lastResumedAt as string | null;
            const baseAccum =
              typeof sessionData.accumulatedMs === "number"
                ? sessionData.accumulatedMs
                : 0;
                
            setIsRunning(wasRunning);
            setLastResumedAt(lastAt ?? null);
            setAccumulatedMs(baseAccum);

            // Calculate current seconds based on timer state
            if (wasRunning && lastAt) {
              const elapsed = Math.max(0, Date.now() - Date.parse(lastAt));
              setSeconds(Math.floor((baseAccum + elapsed) / 1000));
            } else {
              setSeconds(Math.floor(baseAccum / 1000));
            }

            setIsTimerSynced(true);
            setLastTimerUpdate(new Date());
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, user, lastTimerUpdate]);

  // Load session data on mount
  useEffect(() => {
    const loadSessionData = async () => {
      if (!eventId) return;

      try {
        setLoadingPhotos(true);
        const {
          questions,
          photos: sessionPhotos,
          polls: sessionPolls,
          sessionData,
        } = await fetchEventSessionForUser(eventId, userRole === "admin");

        // Load Q&A questions
        setQnaMessages(questions);

        // Load polls
        setPolls(sessionPolls);

        // Load user votes
        const votes = await getUserPollVotes(eventId);
        setUserVotes(votes);

        // Load photos with enhanced URLs
        if (sessionPhotos.length > 0) {
          const photosWithUrls = await Promise.all(
            sessionPhotos.map(async (photo) => {
              const urls = await getPhotoVersionUrls(photo);
              return {
                id: photo.id,
                url: urls.medium, // Use medium version for display
                photo,
                selected: false,
                thumbnailUrl: urls.thumbnail,
                originalUrl: urls.original,
              };
            })
          );
          // Deduplicate photos to prevent React key errors
          setPhotos(deduplicatePhotos(photosWithUrls));
        } else {
          setPhotos([]);
        }

        // Restore session state if available
        if (
          sessionData?.session_data &&
          typeof sessionData.session_data === "object" &&
          !Array.isArray(sessionData.session_data)
        ) {
          const state = sessionData.session_data as Record<string, any>;
          console.log("Restoring session state:", state);

          if (state.currentSpeakerIndex !== undefined) {
            setCurrentSpeakerIndex(state.currentSpeakerIndex);
          }
          if (state.addedTime !== undefined) setAddedTime(state.addedTime);
          if (state.hasStarted !== undefined) setHasStarted(state.hasStarted);

          // Restore timing model robustly:
          // If timer is running and lastResumedAt exists, compute elapsed since then
          // otherwise use accumulatedMs fallback
          const now = Date.now();
          const storedAccumulated =
            typeof state.accumulatedMs === "number"
              ? state.accumulatedMs
              : typeof state.seconds === "number"
              ? (state.seconds as number) * 1000
              : 0;
          const storedLastResumedAt = state.lastResumedAt as string | null;
          const wasRunning = !!state.isRunning;

          setIsRunning(wasRunning);
          setLastResumedAt(storedLastResumedAt ?? null);

          if (wasRunning && storedLastResumedAt) {
            const elapsed = Math.max(0, now - Date.parse(storedLastResumedAt));
            setAccumulatedMs(storedAccumulated); // keep base
            setSeconds(Math.floor((storedAccumulated + elapsed) / 1000));
          } else {
            setAccumulatedMs(storedAccumulated);
            setSeconds(Math.floor(storedAccumulated / 1000));
          }

          // Restore user preferences if available
          if (
            state.userPreferences &&
            typeof state.userPreferences === "object" &&
            !Array.isArray(state.userPreferences) &&
            user?.id
          ) {
            const userPrefs = (state.userPreferences as Record<string, any>)[
              user.id
            ];
            if (userPrefs) {
              if (userPrefs.hideTimeDetails !== undefined) {
                setHideTimeDetails(userPrefs.hideTimeDetails);
                console.log(
                  `Hide time details preference restored: ${userPrefs.hideTimeDetails}`
                );
              }
            }
          }
        }
        setSessionHydrated(true);
      } catch (error) {
        console.error("Error loading session data:", error);
        setPhotos([]);
      } finally {
        setLoadingPhotos(false);
      }
    };

    loadSessionData();
  }, [eventId, user?.id, userRole]);

  // Poll Q&A, Photos, Polls, and user votes every 10s (no timer state changes)
  useEffect(() => {
    if (!eventId) return;

    let cancelled = false;

    const refetchSessionLists = async () => {
      // Skip if photos are currently loading to prevent race conditions
      if (loadingPhotos) return;

      try {
        const {
          questions,
          photos: sessionPhotos,
          polls: sessionPolls,
        } = await fetchEventSessionForUser(eventId, userRole === "admin");

        if (cancelled) return;

        // Q&A
        setQnaMessages(questions);

        // Polls
        setPolls(sessionPolls);

        // User votes
        const votes = await getUserPollVotes(eventId);
        if (!cancelled) setUserVotes(votes);

        // Photos (map to enhanced URLs)
        const photosWithUrls = await Promise.all(
          sessionPhotos.map(async (photo) => {
            const urls = await getPhotoVersionUrls(photo);
            return {
              id: photo.id,
              url: urls.medium, // Use medium version for display
              photo,
              selected: false,
              thumbnailUrl: urls.thumbnail,
              originalUrl: urls.original,
            };
          })
        );
        if (!cancelled) {
          // Deduplicate photos to prevent React key errors
          setPhotos(deduplicatePhotos(photosWithUrls));
        }
      } catch (err) {
        // Avoid noisy toasts during background refresh
        console.error("Polling error (lists refresh):", err);
      }
    };

    // initial fetch + interval
    refetchSessionLists();
    const intervalId = setInterval(refetchSessionLists, 30000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [eventId, userRole, loadingPhotos]);

  // Timer interval - derive seconds from accumulatedMs and lastResumedAt
  // Only run local timer for display purposes, sync updates come from real-time
  useEffect(() => {
    const computeSeconds = () => {
      if (isRunning && lastResumedAt) {
        const elapsed = Math.max(0, Date.now() - Date.parse(lastResumedAt));
        setSeconds(Math.floor((accumulatedMs + elapsed) / 1000));
      } else {
        setSeconds(Math.floor(accumulatedMs / 1000));
      }
    };

    // Only run interval if timer is running
    if (isRunning) {
      computeSeconds();
      intervalRef.current = window.setInterval(computeSeconds, 1000);
    } else {
      computeSeconds(); // Update once when stopped
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, lastResumedAt, accumulatedMs]);

  // Auto-save session state periodically and when timer state changes
  // Only save if we're admin to prevent conflicts
  useEffect(() => {
    if (userRole !== "admin" || !sessionHydrated) return;
    
    const saveInterval = setInterval(() => {
      saveSessionState();
    }, 30000); // Save every 30 seconds
    return () => clearInterval(saveInterval);
  }, [userRole, sessionHydrated]);

  // Save state immediately when timer stops (paused) - admin only
  useEffect(() => {
    if (!sessionHydrated || userRole !== "admin") return;
    if (!isRunning && hasStarted) {
      // Timer was paused, save state immediately
      saveSessionState();
    }
  }, [isRunning, hasStarted, sessionHydrated, userRole]);

  // Save state when component unmounts - admin only
  useEffect(() => {
    return () => {
      if (!sessionHydrated || userRole !== "admin") return;
      saveSessionState();
    };
  }, [sessionHydrated, userRole]);

  // Best-effort save on tab close - admin only
  useEffect(() => {
    if (userRole !== "admin") return;
    
    const handler = () => {
      try {
        saveSessionState();
      } catch {}
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [userRole]);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll when fullscreen
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

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

  return (
    <main className="mx-auto max-w-6xl px-6 py-8 h-[100vh] flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="text-2xl font-semibold">{details.title}</div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              {new Date(details.date).toLocaleDateString("en-GB")} • Live Event
            </div>
          </div>
          {userRole === "admin" && (
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(`/page/${pageId}/event/${eventId}/edit`)
                }
              >
                <SquarePen />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleEndMeeting}
              >
                End Meeting
              </Button>
            </div>
          )}
          {userRole === "member" && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => router.push(`/page/${pageId}`)}
            >
              Leave Meeting
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0">
        {/* Left: Timer and Agenda (Desktop only) */}
        <div className="hidden lg:block lg:col-span-7 space-y-6 overflow-y-auto pr-2 h-full pb-6">
          {/* Big Timer Card - Only show for admins */}
          {userRole === "admin" && (
            <TimerCard
              currentSlot={currentSlot}
              currentSpeaker={currentSpeaker}
              seconds={seconds}
              addedTime={addedTime}
              onTimeState={onTimeState}
              isRunning={isRunning}
              hasStarted={hasStarted}
              onToggleTimer={handleToggleTimer}
              onNextSpeaker={handleNextSpeaker}
              onPreviousSpeaker={handlePreviousSpeaker}
              onAddTime={handleAddTime}
              onToggleFullscreen={() => setIsFullscreen(true)}
              timerBackgroundColor={timerBackgroundColor}
              timerTextColor={timerTextColor}
              min={min}
              target={target}
              max={max}
              hideTimeDetails={hideTimeDetails}
              onToggleHideDetails={handleToggleHideDetails}
              isAdmin={userRole === "admin"}
              currentSpeakerIndex={currentSpeakerIndex}
              totalSpeakers={details?.schedule.length || 0}
            />
          )}

          {/* Agenda - Desktop only */}
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
                      <button
                        type="button"
                        className="flex items-center gap-3 text-left"
                        onClick={() =>
                          setSelectedUser({
                            name: item.speakerName || "Unknown Speaker",
                            roleTitle: item.title,
                            bio: item.speakerBio || "No information provided.",
                            email: item.speakerEmail || undefined,
                            avatar: item.speakerAvatar || undefined,
                            completed: idx < currentSpeakerIndex,
                            // Support array of social links
                            socialLinks: Array.isArray(item.socialMediaLinks)
                              ? (item.socialMediaLinks as Array<{
                                  platform: string;
                                  url: string;
                                }>)
                              : undefined,
                            // Back-compat if a single linkedin string exists
                            linkedin:
                              (item as any).socialMediaLinks?.linkedin ||
                              undefined,
                          })
                        }
                      >
                        <img
                          src={item.speakerAvatar || "/next.svg"}
                          alt="avatar"
                          className="h-8 w-8 rounded-full border-2 border-gray-300"
                          onError={(e) => {
                            console.log(
                              `Image failed to load for ${item.speakerName}: ${item.speakerAvatar}`
                            );
                            e.currentTarget.src = "/next.svg";
                          }}
                        />
                        <div>
                          <div className="font-medium text-sm">
                            {item.speakerName || "Unknown Speaker"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.title}
                          </div>
                          {userRole === "admin" && (
                            <div className="text-xs mt-1 flex gap-2">
                              <p className="text-green-500">
                                Min:{" "}
                                {formatSeconds((item.minMinutes || 3) * 60)}
                              </p>
                              <p className="text-yellow-500">
                                Target:{" "}
                                {formatSeconds(
                                  (item.targetMinutes ||
                                    item.allocatedMinutes ||
                                    5) * 60
                                )}
                              </p>
                              <p className="text-red-500">
                                Max:{" "}
                                {formatSeconds((item.maxMinutes || 7) * 60)}
                              </p>
                            </div>
                          )}

                          {idx === currentSpeakerIndex && isRunning && (
                            <div className="text-xs text-gray-600">
                              Current: {formatSeconds(seconds + addedTime)}
                            </div>
                          )}
                        </div>
                      </button>
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
        <div
          className={`${
            userRole === "admin" ? "lg:hidden block mb-4" : "hidden"
          }`}
        >
          {userRole === "admin" && (
            <TimerCard
              currentSlot={currentSlot}
              currentSpeaker={currentSpeaker}
              seconds={seconds}
              addedTime={addedTime}
              onTimeState={onTimeState}
              isRunning={isRunning}
              hasStarted={hasStarted}
              onToggleTimer={handleToggleTimer}
              onNextSpeaker={handleNextSpeaker}
              onPreviousSpeaker={handlePreviousSpeaker}
              onAddTime={handleAddTime}
              onToggleFullscreen={() => setIsFullscreen(true)}
              timerBackgroundColor={timerBackgroundColor}
              timerTextColor={timerTextColor}
              min={min}
              target={target}
              max={max}
              hideTimeDetails={hideTimeDetails}
              onToggleHideDetails={handleToggleHideDetails}
              isAdmin={userRole === "admin"}
              currentSpeakerIndex={currentSpeakerIndex}
              totalSpeakers={details?.schedule.length || 0}
            />
          )}
        </div>

        {/* Session Tools - Full width on mobile, right side on desktop */}
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
                  <CheckSquare className="h-4 w-4 mr-1 hidden md:block" />
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
                            <button
                              type="button"
                              className="flex items-center gap-2 text-left"
                              onClick={() =>
                                setSelectedUser({
                                  name: item.speakerName || "Unknown Speaker",
                                  roleTitle: item.title,
                                  bio:
                                    item.speakerBio ||
                                    "No information provided.",
                                  email: item.speakerEmail || undefined,
                                  avatar: item.speakerAvatar || undefined,
                                  completed: idx < currentSpeakerIndex,
                                  // Support array of social links
                                  socialLinks: Array.isArray(
                                    item.socialMediaLinks
                                  )
                                    ? (item.socialMediaLinks as Array<{
                                        platform: string;
                                        url: string;
                                      }>)
                                    : undefined,
                                  // Back-compat if a single linkedin string exists
                                  linkedin:
                                    (item as any).socialMediaLinks?.linkedin ||
                                    undefined,
                                })
                              }
                            >
                              <img
                                src={item.speakerAvatar || "/next.svg"}
                                alt="avatar"
                                className="size-10 lg:size-20 rounded-full border-2 border-gray-300 flex-shrink-0"
                                onError={(e) => {
                                  console.log(
                                    `Mobile image failed to load for ${item.speakerName}: ${item.speakerAvatar}`
                                  );
                                  e.currentTarget.src = "/next.svg";
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-xs sm:text-sm truncate">
                                  {item.speakerName || "Unknown Speaker"}
                                </div>
                                <div className="w-40 text-xs text-gray-500 truncate">
                                  {item.title}
                                </div>
                                {userRole === "admin" && (
                                  <div className="text-xs mt-1 flex flex-wrap gap-1 sm:gap-2">
                                    <p className="text-green-500">
                                      Min:{" "}
                                      {formatSeconds(
                                        (item.minMinutes || 3) * 60
                                      )}
                                    </p>
                                    <p className="text-yellow-500">
                                      Target:{" "}
                                      {formatSeconds(
                                        (item.targetMinutes ||
                                          item.allocatedMinutes ||
                                          5) * 60
                                      )}
                                    </p>
                                    <p className="text-red-500">
                                      Max:{" "}
                                      {formatSeconds(
                                        (item.maxMinutes || 7) * 60
                                      )}
                                    </p>
                                  </div>
                                )}
                                {idx < currentSpeakerIndex && (
                                  <div className="text-xs text-gray-600">
                                    Actual: Completed
                                  </div>
                                )}
                                {idx === currentSpeakerIndex && isRunning && (
                                  <div className="text-xs text-gray-600">
                                    Current:{" "}
                                    {formatSeconds(seconds + addedTime)}
                                  </div>
                                )}
                              </div>
                            </button>
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

                  {/* Question input */}
                  <div className="flex items-center gap-2 mb-4">
                    <Input
                      placeholder="Type your question here..."
                      value={qnaQuestion}
                      onChange={(e) => setQnaQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendQuestion();
                        }
                      }}
                    />
                    <Button
                      variant="secondary"
                      onClick={handleSendQuestion}
                      disabled={!qnaQuestion.trim() || loadingQna}
                    >
                      {loadingQna ? "Sending..." : "Send"}
                    </Button>
                  </div>

                  {/* Questions list */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {qnaMessages.length === 0 ? (
                      <div className="text-center text-gray-500 text-sm py-8">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <div>No questions yet</div>
                        <div className="text-xs mt-1">
                          Questions will appear here when submitted
                        </div>
                      </div>
                    ) : (
                      qnaMessages.map((msg) => {
                        const isPending = msg.status === "pending";
                        const isRejected = msg.status === "rejected";
                        const isAnswered =
                          msg.status === "answered" || msg.answered;
                        const isAccepted = msg.status === "accepted";

                        return (
                          <Card
                            key={msg.id}
                            className={`p-3 ${
                              isAnswered
                                ? "bg-green-50 border-green-200"
                                : isPending && userRole !== "admin"
                                ? "opacity-50 bg-gray-50 border-gray-200"
                                : isRejected
                                ? "opacity-30 bg-red-50 border-red-200"
                                : "bg-white"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <div
                                    className={`text-sm font-medium ${
                                      isPending && userRole !== "admin"
                                        ? "text-gray-500"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {msg.question}
                                  </div>
                                  {isPending && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200"
                                    >
                                      Pending
                                    </Badge>
                                  )}
                                  {/* {isAccepted && !isAnswered && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                    >
                                      Approved
                                    </Badge>
                                  )} */}
                                  {isRejected && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-red-50 text-red-700 border-red-200"
                                    >
                                      Rejected
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(
                                    msg.created_at || ""
                                  ).toLocaleTimeString()}
                                  {isPending && userRole !== "admin" && (
                                    <span className="ml-2 text-gray-400">
                                      • Awaiting admin approval
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {userRole === "admin" && isPending && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleAcceptQuestion(msg.id)
                                      }
                                      className="text-green-600 border-green-300 hover:bg-green-50"
                                    >
                                      Accept
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleRejectQuestion(msg.id)
                                      }
                                      className="text-red-600 border-red-300 hover:bg-red-50"
                                    >
                                      Reject
                                    </Button>
                                  </>
                                )}
                                {userRole === "admin" &&
                                  isAccepted &&
                                  !isAnswered && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleMarkAsAnswered(msg.id)
                                      }
                                      className="text-green-600 border-green-300 hover:bg-green-50"
                                    >
                                      Mark Answered
                                    </Button>
                                  )}
                                {isAnswered && (
                                  <Badge className="bg-green-100 text-green-700">
                                    ✓ Answered
                                  </Badge>
                                )}
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
                        <Badge
                          variant={
                            selectedPhotos.size > 0 ? "default" : "secondary"
                          }
                          className={`text-xs ${
                            selectedPhotos.size > 0 ? "bg-blue-500" : ""
                          }`}
                        >
                          {photos?.length || 0} photo
                          {(photos?.length || 0) !== 1 ? "s" : ""}
                          {selectedPhotos.size > 0 &&
                            ` • ${selectedPhotos.size} selected`}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedPhotos.size > 0 ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={deselectAllPhotos}
                            className="text-xs"
                          >
                            <SquareMinus />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={downloadSelectedPhotos}
                            title={`Download ${
                              selectedPhotos.size
                            } selected photo${
                              selectedPhotos.size > 1 ? "s" : ""
                            }`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={deleteSelectedPhotos}
                            title={`Delete ${
                              selectedPhotos.size
                            } selected photo${
                              selectedPhotos.size > 1 ? "s" : ""
                            }`}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={selectAllPhotos}
                          disabled={(photos?.length || 0) === 0}
                          className="text-xs"
                        >
                          Select All
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Upload Component */}
                  <div className="mt-3">
                    <PhotoUpload
                      eventId={eventId}
                      isAdmin={userRole === "admin"}
                      onUploadComplete={handleUploadComplete}
                      onUploadError={handleUploadError}
                      disabled={uploadingPhoto}
                    />
                  </div>

                  {/* Thumbs */}
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    {(photos || []).map((photo, index) => {
                      const isSelected = selectedPhotos.has(photo.id);
                      const isPending = photo.photo.status === "pending";
                      const isRejected = photo.photo.status === "rejected";
                      const isAccepted = photo.photo.status === "accepted";

                      return (
                        <div
                          key={photo.id}
                          className={`relative aspect-square rounded-md overflow-hidden border group cursor-pointer ${
                            isSelected
                              ? "border-blue-500 border-2 bg-blue-50"
                              : isPending && userRole !== "admin"
                              ? "border-gray-200 opacity-50"
                              : isRejected
                              ? "border-red-200 opacity-30"
                              : "border-gray-200"
                          }`}
                          onClick={() => openGallery(index)}
                        >
                          <img
                            src={(photo as any).thumbnailUrl || photo.url} // Use thumbnail for grid display
                            alt={photo.photo.file_name}
                            className={`h-full w-full object-cover transition-opacity duration-200 ${
                              isPending && userRole !== "admin"
                                ? "grayscale"
                                : ""
                            }`}
                            loading="lazy" // Enable lazy loading for better performance
                            onError={(e) => {
                              // Fallback to medium/main URL if thumbnail fails
                              const target = e.target as HTMLImageElement;
                              if (target.src !== photo.url) {
                                target.src = photo.url;
                              }
                            }}
                          />

                          {/* Status overlay - only show for non-admin users */}
                          {isPending && userRole !== "admin" && (
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                              <Badge className="bg-yellow-500 text-white text-xs">
                                Pending
                              </Badge>
                            </div>
                          )}
                          {isRejected && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                              <Badge className="bg-red-500 text-white text-xs">
                                Rejected
                              </Badge>
                            </div>
                          )}

                          {/* Admin approval controls for pending photos */}
                          {userRole === "admin" && isPending && (
                            <div className="absolute bottom-1 left-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAcceptPhoto(photo.id);
                                }}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs py-1 h-auto"
                              >
                                <Check />
                              </Button>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRejectPhoto(photo.id);
                                }}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs py-1 h-auto"
                              >
                                <X />
                              </Button>
                            </div>
                          )}

                          {/* Selection indicator */}
                          <div
                            className={`absolute top-1 left-1 w-5 h-5 rounded border flex items-center justify-center ${
                              isSelected
                                ? "bg-blue-500 border-blue-500"
                                : "bg-white/80 border-gray-300 opacity-0 group-hover:opacity-100"
                            } transition-opacity`}
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePhotoSelection(photo.id);
                            }}
                          >
                            {isSelected && (
                              <svg
                                className="h-3 w-3 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>

                          {/* Individual delete button */}
                          {(userRole === "admin" ||
                            photo.photo.uploaded_by === user?.id) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePhoto(photo.id);
                              }}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete photo"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeToolTab === "polls" && (
                <div className="mt-4">
                  <PollsSection
                    polls={polls}
                    onCreatePoll={handleCreatePoll}
                    onVote={handleVotePoll}
                    onToggleActive={handleTogglePollActive}
                    onDeletePoll={handleDeletePoll}
                    userVotes={userVotes}
                    isLoading={loadingPolls}
                    canManage={userRole === "admin"}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
          onClick={() => setIsFullscreen(false)}
        >
          <div
            className="w-full max-w-6xl h-full max-h-[90vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <TimerCard
              currentSlot={currentSlot}
              currentSpeaker={currentSpeaker}
              seconds={seconds}
              addedTime={addedTime}
              onTimeState={onTimeState}
              isRunning={isRunning}
              hasStarted={hasStarted}
              onToggleTimer={handleToggleTimer}
              onNextSpeaker={handleNextSpeaker}
              onPreviousSpeaker={handlePreviousSpeaker}
              onAddTime={handleAddTime}
              isFullscreen={true}
              onToggleFullscreen={() => setIsFullscreen(false)}
              timerBackgroundColor={timerBackgroundColor}
              timerTextColor={timerTextColor}
              min={min}
              target={target}
              max={max}
              hideTimeDetails={hideTimeDetails}
              isAdmin={userRole === "admin"}
              onToggleHideDetails={handleToggleHideDetails}
              currentSpeakerIndex={currentSpeakerIndex}
              totalSpeakers={details?.schedule.length || 0}
            />
          </div>
        </div>
      )}

      {/* User Details Modal */}
      <Dialog
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      >
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          {selectedUser && (
            <div className="flex flex-col h-full">
              <DialogHeader className="flex-shrink-0">
                <div className="flex flex-col items-center text-center w-full">
                  <img
                    src={selectedUser.avatar || "/next.svg"}
                    alt="avatar"
                    className="h-16 w-16 rounded-full border-2 border-gray-300 mb-2"
                  />
                  <DialogTitle className="text-xl">
                    {selectedUser.name}
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                    {selectedUser.roleTitle}
                  </DialogDescription>
                </div>
              </DialogHeader>
              <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                <div>
                  <div className="font-medium mb-2">Role Details</div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div className="text-sm">{selectedUser.roleTitle}</div>
                  </div>
                </div>
                <div>
                  <div className="font-medium mb-2">About</div>
                  <div className="rounded-md border p-3 text-sm text-gray-700">
                    {selectedUser.bio || "No information provided."}
                  </div>
                </div>
                <div>
                  <div className="font-medium mb-2">Connect</div>
                  <div className="space-y-2">
                    {selectedUser.email && (
                      <div>
                        Email:{" "}
                        <p
                          className="font-mono text-xs underline underline-offset-2 cursor-pointer"
                          onClick={() => {
                            const mailtoLink = `mailto:${selectedUser.email}`;
                            window.open(mailtoLink, "_blank");
                          }}
                        >
                          {selectedUser.email}
                        </p>
                      </div>
                    )}
                    {(selectedUser.socialLinks || []).map((link, i) => (
                      <div key={i} className="flex flex-col">
                        {link.platform}:
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-xs underline underline-offset-2"
                          onClick={() => {
                            window.open(link.url, "_blank");
                          }}
                        >
                          {link.url}
                        </a>
                      </div>
                    ))}

                    {!selectedUser?.socialLinks?.length &&
                      selectedUser.linkedin && (
                        <a
                          href={selectedUser.linkedin}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md border p-3 text-sm block hover:bg-gray-50"
                        >
                          LinkedIn Profile
                        </a>
                      )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Gallery */}
      <ImageGallery
        photos={photos || []}
        initialIndex={galleryInitialIndex}
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />

      {/* Modals */}
      <AddTimeModal
        isOpen={showAddTimeModal}
        onClose={handleCloseAddTimeModal}
        onConfirm={handleAddTimeFromModal}
        currentTime={stoppedTime}
      />

      <EndMeetingModal
        isOpen={showEndMeetingModal}
        onClose={cancelEndMeeting}
        onConfirm={confirmEndMeeting}
        pendingItems={
          details?.schedule
            .filter((item) => !item.status || item.status === "pending")
            .map((item) => ({
              id: item.id,
              title: item.title,
              role: item.role,
            })) || []
        }
      />
    </main>
  );
}
