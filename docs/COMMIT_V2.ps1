# ==========================================================================
# ekkoee homepage v2 — Windows-side commit script
# --------------------------------------------------------------------------
# Run this from PowerShell at the repo root (or anywhere — it resolves
# the path relative to its own location):
#
#     PS> powershell -ExecutionPolicy Bypass -File .\docs\COMMIT_V2.ps1
#
# What it does (in order):
#   1. Clean up sandbox artifacts (.git/index.lock, phantom ./ index entry,
#      stray probe files left by the Linux sandbox).
#   2. Stage + commit each v2 asset in discrete commits so the history
#      tells the upgrade story file-by-file.
#   3. End with the summary commit from the brief.
#
# Stops on first failure. Re-runnable: commits that are already made
# (detected via `git diff --quiet --cached`) are skipped.
# ==========================================================================

$ErrorActionPreference = 'Stop'

# Resolve repo root = parent of this script's directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = Split-Path -Parent $ScriptDir
Set-Location $RepoRoot
Write-Host "[ekko] repo root: $RepoRoot" -ForegroundColor Cyan

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Yellow }
function Ok($msg)   { Write-Host "    [ok] $msg" -ForegroundColor Green }
function Skip($msg) { Write-Host "    [skip] $msg" -ForegroundColor DarkGray }

# --------------------------------------------------------------------------
# 0. Pre-flight: remove any lingering .git/index.lock + probe files.
# --------------------------------------------------------------------------
Step "Pre-flight cleanup"

$lock = Join-Path $RepoRoot '.git\index.lock'
if (Test-Path $lock) {
    Remove-Item $lock -Force -ErrorAction SilentlyContinue
    Ok ".git/index.lock removed"
} else {
    Skip ".git/index.lock (not present)"
}

$probes = @(
    (Join-Path $RepoRoot 'package.json.test'),
    (Join-Path $RepoRoot 'components\home\_test_write_probe.tmp'),
    (Join-Path $RepoRoot 'tsconfig.check.json')
)
foreach ($p in $probes) {
    if (Test-Path $p) {
        Remove-Item $p -Force -ErrorAction SilentlyContinue
        Ok "removed $p"
    } else {
        Skip "$p (not present)"
    }
}

# --------------------------------------------------------------------------
# 1. Remove the phantom "./" entry from the git index (if present).
#    Symptom: `git status` shows every file as deleted + untracked because
#    the root directory itself got staged with mode 23700000000.
# --------------------------------------------------------------------------
Step "Check git index for phantom './' entry"
$lsfiles = & git ls-files --stage '.' 2>$null | Select-String -Pattern '^\S+\s+\S+\s+\S+\s+\.$'
if ($lsfiles) {
    Ok "phantom './' entry found, removing from index"
    & git rm --cached -r --ignore-unmatch '.' | Out-Null
    # Re-add everything that should actually be tracked
    & git add -A
    Ok "index rebuilt"
} else {
    Skip "no phantom entry in index"
}

# Safety net: confirm git status is sane before we start committing.
Step "git status (pre-commit snapshot)"
& git status --short

# --------------------------------------------------------------------------
# 2. Helper: stage a list of paths and commit with a message, skipping if
#    nothing is actually staged (allows re-running the script safely).
# --------------------------------------------------------------------------
function Commit-Paths {
    param(
        [Parameter(Mandatory)][string[]]$Paths,
        [Parameter(Mandatory)][string]$Message
    )
    Step "commit: $Message"

    # Unstage anything currently staged so we commit ONLY the paths we name.
    & git reset --quiet HEAD -- . 2>$null | Out-Null

    $added = $false
    foreach ($p in $Paths) {
        $full = Join-Path $RepoRoot $p
        if (Test-Path $full) {
            & git add -- $p
            $added = $true
        } else {
            Skip "missing: $p"
        }
    }
    if (-not $added) {
        Skip "no paths existed for this commit"
        return
    }

    # Anything actually staged?
    & git diff --cached --quiet
    if ($LASTEXITCODE -eq 0) {
        Skip "already committed (no staged diff)"
    } else {
        & git commit -m $Message
        Ok "committed"
    }
}

# --------------------------------------------------------------------------
# 3. Infrastructure commits (foundation before the v2 components).
# --------------------------------------------------------------------------
Commit-Paths -Paths @('package.json','package-lock.json') `
    -Message 'chore(deps): add three + @types/three for v2 hero scene'

Commit-Paths -Paths @('app/globals.css') `
    -Message 'style(home/v2): add ekko color tokens + CRT overlay keyframes'

# --------------------------------------------------------------------------
# 4. One commit per v2 component, in the order they were written.
#    Commit message format per brief: "feat(home/v2): <component_name>"
# --------------------------------------------------------------------------
$components = @(
    @{ File = 'components/home/Footer.tsx';        Name = 'Footer' },
    @{ File = 'components/home/BootSequence.tsx';  Name = 'BootSequence' },
    @{ File = 'components/home/CoordinateHUD.tsx'; Name = 'CoordinateHUD' },
    @{ File = 'components/home/ProgressRail.tsx';  Name = 'ProgressRail' },
    @{ File = 'components/home/Manifesto.tsx';     Name = 'Manifesto' },
    @{ File = 'components/home/Cta.tsx';           Name = 'Cta' },
    @{ File = 'components/home/Hero.tsx';          Name = 'Hero' },
    @{ File = 'components/home/LiveSystem.tsx';    Name = 'LiveSystem' },
    @{ File = 'components/home/Architecture.tsx';  Name = 'Architecture' },
    @{ File = 'components/home/Process.tsx';       Name = 'Process' },
    @{ File = 'components/home/ThreeHero.tsx';     Name = 'ThreeHero' }
)
foreach ($c in $components) {
    Commit-Paths -Paths @($c.File) -Message "feat(home/v2): $($c.Name)"
}

# --------------------------------------------------------------------------
# 5. Final summary commit — composition entry point (app/page.tsx) +
#    any straggling modifications in app/ that belong to the upgrade.
# --------------------------------------------------------------------------
Commit-Paths -Paths @('app/page.tsx') `
    -Message 'feat(home): upgrade to v2 — 3D hero + live simulation + interactive architecture'

# --------------------------------------------------------------------------
# 6. Summary.
# --------------------------------------------------------------------------
Step "Done. Recent history:"
& git log --oneline -n 20

Write-Host "`n[ekko] v2 commit run finished." -ForegroundColor Cyan
Write-Host "[ekko] Next: review with 'git log --stat -n 14', then 'git push'." -ForegroundColor Cyan
