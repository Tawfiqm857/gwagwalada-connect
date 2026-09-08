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
  it("serves civic feed data in fallback mode", async () => {
    const caller = appRouter.createCaller(createContext());
    const feed = await caller.community.feed();
    expect(feed.length).toBeGreaterThan(0);
    expect(feed[0]).toHaveProperty("badge");
  });

  it("filters marketplace listings by category and search", async () => {
    const caller = appRouter.createCaller(createContext());
    const listings = await caller.marketplace.listings({ category: "Tech", search: "social" });
    expect(listings).toHaveLength(1);
    expect(listings[0]?.seller).toBe("Naza Digital");
  });

  it("exposes course progress and project verification catalogs", async () => {
    const caller = appRouter.createCaller(createContext());
    const courses = await caller.classroom.courses();
    const gallery = await caller.civic.gallery();
    expect(courses).toHaveLength(3);
    expect(gallery.projects.some((project) => project.percent === 100)).toBe(true);
  });

  it("requires authentication for creating a community post", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.community.createPost({ body: "A safe civic update" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
