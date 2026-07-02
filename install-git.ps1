$gitVersion = "2.45.2"
$zipUrl = "https://github.com/git-for-windows/git/releases/download/v$gitVersion.windows.1/MinGit-$gitVersion-64-bit.zip"
$destDir = "$HOME\.git-bin"
$zipFile = "$destDir\git.zip"

try {
    if (!(Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }

    Write-Host "1. Mengunduh MinGit $gitVersion dari GitHub..."
    $webClient = New-Object System.Net.WebClient
    # Use TLS 1.2
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $webClient.DownloadFile($zipUrl, $zipFile)

    Write-Host "2. Mengekstrak berkas MinGit..."
    Expand-Archive -Path $zipFile -DestinationPath $destDir -Force

    Remove-Item -Path $zipFile -Force
    Write-Host "MinGit berhasil diinstal secara lokal di: $destDir"
}
catch {
    Write-Error "Terjadi kesalahan saat menginstal Git: $_"
}
