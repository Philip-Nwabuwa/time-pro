"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Monitor,
  Briefcase,
  GraduationCap,
  Home,
  Calendar,
  Clock,
  MapPin,
  Settings,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Event {
  id: string;
  category: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  eventCode?: string;
  status: string;
}

const mockEvents: Event[] = [
  {
    id: "1",
    category: "Technology",
    title: "Blockchain for Beginners",
    description:
      "Understanding cryptocurrency, smart contracts, and decentralized applications",
    date: "Tue, Aug 26, 2025",
    time: "18:30:00",
    location: "Innovation Center",
    status: "live",
  },
  {
    id: "2",
    category: "Business",
    title: "Digital Marketing Trends 2025",
    description:
      "Latest strategies in social media, content marketing, and online advertising",
    date: "Wed, Aug 27, 2025",
    time: "09:00:00",
    location: "Marketing Hub",
    status: "live",
  },
  {
    id: "3",
    category: "Education",
    title: "Public Speaking Masterclass",
    description:
      "Develop confidence and skills for effective public speaking and presentations",
    date: "Thu, Aug 28, 2025",
    time: "19:00:00",
    location: "Community Learning Center",
    status: "live",
  },
  {
    id: "4",
    category: "Education",
    title: "Financial Literacy Workshop",
    description:
      "Personal finance, investing basics, and retirement planning for young professionals",
    date: "Fri, Aug 29, 2025",
    time: "18:00:00",
    location: "Library Main Branch",
    status: "live",
  },
  {
    id: "5",
    category: "Community",
    title: "Local Food Festivalfjsdhbuyfbyuhbdyuedyucydsciwhduis",
    description:
      "Celebrate diverse cuisines from local restaurants and food trucks",
    date: "Sat, Aug 30, 2025",
    time: "11:00:00",
    location: "Central Park",
    status: "live",
  },
  {
    id: "6",
    category: "Community",
    title: "Neighborhood Cleanup Drive",
    description:
      "Join neighbors in making our community cleaner and more beautiful",
    date: "Sun, Aug 31, 2025",
    time: "08:00:00",
    location: "Main Street",
    status: "live",
  },
];

export default function DiscoveryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredEvents, setFilteredEvents] = useState(mockEvents);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setFilteredEvents(mockEvents);
    } else {
      const filtered = mockEvents.filter(
        (event) =>
          event.title.toLowerCase().includes(query.toLowerCase()) ||
          event.description.toLowerCase().includes(query.toLowerCase()) ||
          (event.eventCode && event.eventCode.includes(query))
      );
      setFilteredEvents(filtered);
    }
  };

  const handleJoinEvent = (eventId: string) => {
    console.log(`Joining event: ${eventId}`);
    // Add your join event logic here
  };

  const handleBackClick = () => {
    router.push("/");
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-4">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Find or Join an Event
        </h1>
        <p className="text-gray-600 mb-6">
          Search by event name or enter event code (codes start with numbers).
        </p>

        {/* Search Input */}
        <div className="relative max-w-2xl mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search events or enter event code (starts with number)"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        <p className="text-gray-600">Found {filteredEvents.length} events</p>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <Card
            key={event.id}
            className="hover:shadow-lg transition-shadow duration-200"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-lg font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
                  {event.title}
                </h3>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  {event.status}
                </Badge>
              </div>

              <p className="text-gray-600 text-sm leading-relaxed">
                {event.description}
              </p>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{event.location}</span>
                </div>
              </div>

              <Button
                onClick={() => handleJoinEvent(event.id)}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Join Event
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No events found matching your search criteria.
          </p>
        </div>
      )}
    </main>
  );
}
