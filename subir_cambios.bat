@echo off
echo ==========================================
echo      SUBIENDO CAMBIOS A GITHUB
echo ==========================================
echo.
echo 1. Preparando archivos...
git add .

echo.
echo 2. Guardando cambios...
git commit -m "Actualizacion: Mejoras en Eventos, Calendario y TPV"

echo.
echo 3. Enviando a la nube (Vercel)...
git push

echo.
echo ==========================================
if %errorlevel% equ 0 (
    echo    TODO CORRECTO - CAMBIOS SUBIDOS
) else (
    echo    HUBO UN ERROR - REVISA LOS MENSAJES
)
echo ==========================================
echo.
pause
