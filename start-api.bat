@echo off
echo Starting CakeShop API Server...
cd /d "C:\xampp\htdocs\CakeShop\api"
echo Current directory: %cd%
echo.
echo Starting server on port 4000...
node index.js
pause
