param(
  [string]$ProjectRef,
  [string]$EnvFile = '.env.supabase'
)

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $repoRoot

if (-not (Test-Path (Join-Path $repoRoot 'supabase'))) {
  Write-Error 'Expected supabase/ directory in repo root.'
  exit 1
}

# if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
#   Write-Error 'Supabase CLI not found. Install it from https://supabase.com/docs/guides/cli.'
#   exit 1
# }

function Read-EnvFile {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    return @{}
  }

  $vars = @{}
  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#')) {
      return
    }

    $parts = $line -split '=', 2
    if ($parts.Length -lt 2) {
      return
    }

    $key = $parts[0].Trim()
    $value = $parts[1].Trim()
    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    $vars[$key] = $value
  }

  return $vars
}

$resolvedProjectRef = $ProjectRef
if (-not $resolvedProjectRef -and $env:SUPABASE_PROJECT_REF) {
  $resolvedProjectRef = $env:SUPABASE_PROJECT_REF
}

if ($resolvedProjectRef) {
  & pnpm supabase link --project-ref $resolvedProjectRef
}

$envVars = Read-EnvFile $EnvFile
if ($envVars.Count -eq 0) {
  Write-Error "Missing $EnvFile. Create it from .env.supabase.example."
  exit 1
}

$requiredSecrets = @(
  'CREEM_API_KEY',
  'CREEM_WEBHOOK_SECRET',
  'CREEM_PRODUCT_ID_PLUS',
  'CREEM_SUCCESS_URL'
)

$secretsArgs = @()
$missingSecrets = @()
foreach ($key in $requiredSecrets) {
  if ($envVars.ContainsKey($key) -and $envVars[$key]) {
    $secretsArgs += "$key=$($envVars[$key])"
  } else {
    $missingSecrets += $key
  }
}

if ($missingSecrets.Count -gt 0) {
  Write-Warning ("Missing secrets in {0}: {1}" -f $EnvFile, ($missingSecrets -join ', '))
}

if ($secretsArgs.Count -gt 0) {
  & pnpm supabase secrets set @secretsArgs
}

if ($envVars.ContainsKey('SUPABASE_DB_URL') -and $envVars['SUPABASE_DB_URL']) {
  & supabase db execute --file supabase/schema.sql --db-url $envVars['SUPABASE_DB_URL']
} else {
  & pnpm supabase db execute --file supabase/schema.sql
}

$functionDirs = Get-ChildItem (Join-Path $repoRoot 'supabase/functions') -Directory |
  Where-Object { $_.Name -ne '_shared' }

foreach ($dir in $functionDirs) {
  & pnpm supabase functions deploy $dir.Name
}

Write-Host 'Supabase init complete.'
