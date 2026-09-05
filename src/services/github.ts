import type { Repository } from "../domain/profile";
import { z } from "zod";

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

const githubRepositoryResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  html_url: z.string().refine(isHttpsUrl),
  description: z.string().nullable(),
  language: z.string().nullable(),
  topics: z.array(z.string()).optional(),
  fork: z.boolean(),
  archived: z.boolean(),
  stargazers_count: z.number(),
  pushed_at: z.string().nullable(),
});

type GitHubRepositoryResponse = z.infer<typeof githubRepositoryResponseSchema>;

export interface ImportedRepository extends Repository {
  fork: boolean;
  archived: boolean;
  stars: number;
  pushedAt: string | null;
}

const importedRepositorySchema = z
  .object({
    id: z.string().min(1).max(200),
    name: z.string().min(1).max(200),
    url: z.string().refine(isHttpsUrl),
    description: z.string().max(5_000),
    focus: z.string().max(500),
    fork: z.boolean(),
    archived: z.boolean(),
    stars: z.number().finite().nonnegative(),
    pushedAt: z.string().nullable(),
  })
  .strict();

export function parseCachedRepositories(value: unknown): ImportedRepository[] {
  return z.array(importedRepositorySchema).max(300).parse(value);
}

export class GitHubImportError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "GitHubImportError";
  }
}

function mapRepository(repository: GitHubRepositoryResponse): ImportedRepository {
  const focus = [repository.language, ...(repository.topics ?? []).slice(0, 2)]
    .filter(Boolean)
    .join(" · ");
  return {
    id: repository.full_name,
    name: repository.name,
    url: repository.html_url,
    description: repository.description ?? "",
    focus,
    fork: repository.fork,
    archived: repository.archived,
    stars: repository.stargazers_count,
    pushedAt: repository.pushed_at,
  };
}

export async function fetchPublicRepositories(
  username: string,
  signal?: AbortSignal,
): Promise<ImportedRepository[]> {
  const cleanUsername = username.trim();
  if (
    !/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(cleanUsername) ||
    cleanUsername.includes("--")
  ) {
    throw new GitHubImportError("Enter a valid GitHub username.");
  }

  const results: GitHubRepositoryResponse[] = [];
  for (let page = 1; page <= 3; page += 1) {
    let response: Response;
    try {
      response = await fetch(
        `https://api.github.com/users/${encodeURIComponent(cleanUsername)}/repos?type=owner&sort=updated&direction=desc&per_page=100&page=${page}`,
        {
          signal,
          headers: {
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        },
      );
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "name" in error &&
        error.name === "AbortError"
      ) {
        throw error;
      }
      throw new GitHubImportError(
        "GitHub could not be reached. Check your connection or add repositories manually.",
      );
    }
    if (!response.ok) {
      if (response.status === 404) {
        throw new GitHubImportError("That GitHub user was not found.", response.status);
      }
      if (response.status === 403 || response.status === 429) {
        throw new GitHubImportError(
          "GitHub's public request limit was reached. Try again later or add repositories manually.",
          response.status,
        );
      }
      throw new GitHubImportError("GitHub could not load repositories right now.", response.status);
    }
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new GitHubImportError("GitHub returned an unreadable repository response.");
    }
    const parsedItems = z.array(githubRepositoryResponseSchema).safeParse(payload);
    if (!parsedItems.success) {
      throw new GitHubImportError("GitHub returned an unexpected repository response.");
    }
    const pageItems = parsedItems.data;
    results.push(...pageItems);
    if (pageItems.length < 100) break;
  }

  return results
    .map(mapRepository)
    .sort((left, right) => {
      if (right.stars !== left.stars) return right.stars - left.stars;
      const leftName = left.name.toLocaleLowerCase("en-US");
      const rightName = right.name.toLocaleLowerCase("en-US");
      return leftName < rightName ? -1 : leftName > rightName ? 1 : 0;
    });
}
