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

function formatSeconds(total: number) {
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(total % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
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
                className={`grid grid-cols-2 gap-3 w-full items-center justify-center ${
                  isFullscreen ? "gap-6" : ""
                }`}
              >
                <Button
                  variant="secondary"
                  size={isFullscreen ? "default" : "default"}
                  className="bg-white/10 text-white hover:bg-white/20"
                  onClick={onNextSpeaker}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Next Speaker
                </Button>
                <Button
                  onClick={onToggleTimer}
                  size={isFullscreen ? "default" : "default"}
                  className="bg-emerald-700 hover:bg-emerald-800"
                >
                  {isRunning ? "Stop" : hasStarted ? "Resume" : "Start Timer"}
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

  // Fullscreen modal state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Timer state
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
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
      setSeconds(0); // Reset timer
      setAddedTime(0); // Reset added time
      setIsRunning(false); // Stop timer
      setHasStarted(false); // Reset timer started state

      // Broadcast speaker change to all users
      await broadcastTimerState({
        isRunning: false,
        hasStarted: false,
        seconds: 0,
        currentSpeakerIndex: nextIndex,
        addedTime: 0,
        lastUpdate: new Date().toISOString(),
        controlledBy: user?.id,
      });
    }
  };

  // Add time function
  const handleAddTime = (timeToAdd: number) => {
    setAddedTime((prev) => prev + timeToAdd);
  };

  // Timer toggle function - only for admins
  const handleToggleTimer = async () => {
    if (userRole !== "admin") {
      toast.error("Only administrators can control the timer");
      return;
    }

    if (!isRunning) {
      setHasStarted(true);
      setIsRunning(true);
      // Broadcast timer start to all users
      await broadcastTimerState({
        isRunning: true,
        hasStarted: true,
        seconds,
        currentSpeakerIndex,
        addedTime,
        lastUpdate: new Date().toISOString(),
        controlledBy: user?.id,
      });
    } else if (isRunning) {
      // Stopping the timer - capture current time and offer to add time
      const currentTime = seconds;
      setIsRunning(false);
      setStoppedTime(formatSeconds(currentTime));
      setShowAddTimeModal(true);
      // Broadcast timer stop to all users
      await broadcastTimerState({
        isRunning: false,
        hasStarted: true,
        seconds: currentTime,
        currentSpeakerIndex,
        addedTime,
        lastUpdate: new Date().toISOString(),
        controlledBy: user?.id,
      });
    } else {
      // Resuming the timer
      setIsRunning(true);
      // Broadcast timer resume to all users
      await broadcastTimerState({
        isRunning: true,
        hasStarted: true,
        seconds,
        currentSpeakerIndex,
        addedTime,
        lastUpdate: new Date().toISOString(),
        controlledBy: user?.id,
      });
    }
  };

  const handleAddTimeFromModal = (additionalSeconds: number) => {
    if (additionalSeconds > 0) {
      setAddedTime((prev) => prev + additionalSeconds);
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
      // Refresh photos list - use role-based function
      const updatedPhotos =
        userRole === "admin"
          ? await fetchSessionPhotos(eventId)
          : await fetchVisibleSessionPhotos(eventId);
      const photosWithUrls = await Promise.all(
        updatedPhotos.map(async (photo) => ({
          id: photo.id,
          url: await getPhotoPublicUrl(photo.file_path),
          photo,
          selected: false,
        }))
      );
      setPhotos(photosWithUrls);
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
      // Refresh photos list - use role-based function
      const updatedPhotos =
        userRole === "admin"
          ? await fetchSessionPhotos(eventId)
          : await fetchVisibleSessionPhotos(eventId);
      const photosWithUrls = await Promise.all(
        updatedPhotos.map(async (photo) => ({
          id: photo.id,
          url: await getPhotoPublicUrl(photo.file_path),
          photo,
          selected: false,
        }))
      );
      setPhotos(photosWithUrls);
      toast.success("Photo rejected");
    } catch (error) {
      console.error("Error rejecting photo:", error);
      toast.error("Failed to reject photo");
    }
  };

  // Photo functions
  const handleFileUpload = async (files: File[]) => {
    if (!eventId || files.length === 0) return;

    setUploadingPhoto(true);
    try {
      const isAdmin = userRole === "admin";

      const uploadPromises = files.map((file) =>
        uploadSessionPhoto(eventId, file, isAdmin)
      );
      const results = await Promise.all(uploadPromises);

      const newPhotos = results.map(({ photo, publicUrl }) => ({
        id: photo.id,
        url: publicUrl,
        photo,
        selected: false,
      }));

      setPhotos((prev = []) => [...prev, ...newPhotos]);

      if (isAdmin) {
        toast.success(
          `Uploaded ${files.length} photo${
            files.length > 1 ? "s" : ""
          } successfully!`
        );
      } else {
        toast.success(
          `Uploaded ${files.length} photo${
            files.length > 1 ? "s" : ""
          } - awaiting admin approval`
        );
      }
    } catch (error) {
      console.error("Error uploading photos:", error);
      toast.error("Failed to upload photos");
    } finally {
      setUploadingPhoto(false);
    }
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

      // Save updated session data
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

  // Broadcast timer state to all users via real-time
  const broadcastTimerState = async (timerState: {
    isRunning: boolean;
    hasStarted: boolean;
    seconds: number;
    currentSpeakerIndex: number;
    addedTime: number;
    lastUpdate: string;
    controlledBy?: string;
  }) => {
    if (!eventId) return;

    try {
      const sessionState = {
        currentSpeakerIndex: timerState.currentSpeakerIndex,
        seconds: timerState.seconds,
        addedTime: timerState.addedTime,
        hasStarted: timerState.hasStarted,
        isRunning: timerState.isRunning,
        lastUpdate: timerState.lastUpdate,
        controlledBy: timerState.controlledBy,
        timerPausedAt: timerState.isRunning ? null : timerState.lastUpdate,
        savedAt: new Date().toISOString(),
      };

      await upsertSessionData(eventId, sessionState);
      setLastTimerUpdate(new Date());
    } catch (error) {
      console.error("Error broadcasting timer state:", error);
      toast.error("Failed to sync timer state");
    }
  };

  // Save session state periodically
  const saveSessionState = async () => {
    if (!eventId) return;

    try {
      // Get current session data to preserve user preferences
      const { sessionData: currentData } = await fetchEventSessionAll(eventId);
      const currentSessionState =
        currentData?.session_data &&
        typeof currentData.session_data === "object" &&
        !Array.isArray(currentData.session_data)
          ? (currentData.session_data as Record<string, any>)
          : {};
      const existingUserPreferences =
        currentSessionState.userPreferences &&
        typeof currentSessionState.userPreferences === "object" &&
        !Array.isArray(currentSessionState.userPreferences)
          ? currentSessionState.userPreferences
          : {};

      const sessionState = {
        currentSpeakerIndex,
        seconds,
        addedTime,
        hasStarted,
        isRunning: false, // Don't persist running state for non-real-time saves
        timerPausedAt: isRunning ? null : new Date().toISOString(), // Track when timer was paused
        lastUpdate: new Date().toISOString(),
        controlledBy: user?.id, // Track who last controlled the timer
        userPreferences: existingUserPreferences, // Preserve existing user preferences
        savedAt: new Date().toISOString(),
      };

      await upsertSessionData(eventId, sessionState);
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

    // For multiple photos, create a zip file or download individually
    for (const photo of selectedPhotoData) {
      try {
        const response = await fetch(photo.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = photo.photo.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error(`Error downloading ${photo.photo.file_name}:`, error);
      }
    }

    toast.success(
      `Downloaded ${selectedPhotos.size} photo${
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

  // Real-time timer synchronization
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
          if (sessionData && sessionData.controlledBy !== user.id) {
            // Only sync if the change was made by another user
            if (sessionData.currentSpeakerIndex !== undefined) {
              setCurrentSpeakerIndex(sessionData.currentSpeakerIndex);
            }
            if (sessionData.seconds !== undefined) {
              setSeconds(sessionData.seconds);
            }
            if (sessionData.addedTime !== undefined) {
              setAddedTime(sessionData.addedTime);
            }
            if (sessionData.hasStarted !== undefined) {
              setHasStarted(sessionData.hasStarted);
            }
            if (sessionData.isRunning !== undefined) {
              setIsRunning(sessionData.isRunning);
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
  }, [eventId, user]);

  // Load session data on mount
  useEffect(() => {
    const loadSessionData = async () => {
      if (!eventId) return;

      try {
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

        // Load photos with public URLs
        if (sessionPhotos.length > 0) {
          const photosWithUrls = await Promise.all(
            sessionPhotos.map(async (photo) => ({
              id: photo.id,
              url: await getPhotoPublicUrl(photo.file_path),
              photo,
              selected: false,
            }))
          );
          setPhotos(photosWithUrls);
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
          if (state.addedTime !== undefined) {
            setAddedTime(state.addedTime);
          }
          if (state.hasStarted !== undefined) {
            setHasStarted(state.hasStarted);
          }

          // Restore timer with consideration for pause time
          if (state.seconds !== undefined) {
            let restoredSeconds = state.seconds;

            // If timer was paused and we have a pause timestamp, don't add elapsed time
            // If timer was running, we would need to calculate elapsed time, but since we save
            // isRunning as false, we assume it was paused
            setSeconds(restoredSeconds);

            console.log(`Timer restored to: ${restoredSeconds} seconds`);
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
      } catch (error) {
        console.error("Error loading session data:", error);
        setPhotos([]);
      }
    };

    loadSessionData();
  }, [eventId, user?.id, userRole]);

  // Poll Q&A, Photos, Polls, and user votes every 10s (no timer state changes)
  useEffect(() => {
    if (!eventId) return;

    let cancelled = false;

    const refetchSessionLists = async () => {
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

        // Photos (map to public URLs)
        const photosWithUrls = await Promise.all(
          sessionPhotos.map(async (photo) => ({
            id: photo.id,
            url: await getPhotoPublicUrl(photo.file_path),
            photo,
            selected: false,
          }))
        );
        if (!cancelled) setPhotos(photosWithUrls);
      } catch (err) {
        // Avoid noisy toasts during background refresh
        console.error("Polling error (lists refresh):", err);
      }
    };

    // initial fetch + interval
    refetchSessionLists();
    const intervalId = setInterval(refetchSessionLists, 10000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [eventId, userRole]);

  // Auto-save session state periodically and when timer state changes
  useEffect(() => {
    const saveInterval = setInterval(() => {
      saveSessionState();
    }, 30000); // Save every 30 seconds
    return () => clearInterval(saveInterval);
  }, [currentSpeakerIndex, seconds, addedTime, hasStarted, isRunning, eventId]);

  // Save state immediately when timer stops (paused)
  useEffect(() => {
    if (!isRunning && hasStarted) {
      // Timer was paused, save state immediately
      saveSessionState();
    }
  }, [isRunning, hasStarted]);

  // Save state when component unmounts or speaker changes
  useEffect(() => {
    return () => {
      saveSessionState();
    };
  }, []);

  useEffect(() => {
    saveSessionState();
  }, [currentSpeakerIndex]);

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
                            bio: item.speakerBio || "No biography provided.",
                            email: item.speakerEmail || "No email provided.",
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
          />
        )}

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
                                    item.speakerBio || "No biography provided.",
                                  email:
                                    item.speakerEmail || "No email provided.",
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

                  {/* Upload dropzone */}
                  <div
                    className="mt-3"
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const files = Array.from(e.dataTransfer.files || []);
                      const imageFiles = files.filter((file) =>
                        file.type.startsWith("image/")
                      );
                      if (imageFiles.length > 0) {
                        handleFileUpload(imageFiles);
                      }
                    }}
                  >
                    <div
                      role="button"
                      className="w-full border-2 border-dashed rounded-md p-6 text-center text-gray-600 hover:bg-gray-50 cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <ImagePlus className="h-6 w-6" />
                        <div className="font-medium">
                          {uploadingPhoto ? "Uploading..." : "Upload Photos"}
                        </div>
                        <div className="text-xs">
                          {uploadingPhoto
                            ? "Please wait"
                            : "Drag & drop images or click"}
                        </div>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          const imageFiles = files.filter((file) =>
                            file.type.startsWith("image/")
                          );
                          if (imageFiles.length > 0) {
                            handleFileUpload(imageFiles);
                          }
                          // reset input value so same file can be added again later
                          if (e.target) e.target.value = "";
                        }}
                      />
                    </div>
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
                            src={photo.url}
                            alt={photo.photo.file_name}
                            className={`h-full w-full object-cover ${
                              isPending && userRole !== "admin"
                                ? "grayscale"
                                : ""
                            }`}
                          />

                          {/* Status overlay */}
                          {isPending && (
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
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRejectPhoto(photo.id);
                                }}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs py-1 h-auto"
                              >
                                Reject
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
            />
          </div>
        </div>
      )}

      {/* User Details Modal */}
      <Dialog
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      >
        <DialogContent className="sm:max-w-md">
          {selectedUser && (
            <div className="space-y-4">
              <DialogHeader>
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
              <div className="space-y-3">
                <div>
                  <div className="font-medium mb-2">Role Details</div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div className="text-sm">{selectedUser.roleTitle}</div>
                  </div>
                </div>
                <div>
                  <div className="font-medium mb-2">Biography</div>
                  <div className="rounded-md border p-3 text-sm text-gray-700">
                    {selectedUser.bio || "No biography provided."}
                  </div>
                </div>
                <div>
                  <div className="font-medium mb-2">Connect</div>
                  <div className="space-y-2">
                    {selectedUser.email && (
                      <div>
                        Email:{" "}
                        <p
                          className="font-mono text-xs underline underline-offset-2"
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
                      <div className="flex flex-col">
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
