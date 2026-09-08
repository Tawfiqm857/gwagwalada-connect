import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Compass, MapPin, Sparkles, UserRound } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const areas = ["Gwagwalada Central", "Tudun Wada", "Dagiri", "Zuba", "Ibwa", "Dobi"];
const interestOptions = ["Digital skills", "Local business", "Community projects", "Youth opportunities", "Marketplace", "GEM events", "Civic updates", "Mentoring"];

export default function Onboarding() {
  const { user, loading, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const completeMutation = trpc.auth.completeOnboarding.useMutation();
  const [step, setStep] = useState(1);
  const [area, setArea] = useState(user?.area ?? "");
  const [interests, setInterests] = useState<string[]>([]);
  const [bio, setBio] = useState("");

  if (loading) return <div className="onboarding-guard"><Compass size={28} /><h1>Preparing your profile…</h1><p>Checking your secure community session.</p></div>;
  if (!isAuthenticated) return <div className="onboarding-guard"><Compass size={28} /><h1>Sign in to finish your profile.</h1><p>Your onboarding details help neighbours discover the right people and opportunities.</p><Link href="/auth"><Button>Go to sign in <ArrowRight size={16} /></Button></Link></div>;

  const toggleInterest = (interest: string) => setInterests((current) => current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest]);
  const next = () => {
    if (step === 1 && !area) return toast.error("Choose the area closest to you.");
    if (step === 2 && interests.length === 0) return toast.error("Choose at least one interest.");
    setStep((current) => Math.min(3, current + 1));
  };
  const finish = async () => {
    if (bio.trim().length < 10) return toast.error("Add a short introduction of at least 10 characters.");
    try {
      const result = await completeMutation.mutateAsync({ area, interests, bio });
      utils.auth.me.setData(undefined, result.user);
      toast.success("Your profile is ready. Welcome to the community.");
      window.location.href = "/";
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "We couldn’t save your profile yet.");
    }
  };

  return <div className="onboarding-page"><div className="onboarding-aside"><Link className="auth-brand" href="/"><span className="brand-mark"><Compass size={21} /></span><span><strong>Gwagwalada</strong><em>Connect</em></span></Link><div className="onboarding-aside-copy"><span className="eyebrow light-eyebrow">A better introduction</span><h1>Let your community know what matters to you.</h1><p>Your profile makes it easier for neighbours to find collaborators, mentors, customers, and trusted local voices.</p></div><div className="onboarding-mini-profile"><div className="onboarding-avatar">{user?.name?.slice(0, 2).toUpperCase() ?? "GC"}</div><div><strong>{user?.name ?? "Community member"}</strong><span>New community profile</span></div></div></div><main className="onboarding-card"><div className="onboarding-top"><div><span className="eyebrow">Step {step} of 3</span><div className="onboarding-progress"><i className={step >= 1 ? "done" : ""} /><i className={step >= 2 ? "done" : ""} /><i className={step >= 3 ? "done" : ""} /></div></div><Link className="onboarding-skip" href="/"><ArrowLeft size={13} /> Skip for now</Link></div>{step === 1 && <section className="onboarding-step"><div className="onboarding-step-icon"><MapPin size={20} /></div><h2>Where are you based?</h2><p>Choose the area you know best so we can make local updates and connections more relevant.</p><div className="choice-grid">{areas.map((item) => <button className={`choice-card ${area === item ? "selected" : ""}`} key={item} onClick={() => setArea(item)}>{area === item && <Check size={14} />}<span>{item}</span></button>)}</div></section>}{step === 2 && <section className="onboarding-step"><div className="onboarding-step-icon"><Sparkles size={20} /></div><h2>What brings you here?</h2><p>Pick the topics you want to see more of. You can change these preferences later.</p><div className="interest-grid">{interestOptions.map((item) => <button className={`interest-chip ${interests.includes(item) ? "selected" : ""}`} key={item} onClick={() => toggleInterest(item)}>{interests.includes(item) ? <Check size={14} /> : <Sparkles size={14} />} {item}</button>)}</div><small className="selection-count">{interests.length} selected</small></section>}{step === 3 && <section className="onboarding-step"><div className="onboarding-step-icon"><UserRound size={20} /></div><h2>Tell neighbours a little about you.</h2><p>Write a short introduction. Mention what you do, what you’re learning, or how you want to contribute.</p><textarea className="onboarding-bio" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={500} placeholder="I’m a web developer learning with GEM and I’m happy to help local businesses get online..." /><div className="bio-meta"><span>Keep it friendly and useful.</span><span>{bio.length}/500</span></div></section>}<div className="onboarding-actions">{step > 1 ? <Button variant="outline" onClick={() => setStep((current) => current - 1)}><ArrowLeft size={15} /> Back</Button> : <span />}{step < 3 ? <Button onClick={next}>Continue <ArrowRight size={15} /></Button> : <Button onClick={finish} disabled={completeMutation.isPending}>{completeMutation.isPending ? "Saving…" : "Finish profile"} <Check size={15} /></Button>}</div></main></div>;
}
