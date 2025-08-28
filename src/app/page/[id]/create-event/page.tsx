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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { fetchPageById, type PageData } from "@/lib/mockApi";

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
}

interface EventFormData {
  title: string;
  date: string;
  allowFeedback: boolean;
  anonymousFeedback: boolean;
  detailedSpeakerProfiles: boolean;
  roles: SpeakerRole[];
}

export default function CreateEventPage() {
  const params = useParams();
  const router = useRouter();
  const pageId = params.id as string;

  const [page, setPage] = useState<PageData | null>(null);
  const [formData, setFormData] = useState<EventFormData>({
    title: "Toastmasters Meeting",
    date: "15/08/2025",
    allowFeedback: true,
    anonymousFeedback: false,
    detailedSpeakerProfiles: true,
    roles: [
      {
        id: "1",
        roleName: "Closing Remarks",
        speakerName: "Toastmaster",
        speakerEmail: "speaker@example.com",
        bio: "",
        avatar: "T",
        minTime: "1:00",
        targetTime: "1:36",
        maxTime: "2:00",
        socialMediaLinks: [{ platform: "LinkedIn", url: "" }],
      },
    ],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const loadPageData = async () => {
      try {
        const pageData = await fetchPageById(pageId);
        setPage(pageData);
      } catch (error) {
        console.error("Failed to load page data:", error);
        toast.error("Failed to load page data");
        router.push("/");
      } finally {
        setPageLoading(false);
      }
    };

    if (pageId) {
      loadPageData();
    }
  }, [pageId, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

    setIsLoading(true);

    try {
      // TODO: Implement API call to create event
      console.log("Creating event for page:", pageId, formData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success("Event created successfully!");

      // Navigate back to page details
      router.push(`/page/${pageId}`);
    } catch (error) {
      toast.error("Failed to create event. Please try again.");
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

  if (!page) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="text-center">
          <div className="text-red-500">Page not found</div>
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
              <Label htmlFor="date">
                <Calendar className="h-4 w-4 inline mr-2" />
                Date *
              </Label>
              <Input
                id="date"
                name="date"
                type="text"
                value={formData.date}
                onChange={handleInputChange}
                disabled={isLoading}
                required
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
            <Tabs defaultValue="schedule" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="schedule">
                    Event Schedule & Roles
                  </TabsTrigger>
                  <TabsTrigger value="polls">Polls</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    {formatTime(calculateTotalTime())} total
                  </div>
                  <Button
                    onClick={addRole}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Role
                  </Button>
                </div>
              </div>

              <TabsContent value="schedule" className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Event Schedule & Roles
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Manage speakers and time allocations.
                  </p>
                </div>

                {formData.roles.map((role, index) => (
                  <div
                    key={role.id}
                    className="border rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-center gap-4">
                      <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                          <Label>Speaker Name</Label>
                          <Input
                            value={role.speakerName}
                            onChange={(e) =>
                              updateRole(role.id, "speakerName", e.target.value)
                            }
                            placeholder="Speaker name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Avatar</Label>
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                              {role.avatar || "?"}
                            </div>
                            <Button size="sm" variant="outline" className="p-2">
                              <Camera className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRole(role.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Min Time</Label>
                        <Input
                          value={role.minTime}
                          onChange={(e) =>
                            updateRole(role.id, "minTime", e.target.value)
                          }
                          placeholder="0:00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Target Time</Label>
                        <Input
                          value={role.targetTime}
                          onChange={(e) =>
                            updateRole(role.id, "targetTime", e.target.value)
                          }
                          placeholder="0:00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Max Time</Label>
                        <Input
                          value={role.maxTime}
                          onChange={(e) =>
                            updateRole(role.id, "maxTime", e.target.value)
                          }
                          placeholder="0:00"
                        />
                      </div>
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
                              updateRole(
                                role.id,
                                "speakerEmail",
                                e.target.value
                              )
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
              </TabsContent>

              <TabsContent value="polls" className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Checkbox id="eventPolls" checked={true} />
                        <Label
                          htmlFor="eventPolls"
                          className="text-lg font-semibold"
                        >
                          Event Polls
                        </Label>
                      </div>
                      <div className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                        Anonymous
                      </div>
                    </div>
                    <Button
                      onClick={() => {}}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      New Poll
                    </Button>
                  </div>

                  {/* Create New Poll Form */}
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          Create New Poll
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="pollTitle">Poll Title</Label>
                        <Input
                          id="pollTitle"
                          placeholder="What's your favorite session?"
                          className="bg-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pollDescription">
                          Description (optional)
                        </Label>
                        <Textarea
                          id="pollDescription"
                          placeholder="Additional details about the poll..."
                          className="min-h-[100px] resize-none bg-white"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label>Poll Options</Label>
                        <div className="space-y-2">
                          <Input placeholder="Option 1" className="bg-white" />
                          <Input placeholder="Option 2" className="bg-white" />
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Option
                        </Button>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button className="bg-green-600 hover:bg-green-700 flex-1">
                          Create Poll
                        </Button>
                        <Button variant="outline" className="flex-1">
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
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
            disabled={isLoading || !formData.title.trim() || !formData.date}
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
