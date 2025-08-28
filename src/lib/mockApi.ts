export interface PageData {
  id: string;
  title: string;
  desc: string;
  members: number;
  events: number;
  role: "admin" | "member";
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  status: "upcoming" | "ongoing" | "completed";
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  joinedDate: string;
  avatar?: string;
}

const mockPages: PageData[] = [
  {
    id: "1",
    title: "London Events Hub",
    desc: "Community events in London",
    members: 156,
    events: 8,
    role: "member",
  },
  {
    id: "2",
    title: "Champions Connect",
    desc: "Champions connect",
    members: 89,
    events: 7,
    role: "admin",
  },
  {
    id: "3",
    title: "Tech Innovators",
    desc: "Technology and innovation meetups",
    members: 234,
    events: 4,
    role: "admin",
  },
  {
    id: "4",
    title: "Benjamin ejeh Agbo",
    desc: "Personal event page",
    members: 12,
    events: 0,
    role: "admin",
  },
  {
    id: "5",
    title: "Digital Marketing Masters",
    desc: "Learn the latest digital marketing strategies",
    members: 78,
    events: 7,
    role: "member",
  },
];

const mockEvents: Record<string, Event[]> = {
  "1": [
    {
      id: "e1",
      title: "London Tech Meetup",
      description: "Monthly gathering of tech enthusiasts in London",
      date: "2024-09-15",
      time: "18:00",
      location: "Tech Hub London",
      attendees: 45,
      status: "upcoming",
    },
    {
      id: "e2",
      title: "Startup Pitch Night",
      description: "Entrepreneurs pitch their ideas",
      date: "2024-09-20",
      time: "19:00",
      location: "Innovation Center",
      attendees: 60,
      status: "upcoming",
    },
    {
      id: "e3",
      title: "AI Workshop",
      description: "Hands-on AI development workshop",
      date: "2024-08-25",
      time: "10:00",
      location: "London University",
      attendees: 30,
      status: "completed",
    },
  ],
  "2": [
    {
      id: "e4",
      title: "Champions Networking",
      description: "Connect with industry champions",
      date: "2024-09-18",
      time: "17:30",
      location: "Business District",
      attendees: 25,
      status: "upcoming",
    },
    {
      id: "e5",
      title: "Leadership Summit",
      description: "Annual leadership conference",
      date: "2024-09-30",
      time: "09:00",
      location: "Grand Hotel",
      attendees: 100,
      status: "upcoming",
    },
  ],
  "5": [
    {
      id: "e6",
      title: "SEO Masterclass",
      description: "Advanced SEO techniques and strategies",
      date: "2024-09-12",
      time: "14:00",
      location: "Digital Hub",
      attendees: 35,
      status: "upcoming",
    },
    {
      id: "e7",
      title: "Social Media Marketing",
      description: "Latest trends in social media marketing",
      date: "2024-09-25",
      time: "15:30",
      location: "Marketing Center",
      attendees: 50,
      status: "upcoming",
    },
  ],
};

const mockMembers: Record<string, Member[]> = {
  "1": [
    {
      id: "m1",
      name: "Sarah Johnson",
      email: "sarah@example.com",
      role: "admin",
      joinedDate: "2024-01-15",
    },
    {
      id: "m2",
      name: "Mike Chen",
      email: "mike@example.com",
      role: "member",
      joinedDate: "2024-02-20",
    },
    {
      id: "m3",
      name: "Emily Davis",
      email: "emily@example.com",
      role: "member",
      joinedDate: "2024-03-10",
    },
  ],
  "2": [
    {
      id: "m4",
      name: "John Smith",
      email: "john@example.com",
      role: "admin",
      joinedDate: "2024-01-05",
    },
    {
      id: "m5",
      name: "Lisa Wang",
      email: "lisa@example.com",
      role: "member",
      joinedDate: "2024-02-15",
    },
  ],
  "5": [
    {
      id: "m6",
      name: "David Brown",
      email: "david@example.com",
      role: "admin",
      joinedDate: "2024-01-20",
    },
    {
      id: "m7",
      name: "Anna Wilson",
      email: "anna@example.com",
      role: "member",
      joinedDate: "2024-03-01",
    },
  ],
};

export const fetchPages = (): Promise<PageData[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockPages);
    }, 1000);
  });
};

export const fetchPageById = (id: string): Promise<PageData | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const page = mockPages.find((p) => p.id === id);
      resolve(page || null);
    }, 500);
  });
};

export const fetchEventsByPageId = (pageId: string): Promise<Event[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockEvents[pageId] || []);
    }, 800);
  });
};

export const fetchMembersByPageId = (pageId: string): Promise<Member[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockMembers[pageId] || []);
    }, 600);
  });
};
