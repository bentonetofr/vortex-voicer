param(
  [Parameter(Mandatory = $true)][string]$ArchivePath,
  [Parameter(Mandatory = $true)][string]$OutputPath
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Read-ZipText($Entry) {
  $reader = [IO.StreamReader]::new($Entry.Open())
  try { return $reader.ReadToEnd() } finally { $reader.Dispose() }
}

function Read-DataValue([string]$Text, [string]$Name, $Fallback) {
  $match = [regex]::Match($Text, "(?m)^$([regex]::Escape($Name))=(.+)$")
  if (-not $match.Success) { return $Fallback }
  $raw = $match.Groups[1].Value.Trim()
  try { return $raw | ConvertFrom-Json } catch { return $raw.Trim('"') }
}

$archive = [System.IO.Compression.ZipFile]::OpenRead($ArchivePath)
try {
  $videoEntries = @($archive.Entries | Where-Object { $_.FullName -match '\.ogv$' } | Sort-Object FullName)
  $scenes = foreach ($videoEntry in $videoEntries) {
    $folder = $videoEntry.FullName.Substring(0, $videoEntry.FullName.LastIndexOf('/'))
    $sourceName = ($folder -split '/')[-1]
    $infoEntry = $archive.GetEntry("$folder/_pack_info.ini")
    $info = if ($infoEntry) { Read-ZipText $infoEntry } else { '' }
    $lineEntries = @($archive.Entries | Where-Object {
      $_.FullName.StartsWith("$folder/") -and $_.Name -ne '_pack_info.ini' -and $_.Name -match '\.(txt|ini)$'
    } | Sort-Object Name)

    $lines = foreach ($lineEntry in $lineEntries) {
      $lineText = Read-ZipText $lineEntry
      $timestamps = @(Read-DataValue $lineText 'dub_timestamps' @())
      $characters = @(Read-DataValue $lineText 'dub_characters' @('Voz livre'))
      [pscustomobject]@{
        order = $lineEntry.Name
        caption = [string](Read-DataValue $lineText 'caption' '')
        startSeconds = if ($timestamps.Count) { [double]$timestamps[0] } else { 0 }
        characters = $characters
      }
    }

    [pscustomobject]@{
      sourceName = $sourceName
      title = [string](Read-DataValue $info 'title' $sourceName)
      authors = @(Read-DataValue $info 'authors' @())
      lineCount = $lines.Count
      lines = @($lines)
    }
  }

  $parent = Split-Path -Parent $OutputPath
  New-Item -ItemType Directory -Path $parent -Force | Out-Null
  $scenes | ConvertTo-Json -Depth 7 | Set-Content -LiteralPath $OutputPath -Encoding utf8
  $scenes | Select-Object sourceName,title,lineCount | Format-Table -AutoSize
} finally {
  $archive.Dispose()
}
