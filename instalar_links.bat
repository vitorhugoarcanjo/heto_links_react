@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
title INSTALADOR - HETOSOFT CENTRAL DE LINKS
color 0A

echo ================================================================
echo    HETOSOFT CENTRAL DE LINKS - INSTALADOR AUTOMATICO
echo ================================================================
echo.
echo Pasta base atual: %~dp0
echo Este instalador vai:
echo.
echo   1. Verificar e instalar Git (se necessario)
echo   2. Verificar e instalar Python (se necessario)
echo   3. Verificar e instalar Node.js e npm (se necessario)
echo   4. Baixar o repositorio do GitHub na pasta escolhida
echo   5. Criar o ambiente virtual Python (backend\venv)
echo   6. Instalar dependencias do backend e registrar raiz (.pth)
echo   7. Inicializar o banco SQLite com os dados iniciais
echo   8. Instalar dependencias do frontend (node_modules)
echo   9. Configurar atalho na inicializacao do Windows e iniciar
echo.
echo ================================================================
echo.

set /p confirm="Deseja iniciar a instalacao agora? (S/N): "
if /i not "%confirm%"=="S" (
    echo.
    echo Instalacao cancelada pelo usuario.
    pause
    exit /b 0
)

set "REPOSITORIO=https://github.com/vitorhugoarcanjo/heto_links_react.git"
set "PASTA_BASE=%~dp0"
if "%PASTA_BASE:~-1%"=="\" set "PASTA_BASE=%PASTA_BASE:~0,-1%"
set "PASTA_PROJETO=%PASTA_BASE%\heto_links_react"
set "PRECISA_REABRIR=0"

echo.
echo ================================================================
echo ETAPA 1/9 - VERIFICANDO GIT
echo ================================================================
git --version >nul 2>&1
if errorlevel 1 (
    echo Git nao encontrado. Instalando via winget...
    winget install -e --id Git.Git --accept-package-agreements --accept-source-agreements
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar o Git. Instale em https://git-scm.com/download/win
        pause
        exit /b 1
    )
    set "PRECISA_REABRIR=1"
) else (
    for /f "tokens=*" %%G in ('git --version') do echo [OK] %%G
)

echo.
echo ================================================================
echo ETAPA 2/9 - VERIFICANDO PYTHON
echo ================================================================
python --version >nul 2>&1
if errorlevel 1 (
    echo Python nao encontrado. Instalando Python 3.12 via winget...
    winget install -e --id Python.Python.3.12 --accept-package-agreements --accept-source-agreements
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar o Python. Instale em https://www.python.org/downloads/
        pause
        exit /b 1
    )
    set "PRECISA_REABRIR=1"
) else (
    for /f "tokens=*" %%P in ('python --version') do echo [OK] %%P
)

echo.
echo ================================================================
echo ETAPA 3/9 - VERIFICANDO NODE.JS E NPM
echo ================================================================
node --version >nul 2>&1
if errorlevel 1 (
    echo Node.js nao encontrado. Instalando Node.js LTS via winget...
    winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar o Node.js. Instale em https://nodejs.org/
        pause
        exit /b 1
    )
    set "PRECISA_REABRIR=1"
) else (
    for /f "tokens=*" %%N in ('node --version') do echo [OK] Node.js %%N
)

if "!PRECISA_REABRIR!"=="1" (
    echo.
    echo ================================================================
    echo NOVAS FERRAMENTAS FORAM INSTALADAS NO WINDOWS
    echo Feche esta janela, abra um novo prompt e execute o instalador
    echo novamente para carregar as variaveis de ambiente no PATH.
    echo ================================================================
    pause
    exit /b 0
)

npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] npm nao encontrado. Reinstale o Node.js LTS.
    pause
    exit /b 1
)
for /f "tokens=*" %%M in ('npm --version') do echo [OK] npm %%M

echo.
echo ================================================================
echo ETAPA 4/9 - BAIXANDO PROJETO DO GITHUB
echo ================================================================
if exist "%PASTA_PROJETO%" (
    echo [AVISO] A pasta "%PASTA_PROJETO%" ja existe.
    set /p sobrescrever="Deseja apagar a pasta atual e baixar novamente? (S/N): "
    if /i not "!sobrescrever!"=="S" (
        echo Instalacao cancelada.
        pause
        exit /b 0
    )
    rmdir /s /q "%PASTA_PROJETO%" 2>nul
    if exist "%PASTA_PROJETO%" (
        echo [ERRO] Nao foi possivel remover "%PASTA_PROJETO%". Feche programas em uso.
        pause
        exit /b 1
    )
)

git clone "%REPOSITORIO%" "%PASTA_PROJETO%"
if errorlevel 1 (
    echo [ERRO] Falha ao clonar "%REPOSITORIO%". Verifique sua internet ou acesso ao GitHub.
    pause
    exit /b 1
)
echo [OK] Repositorio clonado em "%PASTA_PROJETO%".

if not exist "%PASTA_PROJETO%\backend" (
    echo [ERRO] Pasta backend nao encontrada no repositorio.
    pause
    exit /b 1
)
if not exist "%PASTA_PROJETO%\frontend\package.json" (
    echo [ERRO] Arquivo frontend\package.json nao encontrado no repositorio.
    pause
    exit /b 1
)

echo.
echo ================================================================
echo ETAPA 5/9 - CRIANDO AMBIENTE VIRTUAL (VENV)
echo ================================================================
if not exist "%PASTA_PROJETO%\backend\venv" (
    python -m venv "%PASTA_PROJETO%\backend\venv"
    if errorlevel 1 (
        echo [ERRO] Falha ao criar o ambiente virtual em backend\venv.
        pause
        exit /b 1
    )
)
echo [OK] Ambiente virtual pronto em "%PASTA_PROJETO%\backend\venv".

echo.
echo ================================================================
echo ETAPA 6/9 - INSTALANDO DEPENDENCIAS PYTHON E CONFIGURANDO RAIZ
echo ================================================================
call "%PASTA_PROJETO%\backend\venv\Scripts\activate.bat"
python -m pip install --upgrade pip

if exist "%PASTA_PROJETO%\backend\requirements.txt" (
    python -m pip install -r "%PASTA_PROJETO%\backend\requirements.txt"
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar pacotes do backend\requirements.txt.
        pause
        exit /b 1
    )
) else (
    python -m pip install flask flask-cors python-dotenv
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar dependencias padrao do Flask.
        pause
        exit /b 1
    )
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$siteDir = (python -c 'import site; print(site.getsitepackages()[0])').Trim(); " ^
  "Set-Content -Path (Join-Path $siteDir 'hetosoft_raiz.pth') -Value '%PASTA_PROJETO%' -Encoding ascii"
if errorlevel 1 (
    echo [ERRO] Falha ao registrar o caminho da raiz no venv.
    pause
    exit /b 1
)
echo [OK] Dependencias Python instaladas e raiz registrada no venv.

echo.
echo ================================================================
echo ETAPA 7/9 - INICIALIZANDO BANCO DE DADOS
echo ================================================================
set "PYTHONPATH=%PASTA_PROJETO%"
cd /d "%PASTA_PROJETO%"
python -m backend.scripts.seed_links_legado
if errorlevel 1 (
    echo [AVISO] Seed nao executado ou ja aplicado; verifique backend\scripts\seed_links_legado.py.
) else (
    echo [OK] Banco de dados inicializado com sucesso.
)

echo.
echo ================================================================
echo ETAPA 8/9 - INSTALANDO DEPENDENCIAS DO FRONTEND
echo ================================================================
cd /d "%PASTA_PROJETO%\frontend"
call npm install
if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias do frontend com npm install.
    pause
    exit /b 1
)
cd /d "%PASTA_PROJETO%"
echo [OK] Dependencias do frontend instaladas.

echo.
echo ================================================================
echo ETAPA 9/9 - INICIALIZACAO AUTOMATICA E START DO SISTEMA
echo ================================================================
set "PASTA_STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "ORIGEM_INICIAR=%PASTA_PROJETO%\iniciar.bat"
set "DESTINO_ATALHO=%PASTA_STARTUP%\Hetosoft Central de Links.lnk"

if exist "%ORIGEM_INICIAR%" (
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
      "$ws = New-Object -ComObject WScript.Shell; " ^
      "$s = $ws.CreateShortcut('%DESTINO_ATALHO%'); " ^
      "$s.TargetPath = '%ORIGEM_INICIAR%'; " ^
      "$s.WorkingDirectory = '%PASTA_PROJETO%'; " ^
      "$s.WindowStyle = 7; " ^
      "$s.Save()"
    echo [OK] Atalho criado em Inicializar do Windows.
    echo Iniciando sistema...
    call "%ORIGEM_INICIAR%"
) else (
    echo [AVISO] iniciar.bat nao encontrado na raiz de "%PASTA_PROJETO%".
    echo Certifique-se de que iniciar.bat esta commitado no repositorio.
)

echo.
echo ================================================================
echo INSTALACAO FINALIZADA COM SUCESSO!
echo ================================================================
pause
endlocal