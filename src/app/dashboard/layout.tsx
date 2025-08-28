"use client";

import { useAuth } from "@/contexts/AuthContext";
import { ModalProvider } from "@/contexts/ModalContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Timer } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import CreatePageModal from "@/components/modals/CreatePageModal";
import EditProfileModal from "@/components/modals/EditProfileModal";
import ChangePasswordModal from "@/components/ChangePasswordModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully!");
      router.push("/");
    } catch (error) {
      toast.error("Failed to sign out. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-lg mb-4">
            <Timer className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ModalProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onSignOut={handleSignOut} />
        {children}
        <CreatePageModal />
        <EditProfileModal />
        <ChangePasswordModal />
      </div>
    </ModalProvider>
  );
}
