param(
  [Parameter(Mandatory = $true)][string]$MetadataPath,
  [Parameter(Mandatory = $true)][string]$AssetsPath,
  [Parameter(Mandatory = $true)][string]$OutputPath
)

$ErrorActionPreference = 'Stop'
$metadata = @(Get-Content -LiteralPath $MetadataPath -Raw | ConvertFrom-Json)
$assets = @(Get-Content -LiteralPath $AssetsPath -Raw | ConvertFrom-Json)

$catalog = foreach ($asset in $assets) {
  $info = $metadata | Where-Object sourceName -eq $asset.sourceName | Select-Object -First 1
  if (-not $info) { throw "Metadados ausentes para $($asset.sourceName)" }
  [pscustomobject]@{
    sourceName = $asset.sourceName
    slug = $asset.slug
    packTitle = $info.title
    authors = @($info.authors)
    sourceLineCount = $info.lineCount
    durationSeconds = $asset.durationSeconds
    videoBytes = $asset.videoBytes
    posterBytes = $asset.posterBytes
    videoUrl = "/dub-pack/$($asset.slug)/scene.webm"
    posterUrl = "/dub-pack/$($asset.slug)/poster.jpg"
  }
}

$catalog | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $OutputPath -Encoding utf8
[pscustomobject]@{
  sceneCount = $catalog.Count
  totalVideoBytes = ($catalog | Measure-Object videoBytes -Sum).Sum
  totalPosterBytes = ($catalog | Measure-Object posterBytes -Sum).Sum
} | Format-List
