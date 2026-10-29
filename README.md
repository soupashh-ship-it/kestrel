<div align="center">
  <img src=".github/assets/logo.png" width="112" height="112" alt="Kestrel" />
  <h1>Kestrel</h1>

  <p><strong>A fast, private browser built on the web engine your system already has.</strong></p>

  <p>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MPL--2.0-blue" alt="License: MPL-2.0" /></a>
    <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows-lightgrey" alt="Platforms: macOS and Windows" />
  </p>
</div>

Kestrel is built from the open-source browser code of
[Zephium](https://github.com/zephium-browser/Zephium). It keeps the browser
experience—WebKit on macOS and WebView2 on Windows—without AI services, agents,
an assistant panel, dictation, or an AI account.

## What it does

- **Blocks ads and trackers natively.** Network blocking, cosmetic hiding and a
  bundled EasyList/EasyPrivacy seed run in the shell, not in a page script.
- **Tabs and Spaces.** Vertical or horizontal tabs, tab groups, split view,
  private windows and multiple profiles.
- **Runs Chrome extensions** from the Chrome Web Store.
- **Notes, Tasks and Time** live beside the page in the sidebar.
- **History, downloads, bookmarks, reading list and site search** work as you
  expect, with import from other browsers.
- **Nothing phones home.** No telemetry, no analytics, no account. Automatic
  updates stay off until Kestrel has its own release channel; see
  [Updates](#updates).

## No AI services

Kestrel does not include the hosted AI account, assistant, Work canvas, voice
input, or model-provider integrations:

| Removed | Detail |
| --- | --- |
| Work | The agent canvas, run composition, retained browser resources and native work probes |
| Agents | `zephium-agentic`, the controller, runtime, provider transport, model catalog and decision crates |
| Ask | The sidebar assistant, page assist, page reader and semantic/CDP action runtime |
| Voice | Dictation and speech recognition |
| Account | Hosted AI sign-in, credits, billing and the account service |
| Evaluation | Agentic eval fixtures, qualification scripts, probe binaries and their docs |

A few retired Cargo feature names remain declared but empty so historical
`cfg` sites resolve to `false`; no agent code or dependency is compiled into the
default build. All user-facing AI commands, preferences and keyboard entries are
gone.

## Requirements

- Rust with the pinned toolchain in `rust-toolchain.toml`
- Node.js 24.18 (`.node-version`)
- pnpm 11.17 (`corepack enable`)
- macOS 14+ (Apple Silicon) or Windows 10/11 with WebView2
- macOS only: Xcode command-line tools

## Build and run

```sh
pnpm install
pnpm dev          # desktop app with the frame dev server
pnpm build        # frame production build
pnpm -C frame test
```

For a signed installer, see [.github/RELEASE.md](.github/RELEASE.md). The
application identifier is `app.kestrel`.

## Sizes

Measured on Windows 11 x64 with the pinned toolchain and a release build. The
numbers below are from Kestrel's own build, not the upstream release page.

| Piece | Size |
| --- | --- |
| Windows installer (`Kestrel_1.0.3_x64-setup.exe`) | **9.3 MB** (8.9 MiB) |
| Desktop executable (`zephium-desktop.exe`, release) | 24.8 MB |
| Frontend bundle (`frame/dist`, browser + onboarding) | 4.7 MB raw / 1.7 MB gzip |
| Installed on disk | about 25 MB |
| Source tree without `node_modules`, `target`, `.git`, `vendor` | 62 MB |

The runtime itself is small because the web engine ships with the operating
system: WebKit is part of macOS, and WebView2 is a system component on Windows.
[The size breakdown](SIZE.md) has the measurements, the build method and what
makes up the installer.

## Updates

Kestrel has no configured release channel or signing key yet, so self-update is
off. A Zephium release cannot install over a Kestrel build.
Installers are published by hand on the
[releases page](https://github.com/soupashh-ship-it/kestrel/releases).
To publish Kestrel releases, add your own updater endpoint and public key to
`desktop/tauri.conf.json`, then set `SUPPORTED` back on in
`desktop/src/updates.rs`.

## Upstream browser changes

Kestrel keeps its browser code aligned with Zephium while retaining Kestrel's
AI-free feature set. Preview and merge upstream fixes with
[`scripts/sync-upstream.ps1`](scripts/sync-upstream.ps1); see the
[sync guide](docs/upstream-sync.md). The script never pushes a release or source
change to GitHub.

## Privacy

Kestrel keeps browsing data on the machine. There is no telemetry endpoint and
no account. The only network traffic beyond the sites you visit is the filter
list update check and, if you enable it, the search engine's suggestions.

## License

Kestrel is licensed under the [Mozilla Public License 2.0](LICENSE). Its
browser code is derived from Zephium, also MPL-2.0, and keeps the upstream
copyright notices.
The bundled blocker seed is CC-BY-SA-3.0; its notice ships with the app.
