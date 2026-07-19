export interface ReleaseArtifactUrls {
  readonly liveUrl: string;
  readonly videoUrl: string;
}

export interface VerifiedReleaseArtifacts {
  readonly liveUrl: string;
  readonly videoUrl: string;
  readonly liveStatus: number;
  readonly videoStatus: number;
}

export type ArtifactFetcher = (input: string, init?: RequestInit) => Promise<Response>;

const PLACEHOLDER_HOSTS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "your-live-url.com",
  "your-video-url.com",
]);
const VIDEO_PAGE_HOSTS = [
  "youtube.com",
  "youtu.be",
  "vimeo.com",
  "loom.com",
  "streamable.com",
] as const;

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return false;

  return (
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
}

function normalizePublicUrl(rawUrl: string, label: string): URL {
  if (rawUrl.trim().length === 0) {
    throw new Error(`${label} URL is required.`);
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error(`${label} URL must be a valid absolute URL.`);
  }

  const hostname = url.hostname.toLowerCase();
  const looksPlaceholder =
    PLACEHOLDER_HOSTS.has(hostname) ||
    hostname.startsWith("your-") ||
    rawUrl.toLowerCase().includes("placeholder");
  const isLocal =
    hostname === "localhost" ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    hostname.endsWith(".local") ||
    isPrivateIpv4(hostname);

  if (url.protocol !== "https:") {
    throw new Error(`${label} URL must use HTTPS.`);
  }
  if (looksPlaceholder) {
    throw new Error(`${label} URL must not be a placeholder.`);
  }
  if (isLocal) {
    throw new Error(`${label} URL must be publicly reachable, not local or private.`);
  }

  url.hash = "";
  return url;
}

function hostMatches(hostname: string, expected: string): boolean {
  return hostname === expected || hostname.endsWith(`.${expected}`);
}

async function fetchArtifact(
  url: URL,
  label: string,
  fetcher: ArtifactFetcher,
): Promise<Response> {
  let response: Response;
  try {
    response = await fetcher(url.toString(), {
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
      headers: { "user-agent": "Switchboard-release-verifier/1.0" },
    });
  } catch (error) {
    const detail = error instanceof Error ? `: ${error.message}` : "";
    throw new Error(`${label} URL could not be reached${detail}`);
  }

  if (!response.ok) {
    throw new Error(`${label} URL returned HTTP ${response.status}.`);
  }
  return response;
}

export async function verifyReleaseArtifacts(
  input: ReleaseArtifactUrls,
  fetcher: ArtifactFetcher = fetch,
): Promise<VerifiedReleaseArtifacts> {
  const liveUrl = normalizePublicUrl(input.liveUrl, "Live application");
  const videoUrl = normalizePublicUrl(input.videoUrl, "Demo video");

  if (liveUrl.toString() === videoUrl.toString()) {
    throw new Error("Live application and demo video URLs must be different.");
  }

  const liveResponse = await fetchArtifact(liveUrl, "Live application", fetcher);
  const liveContentType = liveResponse.headers.get("content-type")?.toLowerCase() ?? "";
  if (!liveContentType.includes("text/html")) {
    throw new Error("Live application URL must return HTML.");
  }
  const liveHtml = await liveResponse.text();
  if (!/switchboard/i.test(liveHtml)) {
    throw new Error("Live application HTML does not identify Switchboard.");
  }

  const videoResponse = await fetchArtifact(videoUrl, "Demo video", fetcher);
  const videoContentType = videoResponse.headers.get("content-type")?.toLowerCase() ?? "";
  const isKnownVideoPage = VIDEO_PAGE_HOSTS.some((host) => hostMatches(videoUrl.hostname, host));
  const isVideoContent = videoContentType.startsWith("video/");
  const isReachableVideoPage = isKnownVideoPage && videoContentType.includes("text/html");

  if (!isVideoContent && !isReachableVideoPage) {
    throw new Error(
      "Demo video URL must return video content or a supported public video page " +
        `(${VIDEO_PAGE_HOSTS.join(", ")}).`,
    );
  }

  return {
    liveUrl: liveUrl.toString(),
    videoUrl: videoUrl.toString(),
    liveStatus: liveResponse.status,
    videoStatus: videoResponse.status,
  };
}
