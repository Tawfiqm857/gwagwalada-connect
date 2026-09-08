import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { communityPosts, InsertUser, marketplaceListings, users } from "../drizzle/schema";
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

export async function getPeopleDirectory(search?: string) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ id: users.id, name: users.name, role: users.role, area: users.area, bio: users.bio }).from(users).orderBy(desc(users.createdAt)).limit(100);
  const query = search?.toLowerCase() ?? "";
  return rows.filter((row) => !query || `${row.name ?? ""} ${row.role} ${row.area ?? ""} ${row.bio ?? ""}`.toLowerCase().includes(query)).map((row) => ({
    id: String(row.id),
    name: row.name ?? "Community member",
    role: row.role === "admin" ? "GEM Executive" : "Resident",
    area: row.area ?? "Gwagwalada",
    bio: row.bio ?? "This community member has not added an introduction yet.",
    mutuals: 0,
  }));
}

// TODO: add feature queries here as your schema grows.
