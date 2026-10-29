# Keeping Kestrel current

Kestrel keeps the browser features and product identity while omitting the AI
account, assistant, Work canvas, voice input, and model integrations. The Git
remotes keep those changes separate:

- `origin` is your Kestrel repository: `soupashh-ship-it/kestrel`.
- `upstream` is the Zephium source repository: `zephium-browser/Zephium`.

The `kestrel` branch is based on the current upstream browser code. To preview
later upstream commits and merge them into Kestrel, run these commands from the
Kestrel checkout:

```powershell
.\scripts\sync-upstream.ps1 -Preview
.\scripts\sync-upstream.ps1
```

The script requires a clean working tree and a configured Git author. It fetches
`upstream/main`, merges it into the current branch, and keeps Kestrel's deleted
AI-only files deleted. It stops if a conflict falls outside those removals so
you can review the change manually. It never pushes to GitHub.

This checkout has no saved Git author yet. Configure one locally before the next
sync, using your preferred name and GitHub email or noreply address:

```powershell
git config --local user.name "Your Name"
git config --local user.email "your-email-or-github-noreply"
```

After reviewing the merge, run the project's normal build and checks, then push
the branch when you are ready:

```powershell
git push -u origin kestrel
```

Kestrel's own updater remains disabled until you configure a Kestrel signing key
and release endpoint. The Git sync above only updates source code; it does not
publish a browser release.
