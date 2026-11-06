@echo off
setlocal EnableExtensions
chcp 65001 >nul
title Collectly - Baslat

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"
set "VENV_PY=%BACKEND%\.venv\Scripts\python.exe"
set "ENV_FILE=%BACKEND%\.env"
set "COMPOSE_FILE="

echo Collectly baslatiliyor...
if not exist "%VENV_PY%" (
    echo HATA: Backend sanal ortami bulunamadi. Once Kurulum.bat dosyasini calistirin.
    goto :FAIL
)
if not exist "%FRONTEND%\node_modules\.bin\vite.cmd" (
    echo HATA: Frontend bagimliliklari bulunamadi. Once Kurulum.bat dosyasini calistirin.
    goto :FAIL
)
if not exist "%ENV_FILE%" (
    echo HATA: backend\.env bulunamadi. Once Kurulum.bat dosyasini calistirin.
    goto :FAIL
)
where docker.exe >nul 2>&1
if errorlevel 1 (
    echo HATA: Docker komutu bulunamadi. Docker Desktop'i yukleyip PATH'e ekleyin.
    goto :FAIL
)
docker info >nul 2>&1
if errorlevel 1 (
    echo HATA: Docker erisilemiyor. Docker Desktop'i acip tamamen hazir olmasini bekleyin.
    goto :FAIL
)
docker compose version >nul 2>&1
if errorlevel 1 (
    echo HATA: Docker Compose eklentisi kullanilamiyor. Docker Desktop'i guncelleyin.
    goto :FAIL
)
where node.exe >nul 2>&1
if errorlevel 1 (
    echo HATA: Node.js bulunamadi. Node.js 20.19+ veya 22.12+ kurun.
    goto :FAIL
)
where npm.cmd >nul 2>&1
if errorlevel 1 (
    echo HATA: npm bulunamadi. Node.js kurulumunu kontrol edin.
    goto :FAIL
)

if exist "%BACKEND%\docker-compose.yml" set "COMPOSE_FILE=%BACKEND%\docker-compose.yml"
if not defined COMPOSE_FILE if exist "%BACKEND%\compose.yaml" set "COMPOSE_FILE=%BACKEND%\compose.yaml"
if not defined COMPOSE_FILE if exist "%BACKEND%\compose.yml" set "COMPOSE_FILE=%BACKEND%\compose.yml"
if not defined COMPOSE_FILE if exist "%ROOT%docker-compose.yml" set "COMPOSE_FILE=%ROOT%docker-compose.yml"
if not defined COMPOSE_FILE if exist "%ROOT%compose.yaml" set "COMPOSE_FILE=%ROOT%compose.yaml"
if not defined COMPOSE_FILE if exist "%ROOT%compose.yml" set "COMPOSE_FILE=%ROOT%compose.yml"
if not defined COMPOSE_FILE (
    for /r "%ROOT%" %%F in (docker-compose.yml compose.yaml compose.yml) do (
        if not defined COMPOSE_FILE set "COMPOSE_FILE=%%~fF"
    )
)
if not defined COMPOSE_FILE (
    echo HATA: Docker Compose dosyasi bulunamadi.
    goto :FAIL
)

echo Veritabani servisi kontrol ediliyor...
docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_FILE%" up -d db
if errorlevel 1 (
    echo HATA: Veritabani baslatilamadi. Docker Desktop ve Compose ayarlarini kontrol edin.
    goto :FAIL
)
set /a DB_WAIT=0
:WAIT_DATABASE
docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_FILE%" exec -T db pg_isready -q >nul 2>&1
if not errorlevel 1 goto :DATABASE_READY
set /a DB_WAIT+=1
if %DB_WAIT% GEQ 60 goto :DATABASE_TIMEOUT
timeout /t 2 /nobreak >nul
goto :WAIT_DATABASE

:DATABASE_READY
echo Veritabani hazir.

echo Backend kontrol ediliyor...
powershell.exe -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:8000/api/v1/health' -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 (
    echo Backend zaten calisiyor: http://127.0.0.1:8000
    goto :CHECK_FRONTEND
)
powershell.exe -NoProfile -Command "if (Get-NetTCPConnection -State Listen -LocalPort 8000 -ErrorAction SilentlyContinue) { exit 0 }; exit 1" >nul 2>&1
if not errorlevel 1 (
    echo UYARI: 8000 portu kullanimda ancak Collectly API yanit vermiyor. Backend ikinci kez baslatilmadi.
    goto :CHECK_FRONTEND
)
start "Collectly Backend" cmd /k "cd /d ""%BACKEND%"" && ""%VENV_PY%"" -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

:CHECK_FRONTEND
echo Frontend kontrol ediliyor...
powershell.exe -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:5173/' -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 (
    echo Frontend zaten calisiyor: http://localhost:5173
    goto :SUCCESS
)
powershell.exe -NoProfile -Command "if (Get-NetTCPConnection -State Listen -LocalPort 5173 -ErrorAction SilentlyContinue) { exit 0 }; exit 1" >nul 2>&1
if not errorlevel 1 (
    echo UYARI: 5173 portu kullanimda ancak Vite yanit vermiyor. Frontend ikinci kez baslatilmadi.
    goto :SUCCESS
)
start "Collectly Frontend" cmd /k "cd /d ""%FRONTEND%"" && call npm run dev -- --host 127.0.0.1 --strictPort"

:SUCCESS
echo.
echo Collectly hazir. Arayuz: http://localhost:5173
echo API: http://127.0.0.1:8000/docs
echo Bu pencereyi kapatabilirsiniz; sunucular kendi pencerelerinde calisir.
exit /b 0

:DATABASE_TIMEOUT
echo HATA: Veritabani 120 saniye icinde hazir olmadi.
echo Docker Desktop'taki Collectly veritabani konteynerinin durumunu kontrol edin.
goto :FAIL

:FAIL
echo.
pause
exit /b 1
