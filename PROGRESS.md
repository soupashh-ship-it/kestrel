# Kestrel — progress status

Last updated: 2026-10-28 (final for this session).
Full detail, including how to verify from scratch, lives in **`handoff.md`**.
Size numbers live in **`SIZE.md`**.

Goal: fork Zephium (https://github.com/zephium-browser/Zephium) into a browser
named **Kestrel** with all AI/agent functionality removed, plus a measured size
estimate.

## What is DONE

- **Rebrand to Kestrel** — product/window/menu/settings copy, README and
  `.github` docs, Windows Tauri config + NSIS installer name, macOS class names
  and Info.plist, webext bundle id `app.kestrel.webext`, all 13 locale files and
  the runtime `native_*_kestrel` menu keys.
- **AI removal** — 12 crates deleted (28 → 16 workspace crates), all `work_*` /
  `account` / `page_assist` / `voice` / `favicon_probe` desktop modules gone,
  AI settings/mode-switch/dock entries removed from the UI, retired preference
  keys rejected by `zephium-core`. About 1,800 files and ~727,000 lines removed.
- **Verification green** —
  - `cargo check --workspace --all-targets` ✅
  - `cargo clippy --workspace --all-targets` ✅ (0 warnings)
  - `cargo test --workspace --no-fail-fast` ✅ except 8 proven-environmental
    `zephium-blocker` ACL tests (see below)
  - `pnpm -C frame check` ✅ (typecheck, eslint, stylelint, prettier, knip,
    585/585 vitest tests)
  - `pnpm -C frame build` ✅
  - release build + NSIS installer ✅ →
    `target/release/bundle/nsis/Kestrel_1.0.3_x64-setup.exe`
- **Session fixes** — engine `windows/mod.rs` module wiring restored, 228 files
  normalized back to LF (scripted edits had introduced CRLF and broke
  `include_str!` source assertions), i18n key renames, `update_target:
  "kestrel"` frontend alignment, dead knip leftovers removed, prettier applied.
- **Docs** — `SIZE.md` (measured sizes), `handoff.md` (full handoff).

## What is NOT done

1. **8 `zephium-blocker` cache tests fail on drive E:** — environmental
   (`SetFileSecurityW` in the test helper). Pristine HEAD fails identically on
   E: and passes on C:, so it is not caused by this fork. See `handoff.md`.
2. **Dormant AI feature gates** — 210 `agentic-browser` cfg sites + 96 other
   agentic flag references; features declared but never enabled, so builds are
   fine. Removing them is a large mechanical cleanup.
3. **Dead AI strings/components** — ~1,200 `work_*`/`ai_*` keys across 13
   locale JSONs, the orphaned `frame/src/shared/ui/data/Artifact/` component
   family, and unreachable `mode.work` / `mode.choose` / `settings.ai` handlers
   in `desktop/src/lib.rs`.
4. **Crate/binary names still `zephium-*`** (`zephium-desktop.exe`); only the
   user-facing brand says Kestrel.
5. **Unsigned installer** — no code signing configured.
6. **No interactive smoke test** — launch the app and click through tabs,
   spaces, downloads, extensions, private window, settings before shipping.

## Repository state
Everything is **uncommitted** working-tree change on branch `kestrel`
(1,798 files changed vs HEAD). Commit before switching machines or branches.
