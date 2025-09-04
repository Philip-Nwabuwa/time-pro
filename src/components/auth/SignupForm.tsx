"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { supabase } from "@/lib/supabase";
import { handleSignupError } from "@/lib/authUtils";
import { Eye, EyeOff, Timer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import Link from "next/link";
import logo from "@/assets/images/logo-2.jpeg";

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  agreeToTerms: boolean;
}

export default function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupFormData>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      agreeToTerms: false,
    },
  });

  const watchAgreeToTerms = watch("agreeToTerms");

  const onSubmit = async (data: SignupFormData) => {
    if (!data.agreeToTerms) {
      toast.error("Please agree to the Terms and Conditions");
      return;
    }

    setLoading(true);

    try {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          },
        },
      });

      if (error) throw error;

      // Check if user already exists and needs to confirm email
      if (signUpData.user && !signUpData.user.email_confirmed_at) {
        toast.success(
          "Please check your email for the verification link to complete signup.",
        );
        window.location.href = `/verify-otp?email=${encodeURIComponent(
          data.email,
        )}`;
      } else if (signUpData.user && signUpData.user.email_confirmed_at) {
        // User exists and is confirmed - redirect to sign in
        toast.error(
          "An account with this email already exists. Please sign in instead.",
        );
        window.location.href = "/signin";
      } else {
        toast.success(
          "Account created! Please check your email for verification.",
        );
        window.location.href = `/verify-otp?email=${encodeURIComponent(
          data.email,
        )}`;
      }
    } catch (error: any) {
      const errorResult = handleSignupError(error, data.email);

      toast.error(errorResult.message);

      if (errorResult.redirectTo && errorResult.delay > 0) {
        setTimeout(() => {
          window.location.href = errorResult.redirectTo;
        }, errorResult.delay);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="flex flex-col justify-center items-center mb-8">
          <Image
            src={logo}
            alt="Oratoh"
            width={100}
            height={100}
            className="w-16 mb-4"
          />
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Join Oratoh
          </h1>
          <p className="text-muted-foreground text-lg">
            Create your account to get started
          </p>
        </div>

        {/* Signup Card */}
        <Card className="shadow-xl">
          <CardHeader className="space-y-1 text-center pb-4">
            <CardTitle className="text-2xl font-semibold">
              Create Account
            </CardTitle>
            <CardDescription>
              Enter your details to create your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="First name"
                    {...register("firstName", {
                      required: "First name is required",
                    })}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Last name"
                    {...register("lastName", {
                      required: "Last name is required",
                    })}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-start space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  {...register("agreeToTerms", {
                    required: "You must agree to the terms",
                  })}
                  className="mt-1 h-4 w-4 text-primary focus:ring-primary border-input rounded"
                />
                <div className="text-sm">
                  <label htmlFor="agreeToTerms" className="text-foreground">
                    I agree to the{" "}
                    <Link
                      href="#"
                      className="text-primary hover:text-primary/80 font-medium"
                    >
                      Terms and Conditions
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="#"
                      className="text-primary hover:text-primary/80 font-medium"
                    >
                      Privacy Policy
                    </Link>
                  </label>
                  {errors.agreeToTerms && (
                    <p className="text-destructive mt-1">
                      {errors.agreeToTerms.message}
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !watchAgreeToTerms}
                className="w-full"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="pt-4 text-center border-t border-border">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/signin"
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
