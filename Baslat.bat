@echo off
setlocal
cd /d "%~dp0"

echo Collectly veritabani baslatiliyor...
docker compose -f backend\docker-compose.yml up -d db
if errorlevel 1 (
    echo Docker baslatilamadi. Docker Desktop'in acik oldugunu kontrol edin.
    pause
    exit /b 1
)

echo Backend ve frontend ayri pencerelerde aciliyor...
curl.exe --silent --fail http://127.0.0.1:8000/health >nul
if errorlevel 1 start "Collectly Backend" cmd /k "cd /d ""%~dp0backend"" && .venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
curl.exe --silent --fail http://127.0.0.1:5173/ >nul
if errorlevel 1 start "Collectly Frontend" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo Tamamlandi. Arayuz adresi: http://localhost:5173
timeout /t 5
endlocal
