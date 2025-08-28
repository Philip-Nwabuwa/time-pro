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
import {
  Calendar,
  MessageSquare,
  Camera,
  Volume2,
  Maximize2,
  ArrowLeft,
  X,
  Minimize2,
  Play,
  Download,
  Trash2,
  ImagePlus,
  CheckSquare,
} from "lucide-react";
import { fetchEventDetails, type EventDetails } from "@/lib/mockApi";

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
  target: number;
  max: number;
}

function TimerCard({
  currentSlot,
  currentSpeaker,
  seconds,
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
  target,
  max,
}: TimerCardProps) {
  return (
    <Card className={isFullscreen ? "h-full" : ""}>
      <CardContent
        className={`p-6 ${timerBackgroundColor} ${timerTextColor} rounded-md ${
          isFullscreen ? "h-full flex flex-col justify-center" : ""
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className={isFullscreen ? "text-lg" : "text-sm"}>
              {currentSlot?.title || "Table Topics Master"}
            </div>
            <div
              className={`opacity-80 ${isFullscreen ? "text-sm" : "text-xs"}`}
            >
              {currentSpeaker || "Unknown Speaker"}
            </div>
          </div>
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

        <div className="text-center my-8">
          <div
            className={`font-semibold tabular-nums tracking-tight ${
              isFullscreen ? "text-[128px]" : "text-[64px]"
            }`}
          >
            {formatSeconds(seconds)}
          </div>
          <div
            className={`mt-2 flex items-center justify-center gap-6 ${
              isFullscreen ? "text-base" : "text-sm"
            }`}
          >
            <div>
              Min:{" "}
              <span className="font-mono border border-white rounded-full px-2 py-1">
                03:00
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

        {/* Timer controls */}
        <div
          className={`grid grid-cols-3 gap-3 w-full ${
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
            {isRunning ? "Pause" : hasStarted ? "Resume" : "Start Timer"}
          </Button>
          <Button
            variant="secondary"
            size={isFullscreen ? "default" : "default"}
            className="bg-white/10 text-white hover:bg-white/20"
          >
            <Volume2
              className={`${isFullscreen ? "h-5 w-5" : "h-4 w-4"} mr-2`}
            />{" "}
            Sound On
          </Button>
        </div>

        {/* quick add */}
        <div
          className={`mt-4 flex items-center justify-center gap-3 ${
            isFullscreen ? "gap-6" : ""
          }`}
        >
          <Button
            size={isFullscreen ? "default" : "sm"}
            variant="secondary"
            className="bg-white/10 text-white hover:bg-white/20"
            onClick={() => onAddTime(30)}
          >
            +30s
          </Button>
          <Button
            size={isFullscreen ? "default" : "sm"}
            variant="secondary"
            className="bg-white/10 text-white hover:bg-white/20"
            onClick={() => onAddTime(60)}
          >
            +1 min
          </Button>
          <Button
            size={isFullscreen ? "default" : "sm"}
            variant="secondary"
            className="bg-white/10 text-white hover:bg-white/20"
            onClick={() => onAddTime(120)}
          >
            +2 min
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RunEventPage() {
  const router = useRouter();
  const params = useParams();
  const pageId = params.id as string;
  const eventId = params.eventId as string;

  const [details, setDetails] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Q&A Session state
  const [qnaQuestion, setQnaQuestion] = useState("");
  const [qnaMessages, setQnaMessages] = useState<
    Array<{
      id: string;
      question: string;
      timestamp: Date;
      answered?: boolean;
    }>
  >([]);

  // Right panel tabs and photo state
  const [activeToolTab, setActiveToolTab] = useState<"qna" | "photos">(
    "photos",
  );
  const [photos, setPhotos] = useState<string[]>(["/window.svg"]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // User details modal state
  const [selectedUser, setSelectedUser] = useState<{
    name: string;
    roleTitle: string;
    bio?: string;
    email?: string;
    linkedin?: string;
    completed?: boolean;
  } | null>(null);

  const currentSlot = details?.schedule[currentSpeakerIndex];
  const baseAllocation = (currentSlot?.allocatedMinutes || 4) * 60;
  const min = baseAllocation * 0.75; // 75% of allocated time
  const target = baseAllocation + addedTime; // 100% of allocated time + added time
  const max = (baseAllocation + addedTime) * 1.25; // 125% of (allocated time + added time)

  // Speaker names mapping
  const speakerNames = [
    "Alex Wilson",
    "Sarah Johnson",
    "Garimella",
    "Speaker 4",
    "Speaker 5",
  ];
  const currentSpeaker = speakerNames[currentSpeakerIndex] || "Unknown Speaker";

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

  // Next speaker function
  const handleNextSpeaker = () => {
    if (!details?.schedule) return;

    const nextIndex = currentSpeakerIndex + 1;
    if (nextIndex < details.schedule.length) {
      setCurrentSpeakerIndex(nextIndex);
      setSeconds(0); // Reset timer
      setAddedTime(0); // Reset added time
      setIsRunning(false); // Stop timer
      setHasStarted(false); // Reset timer started state
    }
  };

  // Add time function
  const handleAddTime = (timeToAdd: number) => {
    setAddedTime((prev) => prev + timeToAdd);
  };

  // Timer toggle function
  const handleToggleTimer = () => {
    if (!isRunning) {
      setHasStarted(true);
    }
    setIsRunning((prev) => !prev);
  };

  // Q&A functions
  const handleSendQuestion = () => {
    if (qnaQuestion.trim()) {
      const newQuestion = {
        id: Date.now().toString(),
        question: qnaQuestion.trim(),
        timestamp: new Date(),
        answered: false,
      };
      setQnaMessages((prev) => [...prev, newQuestion]);
      setQnaQuestion("");
    }
  };

  const toggleQuestionAnswered = (questionId: string) => {
    setQnaMessages((prev) =>
      prev.map((msg) =>
        msg.id === questionId ? { ...msg, answered: !msg.answered } : msg,
      ),
    );
  };

  useEffect(() => {
    const load = async () => {
      try {
        const d = await fetchEventDetails(pageId, eventId);
        setDetails(d);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [pageId, eventId]);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = window.setInterval(
      () => setSeconds((s) => s + 1),
      1000,
    );
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [isRunning]);

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

  if (!details) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <p className="text-gray-500">Event not found.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8 h-[100vh] flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/page/${pageId}/event/${eventId}`)}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Event
        </Button>
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="text-2xl font-semibold">{details.title}</div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              {new Date(details.date).toLocaleDateString("en-GB")} • 2/5
              completed
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm">
              Settings
            </Button>
            <Button variant="destructive" size="sm">
              End Meeting
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left: Timer and Agenda */}
        <div className="col-span-7 space-y-6 overflow-y-auto pr-2 h-full pb-6">
          {/* Big Timer Card */}
          <TimerCard
            currentSlot={currentSlot}
            currentSpeaker={currentSpeaker}
            seconds={seconds}
            onTimeState={onTimeState}
            isRunning={isRunning}
            hasStarted={hasStarted}
            onToggleTimer={handleToggleTimer}
            onNextSpeaker={handleNextSpeaker}
            onAddTime={handleAddTime}
            onToggleFullscreen={() => setIsFullscreen(true)}
            timerBackgroundColor={timerBackgroundColor}
            timerTextColor={timerTextColor}
            target={target}
            max={max}
          />

          {/* Agenda */}
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
                            name: speakerNames[idx] || "Unknown Speaker",
                            roleTitle: item.title,
                            bio:
                              idx === 0
                                ? "Veteran Toastmaster with excellent opening skills."
                                : idx === 1
                                  ? "Experienced leader facilitating effective business sessions."
                                  : "Dynamic speaker guiding impromptu topics.",
                            email:
                              idx === 0
                                ? "alex.wilson@toastmasters.com"
                                : idx === 1
                                  ? "sarah.johnson@toastmasters.com"
                                  : "garimella@toastmasters.com",
                            linkedin: "https://www.linkedin.com/in/example",
                            completed: idx < currentSpeakerIndex,
                          })
                        }
                      >
                        <img
                          src="/next.svg"
                          alt="avatar"
                          className="h-8 w-8 rounded-full"
                        />
                        <div>
                          <div className="font-medium text-sm">
                            {speakerNames[idx] || "Unknown Speaker"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.title}
                          </div>
                          <div className="text-xs mt-1 flex gap-2">
                            <p className="text-green-500">
                              Min:{" "}
                              {formatSeconds(
                                (item.allocatedMinutes || 4) * 60 * 0.75,
                              )}
                            </p>
                            <p className="text-yellow-500">
                              Target:{" "}
                              {formatSeconds((item.allocatedMinutes || 4) * 60)}
                            </p>
                            <p className="text-red-500">
                              Max:{" "}
                              {formatSeconds(
                                (item.allocatedMinutes || 4) * 60 * 1.25,
                              )}
                            </p>
                          </div>
                          {idx < currentSpeakerIndex && (
                            <div className="text-xs text-gray-600">
                              Actual: Completed
                            </div>
                          )}
                          {idx === currentSpeakerIndex && isRunning && (
                            <div className="text-xs text-gray-600">
                              Current: {formatSeconds(seconds)}
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

        {/* Right: Session Tools */}
        <div className="col-span-5 space-y-4 flex-shrink-0 h-fit">
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3">Session Tools</h4>
              <div className={`flex items-center gap-2`}>
                <Button
                  variant={activeToolTab === "qna" ? "secondary" : "outline"}
                  size="sm"
                  className={
                    activeToolTab === "qna"
                      ? "bg-emerald-100 text-emerald-700"
                      : ""
                  }
                  onClick={() => setActiveToolTab("qna")}
                >
                  <MessageSquare className="h-4 w-4 mr-1" /> Q&A
                </Button>
                <Button
                  variant={activeToolTab === "photos" ? "secondary" : "outline"}
                  size="sm"
                  className={
                    activeToolTab === "photos"
                      ? "bg-emerald-100 text-emerald-700"
                      : ""
                  }
                  onClick={() => setActiveToolTab("photos")}
                >
                  <Camera className="h-4 w-4 mr-1" /> Photos
                </Button>
              </div>

              {activeToolTab === "qna" ? (
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
                      disabled={!qnaQuestion.trim()}
                    >
                      Send
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
                      qnaMessages.map((msg) => (
                        <Card
                          key={msg.id}
                          className={`p-3 ${
                            msg.answered
                              ? "bg-green-50 border-green-200"
                              : "bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {msg.question}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {msg.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant={msg.answered ? "secondary" : "outline"}
                              onClick={() => toggleQuestionAnswered(msg.id)}
                              className={
                                msg.answered
                                  ? "bg-green-100 text-green-700"
                                  : ""
                              }
                            >
                              {msg.answered ? "✓ Answered" : "Mark Answered"}
                            </Button>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">Photo Gallery</div>
                      <Badge variant="secondary" className="text-xs">
                        {photos.length} photo{photos.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon">
                        <CheckSquare className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                      files.forEach((file) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === "string") {
                            setPhotos((prev) => [
                              ...prev,
                              reader.result as string,
                            ]);
                          }
                        };
                        reader.readAsDataURL(file);
                      });
                    }}
                  >
                    <div
                      role="button"
                      className="w-full border-2 border-dashed rounded-md p-6 text-center text-gray-600 hover:bg-gray-50 cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <ImagePlus className="h-6 w-6" />
                        <div className="font-medium">Upload Photos</div>
                        <div className="text-xs">Drag & drop or click</div>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          files.forEach((file) => {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === "string") {
                                setPhotos((prev) => [
                                  ...prev,
                                  reader.result as string,
                                ]);
                              }
                            };
                            reader.readAsDataURL(file);
                          });
                          // reset input value so same file can be added again later
                          if (e.target) e.target.value = "";
                        }}
                      />
                    </div>
                  </div>

                  {/* Thumbs */}
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    {photos.map((src, i) => (
                      <div
                        key={`${src}-${i}`}
                        className="relative aspect-square rounded-md overflow-hidden border"
                      >
                        <img
                          src={src}
                          alt={`photo-${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
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
              target={target}
              max={max}
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
                    src="/next.svg"
                    alt="avatar"
                    className="h-16 w-16 rounded-full mb-2"
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
                    <Badge className="bg-emerald-100 text-emerald-700">
                      {selectedUser.completed ? "Completed" : "Pending"}
                    </Badge>
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
                      <div className="rounded-md border p-3 text-sm">
                        {selectedUser.email}
                      </div>
                    )}
                    {selectedUser.linkedin && (
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
    </main>
  );
}
