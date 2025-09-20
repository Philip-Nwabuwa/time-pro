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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import MemberSearchInput from "@/components/MemberSearchInput";
import DateTimePickerForm from "@/components/DateTimePickerForm";
import TimeInput from "@/components/TimeInput";
import AvatarPicker from "@/components/AvatarPicker";
import { uploadSpeakerAvatar } from "@/lib/avatarUtils";

interface SpeakerRole {
  id: string;
  roleName: string;
  speakerName: string;
  speakerEmail: string;
  bio: string;
  avatar: string;
  avatarBlob: Blob | null;
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
  allowFeedback: boolean;
  anonymousFeedback: boolean;
  detailedSpeakerProfiles: boolean;
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
    allowFeedback: true,
    anonymousFeedback: false,
    detailedSpeakerProfiles: true,
    roles: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [deletedRoleIds, setDeletedRoleIds] = useState<string[]>([]);
  const [uploadingRoleId, setUploadingRoleId] = useState<string | null>(null);
  // Removed status change modal to match create UI

  // Populate form data when event details are loaded
  useEffect(() => {
    if (eventDetails) {
      setFormData({
        title: eventDetails.title,
        date: new Date(eventDetails.date),
        time: eventDetails.time,
        location: eventDetails.location,
        allowFeedback: eventDetails.allowFeedback ?? true,
        anonymousFeedback: eventDetails.anonymousFeedback ?? false,
        detailedSpeakerProfiles: eventDetails.detailedSpeakerProfiles ?? true,
        roles: eventDetails.schedule.map((item, index) => ({
          id: item.id,
          roleName: item.title,
          speakerName: item.speakerName || "",
          speakerEmail: item.speakerEmail || "",
          bio: item.speakerBio || "",
          avatar: item.speakerAvatar || "",
          avatarBlob: null,
          minTime: formatMinutesToTime(item.minMinutes || 3),
          targetTime: formatMinutesToTime(
            item.targetMinutes || item.allocatedMinutes,
          ),
          maxTime: formatMinutesToTime(
            item.maxMinutes || Math.round((item.allocatedMinutes || 5) * 1.5),
          ),
          socialMediaLinks: item.socialMediaLinks || [],
        })),
      });
    }
  }, [eventDetails]);

  const formatMinutesToTime = (minutes: number): string => {
    const totalSeconds = Math.round(minutes * 60);
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const parseTimeToMinutes = (timeString: string): number => {
    if (!timeString) return 0;
    const parts = timeString.split(":");
    const hours = parseInt(parts[0] || "0", 10);
    const minutes = parseInt(parts[1] || "0", 10);
    const seconds = parseInt(parts[2] || "0", 10);
    return (hours || 0) * 60 + (minutes || 0) + (seconds || 0) / 60;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Removed status change handlers to match create UI

  const handleBack = () => {
    const dest =
      eventDetails?.status === "ongoing"
        ? `/page/${pageId}/event/${eventId}/run`
        : `/page/${pageId}/event/${eventId}`;
    router.push(dest);
  };

  const addRoleAtIndex = (index: number) => {
    const newRole: SpeakerRole = {
      id: `new-${Date.now()}`,
      roleName: "",
      speakerName: "",
      speakerEmail: "",
      bio: "",
      avatar: "",
      avatarBlob: null,
      minTime: "",
      targetTime: "",
      maxTime: "",
      socialMediaLinks: [],
      isNew: true,
    };
    setFormData((prev) => ({
      ...prev,
      roles: [
        ...prev.roles.slice(0, index),
        newRole,
        ...prev.roles.slice(index),
      ],
    }));
    toast.success("New role added");
  };

  const addRole = () => addRoleAtIndex(formData.roles.length);

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

  const validateRoleTimeSequence = (role: SpeakerRole) => {
    const minMinutes = parseTimeToMinutes(role.minTime);
    const targetMinutes = parseTimeToMinutes(role.targetTime);
    const maxMinutes = parseTimeToMinutes(role.maxTime);

    const errors: string[] = [];

    // Check if time values are empty (0:00:00)
    if (minMinutes === 0 && role.minTime && role.minTime !== "") {
      errors.push(`"${role.roleName || "Role"}": Min time cannot be 0:00:00`);
    }
    if (targetMinutes === 0 && role.targetTime && role.targetTime !== "") {
      errors.push(
        `"${role.roleName || "Role"}": Target time cannot be 0:00:00`,
      );
    }
    if (maxMinutes === 0 && role.maxTime && role.maxTime !== "") {
      errors.push(`"${role.roleName || "Role"}": Max time cannot be 0:00:00`);
    }

    // Check if required time values are missing
    if (!role.targetTime || role.targetTime === "" || targetMinutes === 0) {
      errors.push(
        `"${role.roleName || "Role"}": Target time is required and cannot be empty`,
      );
    }

    // Check if min time is greater than target time
    if (minMinutes > 0 && targetMinutes > 0 && minMinutes > targetMinutes) {
      errors.push(
        `"${role.roleName || "Role"}": Min time (${role.minTime}) cannot be greater than target time (${role.targetTime})`,
      );
    }

    // Check if target time is greater than max time
    if (targetMinutes > 0 && maxMinutes > 0 && targetMinutes > maxMinutes) {
      errors.push(
        `"${role.roleName || "Role"}": Target time (${role.targetTime}) cannot be greater than max time (${role.maxTime})`,
      );
    }

    // Check if min time is greater than max time
    if (minMinutes > 0 && maxMinutes > 0 && minMinutes > maxMinutes) {
      errors.push(
        `"${role.roleName || "Role"}": Min time (${role.minTime}) cannot be greater than max time (${role.maxTime})`,
      );
    }

    return errors;
  };

  const validateAllRolesTimeSequence = () => {
    const allErrors: string[] = [];

    formData.roles.forEach((role) => {
      const roleErrors = validateRoleTimeSequence(role);
      allErrors.push(...roleErrors);
    });

    return allErrors;
  };

  const updateRole = (index: number, field: keyof SpeakerRole, value: any) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.map((role, i) =>
        i === index ? { ...role, [field]: value } : role,
      ),
    }));
  };

  const handleMemberSelect = (index: number, member: any) => {
    // Auto-fill speaker details from member profile (name, email, avatar, bio, social links)
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.map((role, i) => {
        if (i !== index) return role;

        const updatedAvatar = role.avatarBlob
          ? role.avatar
          : member.avatar || "";

        // Normalize social links from member if present
        const memberSocialLinks = Array.isArray(member.socialMediaLinks)
          ? member.socialMediaLinks
          : member.linkedin
            ? [{ platform: "LinkedIn", url: member.linkedin }]
            : role.socialMediaLinks;

        return {
          ...role,
          speakerName: member.name,
          speakerEmail: member.email,
          bio: member.bio ?? role.bio ?? "",
          socialMediaLinks: memberSocialLinks || [],
          avatar: updatedAvatar,
          avatarBlob: role.avatarBlob,
        };
      }),
    }));
  };

  const handleAvatarChange = (index: number, blob: Blob | null) => {
    // Match create page behavior: store blob and object URL, upload on submit
    if (blob) {
      const url = URL.createObjectURL(blob);
      updateRole(index, "avatarBlob", blob);
      updateRole(index, "avatar", url);
    } else {
      updateRole(index, "avatarBlob", null);
      updateRole(index, "avatar", "");
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

    // Validate time sequences for all roles
    const timeErrors = validateAllRolesTimeSequence();
    if (timeErrors.length > 0) {
      timeErrors.forEach((error) => toast.error(error));
      return;
    }

    setIsLoading(true);

    try {
      // Format date and time for the API
      const eventDate = formData.date.toISOString().split("T")[0]; // YYYY-MM-DD format
      const eventTime = formData.time;

      // Prepare event update data (align with create form surface)
      const eventUpdateData: EventUpdate = {
        title: formData.title.trim(),
        event_date: eventDate,
        event_time: eventTime!,
        location: formData.location.trim() || null,
        estimated_minutes: Math.round(calculateTotalTime()),
        roles_count: formData.roles.length,
        configured: formData.roles.length > 0,
        allow_feedback: formData.allowFeedback,
        anonymous_feedback: formData.anonymousFeedback,
        detailed_speaker_profiles: formData.detailedSpeakerProfiles,
      } as EventUpdate;

      // Update the event
      await updateEvent(eventId, eventUpdateData);

      // Upload speaker avatars and update roles with uploaded URLs
      const rolesWithUploadedAvatars = await Promise.all(
        formData.roles.map(async (role) => {
          let speakerAvatarUrl = role.avatar;
          if (role.avatarBlob) {
            const uploadResult = await uploadSpeakerAvatar(
              role.avatarBlob,
              eventId,
              role.id,
            );
            if (uploadResult.success && uploadResult.url) {
              speakerAvatarUrl = uploadResult.url;
            } else {
              console.warn(
                `Failed to upload avatar for role ${role.roleName}: ${uploadResult.error}`,
              );
              toast.error(
                `Failed to upload avatar for ${role.roleName}: ${uploadResult.error}`,
              );
            }
          }
          if (speakerAvatarUrl && speakerAvatarUrl.startsWith("blob:")) {
            speakerAvatarUrl = "";
          }
          return {
            ...role,
            avatar: speakerAvatarUrl,
          };
        }),
      );

      // Handle schedule items
      // 1. Delete removed roles
      for (const deletedId of deletedRoleIds) {
        await deleteScheduleItem(deletedId);
      }

      // 2. Update existing roles and create new ones
      for (let i = 0; i < rolesWithUploadedAvatars.length; i++) {
        const role = rolesWithUploadedAvatars[i];

        const scheduleItemData = {
          title: role.roleName.trim(),
          role: role.roleName.trim(),
          order_index: i,
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Event</h1>
          <p className="text-gray-600">
            Update event for <span className="font-medium">{page.title}</span>
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSaveEvent();
        }}
        className="space-y-8"
      >
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

            <div className="space-y-2">
              <Label>Date & Time*</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    disabled={isLoading}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {formData.date && formData.time
                      ? `${formData.date.toLocaleDateString()} at ${
                          formData.time
                        }`
                      : formData.date
                        ? `${formData.date.toLocaleDateString()} - Select time`
                        : "Select date and time"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DateTimePickerForm
                    selectedDate={formData.date}
                    selectedTime={formData.time}
                    onDateChange={handleDateChange}
                    onTimeChange={handleTimeChange}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                type="text"
                placeholder="Enter event location (optional)"
                value={formData.location}
                onChange={handleInputChange}
                disabled={isLoading}
                className="text-base"
              />
            </div>
          </CardContent>
        </Card>

        {/* Feedback & Speaker Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Feedback & Speaker Settings</CardTitle>
            <p className="text-sm text-gray-600">
              Configure how feedback and speaker information is handled.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.allowFeedback && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anonymousFeedback"
                  checked={formData.anonymousFeedback}
                  onCheckedChange={(checked: boolean | "indeterminate") =>
                    setFormData((prev) => ({
                      ...prev,
                      anonymousFeedback:
                        checked === "indeterminate"
                          ? prev.anonymousFeedback
                          : (checked as boolean),
                    }))
                  }
                />
                <Label htmlFor="anonymousFeedback">
                  Make feedback anonymous
                </Label>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="detailedSpeakerProfiles"
                checked={formData.detailedSpeakerProfiles}
                onCheckedChange={(checked: boolean | "indeterminate") =>
                  setFormData((prev) => ({
                    ...prev,
                    detailedSpeakerProfiles:
                      checked === "indeterminate"
                        ? prev.detailedSpeakerProfiles
                        : (checked as boolean),
                  }))
                }
              />
              <Label htmlFor="detailedSpeakerProfiles">
                Enable detailed speaker profiles
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Event Schedule & Roles */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div>
                <CardTitle>Event Schedule & Roles</CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Manage speakers and time allocations.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button type="button" onClick={addRole} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Role
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {formData.roles.map((role, index) => (
                <div key={role.id}>
                  {/* Plus button to add role before this one */}
                  {index > 0 && (
                    <div className="flex justify-center my-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addRoleAtIndex(index)}
                        className="rounded-full w-8 h-8 p-0 border-dashed border-2 hover:border-solid"
                        disabled={isLoading}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Role content */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-4">
                      <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                      <div className="space-y-2">
                        <Label>Avatar</Label>
                        <AvatarPicker
                          initialAvatarUrl={role.avatar || null}
                          onAvatarChange={(blob) =>
                            handleAvatarChange(index, blob)
                          }
                        />
                      </div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Role Name</Label>
                          <Input
                            value={role.roleName}
                            onChange={(e) =>
                              updateRole(index, "roleName", e.target.value)
                            }
                            placeholder="Role name"
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
                          />
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRole(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <TimeInput
                        label="Min Time"
                        value={role.minTime}
                        onChange={(value) =>
                          updateRole(index, "minTime", value)
                        }
                        placeholder="0:03:00"
                      />

                      <TimeInput
                        label="Target Time"
                        value={role.targetTime}
                        onChange={(value) =>
                          updateRole(index, "targetTime", value)
                        }
                        placeholder="0:05:00"
                      />

                      <TimeInput
                        label="Max Time"
                        value={role.maxTime}
                        onChange={(value) =>
                          updateRole(index, "maxTime", value)
                        }
                        placeholder="0:07:00"
                      />
                    </div>

                    <div className="border-t pt-4 space-y-4">
                      <h4 className="font-medium">Speaker Details</h4>

                      <div className="space-y-2">
                        <Label>
                          <Mail className="h-4 w-4 inline mr-2" />
                          Speaker Email{" "}
                          {!formData.anonymousFeedback ? "(for feedback)" : ""}
                        </Label>
                        <Input
                          value={role.speakerEmail}
                          onChange={(e) =>
                            updateRole(index, "speakerEmail", e.target.value)
                          }
                          placeholder="speaker@example.com"
                        />
                      </div>

                      {formData.detailedSpeakerProfiles && (
                        <>
                          <div className="space-y-2">
                            <Label>Bio</Label>
                            <Textarea
                              value={role.bio}
                              onChange={(e) =>
                                updateRole(index, "bio", e.target.value)
                              }
                              placeholder="Speaker biography..."
                              className="min-h-[80px]"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Social Media Links</Label>
                            <div className="space-y-2">
                              {role.socialMediaLinks.map((link, linkIndex) => (
                                <div
                                  key={linkIndex}
                                  className="flex items-center gap-2"
                                >
                                  <Select
                                    value={link.platform}
                                    onValueChange={(value) => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        roles: prev.roles.map((r, i) =>
                                          i === index
                                            ? {
                                                ...r,
                                                socialMediaLinks:
                                                  r.socialMediaLinks.map(
                                                    (l, li) =>
                                                      li === linkIndex
                                                        ? {
                                                            ...l,
                                                            platform: value,
                                                          }
                                                        : l,
                                                  ),
                                              }
                                            : r,
                                        ),
                                      }));
                                    }}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="LinkedIn">
                                        LinkedIn
                                      </SelectItem>
                                      <SelectItem value="Twitter">
                                        Twitter
                                      </SelectItem>
                                      <SelectItem value="Instagram">
                                        Instagram
                                      </SelectItem>
                                      <SelectItem value="Website">
                                        Website
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    value={link.url}
                                    onChange={(e) => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        roles: prev.roles.map((r, i) =>
                                          i === index
                                            ? {
                                                ...r,
                                                socialMediaLinks:
                                                  r.socialMediaLinks.map(
                                                    (l, li) =>
                                                      li === linkIndex
                                                        ? {
                                                            ...l,
                                                            url: e.target.value,
                                                          }
                                                        : l,
                                                  ),
                                              }
                                            : r,
                                        ),
                                      }));
                                    }}
                                    placeholder="https://..."
                                    className="flex-1"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        roles: prev.roles.map((r, i) =>
                                          i === index
                                            ? {
                                                ...r,
                                                socialMediaLinks:
                                                  r.socialMediaLinks.filter(
                                                    (_, li) => li !== linkIndex,
                                                  ),
                                              }
                                            : r,
                                        ),
                                      }));
                                    }}
                                    className="text-red-500 hover:text-red-700 p-2"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    roles: prev.roles.map((r, i) =>
                                      i === index
                                        ? {
                                            ...r,
                                            socialMediaLinks: [
                                              ...r.socialMediaLinks,
                                              { platform: "LinkedIn", url: "" },
                                            ],
                                          }
                                        : r,
                                    ),
                                  }));
                                }}
                                className="w-full"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Link
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Plus button at the end if there are no roles */}
              {formData.roles.length === 0 && (
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addRoleAtIndex(0)}
                    className="border-dashed border-2 hover:border-solid"
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Role
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
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
            type="submit"
            disabled={
              isLoading ||
              !formData.title.trim() ||
              !formData.date ||
              !formData.time
            }
            size="lg"
          >
            {isLoading ? "Updating Event..." : "Update Event"}
          </Button>
        </div>
      </form>
    </main>
  );
}
