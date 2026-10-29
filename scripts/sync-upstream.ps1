[CmdletBinding()]
param(
    [switch]$Preview
)

$ErrorActionPreference = 'Stop'
$upstreamUrl = 'https://github.com/zephium-browser/Zephium.git'
$excludedAiPrefixes = @(
    'crates/zephium-account/',
    'crates/zephium-agent-',
    'crates/zephium-agentic/',
    'crates/zephium-decision/',
    'crates/zephium-mcp/',
    'crates/zephium-page-assist/',
    'crates/zephium-terra-macos-probe/',
    'crates/zephium-voice/',
    'crates/zephium-work-',
    'crates/zephium-app/src/work_',
    'crates/zephium-app/src/shell/work_',
    'crates/zephium-core/src/work/',
    'crates/zephium-engine/src/platform/windows/agent_context.rs',
    'crates/zephium-ipc/src/page_assist.rs',
    'crates/zephium-ipc/src/work.rs',
    'crates/zephium-store/src/hub/work_',
    'desktop/src/account.rs',
    'desktop/src/page_assist.rs',
    'desktop/src/voice.rs',
    'desktop/src/work',
    'docs/agent-work-',
    'eval/agentic-',
    'frame/src/app/browser/tests/Work',
    'frame/src/domain/account/',
    'frame/src/domain/ai/',
    'frame/src/domain/voice/',
    'frame/src/features/assist/',
    'frame/src/features/settings/components/account/',
    'frame/src/features/settings/components/AccountGate.svelte',
    'frame/src/features/settings/tests/AccountSignIn',
    'frame/src/features/settings/tests/Ai',
    'frame/src/features/work/',
    'frame/src/session/work-',
    'frame/src/shared/testing/account.ts',
    'frame/src/shared/ui/AccountSummary/',
    'scripts/qualification/windows-agentic',
    'scripts/test-work-',
    'scripts/test_work_',
    'scripts/work-',
    'scripts/work_',
    'xtask/src/agent_',
    'xtask/src/agentic_',
    'xtask/src/work_'
)

function Invoke-Git {
    param([Parameter(Mandatory)][string[]]$GitArgs)
    & git @GitArgs
    if ($LASTEXITCODE -ne 0) {
        throw "git $($GitArgs -join ' ') failed with exit code $LASTEXITCODE."
    }
}

function Test-ExcludedAiPath {
    param([Parameter(Mandatory)][string]$Path)
    foreach ($prefix in $excludedAiPrefixes) {
        if ($Path.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
            return $true
        }
    }
    return $false
}

$repoRoot = (& git rev-parse --show-toplevel)
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($repoRoot)) {
    throw 'Run this script from inside the Kestrel Git repository.'
}

Push-Location $repoRoot.Trim()
try {
    $branch = (& git branch --show-current).Trim()
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($branch)) {
        throw 'Check out a Kestrel branch before syncing upstream.'
    }
    if ($branch -eq 'main') {
        throw 'Switch to the Kestrel product branch before syncing upstream.'
    }

    $dirty = @(& git status --porcelain)
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not read the Git working tree status.'
    }
    if ($dirty.Count -gt 0) {
        throw 'Commit or stash local changes before syncing upstream.'
    }

    $gitName = (& git config user.name)
    $gitEmail = (& git config user.email)
    if ([string]::IsNullOrWhiteSpace($gitName) -or [string]::IsNullOrWhiteSpace($gitEmail)) {
        throw 'Set git config user.name and git config user.email before merging.'
    }

    $configuredUpstream = (& git remote get-url upstream 2>$null)
    if ($LASTEXITCODE -ne 0) {
        Invoke-Git -GitArgs @('remote', 'add', 'upstream', $upstreamUrl)
    } elseif ($configuredUpstream.Trim() -ne $upstreamUrl) {
        throw "The upstream remote points to '$($configuredUpstream.Trim())', expected '$upstreamUrl'."
    }

    Invoke-Git -GitArgs @('fetch', 'upstream', 'main', '--no-tags')

    if ($Preview) {
        Invoke-Git -GitArgs @('log', '--graph', '--oneline', '--left-right', "$branch...upstream/main")
        return
    }

    & git merge --no-ff --no-commit -X ours upstream/main
    $mergeExit = $LASTEXITCODE

    $unmerged = @(& git status --short | Where-Object {
        $_.Length -ge 3 -and $_.Substring(0, 2) -match '^(DD|AU|UD|UA|DU|AA|UU)$'
    })
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not inspect the merge result.'
    }

    foreach ($entry in $unmerged) {
        $code = $entry.Substring(0, 2)
        $path = $entry.Substring(3)
        if (($code -eq 'DU' -or $code -eq 'UA') -and (Test-ExcludedAiPath -Path $path)) {
            Invoke-Git -GitArgs @('rm', '-f', '--', $path)
            continue
        }

        & git merge --abort | Out-Null
        throw "Unexpected conflict in '$path'. The merge was aborted for manual review."
    }

    $addedAiPaths = @(& git diff --cached --name-only --diff-filter=A | Where-Object {
        Test-ExcludedAiPath -Path $_
    })
    foreach ($path in $addedAiPaths) {
        Invoke-Git -GitArgs @('rm', '-f', '--', $path)
    }

    $remaining = @(& git diff --name-only --diff-filter=U)
    if ($remaining.Count -gt 0) {
        & git merge --abort | Out-Null
        throw 'Unexpected unmerged paths remain. The merge was aborted for manual review.'
    }

    $mergeHead = & git rev-parse -q --verify MERGE_HEAD 2>$null
    if ($LASTEXITCODE -eq 0) {
        Invoke-Git -GitArgs @('commit', '--no-edit')
        Write-Host 'Merged upstream/main into the current Kestrel branch.'
    } elseif ($mergeExit -eq 0) {
        Write-Host 'Kestrel is already current with upstream/main.'
    } else {
        throw 'The merge did not complete. Inspect Git status before continuing.'
    }
} finally {
    Pop-Location
}
