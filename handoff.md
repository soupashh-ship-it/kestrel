# Kestrel — handoff

Last updated: 2026-10-28, branch `kestrel` (HEAD `276b1ba`), Windows 11 x64.

**Goal:** fork [Zephium](https://github.com/zephium-browser/Zephium) into a browser named **Kestrel** with all AI/agent functionality removed, and report measured size estimates.

**Where things are:** [README.md](README.md) (rebranded docs), [SIZE.md](SIZE.md) (measured size report), [PROGRESS.md](PROGRESS.md) (running done/remaining list).

---

## What is DONE

### 1. Rebrand to Kestrel
- Product/window/onboarding/settings copy, native menu labels, docs (`README`, `SECURITY`, `CONTRIBUTING`, `CODE_OF_CONDUCT`, `.github/*`).
- Windows Tauri config and NSIS artifact: `Kestrel_1.0.3_x64-setup.exe`.
- macOS: `define_class!` names (`KestrelContentStage`, …), Info.plist, webext bundle id `app.kestrel.webext` / `app.kestrel.webext-qa`.
- i18n: all 13 locale files rebranded; runtime menu keys renamed (`native_quit_kestrel`, `native_about_kestrel`, `native_hide_kestrel`, `native_kestrel`, `native_ask_kestrel`, `native_kestrel_help`) so `menu_text::key(label)` resolves again.

### 2. AI removal (~1,800 files, ~727,000 lines deleted vs upstream; 3,122 added)
- Crates deleted: `zephium-account`, `zephium-agent-controller`, `zephium-agent-model-catalog`, `zephium-agent-provider-transport`, `zephium-agent-runtime`, `zephium-agentic`, `zephium-mcp`, `zephium-page-assist`, `zephium-voice`, `zephium-work-composition`, `zephium-decision`, `zephium-terra-macos-probe`. Workspace is now 16 crates (was 28).
- Desktop: `account.rs`, `page_assist.rs`, `voice.rs`, `favicon_probe.rs`, all `work_*.rs` removed from `desktop/src`.
- Frontend: AI/Work settings sections, mode switch, dock tools and panel entries removed; dead leftovers pruned (see below).
- Preferences: `work.favourite-models`, `ai.enabled`, `work.enabled` retired and rejected by `zephium-core::preferences`.
- Runtime security enum rebranded (`RuntimeSecurityUpdateTarget::Kestrel` → `"kestrel"`) and frontend updated to match.
- xtask architecture guards for the removed boundaries deleted.

### 3. Verification — all green
| Check | Result |
| --- | --- |
| `cargo check --workspace --all-targets` | pass |
| `cargo clippy --workspace --all-targets` | pass, 0 warnings/errors |
| `cargo test --workspace --no-fail-fast` | 42 test binaries pass; **only** `zephium-blocker`'s 8 Windows ACL cache tests fail (environmental — see below) |
| `pnpm -C frame check` (typecheck + eslint + stylelint + prettier + knip + vitest) | pass, 585/585 tests, 0 type errors |
| `pnpm -C frame build` | pass |
| `cargo build --release -p zephium-desktop` | pass (2 m 29 s warm) |
| `pnpm -C desktop exec tauri build --bundles nsis` | pass → `target/release/bundle/nsis/Kestrel_1.0.3_x64-setup.exe` (9,339,646 bytes) |

### 4. Fixes made in this session (after the earlier work)
- Restored module wiring in `crates/zephium-engine/src/platform/windows/mod.rs` that the AI-removal script had broken (`mod apps;` left feature-gated while its `use` was not, plus `use` lines for deleted modules).
- **CRLF normalization**: 228 modified files had Windows CRLF introduced by earlier scripted edits; all had LF at HEAD and were converted back to LF. This was breaking `include_str!`-based source assertions (e.g. `host::tests::the_macos_stage_never_moves_a_page_webkit_is_showing_fullscreen`).
- `native_zephium_help` → `native_kestrel_help` in all 13 locales (menu test).
- Frontend leftovers removed for `knip`: `work-constants.ts`, `StageStub.svelte`, `LivePage.svelte`, `stillWhenUnseen`, `TABLE_CARD`, `identityAvatar` (+ re-export + test mock line).
- `keymap.svelte.ts` no longer filters a `"work"` key group that no longer exists; `runtime-model.ts` switch updated to `case "kestrel"`.
- Prettier applied to the 9 files that failed `format:check`.

### 5. Size report
`SIZE.md` has the full tables. Headlines: **exe 24.8 MB**, **installer 9.3 MB (8.9 MiB)**, frontend bundle 4.7 MB raw / 1.7 MB gzip, source tree 62 MB, Rust 295,633 lines, frontend 40,229 hand-written lines, 683 locked Rust dependencies.

---

## What is NOT done

1. **8 `zephium-blocker` cache tests fail on this machine** — `cache::tests::*` panic on `SetFileSecurityW` at `crates/zephium-blocker/src/cache.rs:1605`.
   *Proven environmental, not a regression:* the tests create their temp root inside the current directory, and this repo lives on **E:**. A pristine `HEAD` worktree on **E:** fails the same 8 tests; the same pristine `HEAD` worktree on **C:** passes 85/85. Nothing in the fork changes that file beyond a doc comment.
   Options: run tests from a checkout on C:, grant the E: volume proper ACL rights, or fix `set_windows_root_security`. CI (hosted `windows-2025`, C:) is unaffected.
2. **Dormant AI feature gates** — 210 `#[cfg(feature = "agentic-browser")]` sites plus 96 other agentic/probe feature-flag references remain across `crates/` and `desktop/`. The features are still declared in `crates/zephium-engine/Cargo.toml` and `crates/zephium-app/Cargo.toml` but nothing enables them, so everything compiles. Cleaning this up means deleting every gated block and the feature declarations — a large mechanical change not yet attempted.
3. **Dead AI strings/components** (not reachable, but present in source):
   - ~1,200 `work_*` / `ai_*` / `agent_*` / `assist_*` keys in `frame/messages/*.json` ×13 locales, including `panel_ask_zephium` ("Ask Kestrel"), `tool_zephium` ("Kestrel AI"), `onb_ai_zephium`, `voice_engine_zephium`.
   - Orphaned component family `frame/src/shared/ui/data/Artifact/` (and `Evidence.svelte`'s use of `work_artifact_unavailable`); nothing imports them.
   - Dead handlers in `desktop/src/lib.rs`: `mode.work` / `mode.browse` / `mode.choose` (they dispatch `browser.work`, which is not in the command registry) and the `"settings.ai"` id in the settings-menu list. No menu item builds any of them.
4. **Names still say `zephium`** — crates (`zephium-*`), the binary (`zephium-desktop.exe`), the tauri config files, and the default theme preset id `"zephium"`. Only the user-facing brand and installer say Kestrel. Renaming crates is a large mechanical refactor (paths, `Cargo.toml`, `use` statements, CI).
5. **Installer is unsigned** — no code signing configured.
6. **No interactive smoke test this session** — verification was build/test/lint level. Before shipping, launch the app and check: tabs/spaces, downloads, extensions, private window, settings pages, update dialog.

---

## How to verify from scratch

```sh
export PATH="$HOME/.cargo/bin:$PATH"      # rustup toolchain
pnpm install
cargo check --workspace --all-targets
cargo clippy --workspace --all-targets
cargo test --workspace --no-fail-fast     # expect only the 8 blocker ACL failures on E:
pnpm -C frame check                        # typecheck + lint + stylelint + format + knip + tests
pnpm -C frame build
cargo build --release -p zephium-desktop
pnpm -C desktop exec tauri build --bundles nsis
```

## Repository state
Everything is **uncommitted** working-tree change on branch `kestrel` (1,798 files changed vs HEAD). Commit before moving machines or switching branches.
