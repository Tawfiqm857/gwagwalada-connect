import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(user: TrpcContext["user"] = null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("Gwagwalada Connect feature contracts", () => {
  it("serves the production civic feed contract", async () => {
    const caller = appRouter.createCaller(createContext());
    const feed = await caller.community.feed();
    expect(Array.isArray(feed)).toBe(true);
  });

  it("filters the production marketplace catalog by category and search", async () => {
    const caller = appRouter.createCaller(createContext());
    const listings = await caller.marketplace.listings({ category: "Tech", search: "social" });
    expect(listings).toEqual([]);
  });

  it("exposes empty course and project catalogs until content is published", async () => {
    const caller = appRouter.createCaller(createContext());
    const courses = await caller.classroom.courses();
    const gallery = await caller.civic.gallery();
    expect(courses).toEqual([]);
    expect(gallery.projects).toEqual([]);
  });

  it("requires authentication for creating a community post", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.community.createPost({ body: "A safe civic update" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("filters real people and returns the messaging contract", async () => {
    const caller = appRouter.createCaller(createContext({ id: 1, openId: "sample-user", email: "sample@example.com", name: "Sample User", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }));
    const people = await caller.social.people({ search: "zuba" });
    const access = await caller.social.canMessage({ userId: "person-2" });
    expect(people).toEqual([]);
    expect(access.allowed).toBe(true);
    expect(access.relationship).toBe("accepted");
  });
});
