@echo off
chcp 65001 > nul
cls
echo ============================================================
echo   🚀 ACHEI AQUI GO - PUBLICADOR AUTOMÁTICO DE PRODUÇÃO
echo ============================================================
echo.

:: 1. Validação de Build
echo [1/3] 🔨 Verificando e compilando o projeto (npm run build)...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERRO: O build de produção falhou.
    echo Corrija os erros acima antes de subir para produção.
    pause
    exit /b %errorlevel%
)
echo ✅ Build concluído com sucesso!
echo.

:: 2. Mensagem de Atualização
echo [2/3] 📝 Preparando commit...
set /p MENSAGEM="Digite o que mudou nesta atualização (ou aperte ENTER para padrão): "
if "%MENSAGEM%"=="" (
    set MENSAGEM=feat: atualizacao do app %date% %time%
)

git add .
git commit -m "%MENSAGEM%"
if %errorlevel% neq 0 (
    echo ℹ️ Nenhuma alteração detectada para commit.
)

:: 3. Envio para o GitHub e Vercel
echo.
echo [3/3] 🌐 Enviando atualizações para o GitHub e Vercel...
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo ⚠️ Falha ao fazer git push. Verifique se o repositório remoto está conectado.
    pause
    exit /b %errorlevel%
)

echo.
echo ============================================================
echo   🎉 SUCESSO! O APP FOI ATUALIZADO EM PRODUÇÃO!
echo   A Vercel já está distribuindo a nova versão online.
echo ============================================================
echo.
pause
