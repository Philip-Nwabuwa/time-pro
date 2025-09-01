"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  GripVertical,
  X,
  Plus,
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
import { usePage } from "@/lib/api/hooks";
import DateTimePickerForm from "@/components/DateTimePickerForm";
import TimeInput from "@/components/TimeInput";
import { createEvent, createScheduleItem } from "@/lib/api/events";
import type { EventInsert, EventScheduleItemInsert } from "@/lib/api/types";
import MemberSearchInput from "@/components/MemberSearchInput";
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

export default function CreateEventPage() {
  const params = useParams();
  const router = useRouter();
  const pageId = params.id as string;

  const {
    data: page,
    isLoading: pageLoading,
    error: pageError,
  } = usePage(pageId);
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  const handleCheckboxChange = (
    name: string,
    checked: boolean | "indeterminate"
  ) => {
    if (checked === "indeterminate") return;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const addRole = () => {
    const newRole: SpeakerRole = {
      id: Date.now().toString(),
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
    };
    setFormData((prev) => ({
      ...prev,
      roles: [...prev.roles, newRole],
    }));
  };

  const removeRole = (roleId: string) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.filter((role) => role.id !== roleId),
    }));
  };

  const updateRole = (roleId: string, field: keyof SpeakerRole, value: any) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.map((role) =>
        role.id === roleId ? { ...role, [field]: value } : role
      ),
    }));
  };

  const handleMemberSelect = (roleId: string, member: any) => {
    // Auto-fill speaker details from member profile
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.map((role) =>
        role.id === roleId
          ? {
              ...role,
              speakerName: member.name,
              speakerEmail: member.email,
              avatar: member.avatar || "",
              avatarBlob: null, // Reset blob when selecting a member
              // Keep existing bio and social media links as they might be role-specific
            }
          : role
      ),
    }));
  };

  const addSocialMediaLink = (roleId: string) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.map((role) =>
        role.id === roleId
          ? {
              ...role,
              socialMediaLinks: [
                ...role.socialMediaLinks,
                { platform: "LinkedIn", url: "" },
              ],
            }
          : role
      ),
    }));
  };

  const removeSocialMediaLink = (roleId: string, linkIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.map((role) =>
        role.id === roleId
          ? {
              ...role,
              socialMediaLinks: role.socialMediaLinks.filter(
                (_, index) => index !== linkIndex
              ),
            }
          : role
      ),
    }));
  };

  const updateSocialMediaLink = (
    roleId: string,
    linkIndex: number,
    field: "platform" | "url",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.map((role) =>
        role.id === roleId
          ? {
              ...role,
              socialMediaLinks: role.socialMediaLinks.map((link, index) =>
                index === linkIndex ? { ...link, [field]: value } : link
              ),
            }
          : role
      ),
    }));
  };

  const calculateTotalTime = () => {
    return formData.roles.reduce((total, role) => {
      const targetTime = parseFloat(role.targetTime.replace(":", "."));
      return total + targetTime;
    }, 0);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time);
    const seconds = Math.round((time - minutes) * 60);
    return `${minutes}m${seconds > 0 ? ` ${seconds}s` : ""}`;
  };

  const parseTimeToMinutes = (timeString: string): number => {
    if (!timeString) return 0;
    const [minutes, seconds] = timeString.split(":").map(Number);
    return (minutes || 0) + (seconds || 0) / 60;
  };

  const transformFormDataToEventInsert = (): EventInsert => {
    return {
      title: formData.title,
      event_date: formData.date!.toISOString().split("T")[0],
      event_time: formData.time!,
      location: formData.location || null,
      page_id: pageId,
      allow_feedback: formData.allowFeedback,
      anonymous_feedback: formData.anonymousFeedback,
      detailed_speaker_profiles: formData.detailedSpeakerProfiles,
      estimated_minutes: Math.round(calculateTotalTime() * 60),
      roles_count: formData.roles.length,
      status: "upcoming",
      configured: true,
    };
  };

  const transformRolesToScheduleItems = (
    eventId: string,
    roles: SpeakerRole[] = formData.roles
  ): EventScheduleItemInsert[] => {
    return roles.map((role, index) => ({
      event_id: eventId,
      title: role.roleName || "Untitled Role",
      role: role.roleName || "Speaker",
      order_index: index,
      allocated_minutes: parseTimeToMinutes(role.targetTime),
      speaker_name: role.speakerName || null,
      speaker_email: role.speakerEmail || null,
      speaker_bio: role.bio || null,
      speaker_avatar: role.avatar || null,
      min_minutes: parseTimeToMinutes(role.minTime) || null,
      target_minutes: parseTimeToMinutes(role.targetTime) || null,
      max_minutes: parseTimeToMinutes(role.maxTime) || null,
      social_media_links:
        role.socialMediaLinks.length > 0 ? role.socialMediaLinks : null,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    setIsLoading(true);

    try {
      const eventData = transformFormDataToEventInsert();

      // Create the event first
      const createdEvent = await createEvent(eventData);

      // Upload speaker avatars and update roles with uploaded URLs
      const rolesWithUploadedAvatars = await Promise.all(
        formData.roles.map(async (role) => {
          let speakerAvatarUrl = role.avatar;

          // If there's a blob (cropped image), upload it
          if (role.avatarBlob) {
            const uploadResult = await uploadSpeakerAvatar(
              role.avatarBlob,
              createdEvent.id,
              role.id
            );

            if (uploadResult.success && uploadResult.url) {
              speakerAvatarUrl = uploadResult.url;
            } else {
              console.warn(
                `Failed to upload avatar for role ${role.roleName}: ${uploadResult.error}`
              );
              // Continue with the existing URL or empty string
            }
          }

          return {
            ...role,
            avatar: speakerAvatarUrl,
          };
        })
      );

      // Create schedule items if there are any roles
      if (rolesWithUploadedAvatars.length > 0) {
        const scheduleItems = transformRolesToScheduleItems(
          createdEvent.id,
          rolesWithUploadedAvatars
        );

        // Create all schedule items
        await Promise.all(
          scheduleItems.map((item) => createScheduleItem(createdEvent.id, item))
        );
      }

      toast.success("Event created successfully!");
      router.push(`/page/${pageId}`);
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error(
        error instanceof Error
          ? `Failed to create event: ${error.message}`
          : "Failed to create event. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push(`/page/${pageId}`);
  };

  if (pageLoading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="text-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </main>
    );
  }

  if (pageError || !page) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="text-center">
          <div className="text-red-500">Page not found or access denied</div>
          <Button onClick={() => router.push("/")} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create New Event
          </h1>
          <p className="text-gray-600">
            Create an event for{" "}
            <span className="font-medium">{page.title}</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
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
              <Label htmlFor="location">
                <MapPin className="h-4 w-4 inline mr-2" />
                Location
              </Label>
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
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allowFeedback"
                checked={formData.allowFeedback}
                onCheckedChange={(checked: boolean | "indeterminate") =>
                  handleCheckboxChange("allowFeedback", checked)
                }
              />
              <Label htmlFor="allowFeedback">Allow feedback collection</Label>
            </div>

            {formData.allowFeedback && (
              <div className="flex items-center space-x-2 ml-6">
                <Checkbox
                  id="anonymousFeedback"
                  checked={formData.anonymousFeedback}
                  onCheckedChange={(checked: boolean | "indeterminate") =>
                    handleCheckboxChange("anonymousFeedback", checked)
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
                  handleCheckboxChange("detailedSpeakerProfiles", checked)
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
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  {formatTime(calculateTotalTime())} total
                </div>
                <Button
                  type="button"
                  onClick={addRole}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Role
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {formData.roles.map((role, index) => (
                <div key={role.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                    <div className="space-y-2">
                      <Label>Avatar</Label>
                      <AvatarPicker
                        initialAvatarUrl={role.avatar || null}
                        onAvatarChange={(blob) => {
                          updateRole(role.id, "avatarBlob", blob);
                          if (blob) {
                            const url = URL.createObjectURL(blob);
                            updateRole(role.id, "avatar", url);
                          } else {
                            updateRole(role.id, "avatar", "");
                          }
                        }}
                      />
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Role Name</Label>
                        <Input
                          value={role.roleName}
                          onChange={(e) =>
                            updateRole(role.id, "roleName", e.target.value)
                          }
                          placeholder="Role name"
                        />
                      </div>

                      <div className="space-y-2">
                        <MemberSearchInput
                          pageId={pageId}
                          value={role.speakerName}
                          onChange={(value) =>
                            updateRole(role.id, "speakerName", value)
                          }
                          onMemberSelect={(member) =>
                            handleMemberSelect(role.id, member)
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
                      onClick={() => removeRole(role.id)}
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
                        updateRole(role.id, "minTime", value)
                      }
                      placeholder="3:00"
                    />

                    <TimeInput
                      label="Target Time"
                      value={role.targetTime}
                      onChange={(value) =>
                        updateRole(role.id, "targetTime", value)
                      }
                      placeholder="5:00"
                    />

                    <TimeInput
                      label="Max Time"
                      value={role.maxTime}
                      onChange={(value) =>
                        updateRole(role.id, "maxTime", value)
                      }
                      placeholder="7:00"
                    />
                  </div>

                  {formData.detailedSpeakerProfiles && (
                    <div className="border-t pt-4 space-y-4">
                      <h4 className="font-medium">Speaker Details</h4>

                      <div className="space-y-2">
                        <Label>
                          <Mail className="h-4 w-4 inline mr-2" />
                          Speaker Email (for feedback)
                        </Label>
                        <Input
                          value={role.speakerEmail}
                          onChange={(e) =>
                            updateRole(role.id, "speakerEmail", e.target.value)
                          }
                          placeholder="speaker@example.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Bio</Label>
                        <Textarea
                          value={role.bio}
                          onChange={(e) =>
                            updateRole(role.id, "bio", e.target.value)
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
                                onValueChange={(value) =>
                                  updateSocialMediaLink(
                                    role.id,
                                    linkIndex,
                                    "platform",
                                    value
                                  )
                                }
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
                                onChange={(e) =>
                                  updateSocialMediaLink(
                                    role.id,
                                    linkIndex,
                                    "url",
                                    e.target.value
                                  )
                                }
                                placeholder="https://..."
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  removeSocialMediaLink(role.id, linkIndex)
                                }
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
                            onClick={() => addSocialMediaLink(role.id)}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Link
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
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
            className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
            size="lg"
          >
            {isLoading ? "Creating Event..." : "Create Event"}
          </Button>
        </div>
      </form>
    </main>
  );
}
