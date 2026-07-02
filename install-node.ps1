$nodeVersion = "v20.15.0"
$zipUrl = "https://nodejs.org/dist/$nodeVersion/node-$nodeVersion-win-x64.zip"
$destDir = "$HOME\.node-bin"
$zipFile = "$destDir\node.zip"

try {
    if (!(Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }

    Write-Host "1. Mengunduh Node.js $nodeVersion dari nodejs.org..."
    $webClient = New-Object System.Net.WebClient
    $webClient.DownloadFile($zipUrl, $zipFile)

    Write-Host "2. Mengekstrak berkas Node.js..."
    Expand-Archive -Path $zipFile -DestinationPath $destDir -Force

    Write-Host "3. Merapikan folder instalasi..."
    $extractedDir = Get-ChildItem -Path $destDir -Directory | Where-Object { $_.Name -like "node-*" } | Select-Object -First 1
    if ($extractedDir) {
        Copy-Item -Path "$($extractedDir.FullName)\*" -Destination $destDir -Recurse -Force
        Remove-Item -Path $extractedDir.FullName -Recurse -Force
    }

    Remove-Item -Path $zipFile -Force
    Write-Host "Node.js berhasil diinstal secara lokal di: $destDir"
    Write-Host "Silakan jalankan: & '$destDir\node.exe' -v untuk memverifikasi."
}
catch {
    Write-Error "Terjadi kesalahan saat menginstal Node.js: $_"
}
