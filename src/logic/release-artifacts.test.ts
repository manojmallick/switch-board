import assert from "node:assert/strict";
import test from "node:test";

import { verifyReleaseArtifacts, type ArtifactFetcher } from "./release-artifacts";

function response(body: string, contentType: string, status = 200): Response {
  return new Response(body, { status, headers: { "content-type": contentType } });
}

function successfulFetcher(videoContentType = "text/html"): ArtifactFetcher {
  return async (input) =>
    input.includes("switchboard.example.dev")
      ? response("<html><title>Switchboard</title></html>", "text/html; charset=utf-8")
      : response("<html><title>Demo</title></html>", videoContentType);
}

test("verifies a public Switchboard deployment and supported video page", async () => {
  const result = await verifyReleaseArtifacts(
    {
      liveUrl: "https://switchboard.example.dev/",
      videoUrl: "https://www.youtube.com/watch?v=verified-demo",
    },
    successfulFetcher(),
  );

  assert.equal(result.liveStatus, 200);
  assert.equal(result.videoStatus, 200);
});

test("accepts a direct public video response", async () => {
  await assert.doesNotReject(
    verifyReleaseArtifacts(
      {
        liveUrl: "https://switchboard.example.dev/",
        videoUrl: "https://cdn.example.dev/switchboard-demo.mp4",
      },
      successfulFetcher("video/mp4"),
    ),
  );
});

test("fails closed for missing, insecure, local, private, and placeholder URLs", async () => {
  const invalidUrls = [
    "",
    "not-a-url",
    "http://switchboard.example.dev",
    "https://localhost:3000",
    "https://192.168.1.20",
    "https://example.com/placeholder",
  ];

  for (const liveUrl of invalidUrls) {
    await assert.rejects(
      verifyReleaseArtifacts(
        { liveUrl, videoUrl: "https://youtu.be/verified-demo" },
        successfulFetcher(),
      ),
    );
  }
});

test("rejects unreachable, failing, wrong-app, and unsupported-video responses", async () => {
  await assert.rejects(
    verifyReleaseArtifacts(
      {
        liveUrl: "https://switchboard.example.dev",
        videoUrl: "https://youtu.be/verified-demo",
      },
      async () => {
        throw new Error("network down");
      },
    ),
    /could not be reached/,
  );

  await assert.rejects(
    verifyReleaseArtifacts(
      {
        liveUrl: "https://switchboard.example.dev",
        videoUrl: "https://youtu.be/verified-demo",
      },
      async () => response("unavailable", "text/html", 503),
    ),
    /HTTP 503/,
  );

  await assert.rejects(
    verifyReleaseArtifacts(
      {
        liveUrl: "https://switchboard.example.dev",
        videoUrl: "https://youtu.be/verified-demo",
      },
      async (input) =>
        input.includes("switchboard")
          ? response("<html>Another app</html>", "text/html")
          : response("<html>Video</html>", "text/html"),
    ),
    /does not identify Switchboard/,
  );

  await assert.rejects(
    verifyReleaseArtifacts(
      {
        liveUrl: "https://switchboard.example.dev",
        videoUrl: "https://files.example.dev/demo",
      },
      successfulFetcher("application/json"),
    ),
    /supported public video page/,
  );
});
