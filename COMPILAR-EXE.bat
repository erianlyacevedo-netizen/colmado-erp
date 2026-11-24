@echo off
cd /d "%~dp0"
where node >nul 2>&1 || goto fail
where npm >nul 2>&1 || goto fail
call npm install
if errorlevel 1 goto fail
call npm run dist
if errorlevel 1 goto fail
explorer "%~dp0dist"
echo Instalador generado en dist.
pause
exit /b 0
:fail
echo No se pudo compilar. Revisa el error anterior. Se necesita Node.js 22 y conexion a Internet para descargar dependencias.
pause
exit /b 1
