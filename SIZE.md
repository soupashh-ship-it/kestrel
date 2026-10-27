# Kestrel size breakdown

Measured on 2026-10-28, Windows 11 x64, Rust release profile
(`opt-level = "s"`, thin LTO, `panic = "abort"`, symbols stripped), Node 24.18,
pnpm 11.17. These are local build numbers, not estimates copied from upstream.

## What ships

| Artifact | Size | Notes |
| --- | --- | --- |
| `zephium-desktop.exe` (release) | 24.8 MB (23.7 MiB) | Single executable; Tauri embeds the frontend bundle and filter seed |
| `frame/dist` (browser + onboarding) | 4.7 MB raw, 1.7 MB gzip, 289 files | Embedded in the executable, so not shipped twice |
| NSIS installer | 9.3 MB (9,339,646 bytes) | Compresses the executable; WebView2 is a system component |
| Total install on disk | about 25 MB | Executable plus the license/notice resources |
| Download | 9.3 MB (8.9 MiB) | `Kestrel_1.0.3_x64-setup.exe`, unsigned |

The executable is the whole app: the Rust shell, the native blocker, the
compiled Svelte frame and the bundled EasyList/EasyPrivacy seed. The web engine
is not in the download — WebKit is part of macOS and WebView2 is a Windows
system component.

## Frontend bundle

| Piece | Raw |
| --- | --- |
| JavaScript + CSS | about 2.4 MB |
| New-tab sky images (AVIF) | 521 KB |
| Spell-check dictionaries (11 languages) | 1.6 MB (12 chunks) |
| Everything else (icons, fonts, HTML) | about 140 KB |

Largest single chunks: the note editor (435 KB), the main browser chunk (200 KB)
and the browser stylesheet (134 KB).

## Source tree

| Measure | Value |
| --- | --- |
| Source without `node_modules`, `target`, `.git`, `vendor` | 62 MB (mostly filter lists, icons and bundled dictionaries) |
| Rust | 295,633 lines across 544 files: 16 workspace crates (down from 28), `desktop/` and `xtask/`, tests included |
| Frontend (`frame/src`) | 40,229 lines of hand-written TypeScript and Svelte, plus about 18,000 generated i18n lines |
| Locked Rust dependencies | 683 crates |
| Debug `cargo check` (warm) | about 52 s |
| Release build (warm) | about 2 min 35 s |

## What removing the AI saved

The fork removes about 1,800 files and roughly 727,000 lines relative to
upstream (3,122 lines added): the agent runtime, controller, model catalog, provider transport,
Work composition, page assist, voice, hosted account service, evaluation
fixtures and their tests and docs. None of it was in the default desktop graph, so the installed binary is
close to upstream's browser-only build; the savings are in build time, source
maintenance, dependency surface and the absence of model/network credentials.

## How to reproduce

```sh
pnpm install
pnpm -C frame build
cargo build --release -p zephium-desktop
du -sh frame/dist
stat -c '%s' target/release/zephium-desktop.exe   # Linux; use stat -f on macOS
pnpm -C desktop exec tauri build --bundles nsis   # Windows installer
```

The NSIS installer is written to
`target/release/bundle/nsis/Kestrel_<version>_x64-setup.exe`.
