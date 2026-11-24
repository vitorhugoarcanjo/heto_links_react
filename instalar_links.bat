@echo off
setlocal EnableExtensions DisableDelayedExpansion
title HETOSOFT - INSTALADOR
color 0A

rem ================================================================
rem A PASTA ONDE ESTE BAT ESTA E A PASTA RAIZ DO SISTEMA.
rem O projeto sera copiado diretamente para esta pasta.
rem ================================================================

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
set "REPO=https://github.com/vitorhugoarcanjo/heto_links_react.git"
set "VENV=%ROOT%\backend\venv"
set "PYEXE="
set "STAGE=%TEMP%\HetosoftClone_%RANDOM%_%RANDOM%"

echo.
echo ============================================================
echo              HETOSOFT - INSTALADOR MODULAR
echo ============================================================
echo.
echo Pasta de instalacao:
echo "%ROOT%"
echo.
echo O projeto sera instalado DIRETAMENTE nessa pasta.
echo.
set "ANSWER="
set /p "ANSWER=Pressione S para continuar ou N para cancelar: "
if /i not "%ANSWER%"=="S" goto CANCEL

echo.
echo [0/7] Verificando o gerenciador de pacotes do Windows...
where winget >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Winget nao encontrado.
    echo Instale "Instalador de Aplicativo" pela Microsoft Store.
    goto ERROR
)
echo [OK] Winget encontrado.

echo.
echo [1/7] Verificando Git...
where git >nul 2>&1
if errorlevel 1 (
    echo Git ausente. Instalando...
    winget install --exact --id Git.Git --silent --accept-package-agreements --accept-source-agreements
    if errorlevel 1 goto ERROR_GIT
    call :REFRESH_PATH
)
where git >nul 2>&1
if errorlevel 1 goto ERROR_GIT
git --version
echo [OK] Git pronto.

echo.
echo [2/7] Verificando Python e pip...
call :FIND_PYTHON
if not defined PYEXE (
    echo Python ausente. Instalando Python 3.12...
    winget install --exact --id Python.Python.3.12 --silent --accept-package-agreements --accept-source-agreements
    if errorlevel 1 goto ERROR_PYTHON
    call :REFRESH_PATH
    call :FIND_PYTHON
)
if not defined PYEXE goto ERROR_PYTHON
"%PYEXE%" --version
"%PYEXE%" -m pip --version >nul 2>&1
if errorlevel 1 (
    "%PYEXE%" -m ensurepip --upgrade
    if errorlevel 1 goto ERROR_PIP
)
echo [OK] Python e pip prontos.

echo.
echo [3/7] Verificando Node.js e npm...
where node >nul 2>&1
if errorlevel 1 (
    echo Node.js ausente. Instalando LTS...
    winget install --exact --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    if errorlevel 1 goto ERROR_NODE
    call :REFRESH_PATH
)
where node >nul 2>&1
if errorlevel 1 goto ERROR_NODE
where npm >nul 2>&1
if errorlevel 1 goto ERROR_NODE
node --version
call npm --version
echo [OK] Node.js e npm prontos.

echo.
echo [4/7] Obtendo os arquivos do projeto...
if exist "%ROOT%\.git\HEAD" (
    echo Repositorio Git ja existe nesta pasta. Atualizando...
    git -C "%ROOT%" pull --ff-only
    if errorlevel 1 goto ERROR_PULL
) else (
    if exist "%ROOT%\backend\" (
        echo [ERRO] Ja existe uma pasta backend, mas nao ha repositorio Git.
        echo Para evitar sobrescrever arquivos, use uma pasta vazia.
        goto ERROR
    )
    echo Clonando em pasta temporaria...
    git clone "%REPO%" "%STAGE%"
    if errorlevel 1 goto ERROR_CLONE

    echo Copiando o projeto para a pasta deste instalador...
    call :COPY_PROJECT
    if errorlevel 1 goto ERROR_COPY
    if exist "%STAGE%" rmdir /s /q "%STAGE%"
)
if not exist "%ROOT%\backend\" goto ERROR_LAYOUT
if not exist "%ROOT%\frontend\package.json" goto ERROR_LAYOUT
echo [OK] Estrutura do projeto encontrada.

echo.
echo [5/7] Preparando Flask e ambiente virtual...
if exist "%ROOT%\backend\requirements.txt" (
    set "REQ=%ROOT%\backend\requirements.txt"
) else if exist "%ROOT%\requirements.txt" (
    set "REQ=%ROOT%\requirements.txt"
) else (
    goto ERROR_REQUIREMENTS
)

if not exist "%VENV%\Scripts\python.exe" (
    if exist "%VENV%" rmdir /s /q "%VENV%"
    "%PYEXE%" -m venv "%VENV%"
    if errorlevel 1 goto ERROR_VENV
)
set "VPY=%VENV%\Scripts\python.exe"
if not exist "%VPY%" goto ERROR_VENV

"%VPY%" -m pip install --upgrade pip
if errorlevel 1 goto ERROR_PIP_INSTALL
"%VPY%" -m pip install -r "%REQ%"
if errorlevel 1 goto ERROR_REQUIREMENTS_INSTALL

"%VPY%" -c "import dotenv" >nul 2>&1
if errorlevel 1 (
    echo Instalando python-dotenv...
    "%VPY%" -m pip install python-dotenv
    if errorlevel 1 goto ERROR_DOTENV
)
echo [OK] Dependencias Python instaladas.

echo.
echo [6/7] Instalando dependencias React...
pushd "%ROOT%\frontend"
if errorlevel 1 goto ERROR_FRONTEND
call npm install
set "NPM_RC=%ERRORLEVEL%"
popd
if not "%NPM_RC%"=="0" goto ERROR_NPM_INSTALL
echo [OK] Dependencias React instaladas.

echo.
echo [7/7] Inicializacao...
if exist "%ROOT%\backend\scripts\seed_links_legado.py" (
    echo Executando rotina de banco existente...
    pushd "%ROOT%"
    set "PYTHONPATH=%ROOT%;%PYTHONPATH%"
    "%VPY%" -m backend.scripts.seed_links_legado
    set "SEED_RC=%ERRORLEVEL%"
    popd
    if not "%SEED_RC%"=="0" echo [AVISO] Rotina de banco retornou erro. Confira o banco antes de usar.
)

if exist "%ROOT%\iniciar.bat" (
    echo Executando iniciar.bat...
    pushd "%ROOT%"
    call "%ROOT%\iniciar.bat"
    set "START_RC=%ERRORLEVEL%"
    popd
    if not "%START_RC%"=="0" echo [AVISO] iniciar.bat encerrou com codigo %START_RC%.
) else (
    echo [AVISO] iniciar.bat nao encontrado na raiz.
)

echo.
echo ============================================================
echo INSTALADOR FINALIZADO
echo Pasta: "%ROOT%"
echo ============================================================
pause
exit /b 0

:FIND_PYTHON
set "PYEXE="
where py >nul 2>&1
if not errorlevel 1 (
    for /f "delims=" %%P in ('py -3 -c "import sys; print(sys.executable)" 2^>nul') do set "PYEXE=%%P"
)
if defined PYEXE if exist "%PYEXE%" exit /b 0
set "PYEXE="
where python >nul 2>&1
if not errorlevel 1 (
    for /f "delims=" %%P in ('python -c "import sys; print(sys.executable)" 2^>nul') do set "PYEXE=%%P"
)
if defined PYEXE if exist "%PYEXE%" exit /b 0
set "PYEXE="
exit /b 0

:REFRESH_PATH
set "PATH=%PATH%;%ProgramFiles%\Git\cmd;%ProgramFiles%\Git\bin;%ProgramFiles%\nodejs;%LocalAppData%\Programs\Python\Python312;%LocalAppData%\Programs\Python\Python312\Scripts;%ProgramFiles%\Python312;%ProgramFiles%\Python312\Scripts"
exit /b 0

:COPY_PROJECT
rem ROOT nao termina com barra: evita erro de aspas no Robocopy.
robocopy "%STAGE%" "%ROOT%" /E /R:2 /W:2 /XF "%~nx0"
if errorlevel 8 exit /b 1
exit /b 0

:CANCEL
echo.
echo Instalacao cancelada pelo usuario.
pause
exit /b 0

:ERROR_GIT
echo [ERRO] Nao foi possivel instalar ou localizar o Git.
goto ERROR
:ERROR_PYTHON
echo [ERRO] Nao foi possivel instalar ou localizar o Python.
goto ERROR
:ERROR_PIP
echo [ERRO] Nao foi possivel preparar o pip.
goto ERROR
:ERROR_NODE
echo [ERRO] Nao foi possivel instalar ou localizar Node.js/npm.
goto ERROR
:ERROR_PULL
echo [ERRO] git pull falhou. Verifique a conexao e alteracoes locais.
goto ERROR
:ERROR_CLONE
echo [ERRO] Falha ao clonar o repositorio do GitHub.
goto ERROR
:ERROR_COPY
echo [ERRO] Falha ao copiar os arquivos para a pasta do instalador.
goto ERROR
:ERROR_LAYOUT
echo [ERRO] Estrutura esperada nao encontrada: backend\ e frontend\package.json.
goto ERROR
:ERROR_REQUIREMENTS
echo [ERRO] requirements.txt nao encontrado em backend nem na raiz.
goto ERROR
:ERROR_VENV
echo [ERRO] Falha ao criar ou localizar backend\venv.
goto ERROR
:ERROR_PIP_INSTALL
echo [ERRO] Falha ao atualizar pip no ambiente virtual.
goto ERROR
:ERROR_REQUIREMENTS_INSTALL
echo [ERRO] pip install -r requirements.txt falhou.
goto ERROR
:ERROR_DOTENV
echo [ERRO] Nao foi possivel instalar python-dotenv.
goto ERROR
:ERROR_FRONTEND
echo [ERRO] Nao foi possivel acessar a pasta frontend.
goto ERROR
:ERROR_NPM_INSTALL
echo [ERRO] npm install falhou no frontend.
goto ERROR

:ERROR
echo.
echo ============================================================
echo INSTALACAO INTERROMPIDA
echo A janela ficara aberta para voce ler o erro.
echo Corrija o problema e execute o instalador novamente.
echo ============================================================
if exist "%STAGE%" rmdir /s /q "%STAGE%" >nul 2>&1
pause
exit /b 1
