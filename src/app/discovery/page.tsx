"use client";

import { Globe, Lock, Plus, Search, Image, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAllPages, useJoinPage } from "@/lib/api/hooks";
import JoinPrivatePageModal from "@/components/modals/JoinPrivatePageModal";

export default function DiscoveryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedPage, setSelectedPage] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const { data: pages, isLoading, error } = useAllPages();
  const joinPageMutation = useJoinPage();

  // Filter pages based on search query
  const filteredPages =
    pages?.filter((page) => {
      if (searchQuery.trim() === "") return true;

      const query = searchQuery.toLowerCase();
      return (
        page.title.toLowerCase().includes(query) ||
        (page.description && page.description.toLowerCase().includes(query)) ||
        (page.category && page.category.toLowerCase().includes(query))
      );
    }) || [];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleJoinPage = async (
    pageId: string,
    isPrivate: boolean,
    pageTitle: string,
  ) => {
    if (isPrivate) {
      setSelectedPage({ id: pageId, title: pageTitle });
      setShowPinModal(true);
    } else {
      try {
        await joinPageMutation.mutateAsync({ pageId });
        router.push(`/page/${pageId}`);
      } catch (_error) {
        // Error is handled by the mutation hook
      }
    }
  };

  const handleJoinPrivatePage = async (pin: string) => {
    if (!selectedPage) return;

    try {
      await joinPageMutation.mutateAsync({ pageId: selectedPage.id, pin });
      router.push(`/page/${selectedPage.id}`);
    } catch (_error) {
      // Error is handled by the mutation hook
      throw _error; // Re-throw to show error in modal
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-4">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading pages...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-4">
        <div className="text-center py-12">
          <p className="text-red-500">Error loading pages. Please try again.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-4">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Discover Pages
        </h1>
        <p className="text-gray-600 mb-6">
          Find and join pages that match your interests. Connect with
          communities and participate in their events.
        </p>

        {/* Search Input */}
        <div className="relative max-w-2xl mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search pages by name, description, or category..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 h-12 text-base"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <p className="text-gray-600">Found {filteredPages.length} pages</p>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPages.map((page) => {
          return (
            <Card
              key={page.id}
              className="hover:shadow-lg transition-shadow duration-200 cursor-pointer overflow-hidden"
              onClick={() => router.push(`/page/${page.id}`)}
            >
              <div className="aspect-video w-full relative overflow-hidden">
                {page.imageUrl ? (
                  <img
                    src={page.imageUrl}
                    alt={page.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="p-4 bg-gray-200/50 rounded-lg mb-2 inline-block">
                        <Image className="h-8 w-8" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                      {page.title}
                    </h3>
                  </div>
                </div>

                {page.description && (
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mt-2">
                    {page.description}
                  </p>
                )}
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3 mb-4">
                  {/* Page Type - Show actual privacy status */}
                  <div
                    className={`flex items-center gap-2 text-sm ${
                      page.isPrivate ? "text-orange-600" : "text-green-600"
                    }`}
                  >
                    {page.isPrivate ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Globe className="h-4 w-4" />
                    )}
                    <span className="font-medium">
                      {page.isPrivate
                        ? "Private - PIN required"
                        : "Public - anyone can join"}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoinPage(page.id, page.isPrivate, page.title);
                  }}
                  className={`w-full text-white ${
                    page.isPrivate
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                  size="sm"
                  disabled={joinPageMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {joinPageMutation.isPending
                    ? "Joining..."
                    : page.isPrivate
                      ? "Join Private Page"
                      : "Join Page"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredPages.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No pages found matching your search criteria.
          </p>
        </div>
      )}

      {/* PIN Modal for Private Pages */}
      <JoinPrivatePageModal
        isOpen={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setSelectedPage(null);
        }}
        onJoin={handleJoinPrivatePage}
        pageTitle={selectedPage?.title || ""}
        isLoading={joinPageMutation.isPending}
      />
    </main>
  );
}
