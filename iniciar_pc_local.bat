@echo off
setlocal EnableExtensions
chcp 65001 >nul
title Hetosoft - Inicializador

set "RAIZ=%~dp0"
if "%RAIZ:~-1%"=="\" set "RAIZ=%RAIZ:~0,-1%"
set "PYTHON=%RAIZ%\backend\venv\Scripts\python.exe"
set "URL_FRONTEND=http://localhost:5173/"
set "PYTHONPATH=%RAIZ%"

 echo ================================================================
 echo       HETOSOFT - CENTRAL DE LINKS
 echo ================================================================
 echo.

if not exist "%PYTHON%" (
    echo [ERRO] Python do ambiente virtual nao encontrado:
    echo        %PYTHON%
    echo Rode o instalador novamente para preparar o backend.
    pause
    exit /b 1
)

if not exist "%RAIZ%\backend\app.py" (
    echo [ERRO] Nao encontrei backend\app.py.
    pause
    exit /b 1
)

if not exist "%RAIZ%\frontend\package.json" (
    echo [ERRO] Nao encontrei frontend\package.json.
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERRO] npm nao encontrado. Instale o Node.js e execute o instalador novamente.
    pause
    exit /b 1
)

if not exist "%RAIZ%\backend\instance\meus_links.db" if exist "%RAIZ%\backend\scripts\seed_links_legado.py" (
    echo [0/2] Banco nao encontrado. Executando inicializacao...
    pushd "%RAIZ%"
    "%PYTHON%" -m backend.scripts.seed_links_legado
    if errorlevel 1 (
        popd
        echo [ERRO] Falha ao inicializar o banco de dados.
        pause
        exit /b 1
    )
    popd
    echo.
)

echo [1/2] Iniciando Backend Flask...
rem O PYTHONPATH e herdado pela janela filha; aspas corretas para caminhos com espacos.
start "Hetosoft - Backend" /D "%RAIZ%" cmd.exe /k ""%PYTHON%" -m backend.app"

echo Aguardando o Backend responder na porta 5000...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$limite=(Get-Date).AddSeconds(45); do { $c=New-Object Net.Sockets.TcpClient; try { $a=$c.BeginConnect('127.0.0.1',5000,$null,$null); if($a.AsyncWaitHandle.WaitOne(1000) -and $c.Connected) { $c.EndConnect($a); $c.Close(); exit 0 } } catch {} finally { $c.Close() }; Start-Sleep -Seconds 1 } while((Get-Date) -lt $limite); exit 1"
if errorlevel 1 (
    echo.
    echo [ERRO] O Backend nao iniciou na porta 5000.
    echo Confira a janela "Hetosoft - Backend" e veja a mensagem de erro do Flask.
    pause
    exit /b 1
)

echo.
echo [2/2] Iniciando Frontend React/Vite...
start "Hetosoft - Frontend" /D "%RAIZ%\frontend" cmd.exe /k "npm run dev -- --host 127.0.0.1 --strictPort"

echo Aguardando o Frontend ficar disponivel...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$limite=(Get-Date).AddSeconds(60); do { try { $r=Invoke-WebRequest -Uri '%URL_FRONTEND%' -UseBasicParsing -TimeoutSec 2; if($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { exit 0 } } catch {}; Start-Sleep -Seconds 2 } while((Get-Date) -lt $limite); exit 1"
if errorlevel 1 (
    echo.
    echo [ERRO] O Frontend nao respondeu dentro de 60 segundos.
    echo Confira a janela "Hetosoft - Frontend" para ver o erro do Vite.
    pause
    exit /b 1
)

start "" "%URL_FRONTEND%"
echo.
echo Sistema iniciado! Abrindo %URL_FRONTEND%
timeout /t 2 /nobreak >nul
exit /b 0
