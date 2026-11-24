@echo off
setlocal EnableExtensions
chcp 65001 >nul
title Hetosoft - Central de Links

set "RAIZ=%~dp0"
if "%RAIZ:~-1%"=="\" set "RAIZ=%RAIZ:~0,-1%"

echo ================================================================
echo    INICIANDO HETOSOFT - CENTRAL DE LINKS
echo ================================================================
echo.

:: Verifica ambiente virtual do backend
if not exist "%RAIZ%\backend\venv\Scripts\activate.bat" (
    echo [ERRO] Ambiente virtual nao encontrado em backend\venv.
    echo Rode o instalador primeiro ou crie o venv em backend\venv.
    pause
    exit /b 1
)

:: Garante banco inicial caso ainda nao exista
if not exist "%RAIZ%\backend\instance\meus_links.db" (
    echo [0/2] Banco de dados nao encontrado. Executando seed inicial...
    cmd /c "cd /d "%RAIZ%" && call "%RAIZ%\backend\venv\Scripts\activate.bat" && set "PYTHONPATH=%RAIZ%" && python -m backend.scripts.seed_links_legado"
    if errorlevel 1 (
        echo [ERRO] Falha ao inicializar o banco de dados.
        pause
        exit /b 1
    )
    echo.
)

:: 1. Inicia Backend Flask a partir da raiz do projeto
echo [1/2] Subindo servidor Backend (http://127.0.0.1:5000)...
start "Hetosoft Links - Backend" /D "%RAIZ%" cmd /k "call "%RAIZ%\backend\venv\Scripts\activate.bat" && set "PYTHONPATH=%RAIZ%" && python -m backend.app"

timeout /t 3 /nobreak >nul

:: 2. Inicia Frontend Vite
echo [2/2] Subindo interface Frontend (http://localhost:5173)...
start "Hetosoft Links - Frontend" /D "%RAIZ%\frontend" cmd /k "npm run dev"

timeout /t 4 /nobreak >nul

:: Abre o navegador na aplicacao
start "" "http://localhost:5173"

echo.
echo ================================================================
echo   Sistema iniciado!
echo   Mantenha as janelas "Backend" e "Frontend" abertas durante o uso.
echo ================================================================
timeout /t 3 /nobreak >nul
exit /b 0