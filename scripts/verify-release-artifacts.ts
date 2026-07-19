import { verifyReleaseArtifacts } from "../src/logic/release-artifacts";

function readArgument(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing required argument: ${name}`);
  }
  return value;
}

async function main(): Promise<void> {
  const result = await verifyReleaseArtifacts({
    liveUrl: readArgument("--live-url"),
    videoUrl: readArgument("--video-url"),
  });

  console.log("Automated v1.0.0 artifact checks passed.");
  console.log(`Live application: ${result.liveUrl} (HTTP ${result.liveStatus})`);
  console.log(`Demo video: ${result.videoUrl} (HTTP ${result.videoStatus})`);
  console.log("Complete the documented signed-out, mobile, and playback checks before tagging.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Release artifact verification failed.");
  process.exitCode = 1;
});
