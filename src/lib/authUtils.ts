import { supabase } from "@/lib/supabase";

export interface UserCheckResult {
  exists: boolean;
  isConfirmed: boolean;
  needsVerification: boolean;
}

export interface ProfileData {
  firstName: string;
  lastName: string;
  bio?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
  github?: string;
  avatar_url?: string;
}

export async function checkUserExists(email: string): Promise<UserCheckResult> {
  try {
    // First, try to sign in with a dummy password to check if user exists
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: "dummy_password_to_check_existence",
    });

    // If we get "Invalid login credentials", the user likely doesn't exist
    // If we get other errors, the user might exist but password is wrong
    if (signInError) {
      if (signInError.message.includes("Invalid login credentials")) {
        return {
          exists: false,
          isConfirmed: false,
          needsVerification: false,
        };
      } else if (signInError.message.includes("Email not confirmed")) {
        return {
          exists: true,
          isConfirmed: false,
          needsVerification: true,
        };
      } else {
        // User likely exists but password is wrong
        return {
          exists: true,
          isConfirmed: true,
          needsVerification: false,
        };
      }
    }

    // If no error, user exists and is confirmed
    return {
      exists: true,
      isConfirmed: true,
      needsVerification: false,
    };
  } catch (error) {
    console.error("Error checking user existence:", error);
    return {
      exists: false,
      isConfirmed: false,
      needsVerification: false,
    };
  }
}

export function handleSignupError(error: any, email: string) {
  console.error("Signup error:", error);

  // Handle specific Supabase errors
  if (error.message?.includes("User already registered")) {
    return {
      message:
        "An account with this email already exists. Please sign in instead.",
      redirectTo: "/signin",
      delay: 2000,
    };
  } else if (error.message?.includes("already been registered")) {
    return {
      message:
        "This email is already registered. Please check your email for the verification link or sign in.",
      redirectTo: `/verify-otp?email=${encodeURIComponent(email)}`,
      delay: 2000,
    };
  } else if (error.message?.includes("Email not confirmed")) {
    return {
      message:
        "Please check your email for the verification link to complete signup.",
      redirectTo: `/verify-otp?email=${encodeURIComponent(email)}`,
      delay: 1000,
    };
  } else {
    return {
      message: error.message || "Account creation failed. Please try again.",
      redirectTo: null,
      delay: 0,
    };
  }
}

export async function updateUserProfile(
  profileData: ProfileData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.updateUser({
      data: {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        bio: profileData.bio || "",
        website: profileData.website || "",
        linkedin: profileData.linkedin || "",
        twitter: profileData.twitter || "",
        instagram: profileData.instagram || "",
        facebook: profileData.facebook || "",
        github: profileData.github || "",
        avatar_url: profileData.avatar_url || "",
      },
    });

    if (error) {
      console.error("Profile update error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Profile update error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update profile",
    };
  }
}
