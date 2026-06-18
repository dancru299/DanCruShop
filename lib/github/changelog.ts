/**
 * Server-side GitHub changelog loader for product detail pages.
 *
 * Reads `GITHUB_PAT` (a fine-grained Personal Access Token with read-only
 * Contents + Metadata on the target repos) from server env only — it must
 * never be exposed with a NEXT_PUBLIC_ prefix or imported into a client
 * component. Responses are cached for 1 hour via the Next.js Data Cache so we
 * stay far under GitHub's authenticated rate limit (5000 req/hour).
 *
 * Only commits that follow Conventional Commits are returned, which doubles as
 * a privacy filter: internal/WIP commit messages are hidden from the public
 * storefront.
 */

export type ChangelogCategory = "feature" | "fix" | "docs" | "optimization";

export type ChangelogEntry = {
  sha: string;
  shortSha: string;
  category: ChangelogCategory;
  scope: string | null;
  subject: string;
  url: string;
  date: string;
  author: {
    name: string;
    login: string | null;
    avatarUrl: string | null;
    profileUrl: string | null;
  };
};

type GithubCommit = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name: string; date: string } | null;
  };
  author: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
};

const CONVENTIONAL_RE =
  /^(feat|fix|docs|refactor|perf)(?:\(([^)]+)\))?!?:\s*(.+)$/i;

const TYPE_TO_CATEGORY: Record<string, ChangelogCategory> = {
  feat: "feature",
  fix: "fix",
  docs: "docs",
  refactor: "optimization",
  perf: "optimization",
};

/**
 * Accepts "owner/repo", "owner/repo.git", or a full GitHub URL and returns the
 * normalized "owner/repo", or null if it can't be parsed.
 */
export function parseGithubRepo(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/\.git$/i, "")
    .match(/^([\w.-]+)\/([\w.-]+)/);

  if (!match) {
    return null;
  }

  return `${match[1]}/${match[2]}`;
}

export type GithubRepoCheckResult =
  | {
      ok: true;
      repo: string;
      authenticated: boolean;
      conventionalCount: number;
      totalFetched: number;
    }
  | { ok: false; message: string };

/**
 * Verifies a repo is reachable with the current credentials, for the admin
 * "Check connection" button. Bypasses the cache so the result is live.
 */
export async function checkGithubRepoConnection(
  repoInput: string
): Promise<GithubRepoCheckResult> {
  const repo = parseGithubRepo(repoInput);
  if (!repo) {
    return {
      ok: false,
      message: "Định dạng repo không hợp lệ. Dùng owner/repo hoặc URL GitHub.",
    };
  }

  const token = process.env.GITHUB_PAT?.trim();
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/commits?per_page=20`,
      { headers, cache: "no-store" }
    );

    if (res.status === 401) {
      return { ok: false, message: "GITHUB_PAT không hợp lệ hoặc đã hết hạn." };
    }
    if (res.status === 404) {
      return {
        ok: false,
        message: token
          ? "Không tìm thấy repo, hoặc PAT không được cấp quyền truy cập repo này."
          : "Không tìm thấy repo. Nếu là repo private, cần cấu hình GITHUB_PAT trên server.",
      };
    }
    if (res.status === 403) {
      return {
        ok: false,
        message: "Bị GitHub giới hạn tần suất (rate limit) hoặc PAT thiếu quyền.",
      };
    }
    if (!res.ok) {
      return { ok: false, message: `GitHub trả về lỗi ${res.status}.` };
    }

    const commits = (await res.json()) as GithubCommit[];
    if (!Array.isArray(commits)) {
      return { ok: false, message: "Phản hồi từ GitHub không hợp lệ." };
    }

    const conventionalCount = commits.filter((commit) => {
      const firstLine = commit.commit?.message?.split(/\r?\n/, 1)[0] ?? "";
      const match = firstLine.match(CONVENTIONAL_RE);
      return match ? Boolean(TYPE_TO_CATEGORY[match[1].toLowerCase()]) : false;
    }).length;

    return {
      ok: true,
      repo,
      authenticated: Boolean(token),
      conventionalCount,
      totalFetched: commits.length,
    };
  } catch {
    return { ok: false, message: "Không kết nối được tới GitHub API." };
  }
}

export async function getProductChangelog(
  repoInput: string,
  limit = 8
): Promise<ChangelogEntry[]> {
  const repo = parseGithubRepo(repoInput);
  if (!repo) {
    return [];
  }

  const token = process.env.GITHUB_PAT?.trim();
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/commits?per_page=30`,
      {
        headers,
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      console.warn(
        `[changelog] GitHub API ${res.status} for ${repo}: ${res.statusText}`
      );
      return [];
    }

    const commits = (await res.json()) as GithubCommit[];
    if (!Array.isArray(commits)) {
      return [];
    }

    const entries: ChangelogEntry[] = [];

    for (const commit of commits) {
      const firstLine = commit.commit?.message?.split(/\r?\n/, 1)[0] ?? "";
      const match = firstLine.match(CONVENTIONAL_RE);
      if (!match) {
        continue;
      }

      const category = TYPE_TO_CATEGORY[match[1].toLowerCase()];
      if (!category) {
        continue;
      }

      entries.push({
        sha: commit.sha,
        shortSha: commit.sha.slice(0, 7),
        category,
        scope: match[2] ?? null,
        subject: match[3].trim(),
        url: commit.html_url,
        date: commit.commit?.author?.date ?? "",
        author: {
          name: commit.commit?.author?.name ?? "Unknown",
          login: commit.author?.login ?? null,
          avatarUrl: commit.author?.avatar_url ?? null,
          profileUrl: commit.author?.html_url ?? null,
        },
      });

      if (entries.length >= limit) {
        break;
      }
    }

    return entries;
  } catch (error) {
    console.warn(`[changelog] Failed to load commits for ${repo}:`, error);
    return [];
  }
}
