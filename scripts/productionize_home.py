from pathlib import Path
import re

path = Path('/home/ubuntu/gwagwalada-connect/client/src/pages/Home.tsx')
source = path.read_text()
source = source.replace('import { useMemo, useState } from "react";', 'import { useEffect, useState } from "react";')
source = source.replace('import { toast } from "sonner";', 'import { toast } from "sonner";\nimport { trpc } from "@/lib/trpc";')
start = source.index('const initialPosts: Post[] = [')
end = source.index('function Avatar', start)
empty_catalogs = '''type Listing = { id: number; title: string; seller: string; category: "Tech" | "Handwork" | "Commerce" | "General Labor"; price: string; rating: string; image?: string; verified: boolean; location?: string };
type Task = { title: string; category: string; budget: string; deadline: string; location: string; posted: string; urgent: boolean };
type Course = { title: string; tag: string; meta: string; progress: number; learners: string; image?: string; color: string };
type Thread = { name: string; initials: string; preview: string; time: string; unread: number; tone: string };
type Person = { id: string; name: string; initials: string; role: string; area: string; bio: string; tone: string; mutuals: number };

const listings: Listing[] = [];
const tasks: Task[] = [];
const courses: Course[] = [];
const threads: Thread[] = [];
const people: Person[] = [];
const notifications: { icon: typeof Heart; title: string; time: string; tone: string }[] = [];
const emptyThread: Thread = { name: "No conversations yet", initials: "GC", preview: "Start a conversation after connecting with someone.", time: "", unread: 0, tone: "sage" };

'''
source = source[:start] + empty_catalogs + source[end:]
source = re.sub(r'\n  const filteredListings = useMemo\(\(\) => listings\.filter\(.*?\n  \}\), \[marketFilter, marketSearch\]\);', '\n  const listingsInput = { category: marketFilter, search: marketSearch };\n  const listingsQuery = trpc.marketplace.listings.useQuery(listingsInput);\n  const filteredListings = listingsQuery.data ?? [];', source, flags=re.S)
source = source.replace('  const [posts, setPosts] = useState(initialPosts);', '  const [posts, setPosts] = useState<Post[]>([]);\n  const feedQuery = trpc.community.feed.useQuery();\n  const createPostMutation = trpc.community.createPost.useMutation();')
source = source.replace('  const [selectedThread, setSelectedThread] = useState(threads[0]);', '  const [selectedThread, setSelectedThread] = useState<Thread>(emptyThread);')
source = source.replace('  const [friendRequests, setFriendRequests] = useState<Record<string, "none" | "pending" | "accepted">>({ "person-2": "pending" });', '  const [friendRequests, setFriendRequests] = useState<Record<string, "none" | "pending" | "accepted">>({});\n\n  useEffect(() => {\n    if (feedQuery.data) {\n      setPosts(feedQuery.data.map((item) => ({\n        id: item.id,\n        author: item.author,\n        initials: item.author.slice(0, 2).toUpperCase(),\n        role: item.role,\n        roleTone: item.role === "GEM Executive" ? "peach" : "sage",\n        time: new Date(item.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }),\n        body: item.body,\n        image: item.mediaUrl ?? undefined,\n        likes: item.likes,\n        comments: item.comments,\n        accent: item.role === "GEM Executive" ? "#e2754f" : "#7d9b76",\n      })));\n    }\n  }, [feedQuery.data]);')
source = source.replace('  const addPost = () => {\n    if (!composer.trim()) return;\n    setPosts((current) => [{ id: Date.now(), author: user?.name ?? "You", initials: "YO", role: "Verified Resident", roleTone: "sage", time: "Just now", body: composer.trim(), likes: 0, comments: 0, accent: "#7d9b76" }, ...current]);\n    setComposer("");\n    setShowComposer(false);\n    toast.success("Your update is live in the community feed.");\n  };', '  const addPost = () => {\n    if (!composer.trim()) return;\n    if (!isAuthenticated) { window.location.href = "/auth"; return; }\n    createPostMutation.mutate({ body: composer.trim() }, {\n      onSuccess: () => {\n        void feedQuery.refetch();\n        setComposer("");\n        setShowComposer(false);\n        toast.success("Your update is live in the community feed.");\n      },\n      onError: (error) => toast.error(error.message),\n    });\n  };')
source = source.replace('HomeView posts={posts}', 'HomeView viewerName={user?.name?.split(" ")[0] ?? "Neighbour"} posts={posts}')
source = source.replace('user?.name ?? "Amina O."', 'user?.name ?? "Community member"')
source = source.replace('user?.name ?? "Amina Okafor"', 'user?.name ?? "Community member"')
source = source.replace('Avatar initials="AO"', 'Avatar initials="GC"')
source = source.replace('Hi Amina! The handmade sandals are ready for pickup. I’m near the Gwagwalada market entrance.<small>10:38</small>', 'No messages yet. Connect with a neighbour to start a conversation.')
source = source.replace('Perfect, thank you. I’ll come by after the classroom session.<small>10:40 · Seen</small>', '')
source = source.replace('The black pair is set aside for you.', '')
source = source.replace('function HomeView({ posts, onLike, onCompose, onView, onToast }', 'function HomeView({ viewerName, posts, onLike, onCompose, onView, onToast }')
source = source.replace('{ posts: Post[];', '{ viewerName: string; posts: Post[];')
source = source.replace('Tuesday, 10 September 2024', '{new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}')
source = source.replace('Good morning, Amina <span>✳</span>', 'Good morning, {viewerName} <span>✳</span>')
path.write_text(source)
