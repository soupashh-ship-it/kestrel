# WebView2 security review: November 1, 2026

The reviewed floor and latest recommendation remain **156.0.4314.42**,
published October 22 (runtime release date October 23). No newer WebView2
Runtime build exists, so the floor is unchanged and this review only renews
the window: review again by November 7 inclusive; CI expires at
2026-11-08T00:00:00Z. The production-release blocker remains cleared (below);
runtime admission is unaffected.

## Vendor evidence

[Microsoft's security release notes](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-relnotes-security)
list Stable security releases 155.0.4283.45 (October 8), 155.0.4283.60
(October 15), 155.0.4283.62 (October 16), 156.0.4314.42 (October 22),
156.0.4314.56 (October 29) and 156.0.4314.58 (October 30), each stating that
it incorporates the latest Chromium security updates, with CVE details to
follow. The page carries no exploited-in-the-wild entry after September 4
(CVE-2026-87491, fixed in Stable 152.0.4191.66) and no notice that Microsoft
is working on a pending fix; the October 6 notice remains absent, so the
production-release blocker stays cleared and every reviewed release postdates
it.

[Stable release notes](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-relnote-stable-channel)
confirm 156.0.4314.58 (October 30) as the newest Edge Stable main release.

The [WebView2 Runtime release notes](https://learn.microsoft.com/en-us/microsoft-edge/webview2/release-notes/)
still name **Runtime 156.0.4314.42 (October 23, 2026)** as the newest stable
Runtime. The October 29 and October 30 Edge servicing releases have no
corresponding Runtime build and no Runtime release-notes entry, so there is no
newer runtime to admit or review and the floor stands. Runtime availability
for 156.0.4314.42 (x86, x64 and ARM64 packages, last updated 10/22/2026) was
independently confirmed in the Microsoft Update Catalog by the October 24
review; that evidence still governs the unchanged floor. If Microsoft publishes
a newer Runtime build, the next review must verify its catalog packages and
raise the floor together with the versions and dates.

The reviewed major remains 156; a 157 runtime keeps the unreviewed-runtime
advisory until it is reviewed. Beta, Dev and Canary remain denied.

## Boundary

This was a vendor-source review only, identical in scope to the October 24
review. It did not reinstall or inventory a Windows machine; 156.0.4314.42
and older runtimes below the floor start with an update-recommended advisory.
Packaged native qualification and a second maintainer's review remain required
before signing a release.
