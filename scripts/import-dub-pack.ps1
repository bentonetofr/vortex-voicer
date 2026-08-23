param(
  [Parameter(Mandatory = $true)][string]$ArchivePath,
  [Parameter(Mandatory = $true)][string]$OutputPath,
  [Parameter(Mandatory = $true)][string]$FfmpegPath,
  [Parameter(Mandatory = $true)][string]$WorkPath
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

function ConvertTo-Slug([string]$Value) {
  $normalized = $Value.Normalize([Text.NormalizationForm]::FormD)
  $characters = foreach ($character in $normalized.ToCharArray()) {
    if ([Globalization.CharUnicodeInfo]::GetUnicodeCategory($character) -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
      $character
    }
  }
  $plain = (-join $characters).Normalize([Text.NormalizationForm]::FormC).ToLowerInvariant()
  return (($plain -replace '[^a-z0-9]+', '-') -replace '(^-|-$)', '')
}

function Get-DurationSeconds([string]$InputPath) {
  $probeOutput = & $FfmpegPath -hide_banner -i $InputPath 2>&1
  $match = $probeOutput | Select-String -Pattern 'Duration: (\d{2}):(\d{2}):(\d{2}\.\d+)' | Select-Object -First 1
  if (-not $match) { return 30 }
  $groups = $match.Matches[0].Groups
  return [math]::Ceiling(([int]$groups[1].Value * 3600) + ([int]$groups[2].Value * 60) + [double]$groups[3].Value)
}

New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
New-Item -ItemType Directory -Path $WorkPath -Force | Out-Null

$archive = [System.IO.Compression.ZipFile]::OpenRead($ArchivePath)
try {
  $entries = @($archive.Entries | Where-Object { $_.FullName -match '\.ogv$' } | Sort-Object FullName)
  $results = @()

  for ($index = 0; $index -lt $entries.Count; $index += 1) {
    $entry = $entries[$index]
    $segments = $entry.FullName -split '/'
    $sourceName = $segments[$segments.Length - 2]
    $slug = ConvertTo-Slug $sourceName
    $scenePath = Join-Path $OutputPath $slug
    $inputPath = Join-Path $WorkPath 'input.ogv'
    $videoPath = Join-Path $scenePath 'scene.webm'
    $posterPath = Join-Path $scenePath 'poster.jpg'

    New-Item -ItemType Directory -Path $scenePath -Force | Out-Null
    [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $inputPath, $true)
    $durationSeconds = Get-DurationSeconds $inputPath
    Write-Output ("[{0}/{1}] {2}" -f ($index + 1), $entries.Count, $sourceName)

    & $FfmpegPath -y -hide_banner -loglevel error -i $inputPath `
      -map '0:v:0' -map '0:a?' -vf "scale='min(640,iw)':-2" `
      -c:v libvpx-vp9 -crf 45 -b:v 0 -deadline good -cpu-used 5 -row-mt 1 `
      -c:a libopus -b:a 32k -ac 1 $videoPath
    if ($LASTEXITCODE -ne 0) { throw "Falha ao converter $sourceName" }

    & $FfmpegPath -y -hide_banner -loglevel error -ss 1 -i $videoPath -frames:v 1 -vf "scale='min(640,iw)':-2" -q:v 6 $posterPath
    if ($LASTEXITCODE -ne 0) {
      & $FfmpegPath -y -hide_banner -loglevel error -i $videoPath -frames:v 1 -vf "scale='min(640,iw)':-2" -q:v 6 $posterPath
    }
    if ($LASTEXITCODE -ne 0) { throw "Falha ao gerar poster de $sourceName" }

    $results += [pscustomobject]@{
      sourceName = $sourceName
      slug = $slug
      durationSeconds = $durationSeconds
      videoBytes = (Get-Item -LiteralPath $videoPath).Length
      posterBytes = (Get-Item -LiteralPath $posterPath).Length
    }
    Remove-Item -LiteralPath $inputPath
  }

  $results | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath (Join-Path $WorkPath 'catalog.json') -Encoding utf8
  $results | Format-Table -AutoSize
} finally {
  $archive.Dispose()
}
