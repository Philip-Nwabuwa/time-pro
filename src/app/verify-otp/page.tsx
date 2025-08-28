"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import OTPVerification from "@/components/auth/OTPVerification";

function VerifyOTPContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const handleBack = () => {
    window.history.back();
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Invalid Verification Link
          </h1>
          <p className="text-gray-600 mb-6">
            This verification link is invalid or has expired.
          </p>
          <button
            onClick={handleBack}
            className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <OTPVerification email={email} onBack={handleBack} />;
}

export default function VerifyOTPPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <VerifyOTPContent />
    </Suspense>
  );
}
