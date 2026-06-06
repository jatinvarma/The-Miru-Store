@echo off
echo.
echo ========================================
echo   Starting MIRU E-commerce Store...
echo ========================================
echo   Backend API  - http://localhost:3001
echo   Frontend     - http://localhost:3000
echo ========================================
echo.

:: Ensure node is in PATH (in case the user hasn't restarted their terminal yet)
set PATH=%PATH%;C:\Program Files\nodejs

:: Run backend and frontend side-by-side using concurrently
call npx.cmd --yes concurrently "cd backend && node server.js" "cd frontend && npm run dev"

pause
