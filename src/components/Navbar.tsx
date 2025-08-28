"use client";

import { Timer, Lock, LogOut, UserCircle, Search } from "lucide-react";
import { useModal } from "@/contexts/ModalContext";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  user: {
    email?: string;
    user_metadata?: {
      first_name?: string;
      last_name?: string;
    };
  };
  onSignOut: () => void;
}

export default function Navbar({ user, onSignOut }: NavbarProps) {
  const { openModal } = useModal();
  const router = useRouter();

  const getInitials = () => {
    if (user.user_metadata?.first_name && user.user_metadata?.last_name) {
      return `${user.user_metadata.first_name[0]}${user.user_metadata.last_name[0]}`.toUpperCase();
    }
    return user.email?.substring(0, 2).toUpperCase() || "U";
  };

  const getDisplayName = () => {
    if (user.user_metadata?.first_name && user.user_metadata?.last_name) {
      return `${user.user_metadata.first_name} ${user.user_metadata.last_name}`;
    }
    return user.email || "User";
  };

  const handleEditProfile = () => {
    openModal("EDIT_PROFILE");
  };

  const handleChangePassword = () => {
    openModal("CHANGE_PASSWORD");
  };

  const handleDiscoveryClick = () => {
    router.push("/dashboard/discovery");
  };

  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500">
              <Timer className="h-6 w-6 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">
              Dashboard
            </span>
            <button
              onClick={handleDiscoveryClick}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Search className="h-4 w-4" />
              Discovery
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* User Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                  {getInitials()}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {getDisplayName()}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleEditProfile}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Edit Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleChangePassword}>
                  <Lock className="mr-2 h-4 w-4" />
                  <span>Change Password</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onSignOut}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
