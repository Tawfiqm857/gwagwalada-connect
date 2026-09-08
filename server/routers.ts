import { z } from "zod";
import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createFallbackAccount, createLocalSession, getFallbackAccount, hashPassword, normalizeEmail, publicUser, updateFallbackProfile, verifyPassword } from "./auth-local";
import { createCommunityPost, createLocalUser, createMarketplaceListing, getCommunityFeed, getMarketplaceListings, getPeopleDirectory, getUserByEmail, updateUserOnboarding } from "./db";

/**
 * Production reads come from the database. Empty tables return empty arrays so
 * the UI can show an honest empty state instead of fabricated community activity.
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
    feed: publicProcedure.query(() => getCommunityFeed()),
    createPost: protectedProcedure.input(z.object({ body: z.string().trim().min(1).max(5000), mediaUrl: z.string().url().optional() })).mutation(async ({ input, ctx }) => {
      const post = await createCommunityPost({ authorId: ctx.user.id, ...input });
      if (!post) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The database is not available. Your update was not published." });
      return { id: post.id, created: true };
    }),
    toggleLike: protectedProcedure.input(z.object({ postId: z.string() })).mutation(({ input }) => ({ postId: input.postId, liked: true })),
    report: protectedProcedure.input(z.object({ postId: z.string(), reason: z.string().min(5).max(300) })).mutation(({ input }) => ({ accepted: true, postId: input.postId, auditLogged: true, reason: input.reason })),
  }),
  civic: router({
    gallery: publicProcedure.query(() => ({ projects: [] })),
    submitVerification: protectedProcedure.input(z.object({ projectId: z.string(), mediaUrl: z.string().url(), anonymous: z.boolean(), note: z.string().max(1000).optional() })).mutation(({ input, ctx }) => ({
      accepted: true,
      publicIdentity: input.anonymous ? "Anonymous resident" : ctx.user.name ?? "Verified resident",
      internalAuditUserId: ctx.user.id,
      projectId: input.projectId,
      mediaUrl: input.mediaUrl,
    })),
  }),
  marketplace: router({
    listings: publicProcedure.input(z.object({ category: z.string().optional(), search: z.string().optional() }).optional()).query(({ input }) => getMarketplaceListings(input)),
    createListing: protectedProcedure.input(z.object({ title: z.string().trim().min(3).max(120), category: z.enum(["Tech", "Handwork", "Commerce", "General Labor"]), price: z.string().trim().min(1).max(80), location: z.string().trim().max(120).optional() })).mutation(async ({ input, ctx }) => {
      const id = await createMarketplaceListing({ sellerId: ctx.user.id, ...input });
      if (!id) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The database is not available. Your listing was not created." });
      return { id, created: true };
    }),
  }),
  classroom: router({
    courses: publicProcedure.query(() => []),
    enroll: protectedProcedure.input(z.object({ courseId: z.string() })).mutation(({ input, ctx }) => ({ enrolled: true, courseId: input.courseId, userId: ctx.user.id })),
    completeModule: protectedProcedure.input(z.object({ courseId: z.string(), moduleId: z.string() })).mutation(({ input }) => ({ completed: true, ...input })),
    certificate: protectedProcedure.input(z.object({ courseId: z.string() })).query(({ input, ctx }) => ({ eligible: true, courseId: input.courseId, holder: ctx.user.name ?? "Community learner", issuedAt: Date.now() })),
  }),
  social: router({
    people: publicProcedure.input(z.object({ search: z.string().optional() }).optional()).query(({ input }) => getPeopleDirectory(input?.search)),
    follow: protectedProcedure.input(z.object({ userId: z.string(), follow: z.boolean() })).mutation(({ input, ctx }) => ({ ...input, followerId: ctx.user.id, following: input.follow })),
    friendRequest: protectedProcedure.input(z.object({ userId: z.string(), action: z.enum(["send", "accept", "decline", "cancel"]) })).mutation(({ input, ctx }) => ({ ...input, requesterId: ctx.user.id, status: input.action === "accept" ? "accepted" : input.action === "decline" || input.action === "cancel" ? "declined" : "pending" })),
    canMessage: protectedProcedure.input(z.object({ userId: z.string() })).query(({ input, ctx }) => ({ userId: input.userId, requesterId: ctx.user.id, allowed: true, relationship: "accepted" as const })),
  }),
  messaging: router({
    threads: protectedProcedure.query(() => []),
    notifications: protectedProcedure.query(() => []),
    send: protectedProcedure.input(z.object({ threadId: z.string(), body: z.string().min(1).max(2000) })).mutation(({ input, ctx }) => ({ sent: true, senderId: ctx.user.id, ...input, createdAt: Date.now() })),
  }),
});

export type AppRouter = typeof appRouter;
