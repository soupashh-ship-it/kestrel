# Kestrel documentation

Code and tests are the evidence of present behavior. Where documents appear to
disagree, `security-model.md` controls claims about enforced security,
`architecture.md` controls the browser foundation, and this index records
what each remaining document covers.

## Architecture and security

- [Architecture](architecture.md): implemented browser structure, domain ownership and native lifecycle.
- [Security model](security-model.md): the guarantees the tree enforces and the gates for disabled capabilities.
- [Frontend contract](frontend.md): stack, ownership, import boundaries and native presentation rules for `frame/`.

## Browser features

- [Interface design](design/interface.md): why the browser chrome is shaped the way it is.
- [Interface system](design/system.md): tokens, shared components and how to inspect them.
- [Settings](design/settings.md): settings structure, search and navigation.
- [Launcher](design/launcher.md): the floating search window and what it hands off.
- [History](design/history.md): the history module, omnibox queries and site icons.
- [Tasks](design/tasks-redesign.md): the shared Tasks surface.
- [Charts](design/charts.md): the chart kit used by Activity.
- [File workflows](file-workflows-windows-qa.md): upload and download ownership, recovery, and Windows acceptance checks.

## Extensions

- [Using extensions](extensions-user-guide.md): installing from the Chrome Web Store and what to expect.
- [Initial release scope](extension-release-scope.md): what extension support covers and its completion criteria.
- [Windows extension QA](windows-extension-qa.md): the isolated QA build, acceptance checklist and performance checks.
- [Windows extension lab](../crates/zephium-webext-windows/README.md): native qualification harness.

## Ad blocking

- [Ad and tracker protection](adblock.md): the native network blocker, cosmetic hiding and release gates.
- [Cosmetic index delivery](adblock-cosmetic-index.md): keeping the generic cosmetic index out of every page.
- [Blocker fuzz harness](../crates/zephium-blocker/fuzz/README.md): running the fuzz targets.

## Contributing and maintenance

- [Contributing](../CONTRIBUTING.md): prerequisites, workflow and quality bar.
- [Security maintenance](security-maintenance.md): recurring security and engine-floor checks.
- [Release engineering](../.github/RELEASE.md): building, signing and publishing releases.
- [Frame guide](../frame/README.md): layout of the Svelte frontend.
