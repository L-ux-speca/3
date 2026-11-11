# Запуск из терминала VS Code:  powershell -ExecutionPolicy Bypass -File update-lists.ps1
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
function List($dir, $ext) {
  $p = Join-Path $root $dir
  if (Test-Path $p) { ,@(Get-ChildItem $p -File | Where-Object { $ext -contains $_.Extension.ToLower() } | Sort-Object Name | ForEach-Object { $_.Name }) } else { ,@() }
}
$img = ".jpg", ".jpeg", ".png", ".webp", ".gif"
$data = [ordered]@{
  photos   = (List "photos" $img)
  videos   = (List "videos" (".mp4", ".webm", ".m4v"))
  myPhotos = (List "my-photos" $img)
  music    = (List "music" (".mp3", ".m4a", ".ogg", ".wav"))
}
$json = $data | ConvertTo-Json -Depth 3
[System.IO.File]::WriteAllText((Join-Path $root "data\files.json"), $json, (New-Object System.Text.UTF8Encoding $false))
Write-Host "Готово. Фото: $($data.photos.Count), мои фото: $($data.myPhotos.Count), видео: $($data.videos.Count), музыка: $($data.music.Count)"
