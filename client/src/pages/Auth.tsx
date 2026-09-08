import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Compass, Eye, EyeOff, LockKeyhole, LogIn, LogOut, Mail, ShieldCheck, UserRound, Users } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "wouter";

type AuthMode = "login" | "register";

export default function Auth() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const utils = trpc.useUtils();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const registerMutation = trpc.auth.register.useMutation();
  const loginMutation = trpc.auth.login.useMutation();
  const submitting = registerMutation.isPending || loginMutation.isPending || loading;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const result = mode === "register"
        ? await registerMutation.mutateAsync({ name, email, password })
        : await loginMutation.mutateAsync({ email, password });
      utils.auth.me.setData(undefined, result.user);
      toast.success(mode === "register" ? "Your Gwagwalada Connect account is ready." : "Welcome back to the community.");
      window.location.href = mode === "register" || !result.user.onboardingCompleted ? "/onboarding" : "/";
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "We couldn’t complete that request.";
      toast.error(message);
    }
  };

  return <div className="auth-page"><div className="auth-art"><div className="auth-orbit orbit-a" /><div className="auth-orbit orbit-b" /><div className="auth-art-copy"><span className="eyebrow light-eyebrow">Gwagwalada Connect</span><h1>Community works better when everyone has a place.</h1><p>Find your people, support local talent, and keep progress visible.</p><div className="auth-trust-list"><span><CheckCircle2 size={15} /> Trusted local profiles</span><span><ShieldCheck size={15} /> Safer community connections</span><span><Users size={15} /> 2,418 active residents</span></div></div></div><main className="auth-card"><Link className="auth-brand" href="/"><span className="brand-mark"><Compass size={21} /></span><span><strong>Gwagwalada</strong><em>Connect</em></span></Link>{isAuthenticated ? <><span className="eyebrow">Your account</span><h2>Welcome back, {user?.name?.split(" ")[0] ?? "neighbour"}.</h2><p className="auth-copy">You’re signed in and ready to connect with your community.</p><div className="auth-account"><div className="auth-account-avatar">{user?.name?.slice(0, 2).toUpperCase() ?? "GC"}</div><div><strong>{user?.name ?? "Community member"}</strong><span>{user?.email ?? "Verified Gwagwalada resident"}</span></div><ShieldCheck size={17} /></div><div className="auth-actions"><Link href="/"><Button>Open my community <ArrowRight size={16} /></Button></Link><Button variant="outline" onClick={async () => { await logout(); toast.success("You’ve been signed out safely."); }} disabled={submitting}><LogOut size={16} /> Sign out</Button></div></> : <><div className="auth-heading-row"><div><span className="eyebrow">Welcome to the neighbourhood</span><h2>{mode === "login" ? "Sign in to your community." : "Create your community account."}</h2></div><div className="auth-mode-switch"><button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Sign in</button><button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Create account</button></div></div><p className="auth-copy">{mode === "login" ? "Pick up where you left off with a secure account for local connections, GEM projects, and marketplace conversations." : "Join residents, builders, businesses, and GEM learners building a stronger Gwagwalada together."}</p><form className="auth-form" onSubmit={submit}>{mode === "register" && <label><span>Your name</span><div className="auth-input"><UserRound size={16} /><input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Amina Okafor" autoComplete="name" required /></div></label>}<label><span>Email address</span><div className="auth-input"><Mail size={16} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></div></label><label><span>Password</span><div className="auth-input"><LockKeyhole size={16} /><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "register" ? "At least 8 characters" : "Your password"} autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={mode === "register" ? 8 : 1} required /><button type="button" className="password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button></div></label>{mode === "register" && <p className="password-hint"><ShieldCheck size={13} /> Use 8 or more characters. Your password is securely hashed before storage.</p>}<Button className="auth-primary" type="submit" disabled={submitting}>{submitting ? "Working…" : mode === "login" ? <><LogIn size={17} /> Sign in <ArrowRight size={15} /></> : <><UserRound size={17} /> Create account <ArrowRight size={15} /></>}</Button></form><div className="auth-divider"><span>or continue with</span></div><Button className="auth-oauth" variant="outline" onClick={() => startLogin()} disabled={submitting}><Compass size={16} /> Continue with secure OAuth</Button><p className="auth-terms">By continuing, you agree to keep Gwagwalada Connect respectful and useful for the community.</p></>}{!isAuthenticated && <Link className="auth-back" href="/"><ArrowRight size={14} /> Continue as a visitor</Link>}</main></div>;
}
