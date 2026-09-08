import { and, desc, eq, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { communityPosts, follows, friendRequests, InsertUser, marketplaceListings, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function createLocalUser(input: { openId: string; name: string; email: string; passwordHash: string }) {
  const db = await getDb();
  if (!db) return undefined;
  await db.insert(users).values({
    openId: input.openId,
    name: input.name,
    email: input.email,
    loginMethod: "password",
    passwordHash: input.passwordHash,
    role: "user",
    lastSignedIn: new Date(),
  });
  return getUserByOpenId(input.openId);
}
export async function updateUserOnboarding(openId: string, input: { area: string; bio: string; interests: string[] }) {
  const db = await getDb();
  if (!db) return undefined;
  await db.update(users).set({
    area: input.area,
    bio: input.bio,
    interests: JSON.stringify(input.interests),
    onboardingCompleted: 1,
    updatedAt: new Date(),
  }).where(eq(users.openId, openId));
  return getUserByOpenId(openId);
}

export async function getCommunityFeed() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    id: communityPosts.id,
    author: users.name,
    role: users.role,
    body: communityPosts.body,
    mediaUrl: communityPosts.mediaUrl,
    likes: communityPosts.likesCount,
    comments: communityPosts.commentsCount,
    createdAt: communityPosts.createdAt,
  }).from(communityPosts).leftJoin(users, eq(communityPosts.authorId, users.id)).orderBy(desc(communityPosts.createdAt)).limit(50);
  return rows.map((row) => ({
    ...row,
    author: row.author ?? "Community member",
    role: row.role === "admin" ? "GEM Executive" : "Resident",
    createdAt: row.createdAt.getTime(),
  }));
}

export async function createCommunityPost(input: { authorId: number; body: string; mediaUrl?: string }) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(communityPosts).values(input);
  const id = Number(result[0].insertId);
  const rows = await db.select().from(communityPosts).where(eq(communityPosts.id, id)).limit(1);
  return rows[0];
}

export async function getMarketplaceListings(input?: { category?: string; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    id: marketplaceListings.id,
    title: marketplaceListings.title,
    seller: users.name,
    category: marketplaceListings.category,
    price: marketplaceListings.price,
    location: marketplaceListings.location,
    image: marketplaceListings.imageUrl,
    verified: marketplaceListings.verified,
  }).from(marketplaceListings).leftJoin(users, eq(marketplaceListings.sellerId, users.id)).orderBy(desc(marketplaceListings.createdAt));
  const search = input?.search?.toLowerCase() ?? "";
  return rows.filter((row) => {
    const categoryMatch = !input?.category || input.category === "All" || row.category === input.category;
    const searchMatch = !search || `${row.title} ${row.seller ?? ""} ${row.category}`.toLowerCase().includes(search);
    return categoryMatch && searchMatch;
  }).map((row) => ({ ...row, seller: row.seller ?? "Community seller", location: row.location ?? "Gwagwalada", image: row.image ?? undefined, verified: Boolean(row.verified), rating: "—" }));
}

export async function createMarketplaceListing(input: { sellerId: number; title: string; category: "Tech" | "Handwork" | "Commerce" | "General Labor"; price: string; location?: string }) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(marketplaceListings).values(input);
  return Number(result[0].insertId);
}

export async function getPeopleDirectory(search?: string, viewerId?: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ id: users.id, name: users.name, role: users.role, area: users.area, bio: users.bio }).from(users).orderBy(desc(users.createdAt)).limit(100);
  const query = search?.toLowerCase() ?? "";
  return rows.filter((row) => row.id !== viewerId && (!query || `${row.name ?? ""} ${row.role} ${row.area ?? ""} ${row.bio ?? ""}`.toLowerCase().includes(query))).map((row) => ({
    id: String(row.id),
    name: row.name ?? "Community member",
    role: row.role === "admin" ? "GEM Executive" : "Resident",
    area: row.area ?? "Gwagwalada",
    bio: row.bio ?? "This community member has not added an introduction yet.",
    mutuals: 0,
  }));
}

export async function getSocialGraph(userId: number) {
  const db = await getDb();
  if (!db) return { followingIds: [] as number[], friendRequests: [] as { userId: number; status: "pending" | "accepted" | "declined"; direction: "incoming" | "outgoing" }[] };
  const [followingRows, requestRows] = await Promise.all([
    db.select({ followingId: follows.followingId }).from(follows).where(eq(follows.followerId, userId)),
    db.select().from(friendRequests).where(or(eq(friendRequests.requesterId, userId), eq(friendRequests.addresseeId, userId))),
  ]);
  return {
    followingIds: followingRows.map((row) => row.followingId),
    friendRequests: requestRows.map((row) => ({
      userId: row.requesterId === userId ? row.addresseeId : row.requesterId,
      status: row.status,
      direction: row.addresseeId === userId ? "incoming" as const : "outgoing" as const,
    })),
  };
}

export async function setFollow(userId: number, targetUserId: number, shouldFollow: boolean) {
  const db = await getDb();
  if (!db) return false;
  if (shouldFollow) {
    await db.insert(follows).values({ followerId: userId, followingId: targetUserId }).onDuplicateKeyUpdate({ set: { followingId: targetUserId } });
  } else {
    await db.delete(follows).where(and(eq(follows.followerId, userId), eq(follows.followingId, targetUserId)));
  }
  return true;
}

export async function updateFriendRequest(userId: number, targetUserId: number, action: "send" | "accept" | "decline" | "cancel") {
  const db = await getDb();
  if (!db) return undefined;
  const outgoing = and(eq(friendRequests.requesterId, userId), eq(friendRequests.addresseeId, targetUserId));
  const incoming = and(eq(friendRequests.requesterId, targetUserId), eq(friendRequests.addresseeId, userId));
  const existing = await db.select().from(friendRequests).where(or(outgoing, incoming)).limit(1);
  const current = existing[0];
  if (action === "send") {
    if (current?.status === "accepted") return "accepted" as const;
    if (current?.status === "pending") return "pending" as const;
    if (current) {
      await db.update(friendRequests).set({ requesterId: userId, addresseeId: targetUserId, status: "pending", updatedAt: new Date() }).where(eq(friendRequests.id, current.id));
    } else {
      await db.insert(friendRequests).values({ requesterId: userId, addresseeId: targetUserId, status: "pending" });
    }
    return "pending" as const;
  }
  if (!current || current.status !== "pending") return current?.status ?? "none" as const;
  const isIncoming = current.addresseeId === userId;
  if (action === "accept" && isIncoming) {
    await db.update(friendRequests).set({ status: "accepted", updatedAt: new Date() }).where(eq(friendRequests.id, current.id));
    return "accepted" as const;
  }
  if ((action === "decline" && isIncoming) || (action === "cancel" && !isIncoming)) {
    await db.update(friendRequests).set({ status: "declined", updatedAt: new Date() }).where(eq(friendRequests.id, current.id));
    return "declined" as const;
  }
  return current.status;
}

// TODO: add feature queries here as your schema grows.
