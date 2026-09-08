import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Compass,
  FileText,
  Flag,
  GraduationCap,
  Heart,
  LayoutGrid,
  LockKeyhole,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Newspaper,
  Play,
  Plus,
  Search,
  Send,
  Settings2,
  Share2,
  ShieldCheck,
  Sparkles,
  Store,
  Upload,
  Users,
  UserCheck,
  UserPlus,
  UserRoundSearch,
  WalletCards,
  X,
} from "lucide-react";

type View = "home" | "marketplace" | "classroom" | "gallery" | "messages" | "people";

type Post = {
  id: number;
  author: string;
  initials: string;
  role: string;
  roleTone: string;
  time: string;
  body: string;
  image?: string;
  likes: number;
  comments: number;
  liked?: boolean;
  accent: string;
};

const navItems: { id: View; label: string; icon: typeof Compass }[] = [
  { id: "home", label: "Community feed", icon: Newspaper },
  { id: "marketplace", label: "Youth marketplace", icon: Store },
  { id: "classroom", label: "GEM classroom", icon: GraduationCap },
  { id: "gallery", label: "Movement gallery", icon: Camera },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "people", label: "Find people", icon: UserRoundSearch },
];

type Listing = { id: number; title: string; seller: string; category: "Tech" | "Handwork" | "Commerce" | "General Labor"; price: string; rating: string; image?: string; verified: boolean; location?: string };
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

function Avatar({ initials, tone = "peach", size = "md" }: { initials: string; tone?: string; size?: "sm" | "md" | "lg" }) {
  return <div className={`avatar avatar-${tone} avatar-${size}`}>{initials}</div>;
}

function StatusBadge({ children, tone = "peach", icon: Icon = ShieldCheck }: { children: React.ReactNode; tone?: string; icon?: typeof ShieldCheck }) {
  return <span className={`status-badge status-${tone}`}><Icon size={12} strokeWidth={2.5} />{children}</span>;
}

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [activeView, setActiveView] = useState<View>("home");
  const [posts, setPosts] = useState<Post[]>([]);
  const feedQuery = trpc.community.feed.useQuery();
  const createPostMutation = trpc.community.createPost.useMutation();
  const peopleQuery = trpc.social.people.useQuery();
  const discoveredPeople = useMemo(() => (peopleQuery.data ?? []).map((person) => ({
    ...person,
    initials: person.name.slice(0, 2).toUpperCase(),
    tone: person.role === "GEM Executive" ? "peach" : "sage",
  })), [peopleQuery.data]);
  const [composer, setComposer] = useState("");
  const [marketFilter, setMarketFilter] = useState("All");
  const [marketSearch, setMarketSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [selectedThread, setSelectedThread] = useState<Thread>(emptyThread);
  const [messageDraft, setMessageDraft] = useState("");
  const [courseProgress, setCourseProgress] = useState<Record<string, number>>({});
  const [courseModal, setCourseModal] = useState<(typeof courses)[number] | null>(null);
  const [followedPeople, setFollowedPeople] = useState<string[]>([]);
  const [friendRequests, setFriendRequests] = useState<Record<string, "none" | "pending" | "accepted">>({});

  useEffect(() => {
    if (feedQuery.data) {
      setPosts(feedQuery.data.map((item) => ({
        id: item.id,
        author: item.author,
        initials: item.author.slice(0, 2).toUpperCase(),
        role: item.role,
        roleTone: item.role === "GEM Executive" ? "peach" : "sage",
        time: new Date(item.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }),
        body: item.body,
        image: item.mediaUrl ?? undefined,
        likes: item.likes,
        comments: item.comments,
        accent: item.role === "GEM Executive" ? "#e2754f" : "#7d9b76",
      })));
    }
  }, [feedQuery.data]);

  const listingsInput = useMemo(() => ({ category: marketFilter, search: marketSearch }), [marketFilter, marketSearch]);
  const listingsQuery = trpc.marketplace.listings.useQuery(listingsInput);
  const filteredListings = listingsQuery.data ?? [];

  const handleLike = (id: number) => {
    setPosts((current) => current.map((post) => post.id === id ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 } : post));
  };

  const addPost = () => {
    if (!composer.trim()) return;
    if (!isAuthenticated) { window.location.href = "/auth"; return; }
    createPostMutation.mutate({ body: composer.trim() }, {
      onSuccess: () => {
        void feedQuery.refetch();
        setComposer("");
        setShowComposer(false);
        toast.success("Your update is live in the community feed.");
      },
      onError: (error) => toast.error(error.message),
    });
  };

  const sendMessage = () => {
    if (!messageDraft.trim()) return;
    setMessageDraft("");
    toast.success(`Message sent to ${selectedThread.name}`);
  };
  const toggleFollow = (personId: string, name: string) => {
    setFollowedPeople((current) => current.includes(personId) ? current.filter((id) => id !== personId) : [...current, personId]);
    toast.success(followedPeople.includes(personId) ? `You unfollowed ${name}.` : `You’re now following ${name}.`);
  };
  const updateFriendRequest = (personId: string, next: "pending" | "accepted", name: string) => {
    setFriendRequests((current) => ({ ...current, [personId]: next }));
    toast.success(next === "accepted" ? `${name} is now a connection. You can message each other.` : `Friend request sent to ${name}.`);
  };

  const startCourse = (course: (typeof courses)[number]) => {
    setCourseProgress((current) => ({ ...current, [course.title]: Math.max(current[course.title] ?? course.progress, 12) }));
    setCourseModal(course);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <button className="brand" onClick={() => setActiveView("home")} aria-label="Gwagwalada Connect home">
            <span className="brand-mark"><Compass size={22} strokeWidth={2.5} /></span>
            <span><strong>Gwagwalada</strong><em>Connect</em></span>
          </button>
          <div className="topbar-search"><Search size={17} /><input value={marketSearch} onChange={(event) => setMarketSearch(event.target.value)} placeholder="Search the community..." /><kbd>⌘ K</kbd></div>
          <div className="topbar-actions">
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => setShowNotifications((current) => !current)}><Bell size={19} /><span className="notification-dot" /></button>
            <button className="profile-chip" onClick={() => setActiveView("home")}><Avatar initials={user?.name?.slice(0, 2).toUpperCase() ?? "AO"} tone="peach" size="sm" /><span className="profile-chip-copy"><strong>{user?.name ?? "Community member"}</strong><small>Resident</small></span><ChevronRight size={15} /></button>
            <button className="icon-button mobile-menu" onClick={() => setMobileNav((current) => !current)} aria-label="Open navigation"><Menu size={20} /></button>
          </div>
        </div>
        {showNotifications && <div className="notification-panel"><div className="panel-heading"><div><span className="eyebrow">Your space</span><h3>Notifications</h3></div><button className="text-button" onClick={() => toast.success("All notifications marked as read")}>Mark all read</button></div>{notifications.map(({ icon: Icon, title, time, tone }) => <div className="notification-row" key={title}><span className={`notification-icon ${tone}`}><Icon size={16} /></span><div><strong>{title}</strong><span>{time}</span></div><span className="unread-dot" /></div>)}</div>}
      </header>

      <div className="workspace">
        <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
          <div className="sidebar-section"><span className="sidebar-label">Navigate</span>{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={`sidebar-link ${activeView === id ? "active" : ""}`} onClick={() => { setActiveView(id); setMobileNav(false); }}><Icon size={18} /><span>{label}</span>{id === "messages" && <span className="nav-count">2</span>}</button>)}</div>
          <div className="sidebar-section"><span className="sidebar-label">Your activity</span><button className="sidebar-link" onClick={() => toast.info("Saved items are coming soon.")}><WalletCards size={18} /><span>Saved items</span></button><button className="sidebar-link" onClick={() => toast.info("Your profile editor is coming soon.")}><CircleUserRound size={18} /><span>My profile</span></button><button className="sidebar-link" onClick={() => toast.info("Settings are coming soon.")}><Settings2 size={18} /><span>Settings</span></button></div>
          <div className="sidebar-spacer" />
          <div className="connect-card"><div className="connect-orbit"><Sparkles size={18} /></div><strong>Build a stronger Gwagwalada</strong><p>Share what you know. Support a local builder. Verify what matters.</p><button onClick={() => setShowComposer(true)}>Create a post <ArrowRight size={14} /></button></div>
          <div className="sidebar-footer"><div className="footer-user"><Avatar initials={user?.name?.slice(0, 2).toUpperCase() ?? "AO"} tone="peach" size="sm" /><div><strong>{user?.name ?? "Community member"}</strong><small>Gwagwalada, FCT</small></div></div>{isAuthenticated ? <button className="logout-button" onClick={() => logout()} title="Log out"><LogOut size={16} /></button> : <button className="logout-button" onClick={() => { window.location.href = "/auth"; }} title="Sign in"><LogIn size={16} /></button>}</div>
        </aside>

        <main className="main-content">
          {activeView === "home" && <HomeView viewerName={user?.name?.split(" ")[0] ?? "Neighbour"} posts={posts} onLike={handleLike} onCompose={() => setShowComposer(true)} onView={(view) => setActiveView(view)} onToast={(message) => toast.info(message)} />}
          {activeView === "marketplace" && <MarketplaceView filter={marketFilter} setFilter={setMarketFilter} search={marketSearch} setSearch={setMarketSearch} listings={filteredListings} onToast={(message) => toast.info(message)} />}
          {activeView === "classroom" && <ClassroomView courses={courses} courseProgress={courseProgress} onStart={startCourse} onToast={(message) => toast.info(message)} />}
          {activeView === "gallery" && <GalleryView onToast={(message) => toast.info(message)} />}
          {activeView === "messages" && <MessagesView selected={selectedThread} setSelected={setSelectedThread} draft={messageDraft} setDraft={setMessageDraft} onSend={sendMessage} />}
          {activeView === "people" && <PeopleView people={discoveredPeople} followedPeople={followedPeople} friendRequests={friendRequests} onFollow={toggleFollow} onFriendRequest={updateFriendRequest} onMessage={(person) => { setSelectedThread({ name: person.name, initials: person.initials, preview: "New connection", time: "Now", unread: 0, tone: person.tone }); setActiveView("messages"); }} />}
        </main>
      </div>

      <nav className="mobile-bottom-nav">{navItems.slice(0, 5).map(({ id, label, icon: Icon }) => <button className={activeView === id ? "active" : ""} key={id} onClick={() => setActiveView(id)}><Icon size={19} /><span>{label.split(" ")[0]}</span>{id === "messages" && <i />}</button>)}</nav>

      {showComposer && <div className="modal-backdrop" onClick={() => setShowComposer(false)}><div className="composer-modal" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><span className="eyebrow">Community feed</span><h2>Share an update</h2></div><button className="icon-button" onClick={() => setShowComposer(false)}><X size={19} /></button></div><div className="composer-author"><Avatar initials={user?.name?.slice(0, 2).toUpperCase() ?? "AO"} tone="peach" /><div><strong>{user?.name ?? "Community member"}</strong><span>Posting to Gwagwalada Connect · <ShieldCheck size={12} /> Verified Resident</span></div></div><Textarea value={composer} onChange={(event) => setComposer(event.target.value)} placeholder="What is happening in your corner of Gwagwalada?" autoFocus /><div className="composer-tools"><button onClick={() => toast.info("Image picker is ready for Supabase Storage wiring.")}><Camera size={17} /> Add photo</button><button onClick={() => toast.info("Project verification posts include private admin audit logging.")}><Flag size={17} /> Verify a project</button><Button onClick={addPost} disabled={!composer.trim()}>Publish update <ArrowRight size={15} /></Button></div></div></div>}
      {courseModal && <div className="modal-backdrop" onClick={() => setCourseModal(null)}><div className="course-modal" onClick={(event) => event.stopPropagation()}><div className="course-cover" style={{ backgroundImage: `linear-gradient(90deg, rgba(24,31,29,.8), rgba(24,31,29,.1)), url(${courseModal.image})` }}><button className="icon-button light" onClick={() => setCourseModal(null)}><X size={18} /></button><div><span className="course-tag">{courseModal.tag}</span><h2>{courseModal.title}</h2><p>{courseModal.meta} · Self-paced</p></div></div><div className="course-modal-body"><div className="course-learning-grid"><div><span className="eyebrow">Your next lesson</span><h3>Build your first responsive landing page</h3><p>Continue learning with a guided exercise and receive feedback from the GEM mentor team.</p></div><Button onClick={() => { setCourseProgress((current) => ({ ...current, [courseModal.title]: 42 })); toast.success("Lesson marked complete"); }}>Continue lesson <Play size={15} /></Button></div><div className="module-list"><div className="module-row done"><Check size={15} /><span>Welcome & tools setup</span><small>Complete</small></div><div className="module-row current"><Play size={15} /><span>Responsive layout basics</span><small>12 min</small></div><div className="module-row"><LockKeyhole size={15} /><span>Build a local business page</span><small>Locked</small></div></div><div className="certificate-note"><ShieldCheck size={18} /><span>Complete all modules to unlock your GEM digital skills certificate.</span></div></div></div></div>}
    </div>
  );
}

function HomeView({ viewerName, posts, onLike, onCompose, onView, onToast }: { viewerName: string; posts: Post[]; onLike: (id: number) => void; onCompose: () => void; onView: (view: View) => void; onToast: (message: string) => void }) {
  return <>
    <section className="welcome-row"><div><span className="eyebrow">{new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span><h1>Good morning, {viewerName} <span>✳</span></h1><p>Here’s what’s moving through Gwagwalada today.</p></div><div className="welcome-actions"><Button variant="outline" onClick={() => onView("gallery")}><ShieldCheck size={16} /> Verify a project</Button><Button onClick={onCompose}><Plus size={17} /> Create post</Button></div></section>
    <section className="signal-grid"><div className="signal-card signal-primary"><div className="signal-top"><div><span className="eyebrow light-eyebrow">Community pulse</span><strong>{posts.length ? "Fresh local updates" : "Your community starts here"}</strong></div><span className="signal-icon"><BarChart3 size={18} /></span></div><div className="signal-number">{posts.length} <small>published updates</small></div><div className="signal-foot"><span><i className="green-dot" /> Live database feed</span><span>{posts.length ? "Active" : "Waiting"}</span></div></div><div className="signal-card"><div className="signal-top"><div><span className="eyebrow">GEM projects</span><strong>Visible progress</strong></div><span className="signal-icon sage-icon"><CheckCircle2 size={18} /></span></div><div className="project-progress"><div><strong>0</strong><span>verified projects</span></div><Progress value={0} /><span className="progress-label">No project updates yet</span></div><button className="card-link" onClick={() => onView("gallery")}>Open project trail <ArrowRight size={14} /></button></div><div className="signal-card"><div className="signal-top"><div><span className="eyebrow">Youth opportunities</span><strong>Find your next move</strong></div><span className="signal-icon blue-icon"><BriefcaseBusiness size={18} /></span></div><div className="opportunity-row"><div className="mini-avatars"><Avatar initials="GC" tone="blue" size="sm" /></div><div><strong>Explore local opportunities</strong><span>Published by community members</span></div></div><button className="card-link" onClick={() => onView("marketplace")}>Open marketplace <ArrowRight size={14} /></button></div></section>
    <div className="content-grid"><section className="feed-column"><div className="section-heading"><div><span className="eyebrow">From your community</span><h2>Community feed</h2></div><button className="filter-button" onClick={() => onToast("Feed filters are coming soon.")}>Latest <ChevronRight size={15} /></button></div><div className="quick-composer" onClick={onCompose}><Avatar initials="GC" tone="peach" /><div>Share something with the community...</div><button onClick={(event) => { event.stopPropagation(); onCompose(); }}><Plus size={17} /></button></div>{posts.length ? posts.map((post) => <PostCard key={post.id} post={post} onLike={onLike} onToast={onToast} />) : <div className="empty-state feed-empty"><Newspaper size={24} /><strong>No updates have been published yet.</strong><p>Be the first neighbour to share something useful with Gwagwalada.</p><Button onClick={onCompose}><Plus size={15} /> Create the first post</Button></div>}</section><aside className="home-rail"><div className="rail-card spotlight-card"><div className="rail-card-header"><div><span className="eyebrow">Community spotlight</span><h3>Stories from<br /><em>your neighbourhood.</em></h3></div><span className="sparkle-badge"><Sparkles size={16} /></span></div><div className="empty-state compact-empty"><Camera size={20} /><p>Community stories will appear here once residents publish updates.</p></div></div><div className="rail-card"><div className="rail-card-header"><div><span className="eyebrow">Quick links</span><h3>Make your mark</h3></div><LayoutGrid size={18} className="muted-icon" /></div><div className="quick-links"><button onClick={() => onView("gallery")}><span className="quick-icon peach-icon"><Camera size={16} /></span><span><strong>Verify a project</strong><small>Add field evidence</small></span><ChevronRight size={15} /></button><button onClick={() => onView("classroom")}><span className="quick-icon blue-icon"><BookOpen size={16} /></span><span><strong>Learn a skill</strong><small>GEM digital classroom</small></span><ChevronRight size={15} /></button><button onClick={() => onView("marketplace")}><span className="quick-icon sage-icon"><Store size={16} /></span><span><strong>Support local</strong><small>Shop the marketplace</small></span><ChevronRight size={15} /></button></div></div></aside></div>
  </>;
}
function PostCard({ post, onLike, onToast }: { post: Post; onLike: (id: number) => void; onToast: (message: string) => void }) {
  return <article className="post-card"><div className="post-accent" style={{ background: post.accent }} /><div className="post-head"><Avatar initials={post.initials} tone={post.roleTone} /><div className="post-author"><div><strong>{post.author}</strong><StatusBadge tone={post.roleTone}>{post.role}</StatusBadge></div><span>{post.time} · Gwagwalada</span></div><button className="icon-button ghost"><MoreHorizontal size={18} /></button></div><p className="post-body">{post.body}</p>{post.image && <div className="post-image"><img src={post.image} alt="Community update" /><span className="image-chip"><MapPin size={13} /> Gwagwalada</span></div>}<div className="post-actions"><div><button className={post.liked ? "liked" : ""} onClick={() => onLike(post.id)}><Heart size={17} fill={post.liked ? "currentColor" : "none"} /> {post.likes}</button><button onClick={() => onToast("Comment thread opened.")}><MessageSquare size={17} /> {post.comments}</button><button onClick={() => onToast("Share link copied.")}><Share2 size={17} /> Share</button></div><button onClick={() => onToast("Thanks for helping keep the community safe.")}><Flag size={15} /> Report</button></div></article>;
}

function MarketplaceView({ filter, setFilter, search, setSearch, listings, onToast }: { filter: string; setFilter: (value: string) => void; search: string; setSearch: (value: string) => void; listings: Listing[]; onToast: (message: string) => void }) {
  const filters = ["All", "Tech", "Handwork", "Commerce", "General Labor"];
  return <><section className="page-hero marketplace-hero"><div><span className="eyebrow light-eyebrow">Support local talent</span><h1>Youth marketplace</h1><p>Find something made, grown, or built right here in Gwagwalada.</p></div><div className="hero-stat"><span><Store size={18} /> Published listings</span><strong>{listings.length}</strong><small>Live database results</small></div></section><div className="market-toolbar"><div className="market-search"><Search size={17} /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search goods, services, or sellers" /></div><Button onClick={() => onToast("Listing form opened.")}><Plus size={17} /> List something</Button></div><div className="filter-row">{filters.map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}<span className="filter-result">{listings.length} results</span></div><section className="listing-grid">{listings.length ? listings.map((listing) => <Card className="listing-card" key={listing.id}><div className="listing-image">{listing.image ? <img src={listing.image} alt={listing.title} /> : <div className="listing-image-placeholder"><Store size={26} /><span>No image</span></div>}<span>{listing.category}</span><button onClick={() => onToast("Saved to your items.")}><Heart size={16} /></button></div><div className="listing-copy"><div className="listing-seller"><Avatar initials={listing.seller.slice(0, 2).toUpperCase()} tone={listing.category === "Tech" ? "blue" : "peach"} size="sm" /><span><strong>{listing.seller} {listing.verified && <ShieldCheck size={13} />}</strong><small><MapPin size={12} /> {listing.location ?? "Gwagwalada"} · {listing.rating}</small></span></div><h3>{listing.title}</h3><div className="listing-foot"><strong>{listing.price}</strong><button onClick={() => onToast(`Opening a chat with ${listing.seller}`)}>Message seller <ArrowRight size={14} /></button></div></div></Card>) : <div className="empty-state marketplace-empty"><Store size={25} /><strong>No marketplace listings yet.</strong><p>Publish the first local good or service to start the marketplace.</p><Button onClick={() => onToast("Listing form opened.")}><Plus size={15} /> List something</Button></div>}</section><section className="task-board"><div className="section-heading"><div><span className="eyebrow">Get paid for what you can do</span><h2>Task board</h2></div><button className="card-link" onClick={() => onToast("Task board is empty until a task is published.")}>View all tasks <ArrowRight size={14} /></button></div><div className="empty-state compact-empty"><BriefcaseBusiness size={20} /><p>No community tasks have been published yet.</p></div></section></>;
}
function ClassroomView({ courses, courseProgress, onStart, onToast }: { courses: Course[]; courseProgress: Record<string, number>; onStart: (course: Course) => void; onToast: (message: string) => void }) {
  return <><section className="page-hero classroom-hero"><div><span className="eyebrow light-eyebrow">Learn. Build. Earn.</span><h1>GEM digital classroom</h1><p>Practical skills, taught for the opportunities already growing around you.</p></div><div className="classroom-hero-art"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><GraduationCap size={54} /></div></section><div className="classroom-stat-row"><div><span className="stat-icon peach-icon"><BookOpen size={18} /></span><div><strong>{courses.length}</strong><small>published courses</small></div></div><div><span className="stat-icon sage-icon"><CheckCircle2 size={18} /></span><div><strong>0</strong><small>certificates earned</small></div></div><div><span className="stat-icon blue-icon"><Clock3 size={18} /></span><div><strong>0h</strong><small>learning time</small></div></div><div className="classroom-stat-cta"><Button variant="outline" onClick={() => onToast("Certificates will appear here after you complete a course.")}><FileText size={16} /> My certificates</Button></div></div><section className="course-section"><div className="section-heading"><div><span className="eyebrow">Keep growing</span><h2>Continue learning</h2></div><button className="filter-button" onClick={() => onToast("Showing your published courses.")}>All courses <ChevronRight size={15} /></button></div>{courses.length ? <div className="course-grid">{courses.map((course) => { const progress = courseProgress[course.title] ?? course.progress; return <Card className="course-card" key={course.title}><div className="course-copy"><h3>{course.title}</h3><p>{course.meta} · {course.learners}</p><div className="course-progress-line"><Progress value={progress} /><span>{progress}%</span></div><button className="course-continue" onClick={() => onStart(course)}>{progress > 0 ? "Continue course" : "Start course"}<ArrowRight size={15} /></button></div></Card>; })}</div> : <div className="empty-state"><GraduationCap size={25} /><strong>No courses published yet.</strong><p>GEM learning content will appear here when the classroom catalog is ready.</p></div>}</section><section className="learning-banner"><div className="learning-banner-copy"><span className="eyebrow">Designed for Gwagwalada</span><h2>Your skill is a community asset.</h2><p>Complete a course, add your certificate to your profile, and get discovered by local businesses looking for exactly what you can do.</p><Button onClick={() => onToast("Skills assessment coming soon.")}>Take the skills assessment <ArrowRight size={15} /></Button></div></section></>;
}
function GalleryView({ onToast }: { onToast: (message: string) => void }) {
  return <><section className="page-hero gallery-hero"><div><span className="eyebrow light-eyebrow">Proof in the open</span><h1>Movement gallery</h1><p>See what’s happening on the ground. Add your own evidence to the story.</p></div><Button onClick={() => onToast("Project verification form opened.")}><Upload size={16} /> Verify a project</Button></section><section className="verification-banner"><div className="verification-icon"><ShieldCheck size={24} /></div><div><span className="eyebrow">Civic project verification</span><h2>Turn claims into a public trail.</h2><p>Upload a field photo, choose your visibility, and help neighbours see what is completed, what is in progress, and what needs attention.</p></div><div className="verification-stats"><div><strong>0</strong><span>projects tracked</span></div><div><strong>0</strong><span>field updates</span></div><div><strong>0</strong><span>areas covered</span></div></div></section><div className="gallery-grid"><div className="gallery-feature gallery-empty"><Camera size={30} /><h2>No community media yet.</h2><p>Verified project photos and movement stories will appear here after residents contribute them.</p><Button onClick={() => onToast("Project verification form opened.")}><Upload size={15} /> Add field evidence</Button></div></div><section className="project-trail"><div className="section-heading"><div><span className="eyebrow">Open accountability</span><h2>Project trail</h2></div><button className="card-link" onClick={() => onToast("No projects have been published yet.")}>See all projects <ArrowRight size={14} /></button></div><div className="empty-state compact-empty"><ShieldCheck size={20} /><p>No civic projects have been published for verification yet.</p></div></section></>;
}
function PeopleView({ people, followedPeople, friendRequests, onFollow, onFriendRequest, onMessage }: { people: Person[]; followedPeople: string[]; friendRequests: Record<string, "none" | "pending" | "accepted">; onFollow: (personId: string, name: string) => void; onFriendRequest: (personId: string, next: "pending" | "accepted", name: string) => void; onMessage: (person: Person) => void }) {
  const [query, setQuery] = useState("");
  const filteredPeople = people.filter((person) => `${person.name} ${person.role} ${person.area}`.toLowerCase().includes(query.toLowerCase()));
  return <><section className="people-hero"><div><span className="eyebrow light-eyebrow">Your community, closer</span><h1>Find your people</h1><p>Discover residents, builders, businesses, and GEM leaders you can learn from or work with.</p></div><div className="people-hero-stat"><Users size={20} /><strong>{people.length}</strong><span>published profiles</span></div></section><div className="people-toolbar"><div className="people-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, role, or area" /></div><div className="people-toolbar-note"><UserCheck size={15} /> Mutual connections help keep this space trusted.</div></div><div className="people-section-heading"><div><span className="eyebrow">People worth knowing</span><h2>{filteredPeople.length} local profiles</h2></div><span className="people-request-note"><UserPlus size={14} /> {Object.values(friendRequests).filter((status) => status === "pending").length} requests waiting</span></div>{filteredPeople.length ? <div className="people-grid">{filteredPeople.map((person) => { const requestState = friendRequests[person.id] ?? "none"; const isFollowing = followedPeople.includes(person.id); return <Card className="person-card" key={person.id}><div className="person-card-top"><Avatar initials={person.initials} tone={person.tone} size="lg" /><button className={`follow-quiet ${isFollowing ? "following" : ""}`} onClick={() => onFollow(person.id, person.name)}>{isFollowing ? <Check size={14} /> : <Plus size={14} />} {isFollowing ? "Following" : "Follow"}</button></div><div className="person-card-copy"><h3>{person.name} <ShieldCheck size={14} /></h3><StatusBadge tone={person.tone}>{person.role}</StatusBadge><span className="person-area"><MapPin size={12} /> {person.area}</span><p>{person.bio}</p><small><Users size={12} /> {person.mutuals} mutual connections</small></div><div className="person-card-actions">{requestState === "accepted" ? <Button onClick={() => onMessage(person)}><MessageCircle size={15} /> Message</Button> : requestState === "pending" ? <Button variant="outline" onClick={() => onFriendRequest(person.id, "accepted", person.name)}><UserCheck size={15} /> Accept request</Button> : <Button variant="outline" onClick={() => onFriendRequest(person.id, "pending", person.name)}><UserPlus size={15} /> Add connection</Button>}<button className="icon-button" onClick={() => toast.info(`Opening ${person.name}'s profile.`)}><ChevronRight size={16} /></button></div></Card>; })}</div> : <div className="empty-state"><UserRoundSearch size={25} /><strong>No public profiles yet.</strong><p>New residents will appear here after they complete onboarding.</p></div>}</>;
}
function MessagesView({ selected, setSelected, draft, setDraft, onSend }: { selected: Thread; setSelected: (thread: Thread) => void; draft: string; setDraft: (value: string) => void; onSend: () => void }) {
  return <><section className="messages-heading"><div><span className="eyebrow">Stay connected</span><h1>Messages</h1><p>Conversations with people building, buying, and learning around you.</p></div><Button onClick={() => toast.info("Connect with a community member before starting a message.")}><Plus size={17} /> New message</Button></section><section className="messages-shell"><div className="thread-list"><div className="thread-search"><Search size={16} /><input placeholder="Search messages" /></div>{threads.length ? threads.map((thread) => <button className={`thread-item ${selected.name === thread.name ? "active" : ""}`} onClick={() => setSelected(thread)} key={thread.name}><Avatar initials={thread.initials} tone={thread.tone} /><span><strong>{thread.name}</strong><small>{thread.preview}</small></span><em>{thread.time}{thread.unread > 0 && <i>{thread.unread}</i>}</em></button>) : <div className="empty-state compact-empty"><MessageCircle size={20} /><p>No conversations yet.</p></div>}</div><div className="conversation"><div className="conversation-header"><Avatar initials={selected.initials} tone={selected.tone} /><div><strong>{selected.name}</strong><span><i className="green-dot" /> Direct messages</span></div><button className="icon-button"><MoreHorizontal size={18} /></button></div><div className="conversation-body"><div className="empty-state"><MessageSquare size={25} /><strong>No messages yet.</strong><p>Connect with another community member to start a conversation.</p></div></div><div className="message-composer"><button className="icon-button"><Plus size={18} /></button><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && onSend()} placeholder="Write a message..." /><button className="send-button" onClick={onSend}><Send size={17} /></button></div></div></section></>;
}