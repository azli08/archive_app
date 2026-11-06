@echo off
setlocal EnableExtensions
chcp 65001 >nul
title Collectly - Ilk Kurulum

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"
set "ENV_FILE=%BACKEND%\.env"
set "ENV_EXAMPLE=%BACKEND%\.env.example"
set "VENV_PY=%BACKEND%\.venv\Scripts\python.exe"
set "PY_LAUNCHER="
set "COMPOSE_FILE="

echo Collectly ilk kurulum denetimleri baslatiliyor...
if not exist "%BACKEND%\requirements.txt" (
    echo HATA: backend\requirements.txt bulunamadi. Proje dosyalarini kontrol edin.
    goto :FAIL
)
if not exist "%FRONTEND%\package.json" (
    echo HATA: frontend\package.json bulunamadi. Proje dosyalarini kontrol edin.
    goto :FAIL
)

where docker.exe >nul 2>&1
if errorlevel 1 (
    echo HATA: Docker komutu bulunamadi. Docker Desktop'i kurun ve PATH'e ekleyin.
    goto :FAIL
)
docker --version >nul 2>&1
if errorlevel 1 (
    echo HATA: Docker CLI baslatilamadi. Docker Desktop kurulumunu kontrol edin.
    goto :FAIL
)
docker compose version >nul 2>&1
if errorlevel 1 (
    echo HATA: Docker Compose v2 bulunamadi. Docker Desktop'i guncelleyip yeniden acin.
    goto :FAIL
)
docker info >nul 2>&1
if errorlevel 1 (
    echo HATA: Docker motoruna erisilemiyor. Docker Desktop'i acip hazir olmasini bekleyin.
    goto :FAIL
)

where py.exe >nul 2>&1
if not errorlevel 1 (
    py -3 --version >nul 2>&1
    if not errorlevel 1 set "PY_LAUNCHER=py -3"
)
if not defined PY_LAUNCHER (
    where python.exe >nul 2>&1
    if not errorlevel 1 (
        python --version >nul 2>&1
        if not errorlevel 1 set "PY_LAUNCHER=python"
    )
)
if not defined PY_LAUNCHER (
    echo HATA: Python 3 bulunamadi. Python 3 yukleyin ve PATH secenegini etkinlestirin.
    goto :FAIL
)
%PY_LAUNCHER% -c "import sys; raise SystemExit(0 if sys.version_info.major == 3 else 1)" >nul 2>&1
if errorlevel 1 (
    echo HATA: Python 3 calistirilamadi. Python kurulumunu kontrol edin.
    goto :FAIL
)

where node.exe >nul 2>&1
if errorlevel 1 (
    echo HATA: Node.js bulunamadi. Node.js 20.19+ veya 22.12+ yukleyin.
    goto :FAIL
)
node --version >nul 2>&1
if errorlevel 1 (
    echo HATA: Node.js calistirilamadi. Node.js kurulumunu kontrol edin.
    goto :FAIL
)
node -e "const [major,minor]=process.versions.node.split('.').map(Number);process.exit(((major===20&&minor>=19)||(major===22&&minor>=12)||major>22)?0:1)" >nul 2>&1
if errorlevel 1 (
    echo HATA: Bu frontend Node.js 20.19+ veya 22.12+ gerektiriyor. Node.js'i guncelleyin.
    goto :FAIL
)
where npm.cmd >nul 2>&1
if errorlevel 1 (
    echo HATA: npm bulunamadi. Node.js'in npm ile birlikte kuruldugunu kontrol edin.
    goto :FAIL
)
npm --version >nul 2>&1
if errorlevel 1 (
    echo HATA: npm calistirilamadi. Node.js kurulumunu kontrol edin.
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
    echo HATA: Proje icinde bir Docker Compose dosyasi bulunamadi.
    goto :FAIL
)
echo Docker Compose dosyasi bulundu: "%COMPOSE_FILE%"

if not exist "%ENV_FILE%" (
    if not exist "%ENV_EXAMPLE%" (
        echo HATA: backend\.env.example bulunamadi; .env dosyasi olusturulamadi.
        goto :FAIL
    )
    copy "%ENV_EXAMPLE%" "%ENV_FILE%" >nul
    if errorlevel 1 (
        echo HATA: backend\.env dosyasi sablondan olusturulamadi.
        goto :FAIL
    )
    echo backend\.env, .env.example sablonundan olusturuldu.
) else (
    echo backend\.env zaten var; dosyanin uzerine yazilmadi.
)

if not exist "%VENV_PY%" (
    echo Backend icin Python sanal ortami olusturuluyor...
    %PY_LAUNCHER% -m venv "%BACKEND%\.venv"
    if errorlevel 1 (
        echo HATA: Backend sanal ortami olusturulamadi.
        goto :FAIL
    )
)
if not exist "%VENV_PY%" (
    echo HATA: Sanal ortam Python dosyasi bulunamadi: "%VENV_PY%"
    goto :FAIL
)
echo Backend Python bagimliliklari kuruluyor...
"%VENV_PY%" -m pip install -r "%BACKEND%\requirements.txt"
if errorlevel 1 (
    echo HATA: Python bagimliliklari kurulamadi. Internet baglantisini ve pip ciktisini kontrol edin.
    goto :FAIL
)

echo Frontend bagimliliklari kuruluyor...
pushd "%FRONTEND%"
if exist package-lock.json (
    call npm ci
) else (
    call npm install
)
if errorlevel 1 (
    echo HATA: Frontend bagimliliklari kurulamadi. npm ciktisini kontrol edin.
    goto :FAIL
)
popd

echo Veritabani servisi baslatiliyor...
docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_FILE%" up -d db
if errorlevel 1 (
    echo HATA: Veritabani baslatilamadi. Docker ciktisini kontrol edin.
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
echo Veritabani hazir. Migration'lar uygulaniyor...
pushd "%BACKEND%"
"%VENV_PY%" -m alembic upgrade head
set "MIGRATION_RESULT=%ERRORLEVEL%"
popd
if not "%MIGRATION_RESULT%"=="0" (
    echo HATA: Veritabani migration'lari uygulanamadi. Yukaridaki Alembic ciktisini kontrol edin.
    goto :FAIL
)

echo.
echo Ilk kurulum basariyla tamamlandi.
echo Bundan sonraki acilislarda proje klasorundeki Baslat.bat dosyasina cift tiklamaniz yeterli.
echo Yerel backend ayarlari backend\.env icindedir; bu dosya Git'e eklenmemelidir.
echo.
pause
exit /b 0

:DATABASE_TIMEOUT
echo HATA: Veritabani 120 saniye icinde hazir olmadi.
echo Docker Desktop'taki Collectly veritabani konteynerinin durumunu kontrol edin.
goto :FAIL

:FAIL
echo.
pause
exit /b 1
