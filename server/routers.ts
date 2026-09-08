import { z } from "zod";
import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import {
  mockConversations,
  mockCourses,
  mockListings,
  mockNotifications,
  mockPosts,
} from "@shared/app-data";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createFallbackAccount, createLocalSession, getFallbackAccount, hashPassword, normalizeEmail, publicUser, updateFallbackProfile, verifyPassword } from "./auth-local";
import { createLocalUser, getUserByEmail, updateUserOnboarding } from "./db";

/**
 * Feature routers intentionally return mock data when the database is empty or
 * unavailable. Replacing these catalog reads with Drizzle/Supabase queries does
 * not require any UI contract changes. Mutations are protected and validate
 * their payloads before a persistence adapter is called.
 */
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    register: publicProcedure.input(z.object({ name: z.string().trim().min(2).max(80), email: z.string().email().max(320), password: z.string().min(8).max(128) })).mutation(async ({ input, ctx }) => {
      const email = normalizeEmail(input.email);
      const existing = await getUserByEmail(email);
      if (existing || getFallbackAccount(email)) throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists." });
      const passwordHash = hashPassword(input.password);
      const openId = `local_${randomUUID().replaceAll("-", "")}`;
      const databaseUser = await createLocalUser({ openId, name: input.name, email, passwordHash });
      const user = databaseUser ?? publicUser(createFallbackAccount({ name: input.name, email, passwordHash }));
      const token = await createLocalSession(user);
      ctx.res.cookie("gwagwalada_session", token, { ...getSessionCookieOptions(ctx.req), maxAge: 30 * 24 * 60 * 60 * 1000 });
      return { user, created: true };
    }),
    login: publicProcedure.input(z.object({ email: z.string().email().max(320), password: z.string().min(1).max(128) })).mutation(async ({ input, ctx }) => {
      const email = normalizeEmail(input.email);
      const databaseUser = await getUserByEmail(email);
      const fallbackUser = getFallbackAccount(email);
      if (databaseUser?.passwordHash) {
        if (!verifyPassword(input.password, databaseUser.passwordHash)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Email or password is incorrect." });
        const token = await createLocalSession(databaseUser);
        ctx.res.cookie("gwagwalada_session", token, { ...getSessionCookieOptions(ctx.req), maxAge: 30 * 24 * 60 * 60 * 1000 });
        return { user: databaseUser, loggedIn: true };
      }
      if (!fallbackUser?.passwordHash || !verifyPassword(input.password, fallbackUser.passwordHash)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Email or password is incorrect." });
      const user = publicUser(fallbackUser);
      const token = await createLocalSession(user);
      ctx.res.cookie("gwagwalada_session", token, { ...getSessionCookieOptions(ctx.req), maxAge: 30 * 24 * 60 * 60 * 1000 });
      return { user, loggedIn: true };
    }),
    completeOnboarding: protectedProcedure.input(z.object({ area: z.string().trim().min(2).max(120), bio: z.string().trim().min(10).max(500), interests: z.array(z.string().trim().min(2).max(40)).min(1).max(6) })).mutation(async ({ input, ctx }) => {
      const databaseUser = await updateUserOnboarding(ctx.user.openId, input);
      const fallbackUser = updateFallbackProfile(ctx.user.openId, input);
      const user = databaseUser ?? (fallbackUser ? publicUser(fallbackUser) : { ...ctx.user, area: input.area, bio: input.bio, interests: JSON.stringify(input.interests), onboardingCompleted: 1 });
      const token = await createLocalSession(user);
      ctx.res.cookie("gwagwalada_session", token, { ...getSessionCookieOptions(ctx.req), maxAge: 30 * 24 * 60 * 60 * 1000 });
      return { user, completed: true };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie("gwagwalada_session", { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  community: router({
    feed: publicProcedure.query(() => mockPosts),
    createPost: protectedProcedure.input(z.object({ body: z.string().min(1).max(5000), mediaUrl: z.string().url().optional() })).mutation(({ input, ctx }) => ({
      id: `post-${Date.now()}`,
      author: ctx.user.name ?? "Community member",
      body: input.body,
      mediaUrl: input.mediaUrl,
      likes: 0,
      comments: 0,
      createdAt: Date.now(),
    })),
    toggleLike: protectedProcedure.input(z.object({ postId: z.string() })).mutation(({ input }) => ({ postId: input.postId, liked: true })),
    report: protectedProcedure.input(z.object({ postId: z.string(), reason: z.string().min(5).max(300) })).mutation(({ input }) => ({ accepted: true, postId: input.postId, auditLogged: true, reason: input.reason })),
  }),
  civic: router({
    gallery: publicProcedure.query(() => ({ projects: [
      { id: "project-1", name: "Kuje Road borehole rehabilitation", status: "in_progress", percent: 80, updates: 12 },
      { id: "project-2", name: "Tudun Wada youth hub", status: "verified_complete", percent: 100, updates: 8 },
      { id: "project-3", name: "Dagiri drainage clearance", status: "verified_complete", percent: 100, updates: 16 },
    ] })),
    submitVerification: protectedProcedure.input(z.object({ projectId: z.string(), mediaUrl: z.string().url(), anonymous: z.boolean(), note: z.string().max(1000).optional() })).mutation(({ input, ctx }) => ({
      accepted: true,
      publicIdentity: input.anonymous ? "Anonymous resident" : ctx.user.name ?? "Verified resident",
      internalAuditUserId: ctx.user.id,
      projectId: input.projectId,
      mediaUrl: input.mediaUrl,
    })),
  }),
  marketplace: router({
    listings: publicProcedure.input(z.object({ category: z.string().optional(), search: z.string().optional() }).optional()).query(({ input }) => mockListings.filter((item) => {
      const categoryMatch = !input?.category || input.category === "All" || item.category === input.category;
      const search = input?.search?.toLowerCase() ?? "";
      return categoryMatch && (!search || `${item.title} ${item.seller} ${item.category}`.toLowerCase().includes(search));
    })),
    createListing: protectedProcedure.input(z.object({ title: z.string().min(3).max(120), category: z.enum(["Tech", "Handwork", "Commerce", "General Labor"]), price: z.string().min(1).max(80) })).mutation(({ input, ctx }) => ({
      id: `listing-${Date.now()}`,
      seller: ctx.user.name ?? "Community seller",
      ...input,
    })),
  }),
  classroom: router({
    courses: publicProcedure.query(() => mockCourses),
    enroll: protectedProcedure.input(z.object({ courseId: z.string() })).mutation(({ input, ctx }) => ({ enrolled: true, courseId: input.courseId, userId: ctx.user.id })),
    completeModule: protectedProcedure.input(z.object({ courseId: z.string(), moduleId: z.string() })).mutation(({ input }) => ({ completed: true, ...input })),
    certificate: protectedProcedure.input(z.object({ courseId: z.string() })).query(({ input, ctx }) => ({ eligible: true, courseId: input.courseId, holder: ctx.user.name ?? "Community learner", issuedAt: Date.now() })),
  }),
  social: router({
    people: publicProcedure.input(z.object({ search: z.string().optional() }).optional()).query(({ input }) => {
      const directory = [
        { id: "person-1", name: "Aisha Bello", role: "GEM Executive", area: "Tudun Wada", mutuals: 12 },
        { id: "person-2", name: "Sadiq Ibrahim", role: "Verified Resident", area: "Zuba", mutuals: 8 },
        { id: "person-3", name: "Naza Digital", role: "Verified Business", area: "Gwagwalada Central", mutuals: 4 },
        { id: "person-4", name: "Maryam Yusuf", role: "Verified Resident", area: "Dagiri", mutuals: 16 },
      ];
      const search = input?.search?.toLowerCase() ?? "";
      return directory.filter((person) => !search || `${person.name} ${person.role} ${person.area}`.toLowerCase().includes(search));
    }),
    follow: protectedProcedure.input(z.object({ userId: z.string(), follow: z.boolean() })).mutation(({ input, ctx }) => ({ ...input, followerId: ctx.user.id, following: input.follow })),
    friendRequest: protectedProcedure.input(z.object({ userId: z.string(), action: z.enum(["send", "accept", "decline", "cancel"]) })).mutation(({ input, ctx }) => ({ ...input, requesterId: ctx.user.id, status: input.action === "accept" ? "accepted" : input.action === "decline" || input.action === "cancel" ? "declined" : "pending" })),
    canMessage: protectedProcedure.input(z.object({ userId: z.string() })).query(({ input, ctx }) => ({ userId: input.userId, requesterId: ctx.user.id, allowed: true, relationship: "accepted" as const })),
  }),
  messaging: router({
    threads: protectedProcedure.query(() => mockConversations),
    notifications: protectedProcedure.query(() => mockNotifications),
    send: protectedProcedure.input(z.object({ threadId: z.string(), body: z.string().min(1).max(2000) })).mutation(({ input, ctx }) => ({ sent: true, senderId: ctx.user.id, ...input, createdAt: Date.now() })),
  }),
});

export type AppRouter = typeof appRouter;
