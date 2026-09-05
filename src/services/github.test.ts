import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPublicRepositories, GitHubImportError, parseCachedRepositories } from "./github";

const repository = {
  id: 42,
  name: "profile-studio",
  full_name: "octocat/profile-studio",
  html_url: "https://github.com/octocat/profile-studio",
  description: "A configurable profile generator.",
  language: "TypeScript",
  topics: ["github-profile", "svg", "extra"],
  fork: false,
  archived: false,
  stargazers_count: 12,
  pushed_at: "2026-09-01T12:00:00Z",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GitHub repository import", () => {
  it("maps public repositories without requiring authentication", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([repository]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchPublicRepositories("octocat")).resolves.toEqual([
      {
        id: "octocat/profile-studio",
        name: "profile-studio",
        url: "https://github.com/octocat/profile-studio",
        description: "A configurable profile generator.",
        focus: "TypeScript · github-profile · svg",
        fork: false,
        archived: false,
        stars: 12,
        pushedAt: "2026-09-01T12:00:00Z",
      },
    ]);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/users/octocat/repos?");
  });

  it("rejects invalid usernames before making a request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchPublicRepositories("bad--name")).rejects.toThrow(
      "Enter a valid GitHub username.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [404, "not found"],
    [403, "request limit"],
    [429, "request limit"],
    [500, "could not load"],
  ])("maps HTTP %i to an actionable error", async (status, message) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status })));

    await expect(fetchPublicRepositories("octocat")).rejects.toMatchObject({
      status,
      message: expect.stringContaining(message),
    });
  });

  it("rejects malformed API payloads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify([{ ...repository, html_url: "javascript:alert(1)" }]), {
          status: 200,
        }),
      ),
    );

    await expect(fetchPublicRepositories("octocat")).rejects.toThrow(
      "unexpected repository response",
    );
  });

  it("treats a non-URL API field as an intentional import error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify([{ ...repository, html_url: "not a url" }]), { status: 200 }),
      ),
    );

    await expect(fetchPublicRepositories("octocat")).rejects.toBeInstanceOf(Error);
  });

  it("normalizes offline and unreadable responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("browser-specific message")));
    await expect(fetchPublicRepositories("octocat")).rejects.toEqual(
      expect.objectContaining({
        name: "GitHubImportError",
        message: expect.stringContaining("could not be reached"),
      }),
    );

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("not-json", { status: 200 })),
    );
    await expect(fetchPublicRepositories("octocat")).rejects.toEqual(
      expect.objectContaining({
        name: "GitHubImportError",
        message: expect.stringContaining("unreadable"),
      }),
    );
  });

  it("preserves abort errors", async () => {
    const abortError = new DOMException("Aborted", "AbortError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));

    await expect(fetchPublicRepositories("octocat")).rejects.toBe(abortError);
  });

  it("validates cached repositories before they reach the editor", () => {
    const valid = {
      id: "octocat/profile-studio",
      name: "profile-studio",
      url: "https://github.com/octocat/profile-studio",
      description: "Cached description",
      focus: "TypeScript",
      fork: false,
      archived: false,
      stars: 12,
      pushedAt: null,
    };
    expect(parseCachedRepositories([valid])).toEqual([valid]);
    expect(() => parseCachedRepositories([{ ...valid, url: "not a url" }])).toThrow();
    expect(() => parseCachedRepositories([{ ...valid, missing: true }])).toThrow();
    expect(new GitHubImportError("x").name).toBe("GitHubImportError");
  });
});
