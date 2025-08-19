Write-Host "Starting CakeShop API Server..." -ForegroundColor Green
Set-Location "C:\xampp\htdocs\CakeShop\api"
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Starting server on port 4000..." -ForegroundColor Green
node index.js
