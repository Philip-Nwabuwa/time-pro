"use client";

import { useState } from "react";
import { getUserAvatarUrl } from "@/lib/avatarUtils";

interface UserAvatarProps {
  user: {
    email?: string;
    user_metadata?: {
      first_name?: string;
      last_name?: string;
      avatar_url?: string;
    };
  };
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function UserAvatar({
  user,
  size = "md",
  className = "",
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const avatarUrl = getUserAvatarUrl(user);

  const getInitials = () => {
    if (user.user_metadata?.first_name && user.user_metadata?.last_name) {
      return `${user.user_metadata.first_name[0]}${user.user_metadata.last_name[0]}`.toUpperCase();
    }
    return user.email?.substring(0, 2).toUpperCase() || "U";
  };

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-9 w-9 text-xs",
    lg: "h-12 w-12 text-sm",
  };

  const baseClasses = `flex items-center justify-center rounded-full bg-emerald-600 font-semibold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${sizeClasses[size]} ${className}`;

  // If no avatar URL or image failed to load, show initials
  if (!avatarUrl || imageError) {
    return <div className={baseClasses}>{getInitials()}</div>;
  }

  // Show avatar image with fallback to initials
  return (
    <div className={baseClasses} style={{ padding: 0 }}>
      <img
        src={avatarUrl}
        alt={`${user.user_metadata?.first_name || user.email}'s avatar`}
        className="h-full w-full rounded-full object-cover"
        onError={() => setImageError(true)}
        onLoad={() => setImageError(false)}
      />
    </div>
  );
}
