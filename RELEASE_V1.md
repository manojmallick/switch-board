# v1.0.0 release gate

Do not change the package version, create a `v1.0.0` tag, push a tag, or publish a GitHub release
until every item below is complete. The v0.7.1 submission candidate remains the truthful version
while public artifacts are pending.

## 1. Automated public-artifact check

Run this with the final public URLs—never placeholders, preview URLs that will expire, or local
addresses:

```bash
pnpm verify:release-artifacts -- \
  --live-url "https://<final-live-domain>" \
  --video-url "https://<final-public-video-url>"
```

The command fails unless both URLs use HTTPS and return successful responses. The live URL must
serve HTML that identifies Switchboard. The video URL must be a reachable YouTube, Vimeo, Loom,
Streamable page or return a direct `video/*` response.

Passing this command proves reachability and basic identity only. Save its terminal output with
the release evidence.

## 2. Required manual verification

- [ ] Open the live URL in a signed-out/private desktop browser.
- [ ] Open the live URL on a phone-sized viewport and confirm the full demo remains usable.
- [ ] Run the judge workday and confirm **6 switches · 2 cold · 74 estimated minutes**.
- [ ] Open the measurement explanation and confirm **73.8 min → 74 min**.
- [ ] Exercise re-entry, priority merge, planner, and closeout fallback paths.
- [ ] Play the public video from beginning to end while signed out.
- [ ] Confirm the video is public/unlisted as intended, audible, no more than three minutes, and
      shows the same live URL and measured result.
- [ ] Confirm the final commit deployed at the live URL matches the intended release commit.

## 3. Tag only after both sections pass

After merging the final evidence update into `main`, use the repository's release workflow to:

1. change the package and visible product version from 0.7.1 to 1.0.0;
2. run `pnpm verify` and the benchmark again;
3. commit the verified release evidence and version change;
4. create annotated tag `v1.0.0` on that exact `main` commit;
5. push the tag and create the GitHub release.

If either public URL changes after verification, restart this gate. A successful local build is
not a substitute for checking the final live application and video.
