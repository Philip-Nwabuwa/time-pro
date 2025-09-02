"use client";

import { Timer, Lock, LogOut, UserCircle, Search } from "lucide-react";
import Image from "next/image";
import { useModal } from "@/contexts/ModalContext";
import { useRouter, usePathname } from "next/navigation";
import UserAvatar from "./UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import logo from "@/assets/images/logo-2.jpeg";

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
  const pathname = usePathname();

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
    router.push("/discovery");
  };

  const handleDashboardClick = () => {
    router.push("/");
  };

  const isDiscoveryActive = pathname === "/discovery";
  const isDashboardActive = pathname === "/";

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1">
              <Image
                src={logo}
                alt="Oratoh"
                width={100}
                height={100}
                className="w-8"
              />
              <span className="text-lg lg:text-2xl font-semibold text-gray-900">
                Oratoh
              </span>
            </Link>
            <button
              onClick={handleDashboardClick}
              className={`hidden md:block items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                isDashboardActive
                  ? "text-gray-900 font-bold border-b-2 border-purple-900 pb-1"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={handleDiscoveryClick}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                isDiscoveryActive
                  ? "text-gray-900 font-bold border-b-2 border-purple-900 pb-1"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Search className="h-4 w-4" />
              Discovery
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* User Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="border border-solid border-purple-900 p-[1px] rounded-full">
                  <UserAvatar user={user} size="md" />
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
