param(
  [string]$RootPath = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [string]$Branch = 'main',
  [int]$PollSeconds = 3,
  [string]$CommitPrefix = 'Auto-sync'
)

$ErrorActionPreference = 'Stop'
Set-Location $RootPath

function Sync-Repo {
  $status = git status --porcelain
  if ([string]::IsNullOrWhiteSpace($status)) {
    return
  }

  git add -A | Out-Null

  $commitMessage = '{0}: {1}' -f $CommitPrefix, (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
  git commit -m $commitMessage | Out-Null

  if ($LASTEXITCODE -eq 0) {
    git push origin $Branch | Out-Null
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Synced changes to origin/$Branch"
  }
}

Write-Host "Watching $RootPath for changes. Press Ctrl+C to stop."

while ($true) {
  try {
    Sync-Repo
  }
  catch {
    Write-Warning $_.Exception.Message
  }

  Start-Sleep -Seconds $PollSeconds
}
