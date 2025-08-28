"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Timer, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import React from "react";
import { toast } from "sonner";

interface OTPVerificationProps {
  email: string;
  onBack: () => void;
}

export default function OTPVerification({
  email,
  onBack,
}: OTPVerificationProps) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const router = useRouter();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "signup",
      });

      if (error) throw error;

      toast.success("Email verified successfully!");
      setSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) throw error;

      toast.success("New verification code sent to your email!");
      setCountdown(60);
      setCanResend(false);
      setOtp("");

      // Clear all input fields
      inputRefs.current.forEach((input) => {
        if (input) input.value = "";
      });

      // Focus first input
      const firstInput = inputRefs.current[0];
      if (firstInput) {
        firstInput.focus();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to resend code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/signup");
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow single digits
    if (!/^\d?$/.test(value)) return;

    const newOtp = otp.split("");
    newOtp[index] = value;
    setOtp(newOtp.join(""));

    // Auto-focus next input if value is entered
    if (value && index < 5) {
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = inputRefs.current[index - 1];
      if (prevInput) {
        prevInput.focus();
      }
    }

    // Handle arrow keys
    if (e.key === "ArrowLeft" && index > 0) {
      const prevInput = inputRefs.current[index - 1];
      if (prevInput) {
        prevInput.focus();
      }
    }

    if (e.key === "ArrowRight" && index < 5) {
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text/plain")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (pastedData.length === 6) {
      setOtp(pastedData);
      // Focus the last input field
      const lastInput = inputRefs.current[5];
      if (lastInput) {
        lastInput.focus();
      }
      toast.success("OTP code pasted successfully!");
    } else {
      toast.error("Please paste a valid 6-digit code");
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-lg mb-4">
              <Timer className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Welcome to TimePro
            </h1>
            <p className="text-gray-600">
              Professional event management platform
            </p>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl">Email Verified!</CardTitle>
              <CardDescription>
                Your account has been successfully created and verified.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Redirecting you to your dashboard...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-lg mb-4">
            <Timer className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome to TimePro
          </h1>
          <p className="text-gray-600">
            Professional event management platform
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Verify Your Email</CardTitle>
            <CardDescription>
              We've sent a 6-digit verification code to
              <br />
              <span className="font-medium text-gray-800">{email}</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-700">
                Enter verification code
              </label>
              <div className="flex gap-2 justify-center">
                {Array.from({ length: 6 }, (_, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    maxLength={1}
                    value={otp[index] || ""}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-md focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors"
                    placeholder="•"
                  />
                ))}
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Didn't receive the code?{" "}
                {canResend ? (
                  <button
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="text-green-500 hover:text-green-600 font-medium disabled:opacity-50"
                  >
                    Resend code
                  </button>
                ) : (
                  <span className="text-gray-400">Resend in {countdown}s</span>
                )}
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              onClick={handleVerifyOTP}
              disabled={loading || otp.length !== 6}
              className="w-full"
              size="lg"
            >
              {loading ? "Verifying..." : "Verify Email"}
            </Button>

            <Button
              variant="outline"
              onClick={handleBack}
              disabled={loading}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sign Up
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
