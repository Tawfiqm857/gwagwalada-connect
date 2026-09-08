import { describe, expect, it } from "vitest";
import { createFallbackAccount, hashPassword, verifyPassword } from "./auth-local";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { cookie: () => undefined, clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("local account authentication", () => {
  it("hashes passwords and rejects incorrect credentials", () => {
    const stored = hashPassword("correct horse battery staple");
    expect(stored).not.toContain("correct horse");
    expect(verifyPassword("correct horse battery staple", stored)).toBe(true);
    expect(verifyPassword("wrong password", stored)).toBe(false);
  });

  it("logs an existing fallback account in and sets a session cookie", async () => {
    const email = `preview-${Date.now()}@example.com`;
    createFallbackAccount({ name: "Preview Resident", email, passwordHash: hashPassword("community123") });
    const cookies: string[] = [];
    const ctx = createContext();
    ctx.res.cookie = ((name: string, value: string) => cookies.push(`${name}=${value}`)) as TrpcContext["res"]["cookie"];
    const result = await appRouter.createCaller(ctx).auth.login({ email, password: "community123" });
    expect(result.loggedIn).toBe(true);
    expect(result.user.email).toBe(email);
    expect(cookies[0]).toMatch(/^gwagwalada_session=ey/);
  });
});
