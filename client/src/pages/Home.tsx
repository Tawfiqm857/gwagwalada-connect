import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
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
  WalletCards,
  X,
} from "lucide-react";

type View = "home" | "marketplace" | "classroom" | "gallery" | "messages";

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

const aerialImage = "/manus-storage/gwagwalada-aerial_b65c9364.jpg";
const projectImage = "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=1200&q=80";
const marketImage = "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1000&q=80";
const classroomImage = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80";

const navItems: { id: View; label: string; icon: typeof Compass }[] = [
  { id: "home", label: "Community feed", icon: Newspaper },
  { id: "marketplace", label: "Youth marketplace", icon: Store },
  { id: "classroom", label: "GEM classroom", icon: GraduationCap },
  { id: "gallery", label: "Movement gallery", icon: Camera },
  { id: "messages", label: "Messages", icon: MessageCircle },
];

const initialPosts: Post[] = [
  {
    id: 1,
    author: "Aisha Bello",
    initials: "AB",
    role: "GEM Executive",
    roleTone: "peach",
    time: "18 min ago",
    body: "The Tudun Wada youth hub is now open for evening study sessions. We have 24 new seats, solar backup, and free Wi-Fi from 5–9pm. Tag a young person who should know about it.",
    image: projectImage,
    likes: 128,
    comments: 24,
    accent: "#e2754f",
  },
  {
    id: 2,
    author: "Sadiq Ibrahim",
    initials: "SI",
    role: "Verified Resident",
    roleTone: "sage",
    time: "42 min ago",
    body: "Looking for two people who can help paint a small shop front near Zuba junction this Saturday. ₦12,000 total, materials already on site. Details in the task board.",
    likes: 46,
    comments: 11,
    accent: "#7d9b76",
  },
  {
    id: 3,
    author: "Gwagwalada Area Council",
    initials: "GA",
    role: "Area Council Official",
    roleTone: "blue",
    time: "Yesterday",
    body: "Water project update: the Kuje Road borehole rehabilitation has reached 80%. Residents can follow the verification trail in Movement Gallery and add field photos.",
    image: aerialImage,
    likes: 209,
    comments: 38,
    accent: "#557c9d",
  },
];

const listings = [
  { title: "Handmade leather sandals", seller: "Kareem Crafts", category: "Handwork", price: "₦18,500", rating: "4.9", image: "https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?auto=format&fit=crop&w=700&q=80", verified: true },
  { title: "Social media starter pack", seller: "Naza Digital", category: "Tech", price: "₦25,000", rating: "5.0", image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=700&q=80", verified: true },
  { title: "Fresh garden vegetables", seller: "Bwari Growers", category: "Commerce", price: "From ₦3,000", rating: "4.8", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80", verified: false },
  { title: "Event chairs & canopy", seller: "Umar Rentals", category: "General Labor", price: "₦10,000 / day", rating: "4.7", image: "https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&w=700&q=80", verified: true },
];

const tasks = [
  { title: "Paint the Community Library entrance", category: "General Labor", budget: "₦12,000", deadline: "Sat, 14 Sep", location: "Tudun Wada", posted: "2h ago", urgent: true },
  { title: "Catalogue 80 product photos", category: "Tech", budget: "₦18,000", deadline: "Mon, 16 Sep", location: "Remote / Gwagwalada", posted: "5h ago", urgent: false },
  { title: "Design a flyer for GEM clean-up", category: "Tech", budget: "₦15,000", deadline: "Wed, 18 Sep", location: "Gwagwalada", posted: "Yesterday", urgent: false },
];

const courses = [
  { title: "Web Development Foundations", tag: "POPULAR", meta: "6 modules · 4h 20m", progress: 68, learners: "142 learners", image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80", color: "peach" },
  { title: "Data Annotation & AI Work", tag: "START HERE", meta: "4 modules · 2h 45m", progress: 22, learners: "86 learners", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80", color: "blue" },
  { title: "Digital Marketing for Local Business", tag: "NEW", meta: "5 modules · 3h 10m", progress: 0, learners: "64 learners", image: classroomImage, color: "sage" },
];

const threads = [
  { name: "Kareem Crafts", initials: "KC", preview: "The sandals are ready for pickup.", time: "10:42", unread: 2, tone: "peach" },
  { name: "GEM Skills Team", initials: "GS", preview: "Your quiz result is available.", time: "Yesterday", unread: 0, tone: "blue" },
  { name: "Sadiq Ibrahim", initials: "SI", preview: "Can you share the task details?", time: "Mon", unread: 0, tone: "sage" },
];

type Listing = (typeof listings)[number];
type Course = (typeof courses)[number];
type Thread = (typeof threads)[number];

const notifications = [
  { icon: Heart, title: "Aisha Bello liked your update", time: "8 min ago", tone: "peach" },
  { icon: CheckCircle2, title: "Your project verification was received", time: "1h ago", tone: "sage" },
  { icon: GraduationCap, title: "New lesson unlocked in Web Development", time: "3h ago", tone: "blue" },
];

function Avatar({ initials, tone = "peach", size = "md" }: { initials: string; tone?: string; size?: "sm" | "md" | "lg" }) {
  return <div className={`avatar avatar-${tone} avatar-${size}`}>{initials}</div>;
}

function StatusBadge({ children, tone = "peach", icon: Icon = ShieldCheck }: { children: React.ReactNode; tone?: string; icon?: typeof ShieldCheck }) {
  return <span className={`status-badge status-${tone}`}><Icon size={12} strokeWidth={2.5} />{children}</span>;
}

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [activeView, setActiveView] = useState<View>("home");
  const [posts, setPosts] = useState(initialPosts);
  const [composer, setComposer] = useState("");
  const [marketFilter, setMarketFilter] = useState("All");
  const [marketSearch, setMarketSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [selectedThread, setSelectedThread] = useState(threads[0]);
  const [messageDraft, setMessageDraft] = useState("");
  const [courseProgress, setCourseProgress] = useState<Record<string, number>>({});
  const [courseModal, setCourseModal] = useState<(typeof courses)[number] | null>(null);

  const filteredListings = useMemo(() => listings.filter((item) => {
    const matchesFilter = marketFilter === "All" || item.category === marketFilter;
    const query = marketSearch.toLowerCase();
    return matchesFilter && (!query || `${item.title} ${item.seller} ${item.category}`.toLowerCase().includes(query));
  }), [marketFilter, marketSearch]);

  const handleLike = (id: number) => {
    setPosts((current) => current.map((post) => post.id === id ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 } : post));
  };

  const addPost = () => {
    if (!composer.trim()) return;
    setPosts((current) => [{ id: Date.now(), author: user?.name ?? "You", initials: "YO", role: "Verified Resident", roleTone: "sage", time: "Just now", body: composer.trim(), likes: 0, comments: 0, accent: "#7d9b76" }, ...current]);
    setComposer("");
    setShowComposer(false);
    toast.success("Your update is live in the community feed.");
  };

  const sendMessage = () => {
    if (!messageDraft.trim()) return;
    setMessageDraft("");
    toast.success(`Message sent to ${selectedThread.name}`);
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
            <button className="profile-chip" onClick={() => setActiveView("home")}><Avatar initials={user?.name?.slice(0, 2).toUpperCase() ?? "AO"} tone="peach" size="sm" /><span className="profile-chip-copy"><strong>{user?.name ?? "Amina O."}</strong><small>Resident</small></span><ChevronRight size={15} /></button>
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
          <div className="sidebar-footer"><div className="footer-user"><Avatar initials={user?.name?.slice(0, 2).toUpperCase() ?? "AO"} tone="peach" size="sm" /><div><strong>{user?.name ?? "Amina Okafor"}</strong><small>Gwagwalada, FCT</small></div></div>{isAuthenticated ? <button className="logout-button" onClick={() => logout()} title="Log out"><LogOut size={16} /></button> : <button className="logout-button" onClick={() => startLogin()} title="Sign in"><LogIn size={16} /></button>}</div>
        </aside>

        <main className="main-content">
          {activeView === "home" && <HomeView posts={posts} onLike={handleLike} onCompose={() => setShowComposer(true)} onView={(view) => setActiveView(view)} onToast={(message) => toast.info(message)} />}
          {activeView === "marketplace" && <MarketplaceView filter={marketFilter} setFilter={setMarketFilter} search={marketSearch} setSearch={setMarketSearch} listings={filteredListings} onToast={(message) => toast.info(message)} />}
          {activeView === "classroom" && <ClassroomView courses={courses} courseProgress={courseProgress} onStart={startCourse} onToast={(message) => toast.info(message)} />}
          {activeView === "gallery" && <GalleryView onToast={(message) => toast.info(message)} />}
          {activeView === "messages" && <MessagesView selected={selectedThread} setSelected={setSelectedThread} draft={messageDraft} setDraft={setMessageDraft} onSend={sendMessage} />}
        </main>
      </div>

      <nav className="mobile-bottom-nav">{navItems.slice(0, 5).map(({ id, label, icon: Icon }) => <button className={activeView === id ? "active" : ""} key={id} onClick={() => setActiveView(id)}><Icon size={19} /><span>{label.split(" ")[0]}</span>{id === "messages" && <i />}</button>)}</nav>

      {showComposer && <div className="modal-backdrop" onClick={() => setShowComposer(false)}><div className="composer-modal" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><span className="eyebrow">Community feed</span><h2>Share an update</h2></div><button className="icon-button" onClick={() => setShowComposer(false)}><X size={19} /></button></div><div className="composer-author"><Avatar initials={user?.name?.slice(0, 2).toUpperCase() ?? "AO"} tone="peach" /><div><strong>{user?.name ?? "Amina Okafor"}</strong><span>Posting to Gwagwalada Connect · <ShieldCheck size={12} /> Verified Resident</span></div></div><Textarea value={composer} onChange={(event) => setComposer(event.target.value)} placeholder="What is happening in your corner of Gwagwalada?" autoFocus /><div className="composer-tools"><button onClick={() => toast.info("Image picker is ready for Supabase Storage wiring.")}><Camera size={17} /> Add photo</button><button onClick={() => toast.info("Project verification posts include private admin audit logging.")}><Flag size={17} /> Verify a project</button><Button onClick={addPost} disabled={!composer.trim()}>Publish update <ArrowRight size={15} /></Button></div></div></div>}
      {courseModal && <div className="modal-backdrop" onClick={() => setCourseModal(null)}><div className="course-modal" onClick={(event) => event.stopPropagation()}><div className="course-cover" style={{ backgroundImage: `linear-gradient(90deg, rgba(24,31,29,.8), rgba(24,31,29,.1)), url(${courseModal.image})` }}><button className="icon-button light" onClick={() => setCourseModal(null)}><X size={18} /></button><div><span className="course-tag">{courseModal.tag}</span><h2>{courseModal.title}</h2><p>{courseModal.meta} · Self-paced</p></div></div><div className="course-modal-body"><div className="course-learning-grid"><div><span className="eyebrow">Your next lesson</span><h3>Build your first responsive landing page</h3><p>Continue learning with a guided exercise and receive feedback from the GEM mentor team.</p></div><Button onClick={() => { setCourseProgress((current) => ({ ...current, [courseModal.title]: 42 })); toast.success("Lesson marked complete"); }}>Continue lesson <Play size={15} /></Button></div><div className="module-list"><div className="module-row done"><Check size={15} /><span>Welcome & tools setup</span><small>Complete</small></div><div className="module-row current"><Play size={15} /><span>Responsive layout basics</span><small>12 min</small></div><div className="module-row"><LockKeyhole size={15} /><span>Build a local business page</span><small>Locked</small></div></div><div className="certificate-note"><ShieldCheck size={18} /><span>Complete all modules to unlock your GEM digital skills certificate.</span></div></div></div></div>}
    </div>
  );
}

function HomeView({ posts, onLike, onCompose, onView, onToast }: { posts: Post[]; onLike: (id: number) => void; onCompose: () => void; onView: (view: View) => void; onToast: (message: string) => void }) {
  return <>
    <section className="welcome-row"><div><span className="eyebrow">Tuesday, 10 September 2024</span><h1>Good morning, Amina <span>✳</span></h1><p>Here’s what’s moving through Gwagwalada today.</p></div><div className="welcome-actions"><Button variant="outline" onClick={() => onToast("Project verification workflow is ready to use.")}><ShieldCheck size={16} /> Verify a project</Button><Button onClick={onCompose}><Plus size={17} /> Create post</Button></div></section>
    <section className="signal-grid"><div className="signal-card signal-primary"><div className="signal-top"><div><span className="eyebrow light-eyebrow">Community pulse</span><strong>Good things are moving.</strong></div><span className="signal-icon"><BarChart3 size={18} /></span></div><div className="signal-number">2,418 <small>active residents this week</small></div><div className="signal-chart"><span style={{ height: "32%" }} /><span style={{ height: "48%" }} /><span style={{ height: "39%" }} /><span style={{ height: "64%" }} /><span style={{ height: "53%" }} /><span style={{ height: "78%" }} /><span style={{ height: "69%" }} /><span style={{ height: "92%" }} /></div><div className="signal-foot"><span><i className="green-dot" /> Up 14.6% from last week</span><span>Live</span></div></div><div className="signal-card"><div className="signal-top"><div><span className="eyebrow">GEM projects</span><strong>Visible progress</strong></div><span className="signal-icon sage-icon"><CheckCircle2 size={18} /></span></div><div className="project-progress"><div><strong>12</strong><span>verified this month</span></div><Progress value={72} /><span className="progress-label">72% on track</span></div><button className="card-link" onClick={() => onView("gallery")}>View project trail <ArrowRight size={14} /></button></div><div className="signal-card"><div className="signal-top"><div><span className="eyebrow">Youth opportunities</span><strong>Find your next move</strong></div><span className="signal-icon blue-icon"><BriefcaseBusiness size={18} /></span></div><div className="opportunity-row"><div className="mini-avatars"><Avatar initials="SK" tone="blue" size="sm" /><Avatar initials="MN" tone="sage" size="sm" /><Avatar initials="+18" tone="peach" size="sm" /></div><div><strong>23 new tasks</strong><span>posted by local businesses</span></div></div><button className="card-link" onClick={() => onView("marketplace")}>Explore opportunities <ArrowRight size={14} /></button></div></section>
    <div className="content-grid"><section className="feed-column"><div className="section-heading"><div><span className="eyebrow">From your community</span><h2>Community feed</h2></div><button className="filter-button" onClick={() => onToast("Feed filters are coming soon.")}>Latest <ChevronRight size={15} /></button></div><div className="quick-composer" onClick={onCompose}><Avatar initials="AO" tone="peach" /><div>Share something with the community...</div><button onClick={(event) => { event.stopPropagation(); onCompose(); }}><Plus size={17} /></button></div>{posts.map((post) => <PostCard key={post.id} post={post} onLike={onLike} onToast={onToast} />)}<button className="load-more" onClick={() => onToast("You’re all caught up for now.")}>Load more updates <ArrowRight size={15} /></button></section><aside className="home-rail"><div className="rail-card spotlight-card"><div className="rail-card-header"><div><span className="eyebrow">This week in GEM</span><h3>Small actions.<br /><em>Visible change.</em></h3></div><span className="sparkle-badge"><Sparkles size={16} /></span></div><div className="spotlight-image"><img src={projectImage} alt="GEM volunteers in the community" /><span>Community clean-up · 08 Sep</span></div><p>87 volunteers cleared the drainage route around Dagiri market this weekend.</p><button className="card-link" onClick={() => onToast("Opening the full movement story...")}>Read the story <ArrowRight size={14} /></button></div><div className="rail-card"><div className="rail-card-header"><div><span className="eyebrow">Quick links</span><h3>Make your mark</h3></div><LayoutGrid size={18} className="muted-icon" /></div><div className="quick-links"><button onClick={() => onToast("Project verification form opened.")}><span className="quick-icon peach-icon"><Camera size={16} /></span><span><strong>Verify a project</strong><small>Add field evidence</small></span><ChevronRight size={15} /></button><button onClick={() => onView("classroom")}><span className="quick-icon blue-icon"><BookOpen size={16} /></span><span><strong>Learn a skill</strong><small>GEM digital classroom</small></span><ChevronRight size={15} /></button><button onClick={() => onView("marketplace")}><span className="quick-icon sage-icon"><Store size={16} /></span><span><strong>Support local</strong><small>Shop the marketplace</small></span><ChevronRight size={15} /></button></div></div><div className="rail-note"><div className="note-icon"><Users size={17} /></div><div><strong>Invite your circle</strong><p>Every trusted neighbour makes this space better.</p><button onClick={() => onToast("Invite link copied to clipboard.")}>Copy invite link</button></div></div></aside></div>
  </>;
}

function PostCard({ post, onLike, onToast }: { post: Post; onLike: (id: number) => void; onToast: (message: string) => void }) {
  return <article className="post-card"><div className="post-accent" style={{ background: post.accent }} /><div className="post-head"><Avatar initials={post.initials} tone={post.roleTone} /><div className="post-author"><div><strong>{post.author}</strong><StatusBadge tone={post.roleTone}>{post.role}</StatusBadge></div><span>{post.time} · Gwagwalada</span></div><button className="icon-button ghost"><MoreHorizontal size={18} /></button></div><p className="post-body">{post.body}</p>{post.image && <div className="post-image"><img src={post.image} alt="Community update" /><span className="image-chip"><MapPin size={13} /> Gwagwalada</span></div>}<div className="post-actions"><div><button className={post.liked ? "liked" : ""} onClick={() => onLike(post.id)}><Heart size={17} fill={post.liked ? "currentColor" : "none"} /> {post.likes}</button><button onClick={() => onToast("Comment thread opened.")}><MessageSquare size={17} /> {post.comments}</button><button onClick={() => onToast("Share link copied.")}><Share2 size={17} /> Share</button></div><button onClick={() => onToast("Thanks for helping keep the community safe.")}><Flag size={15} /> Report</button></div></article>;
}

function MarketplaceView({ filter, setFilter, search, setSearch, listings, onToast }: { filter: string; setFilter: (value: string) => void; search: string; setSearch: (value: string) => void; listings: Listing[]; onToast: (message: string) => void }) {
  const filters = ["All", "Tech", "Handwork", "Commerce", "General Labor"];
  return <><section className="page-hero marketplace-hero"><div><span className="eyebrow light-eyebrow">Support local talent</span><h1>Youth marketplace</h1><p>Find something made, grown, or built right here in Gwagwalada.</p></div><div className="hero-stat"><span><Store size={18} /> Active sellers</span><strong>384</strong><small>+28 this month</small></div></section><div className="market-toolbar"><div className="market-search"><Search size={17} /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search goods, services, or sellers" /></div><Button onClick={() => onToast("Listing form opened.")}><Plus size={17} /> List something</Button></div><div className="filter-row">{filters.map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}<span className="filter-result">{listings.length} results</span></div><section className="listing-grid">{listings.map((listing) => <Card className="listing-card" key={listing.title}><div className="listing-image"><img src={listing.image} alt={listing.title} /><span>{listing.category}</span><button onClick={() => onToast("Saved to your items.")}><Heart size={16} /></button></div><div className="listing-copy"><div className="listing-seller"><Avatar initials={listing.seller.slice(0, 2).toUpperCase()} tone={listing.category === "Tech" ? "blue" : "peach"} size="sm" /><span><strong>{listing.seller} {listing.verified && <ShieldCheck size={13} />}</strong><small><MapPin size={12} /> Gwagwalada · ★ {listing.rating}</small></span></div><h3>{listing.title}</h3><div className="listing-foot"><strong>{listing.price}</strong><button onClick={() => onToast(`Opening a chat with ${listing.seller}`)}>Message seller <ArrowRight size={14} /></button></div></div></Card>)}</section><section className="task-board"><div className="section-heading"><div><span className="eyebrow">Get paid for what you can do</span><h2>Task board</h2></div><button className="card-link" onClick={() => onToast("All tasks loaded.")}>View all tasks <ArrowRight size={14} /></button></div><div className="task-list">{tasks.map((task) => <div className="task-row" key={task.title}><div className="task-icon"><BriefcaseBusiness size={18} /></div><div className="task-copy"><div><h3>{task.title}</h3>{task.urgent && <span className="urgent-tag">New</span>}</div><span><MapPin size={13} /> {task.location} · <Clock3 size={13} /> {task.deadline}</span></div><div className="task-meta"><strong>{task.budget}</strong><small>Posted {task.posted}</small></div><button className="outline-small" onClick={() => onToast("Task details opened.")}>View task <ChevronRight size={14} /></button></div>)}</div></section></>;
}

function ClassroomView({ courses, courseProgress, onStart, onToast }: { courses: Course[]; courseProgress: Record<string, number>; onStart: (course: Course) => void; onToast: (message: string) => void }) {
  return <><section className="page-hero classroom-hero"><div><span className="eyebrow light-eyebrow">Learn. Build. Earn.</span><h1>GEM digital classroom</h1><p>Practical skills, taught for the opportunities already growing around you.</p></div><div className="classroom-hero-art"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><GraduationCap size={54} /></div></section><div className="classroom-stat-row"><div><span className="stat-icon peach-icon"><BookOpen size={18} /></span><div><strong>2 / 3</strong><small>courses in progress</small></div></div><div><span className="stat-icon sage-icon"><CheckCircle2 size={18} /></span><div><strong>1</strong><small>certificate earned</small></div></div><div><span className="stat-icon blue-icon"><Clock3 size={18} /></span><div><strong>6.4h</strong><small>learning time</small></div></div><div className="classroom-stat-cta"><Button variant="outline" onClick={() => onToast("Certificate gallery opened.")}><FileText size={16} /> My certificates</Button></div></div><section className="course-section"><div className="section-heading"><div><span className="eyebrow">Keep growing</span><h2>Continue learning</h2></div><button className="filter-button" onClick={() => onToast("Showing your saved courses.")}>My learning <ChevronRight size={15} /></button></div><div className="course-grid">{courses.map((course) => { const progress = courseProgress[course.title] ?? course.progress; return <Card className="course-card" key={course.title}><div className="course-image"><img src={course.image} alt={course.title} /><span className={`course-tag ${course.color}`}>{course.tag}</span><button onClick={() => onStart(course)}><Play size={17} fill="currentColor" /></button></div><div className="course-copy"><h3>{course.title}</h3><p>{course.meta} · {course.learners}</p><div className="course-progress-line"><Progress value={progress} /><span>{progress}%</span></div><button className="course-continue" onClick={() => onStart(course)}>{progress > 0 ? "Continue course" : "Start course"}<ArrowRight size={15} /></button></div></Card>; })}</div></section><section className="learning-banner"><div className="learning-banner-copy"><span className="eyebrow">Designed for Gwagwalada</span><h2>Your skill is a community asset.</h2><p>Complete a course, add your certificate to your profile, and get discovered by local businesses looking for exactly what you can do.</p><Button onClick={() => onToast("Skills assessment coming soon.")}>Take the skills assessment <ArrowRight size={15} /></Button></div><div className="learning-banner-art"><div className="certificate-paper"><ShieldCheck size={20} /><span>GEM</span><strong>Certificate</strong><small>DIGITAL SKILLS</small></div></div></section></>;
}

function GalleryView({ onToast }: { onToast: (message: string) => void }) {
  return <><section className="page-hero gallery-hero"><div><span className="eyebrow light-eyebrow">Proof in the open</span><h1>Movement gallery</h1><p>See what’s happening on the ground. Add your own evidence to the story.</p></div><Button onClick={() => onToast("Project verification form opened.")}><Upload size={16} /> Verify a project</Button></section><section className="verification-banner"><div className="verification-icon"><ShieldCheck size={24} /></div><div><span className="eyebrow">Civic project verification</span><h2>Turn claims into a public trail.</h2><p>Upload a field photo, choose your visibility, and help neighbours see what is completed, what is in progress, and what needs attention.</p></div><div className="verification-stats"><div><strong>38</strong><span>projects tracked</span></div><div><strong>91</strong><span>field updates</span></div><div><strong>14</strong><span>areas covered</span></div></div></section><div className="gallery-grid"><div className="gallery-feature"><img src={aerialImage} alt="Aerial view of Gwagwalada" /><div className="gallery-overlay"><span className="gallery-label">Area overview</span><h2>Gwagwalada, from the ground up.</h2><p>Residents are building a shared record of the places they call home.</p><button onClick={() => onToast("Opening the area story...")}>Explore story <ArrowRight size={15} /></button></div></div>{[projectImage, marketImage, classroomImage].map((image, index) => <div className="gallery-tile" key={image}><img src={image} alt="GEM community initiative" /><div><span>{["Community clean-up", "Local commerce", "Youth learning"][index]}</span><strong>{["87 volunteers · 08 Sep", "Dagiri market · 05 Sep", "Skills lab · 02 Sep"][index]}</strong></div></div>)}</div><section className="project-trail"><div className="section-heading"><div><span className="eyebrow">Open accountability</span><h2>Project trail</h2></div><button className="card-link" onClick={() => onToast("All projects loaded.")}>See all projects <ArrowRight size={14} /></button></div><div className="trail-list">{[{ name: "Kuje Road borehole rehabilitation", area: "Kuje Road", status: "In progress", percent: 80, color: "peach" }, { name: "Tudun Wada youth hub", area: "Tudun Wada", status: "Verified complete", percent: 100, color: "sage" }, { name: "Dagiri drainage clearance", area: "Dagiri", status: "Verified complete", percent: 100, color: "blue" }].map((project) => <div className="trail-row" key={project.name}><div className={`trail-status ${project.color}`}><CheckCircle2 size={17} /></div><div className="trail-copy"><strong>{project.name}</strong><span><MapPin size={12} /> {project.area} · Updated today</span></div><div className="trail-progress"><Progress value={project.percent} /><span>{project.status}</span></div><ChevronRight size={17} className="muted-icon" /></div>)}</div></section></>;
}

function MessagesView({ selected, setSelected, draft, setDraft, onSend }: { selected: Thread; setSelected: (thread: Thread) => void; draft: string; setDraft: (value: string) => void; onSend: () => void }) {
  return <><section className="messages-heading"><div><span className="eyebrow">Stay connected</span><h1>Messages</h1><p>Conversations with people building, buying, and learning around you.</p></div><Button onClick={() => toast.info("New message flow opened.")}><Plus size={17} /> New message</Button></section><section className="messages-shell"><div className="thread-list"><div className="thread-search"><Search size={16} /><input placeholder="Search messages" /></div>{threads.map((thread) => <button className={`thread-item ${selected.name === thread.name ? "active" : ""}`} onClick={() => setSelected(thread)} key={thread.name}><Avatar initials={thread.initials} tone={thread.tone} /><span><strong>{thread.name}</strong><small>{thread.preview}</small></span><em>{thread.time}{thread.unread > 0 && <i>{thread.unread}</i>}</em></button>)}</div><div className="conversation"><div className="conversation-header"><Avatar initials={selected.initials} tone={selected.tone} /><div><strong>{selected.name}</strong><span><i className="green-dot" /> Usually replies within an hour</span></div><button className="icon-button"><MoreHorizontal size={18} /></button></div><div className="conversation-body"><div className="date-divider"><span>Today</span></div><div className="message-bubble received">Hi Amina! The handmade sandals are ready for pickup. I’m near the Gwagwalada market entrance.<small>10:38</small></div><div className="message-bubble sent">Perfect, thank you. I’ll come by after the classroom session.<small>10:40 · Seen</small></div><div className="message-bubble received">The black pair is set aside for you.</div></div><div className="message-composer"><button className="icon-button"><Plus size={18} /></button><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && onSend()} placeholder="Write a message..." /><button className="send-button" onClick={onSend}><Send size={17} /></button></div></div></section></>;
}
