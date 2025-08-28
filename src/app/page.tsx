"use client";

import { Users, Calendar, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useModal } from "@/contexts/ModalContext";
import { useEffect, useState } from "react";
import { fetchPages, type PageData } from "@/lib/mockApi";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { openModal } = useModal();
  const router = useRouter();
  const [pages, setPages] = useState<PageData[]>([]);
  const [loading, setLoading] = useState(true);

  const handleCreatePageClick = () => {
    openModal("CREATE_PAGE");
  };

  const handlePageClick = (pageId: string) => {
    router.push(`/page/${pageId}`);
  };

  useEffect(() => {
    const loadPages = async () => {
      try {
        const pagesData = await fetchPages();
        setPages(pagesData);
      } catch (error) {
        console.error("Failed to load pages:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPages();
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-xl">My Pages</CardTitle>
              <CardDescription>Manage your event pages</CardDescription>
            </div>
            <Button size="sm" className="gap-2" onClick={handleCreatePageClick}>
              <Plus className="h-4 w-4" />
              Create Page
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-500">Loading pages...</span>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <Card className="border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-xl">My Pages</CardTitle>
            <CardDescription>Manage your event pages</CardDescription>
          </div>
          <Button size="sm" className="gap-2" onClick={handleCreatePageClick}>
            <Plus className="h-4 w-4" />
            Create Page
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {pages.map((page) => (
              <Card
                key={page.id}
                className="hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => handlePageClick(page.id)}
              >
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between gap-2">
                    {page.title}{" "}
                    <span
                      className={
                        page.role === "admin"
                          ? "inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700"
                          : "inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                      }
                    >
                      {page.role}
                    </span>
                  </CardTitle>
                  <CardDescription>{page.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{page.members} members</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{page.events} events</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
