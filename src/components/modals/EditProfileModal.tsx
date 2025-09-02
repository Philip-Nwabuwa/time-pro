"use client";

import React, { useState, useEffect } from "react";
import { useModal } from "@/contexts/ModalContext";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  User,
  Plus,
  Trash2,
  Facebook,
  Linkedin,
  Twitter,
  Instagram,
  Github,
  Globe,
} from "lucide-react";
import AvatarPicker from "../AvatarPicker";
import { updateUserProfile } from "@/lib/authUtils";
import { uploadAvatar, getUserAvatarUrl } from "@/lib/avatarUtils";

type PlatformType =
  | "facebook"
  | "linkedin"
  | "twitter"
  | "instagram"
  | "github"
  | "website"
  | "custom";

interface SocialLink {
  id: string;
  platform: PlatformType;
  customName?: string;
  url: string;
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
  bio: string;
  socialLinks: SocialLink[];
}

export default function EditProfileModal() {
  const { isModalOpen, closeModal } = useModal();
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
    bio: "",
    socialLinks: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);

  // Initialize form data when modal opens or user changes
  useEffect(() => {
    if (user && isModalOpen("EDIT_PROFILE")) {
      const existingLinks: SocialLink[] = [];

      // Convert existing metadata to social links format
      if (user.user_metadata?.website) {
        existingLinks.push({
          id: crypto.randomUUID(),
          platform: "website",
          url: user.user_metadata.website,
        });
      }
      if (user.user_metadata?.linkedin) {
        existingLinks.push({
          id: crypto.randomUUID(),
          platform: "linkedin",
          url: user.user_metadata.linkedin,
        });
      }
      if (user.user_metadata?.twitter) {
        existingLinks.push({
          id: crypto.randomUUID(),
          platform: "twitter",
          url: user.user_metadata.twitter,
        });
      }
      if (user.user_metadata?.instagram) {
        existingLinks.push({
          id: crypto.randomUUID(),
          platform: "instagram",
          url: user.user_metadata.instagram,
        });
      }
      if (user.user_metadata?.facebook) {
        existingLinks.push({
          id: crypto.randomUUID(),
          platform: "facebook",
          url: user.user_metadata.facebook,
        });
      }
      if (user.user_metadata?.github) {
        existingLinks.push({
          id: crypto.randomUUID(),
          platform: "github",
          url: user.user_metadata.github,
        });
      }

      setFormData({
        firstName: user.user_metadata?.first_name || "",
        lastName: user.user_metadata?.last_name || "",
        bio: user.user_metadata?.bio || "",
        socialLinks: existingLinks,
      });
    }
  }, [user, isModalOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addSocialLink = () => {
    const newLink: SocialLink = {
      id: crypto.randomUUID(),
      platform: "website",
      url: "",
    };
    setFormData((prev) => ({
      ...prev,
      socialLinks: [...prev.socialLinks, newLink],
    }));
  };

  const removeSocialLink = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((link) => link.id !== id),
    }));
  };

  const updateSocialLink = (id: string, updates: Partial<SocialLink>) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.map((link) =>
        link.id === id ? { ...link, ...updates } : link
      ),
    }));
  };

  const handleAvatarChange = (croppedBlob: Blob | null) => {
    setAvatarBlob(croppedBlob);
  };

  const getPlatformIcon = (platform: PlatformType) => {
    const iconProps = { className: "h-4 w-4" };
    switch (platform) {
      case "facebook":
        return <Facebook {...iconProps} />;
      case "linkedin":
        return <Linkedin {...iconProps} />;
      case "twitter":
        return <Twitter {...iconProps} />;
      case "instagram":
        return <Instagram {...iconProps} />;
      case "github":
        return <Github {...iconProps} />;
      case "website":
        return <Globe {...iconProps} />;
      case "custom":
        return <Globe {...iconProps} />;
      default:
        return <Globe {...iconProps} />;
    }
  };

  const getPlatformName = (platform: PlatformType) => {
    switch (platform) {
      case "facebook":
        return "Facebook";
      case "linkedin":
        return "LinkedIn";
      case "twitter":
        return "Twitter/X";
      case "instagram":
        return "Instagram";
      case "github":
        return "GitHub";
      case "website":
        return "Website";
      case "custom":
        return "Custom";
      default:
        return "Website";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }

    setIsLoading(true);

    try {
      let avatarUrl = getUserAvatarUrl(user); // Keep current avatar URL

      // Upload new avatar if user selected one
      if (avatarBlob && user) {
        const uploadResult = await uploadAvatar(avatarBlob, user.id);
        if (uploadResult.success && uploadResult.url) {
          avatarUrl = uploadResult.url;
        } else {
          // Don't fail the whole update if avatar upload fails
          console.error("Avatar upload failed:", uploadResult.error);
          toast.error(
            "Profile updated, but avatar upload failed. Please try again."
          );
        }
      }

      // Prepare profile data for update
      const socialLinksMap = formData.socialLinks.reduce((acc, link) => {
        if (link.platform === "custom" && link.customName) {
          acc[link.customName.toLowerCase()] = link.url;
        } else {
          acc[link.platform] = link.url;
        }
        return acc;
      }, {} as Record<string, string>);

      const profileData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        bio: formData.bio,
        avatar_url: avatarUrl || undefined,
        ...socialLinksMap,
      };

      const result = await updateUserProfile(profileData);

      if (result.success) {
        // Refresh user data to reflect changes immediately
        await refreshUser();
        toast.success("Profile updated successfully!");
        closeModal();
      } else {
        toast.error(
          result.error || "Failed to update profile. Please try again."
        );
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Only allow closing if not loading (this will only be called by Cancel button)
    if (!isLoading) {
      // Reset form to original user data
      if (user) {
        const existingLinks: SocialLink[] = [];

        // Convert existing metadata to social links format
        if (user.user_metadata?.website) {
          existingLinks.push({
            id: crypto.randomUUID(),
            platform: "website",
            url: user.user_metadata.website,
          });
        }
        if (user.user_metadata?.linkedin) {
          existingLinks.push({
            id: crypto.randomUUID(),
            platform: "linkedin",
            url: user.user_metadata.linkedin,
          });
        }
        if (user.user_metadata?.twitter) {
          existingLinks.push({
            id: crypto.randomUUID(),
            platform: "twitter",
            url: user.user_metadata.twitter,
          });
        }
        if (user.user_metadata?.instagram) {
          existingLinks.push({
            id: crypto.randomUUID(),
            platform: "instagram",
            url: user.user_metadata.instagram,
          });
        }
        if (user.user_metadata?.facebook) {
          existingLinks.push({
            id: crypto.randomUUID(),
            platform: "facebook",
            url: user.user_metadata.facebook,
          });
        }
        if (user.user_metadata?.github) {
          existingLinks.push({
            id: crypto.randomUUID(),
            platform: "github",
            url: user.user_metadata.github,
          });
        }

        setFormData({
          firstName: user.user_metadata?.first_name || "",
          lastName: user.user_metadata?.last_name || "",
          bio: user.user_metadata?.bio || "",
          socialLinks: existingLinks,
        });
      }
      closeModal();
    }
  };

  return (
    <Dialog open={isModalOpen("EDIT_PROFILE")} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Avatar Preview */}
          <div className="flex flex-col items-center space-y-4">
            <div className="text-sm font-medium text-gray-700">
              Current Avatar
            </div>
            <AvatarPicker
              initialAvatarUrl={getUserAvatarUrl(user)}
              onAvatarChange={handleAvatarChange}
            />
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={handleInputChange}
                disabled={isLoading}
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">
                Social Links
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSocialLink}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Link
              </Button>
            </div>

            {formData.socialLinks.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No social links added yet. Click "Add Link" to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {formData.socialLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex gap-3 items-start p-4 border rounded-lg bg-gray-50"
                  >
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Platform</Label>
                          <Select
                            value={link.platform}
                            onValueChange={(value: PlatformType) =>
                              updateSocialLink(link.id, {
                                platform: value,
                                customName:
                                  value === "custom"
                                    ? link.customName || ""
                                    : undefined,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue>
                                <div className="flex items-center gap-2">
                                  {getPlatformIcon(link.platform)}
                                  <span>{getPlatformName(link.platform)}</span>
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="facebook">
                                <div className="flex items-center gap-2">
                                  <Facebook className="h-4 w-4" />
                                  <span>Facebook</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="linkedin">
                                <div className="flex items-center gap-2">
                                  <Linkedin className="h-4 w-4" />
                                  <span>LinkedIn</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="twitter">
                                <div className="flex items-center gap-2">
                                  <Twitter className="h-4 w-4" />
                                  <span>Twitter/X</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="instagram">
                                <div className="flex items-center gap-2">
                                  <Instagram className="h-4 w-4" />
                                  <span>Instagram</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="github">
                                <div className="flex items-center gap-2">
                                  <Github className="h-4 w-4" />
                                  <span>GitHub</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="website">
                                <div className="flex items-center gap-2">
                                  <Globe className="h-4 w-4" />
                                  <span>Website</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="custom">
                                <div className="flex items-center gap-2">
                                  <Globe className="h-4 w-4" />
                                  <span>Custom</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {link.platform === "custom" && (
                          <div className="space-y-2">
                            <Label>Platform Name</Label>
                            <Input
                              placeholder="Enter platform name"
                              value={link.customName || ""}
                              onChange={(e) =>
                                updateSocialLink(link.id, {
                                  customName: e.target.value,
                                })
                              }
                              disabled={isLoading}
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>URL</Label>
                        <Input
                          type="url"
                          placeholder="https://..."
                          value={link.url}
                          onChange={(e) =>
                            updateSocialLink(link.id, { url: e.target.value })
                          }
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSocialLink(link.id)}
                      disabled={isLoading}
                      className="flex-shrink-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                !formData.firstName.trim() ||
                !formData.lastName.trim()
              }
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
