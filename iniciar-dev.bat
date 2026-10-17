@echo off
chcp 65001 > nul
cls
echo ============================================================
echo   💻 INICIANDO AMBIENTE DE DESENVOLVIMENTO - ACHEI AQUI GO
echo ============================================================
echo.
echo Abrindo servidor local em http://localhost:3000...
echo Para parar o servidor, pressione CTRL+C na janela.
echo.
call npm run dev
pause
