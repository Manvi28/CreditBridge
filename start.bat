@echo off
echo Starting CreditBridge Services...
echo.

echo Starting Backend Server...
start "CreditBridge Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak > nul

echo Starting AI Service...
start "CreditBridge AI" cmd /k "cd ai-service && python app.py"
timeout /t 3 /nobreak > nul

echo Starting Frontend...
start "CreditBridge Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo All services started!
echo.
echo Frontend: http://localhost:5173
echo Backend: http://localhost:5000
echo AI Service: http://localhost:6000
echo.
echo Close this window when done.
pause