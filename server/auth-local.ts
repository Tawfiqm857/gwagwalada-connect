import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import type { Request } from "express";
import type { User } from "../drizzle/schema";
import { ENV } from "./_core/env";

export const LOCAL_SESSION_COOKIE = "gwagwalada_session";
const SESSION_TTL = "30d";
const secret = new TextEncoder().encode(ENV.cookieSecret || "gwagwalada-connect-development-secret");

type LocalAccount = Pick<User, "id" | "openId" | "name" | "email" | "role" | "loginMethod" | "createdAt" | "updatedAt" | "lastSignedIn"> & { passwordHash: string };
const fallbackAccounts = new Map<string, LocalAccount>();
let fallbackId = 1000;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, expectedHex] = storedHash.split(":");
  if (!salt || !expectedHex) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function createLocalSession(user: User) {
  return new SignJWT({
    openId: user.openId,
    name: user.name,
    email: user.email,
    role: user.role,
    loginMethod: user.loginMethod,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(secret);
}

function parseCookies(header: string | undefined) {
  return Object.fromEntries((header ?? "").split(";").map((part) => part.trim().split("=")).filter(([key, value]) => key && value));
}

export async function getLocalSessionUser(req: Request): Promise<User | null> {
  const token = parseCookies(req.headers.cookie)[LOCAL_SESSION_COOKIE];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const id = Number(payload.sub);
    if (!Number.isInteger(id)) return null;
    return {
      id,
      openId: String(payload.openId ?? ""),
      name: typeof payload.name === "string" ? payload.name : null,
      email: typeof payload.email === "string" ? payload.email : null,
      loginMethod: typeof payload.loginMethod === "string" ? payload.loginMethod : "password",
      passwordHash: null,
      role: payload.role === "admin" ? "admin" : "user",
      createdAt: new Date(Number(payload.iat ?? Date.now()) * 1000),
      updatedAt: new Date(Number(payload.iat ?? Date.now()) * 1000),
      lastSignedIn: new Date(Number(payload.iat ?? Date.now()) * 1000),
    };
  } catch {
    return null;
  }
}

export function createFallbackAccount(input: { name: string; email: string; passwordHash: string }) {
  const now = new Date();
  const account: LocalAccount = {
    id: fallbackId++,
    openId: `local_${randomUUID().replaceAll("-", "")}`,
    name: input.name,
    email: normalizeEmail(input.email),
    loginMethod: "password",
    role: "user",
    passwordHash: input.passwordHash,
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
  fallbackAccounts.set(account.email ?? "", account);
  return account;
}

export function getFallbackAccount(email: string) {
  return fallbackAccounts.get(normalizeEmail(email));
}

export function publicUser(account: LocalAccount): User {
  const { passwordHash: _passwordHash, ...user } = account;
  return { ...user, passwordHash: null };
}

export function createUserFingerprint(email: string) {
  return createHash("sha256").update(normalizeEmail(email)).digest("hex").slice(0, 12);
}
