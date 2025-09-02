"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  GripVertical,
  X,
  Plus,
  Camera,
  Mail,
  Link as LinkIcon,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useEventDetails, usePage } from "@/lib/api/hooks";
import {
  updateEvent,
  updateScheduleItem,
  createScheduleItem,
  deleteScheduleItem,
} from "@/lib/api/events";
import type {
  EventUpdate,
  EventScheduleItemInsert,
  EventScheduleItemUpdate,
} from "@/lib/api/types";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/hooks";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import MemberSearchInput from "@/components/MemberSearchInput";
import DateTimePickerForm from "@/components/DateTimePickerForm";
import TimeInput from "@/components/TimeInput";
import { format } from "date-fns";
import AvatarPicker from "@/components/AvatarPicker";
import { uploadSpeakerAvatar } from "@/lib/avatarUtils";

interface SpeakerRole {
  id: string;
  roleName: string;
  speakerName: string;
  speakerEmail: string;
  bio: string;
  avatar: string;
  minTime: string;
  targetTime: string;
  maxTime: string;
  socialMediaLinks: { platform: string; url: string }[];
  isNew?: boolean;
}

interface EventFormData {
  title: string;
  date: Date | null;
  time: string | null;
  location: string;
  description: string;
  allowFeedback: boolean;
  anonymousFeedback: boolean;
  detailedSpeakerProfiles: boolean;
  status: "upcoming" | "completed" | "draft";
  roles: SpeakerRole[];
}

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const pageId = params.id as string;
  const eventId = params.eventId as string;

  const {
    data: page,
    isLoading: pageLoading,
    error: pageError,
  } = usePage(pageId);

  const {
    data: eventDetails,
    isLoading: eventLoading,
    error: eventError,
  } = useEventDetails(pageId, eventId);

  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    date: null,
    time: null,
    location: "",
    description: "",
    allowFeedback: true,
    anonymousFeedback: false,
    detailedSpeakerProfiles: true,
    status: "upcoming",
    roles: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [deletedRoleIds, setDeletedRoleIds] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [uploadingRoleId, setUploadingRoleId] = useState<string | null>(null);

  // Modal states
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<string | null>(
    null
  );

  // Populate form data when event details are loaded
  useEffect(() => {
    if (eventDetails) {
      setFormData({
        title: eventDetails.title,
        date: new Date(eventDetails.date),
        time: eventDetails.time,
        location: eventDetails.location,
        description: eventDetails.description || "",
        allowFeedback: eventDetails.allowFeedback ?? true,
        anonymousFeedback: eventDetails.anonymousFeedback ?? false,
        detailedSpeakerProfiles: eventDetails.detailedSpeakerProfiles ?? true,
        status: eventDetails.status as "upcoming" | "completed" | "draft",
        roles: eventDetails.schedule.map((item, index) => ({
          id: item.id,
          roleName: item.title,
          speakerName: item.speakerName || "",
          speakerEmail: item.speakerEmail || "",
          bio: item.speakerBio || "",
          avatar: item.speakerAvatar || "",
          minTime: formatMinutesToTime(item.minMinutes || 3),
          targetTime: formatMinutesToTime(
            item.targetMinutes || item.allocatedMinutes
          ),
          maxTime: formatMinutesToTime(
            item.maxMinutes || item.allocatedMinutes * 1.5
          ),
          socialMediaLinks: item.socialMediaLinks || [],
        })),
      });
    }
  }, [eventDetails]);

  // Track changes to mark as unsaved
  useEffect(() => {
    if (eventDetails) {
      setHasUnsavedChanges(true);
    }
  }, [formData, deletedRoleIds]);

  const formatMinutesToTime = (minutes: number): string => {
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const parseTimeToMinutes = (timeString: string): number => {
    if (!timeString) return 0;
    const [minutes, seconds] = timeString.split(":").map(Number);
    return (minutes || 0) + (seconds || 0) / 60;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStatusChange = (status: string) => {
    // Warn if changing to completed status
    if (status === "completed" && formData.status !== "completed") {
      setPendingStatusChange(status);
      setShowStatusChangeModal(true);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      status: status as "upcoming" | "completed" | "draft",
    }));
  };

  const confirmStatusChange = () => {
    if (pendingStatusChange) {
      setFormData((prev) => ({
        ...prev,
        status: pendingStatusChange as "upcoming" | "completed" | "draft",
      }));
    }
    setShowStatusChangeModal(false);
    setPendingStatusChange(null);
  };

  const cancelStatusChange = () => {
    setShowStatusChangeModal(false);
    setPendingStatusChange(null);
  };

  const handleBack = () => {
    if (hasUnsavedChanges && !isLoading) {
      setShowUnsavedChangesModal(true);
      return;
    }
    router.push(`/page/${pageId}/event/${eventId}`);
  };

  const confirmLeaveWithoutSaving = () => {
    setShowUnsavedChangesModal(false);
    router.push(`/page/${pageId}/event/${eventId}`);
  };

  const cancelLeave = () => {
    setShowUnsavedChangesModal(false);
  };

  const addRole = () => {
    const newRole: SpeakerRole = {
      id: `new-${Date.now()}`,
      roleName: "",
      speakerName: "",
      speakerEmail: "",
      bio: "",
      avatar: "",
      minTime: "03:00",
      targetTime: "05:00",
      maxTime: "07:00",
      socialMediaLinks: [],
      isNew: true,
    };
    setFormData((prev) => ({
      ...prev,
      roles: [...prev.roles, newRole],
    }));
  };

  const removeRole = (index: number) => {
    const roleToRemove = formData.roles[index];

    // If it's an existing role (not a new one), track it for deletion
    if (
      roleToRemove &&
      !roleToRemove.isNew &&
      !roleToRemove.id.startsWith("new-")
    ) {
      setDeletedRoleIds((prev) => [...prev, roleToRemove.id]);
    }

    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.filter((_, i) => i !== index),
    }));
  };

  const updateRole = (index: number, field: keyof SpeakerRole, value: any) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.map((role, i) =>
        i === index ? { ...role, [field]: value } : role
      ),
    }));
  };

  const handleMemberSelect = (index: number, member: any) => {
    // Auto-fill speaker details from member profile
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.map((role, i) =>
        i === index
          ? {
              ...role,
              speakerName: member.name,
              speakerEmail: member.email,
              avatar: member.avatar || "",
              // Keep existing bio and social media links as they might be role-specific
            }
          : role
      ),
    }));
  };

  const handleAvatarChange = async (index: number, fileBlob: Blob | null) => {
    const role = formData.roles[index];
    if (!role) return;
    if (!fileBlob) {
      // Clear avatar
      updateRole(index, "avatar", "");
      return;
    }
    try {
      setUploadingRoleId(role.id);
      const result = await uploadSpeakerAvatar(fileBlob, eventId, role.id);
      if (result.success && result.url) {
        updateRole(index, "avatar", result.url);
        toast.success("Speaker photo updated");
      } else {
        toast.error(result.error || "Failed to upload photo");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to upload photo");
    } finally {
      setUploadingRoleId(null);
    }
  };

  const calculateTotalTime = (): number => {
    return formData.roles.reduce((total, role) => {
      return total + parseTimeToMinutes(role.targetTime);
    }, 0);
  };

  const handleDateChange = (date: Date | null) => {
    setFormData((prev) => ({
      ...prev,
      date,
    }));
  };

  const handleTimeChange = (time: string | null) => {
    setFormData((prev) => ({
      ...prev,
      time,
    }));
  };

  // Dropdown options
  const timeSlots = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
    "20:30",
  ];

  const today = new Date();
  const dateOptions = Array.from({ length: 60 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  const handleSaveEvent = async () => {
    // Validation
    if (!formData.title.trim()) {
      toast.error("Event title is required");
      return;
    }

    if (!formData.date) {
      toast.error("Event date is required");
      return;
    }

    if (!formData.time) {
      toast.error("Event time is required");
      return;
    }

    // Validate roles
    const invalidRoles = formData.roles.filter((role) => !role.roleName.trim());
    if (invalidRoles.length > 0) {
      toast.error("All roles must have a name");
      return;
    }

    setIsLoading(true);

    try {
      // Format date and time for the API
      const eventDate = formData.date.toISOString().split("T")[0]; // YYYY-MM-DD format
      const eventTime = formData.time;

      // Prepare event update data
      const eventUpdateData: EventUpdate = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        event_date: eventDate,
        event_time: eventTime,
        location: formData.location.trim() || null,
        status: formData.status,
        estimated_minutes: Math.round(calculateTotalTime()),
        roles_count: formData.roles.length,
        configured: formData.roles.length > 0,
        allow_feedback: formData.allowFeedback,
        anonymous_feedback: formData.anonymousFeedback,
        detailed_speaker_profiles: formData.detailedSpeakerProfiles,
      };

      // Update the event
      await updateEvent(eventId, eventUpdateData);

      // Handle schedule items
      // 1. Delete removed roles
      for (const deletedId of deletedRoleIds) {
        await deleteScheduleItem(deletedId);
      }

      // 2. Update existing roles and create new ones
      for (let i = 0; i < formData.roles.length; i++) {
        const role = formData.roles[i];

        const scheduleItemData = {
          title: role.roleName.trim(),
          role: role.roleName.trim(),
          order_index: i + 1,
          allocated_minutes: Math.round(parseTimeToMinutes(role.targetTime)),
          min_minutes: Math.round(parseTimeToMinutes(role.minTime)),
          target_minutes: Math.round(parseTimeToMinutes(role.targetTime)),
          max_minutes: Math.round(parseTimeToMinutes(role.maxTime)),
          speaker_name: role.speakerName.trim() || null,
          speaker_email: role.speakerEmail.trim() || null,
          speaker_bio: role.bio.trim() || null,
          speaker_avatar: role.avatar || null,
          social_media_links:
            role.socialMediaLinks.length > 0 ? role.socialMediaLinks : null,
        };

        if (role.isNew || role.id.startsWith("new-")) {
          // Create new schedule item
          await createScheduleItem(eventId, scheduleItemData);
        } else {
          // Update existing schedule item
          await updateScheduleItem(role.id, scheduleItemData);
        }
      }

      // Invalidate queries to refresh the data
      await queryClient.invalidateQueries({
        queryKey: queryKeys.eventDetails(pageId, eventId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.pageEvents(pageId),
      });

      toast.success("Event updated successfully!");
      setHasUnsavedChanges(false);
      handleBack();
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error("Failed to update event. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (pageLoading || eventLoading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-8">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  if (pageError || eventError || !page || !eventDetails) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-8">
        <p className="text-red-500">
          {pageError?.message || eventError?.message || "Event not found."}
        </p>
        <Button variant="outline" onClick={handleBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Event
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Event</h1>
        <p className="text-gray-600">
          Edit event for <span className="font-medium">{page.title}</span>
        </p>
      </div>

      <div className="space-y-8">
        {/* Event Details */}
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleInputChange}
                disabled={isLoading}
                required
                className="text-base"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Event Date & Time *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    value={
                      formData.date
                        ? formData.date.toISOString().split("T")[0]
                        : ""
                    }
                    onValueChange={(v) => handleDateChange(new Date(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select date" />
                    </SelectTrigger>
                    <SelectContent>
                      {dateOptions.map((d) => {
                        const val = d.toISOString().split("T")[0];
                        return (
                          <SelectItem key={val} value={val}>
                            {format(d, "EEE, MMM d, yyyy")}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  <Select
                    value={formData.time || ""}
                    onValueChange={handleTimeChange}
                    disabled={!formData.date}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleInputChange}
                disabled={isLoading}
                className="text-base"
              />
            </div>
          </CardContent>
        </Card>

        {/* Event Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Event Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allowFeedback"
                checked={formData.allowFeedback}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    allowFeedback: checked as boolean,
                  }))
                }
                disabled={isLoading}
              />
              <Label htmlFor="allowFeedback">Allow feedback collection</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="anonymousFeedback"
                checked={formData.anonymousFeedback}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    anonymousFeedback: checked as boolean,
                  }))
                }
                disabled={isLoading || !formData.allowFeedback}
              />
              <Label htmlFor="anonymousFeedback">
                Allow anonymous feedback
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="detailedSpeakerProfiles"
                checked={formData.detailedSpeakerProfiles}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    detailedSpeakerProfiles: checked as boolean,
                  }))
                }
                disabled={isLoading}
              />
              <Label htmlFor="detailedSpeakerProfiles">
                Enable detailed speaker profiles
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Roles and Schedule */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Roles & Schedule</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRole}
                disabled={isLoading}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Role
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {formData.roles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No roles added yet.</p>
                <p className="text-sm">Click "Add Role" to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.roles.map((role, index) => (
                  <div
                    key={role.id}
                    className="border rounded-lg p-4 space-y-4 relative"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                          Role {index + 1}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRole(index)}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Role Name *</Label>
                        <Input
                          value={role.roleName}
                          onChange={(e) =>
                            updateRole(index, "roleName", e.target.value)
                          }
                          placeholder="e.g., Toastmaster, Speaker"
                          disabled={isLoading}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <MemberSearchInput
                          pageId={pageId}
                          value={role.speakerName}
                          onChange={(value) =>
                            updateRole(index, "speakerName", value)
                          }
                          onMemberSelect={(member) =>
                            handleMemberSelect(index, member)
                          }
                          label="Speaker Name"
                          placeholder="Search members or enter name..."
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Speaker Photo</Label>
                        <div className="flex items-center gap-3">
                          <AvatarPicker
                            initialAvatarUrl={role.avatar}
                            onAvatarChange={(blob) =>
                              handleAvatarChange(index, blob)
                            }
                          />
                          {uploadingRoleId === role.id && (
                            <span className="text-sm text-gray-500">
                              Uploading...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Speaker Email</Label>
                      <Input
                        value={role.speakerEmail}
                        onChange={(e) =>
                          updateRole(index, "speakerEmail", e.target.value)
                        }
                        placeholder="Speaker's email address"
                        disabled={isLoading}
                        type="email"
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <TimeInput
                          label="Min Time"
                          value={role.minTime}
                          onChange={(value) =>
                            updateRole(index, "minTime", value)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <TimeInput
                          label="Target Time"
                          value={role.targetTime}
                          onChange={(value) =>
                            updateRole(index, "targetTime", value)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <TimeInput
                          label="Max Time"
                          value={role.maxTime}
                          onChange={(value) =>
                            updateRole(index, "maxTime", value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      Total Estimated Time:
                    </span>
                    <span className="font-semibold text-gray-900">
                      {Math.round(calculateTotalTime())} minutes
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-end pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={isLoading}
            size="lg"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={
              isLoading ||
              !formData.title.trim() ||
              !formData.date ||
              !formData.time
            }
            className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
            size="lg"
            onClick={handleSaveEvent}
          >
            {isLoading ? "Updating Event..." : "Update Event"}
          </Button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showStatusChangeModal}
        onClose={cancelStatusChange}
        onConfirm={confirmStatusChange}
        title="Change Event Status"
        description="Changing the status to 'Completed' will mark this event as finished. Are you sure?"
        confirmText="Mark as Completed"
        cancelText="Cancel"
        variant="warning"
      />
    </main>
  );
}
