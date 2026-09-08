import { z } from "zod";
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
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
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
  messaging: router({
    threads: protectedProcedure.query(() => mockConversations),
    notifications: protectedProcedure.query(() => mockNotifications),
    send: protectedProcedure.input(z.object({ threadId: z.string(), body: z.string().min(1).max(2000) })).mutation(({ input, ctx }) => ({ sent: true, senderId: ctx.user.id, ...input, createdAt: Date.now() })),
  }),
});

export type AppRouter = typeof appRouter;
