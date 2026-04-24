$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "==> Clearing stale git lock" -ForegroundColor Cyan
Remove-Item -Force .git\index.lock -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "==> Removing cruft" -ForegroundColor Cyan
Remove-Item -Force test_write_permissions.tmp -ErrorAction SilentlyContinue

$gitName = git config user.name
if (-not $gitName) { git config user.name  "ekko" }
$gitEmail = git config user.email
if (-not $gitEmail) { git config user.email "ekkobuds@gmail.com" }

Write-Host ""
Write-Host "==> Staging changed files only (skip CRLF noise)" -ForegroundColor Cyan

git add -- "app/layout.tsx"
git add -- "app/globals.css"
git add -- "next.config.ts"
git add -- "app/(home)/_sections/Hero.tsx"
git add -- "app/(home)/_sections/Manifesto.tsx"
git add -- "app/(home)/_sections/Mission.tsx"
git add -- "app/(home)/_sections/Process.tsx"
git add -- "app/(home)/_sections/Architecture.tsx"
git add -- "app/(home)/_sections/Trust.tsx"
git add -- "app/(home)/_sections/DashboardPreview.tsx"
git add -- "app/(home)/_sections/CTA.tsx"
git add -- "components/ui/CyberpunkFrame.tsx"
git add -- "components/ui/LangSwitcher.tsx"
git add -- "components/home/HomeOrbit.tsx"
git add -- "app/login/LoginClient.tsx"
git add -- "lib/i18n"
git add -- "public/line-qr.png"

Write-Host ""
Write-Host "==> Staged files:" -ForegroundColor Cyan
git diff --cached --stat

Write-Host ""
Write-Host "==> Commit" -ForegroundColor Cyan
git commit `
    -m "feat(home): i18n + collapsible contacts + mobile polish" `
    -m "- Lightweight client-side i18n (lib/i18n): zh-Hant default / en / zh-Hans" `
    -m "- LangSwitcher pills (TC / EN / SC) in CyberpunkFrame HUD" `
    -m "- EKKOEE.COM wordmark clickable; dispatches ekkoee:go-home so HomeOrbit scrolls back to Hero from any section" `
    -m "- CTA redesign: rose button toggles a contact reveal (LINE / Telegram / hello@ / protonmail); LINE row expands QR on click" `
    -m "- Process three-column padding widened so text breathes from dividers" `
    -m "- Login: wider gap between intro and inputs, placeholder changed to TSMC" `
    -m "- Mobile polish: HUD hides tagline/NODE/agents/warn below breakpoints; Architecture swaps the 420px diagram for a stacked node list on mobile; clamp min sizes dropped so 320-375px viewports don't overflow; section padding reduced on mobile" `
    -m "- Perf: low-end device detection (hardwareConcurrency <= 4 + deviceMemory <= 4, or narrow screen, or prefers-reduced-motion) skips Three.js canvas and falls back to the static hero" `
    -m "- Perf: content-visibility: hidden on off-viewport HomeOrbit sections so the browser skips layout/paint for what is far away" `
    -m "- Perf: next.config adds poweredByHeader off, productionBrowserSourceMaps off, optimizePackageImports for framer-motion/three, and long-cache immutable headers for /public static assets" `
    -m "- New asset: public/line-qr.png (ekkoee-themed QR with LINE badge)"

Write-Host ""
Write-Host "==> Push to origin main" -ForegroundColor Cyan
git push origin main

Write-Host ""
Write-Host "Done. If Vercel is connected, it will redeploy automatically." -ForegroundColor Green
