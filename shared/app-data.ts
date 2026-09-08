export type VerificationBadge = "Resident" | "Verified Business" | "GEM Executive" | "Area Council Official";

export type CommunityPost = {
  id: string;
  author: string;
  badge: VerificationBadge;
  body: string;
  mediaUrl?: string;
  likes: number;
  comments: number;
  createdAt: number;
};

export type MarketListing = {
  id: string;
  title: string;
  seller: string;
  category: "Tech" | "Handwork" | "Commerce" | "General Labor";
  price: string;
  location: string;
  verified: boolean;
};

export type Course = {
  id: string;
  title: string;
  description: string;
  modules: number;
  duration: string;
  progress: number;
};

export type Conversation = {
  id: string;
  participant: string;
  preview: string;
  unread: number;
  updatedAt: number;
};

export const mockPosts: CommunityPost[] = [
  {
    id: "post-1",
    author: "Aisha Bello",
    badge: "GEM Executive",
    body: "The Tudun Wada youth hub is now open for evening study sessions.",
    likes: 128,
    comments: 24,
    createdAt: Date.now() - 18 * 60 * 1000,
  },
  {
    id: "post-2",
    author: "Sadiq Ibrahim",
    badge: "Resident",
    body: "Looking for two people who can help paint a small shop front near Zuba junction.",
    likes: 46,
    comments: 11,
    createdAt: Date.now() - 42 * 60 * 1000,
  },
  {
    id: "post-3",
    author: "Gwagwalada Area Council",
    badge: "Area Council Official",
    body: "Water project update: the Kuje Road borehole rehabilitation has reached 80%.",
    likes: 209,
    comments: 38,
    createdAt: Date.now() - 24 * 60 * 60 * 1000,
  },
];

export const mockListings: MarketListing[] = [
  { id: "listing-1", title: "Handmade leather sandals", seller: "Kareem Crafts", category: "Handwork", price: "₦18,500", location: "Gwagwalada", verified: true },
  { id: "listing-2", title: "Social media starter pack", seller: "Naza Digital", category: "Tech", price: "₦25,000", location: "Gwagwalada", verified: true },
  { id: "listing-3", title: "Fresh garden vegetables", seller: "Bwari Growers", category: "Commerce", price: "From ₦3,000", location: "Gwagwalada", verified: false },
];

export const mockCourses: Course[] = [
  { id: "course-1", title: "Web Development Foundations", description: "Build your first responsive web experience.", modules: 6, duration: "4h 20m", progress: 68 },
  { id: "course-2", title: "Data Annotation & AI Work", description: "Learn practical workflows for AI data projects.", modules: 4, duration: "2h 45m", progress: 22 },
  { id: "course-3", title: "Digital Marketing for Local Business", description: "Help local brands get discovered and grow.", modules: 5, duration: "3h 10m", progress: 0 },
];

export const mockConversations: Conversation[] = [
  { id: "thread-1", participant: "Kareem Crafts", preview: "The sandals are ready for pickup.", unread: 2, updatedAt: Date.now() - 4 * 60 * 1000 },
  { id: "thread-2", participant: "GEM Skills Team", preview: "Your quiz result is available.", unread: 0, updatedAt: Date.now() - 24 * 60 * 60 * 1000 },
  { id: "thread-3", participant: "Sadiq Ibrahim", preview: "Can you share the task details?", unread: 0, updatedAt: Date.now() - 3 * 24 * 60 * 60 * 1000 },
];

export const mockNotifications = [
  { id: "notification-1", title: "Aisha Bello liked your update", type: "social", createdAt: Date.now() - 8 * 60 * 1000 },
  { id: "notification-2", title: "Your project verification was received", type: "civic", createdAt: Date.now() - 60 * 60 * 1000 },
  { id: "notification-3", title: "New lesson unlocked in Web Development", type: "classroom", createdAt: Date.now() - 3 * 60 * 60 * 1000 },
];
