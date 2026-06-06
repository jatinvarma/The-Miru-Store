$path = "frontend/src/style.css"
$content = Get-Content $path -Raw
$content = $content -replace 'Plus Jakarta Sans', 'Inter'
Set-Content $path $content
Write-Host "Done"
