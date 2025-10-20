@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

echo ===========================================================
echo === TILEAR VIENTO (4326 -> 3857 -> XYZ)  — QGIS 3.40.8 ====
echo ===========================================================

REM --- Rutas de tu instalación QGIS 3.40.8 ---
set "GDAL_BIN=C:\Program Files\QGIS 3.40.8\bin"
set "PYTHON_EXE=C:\Program Files\QGIS 3.40.8\apps\Python312\python.exe"
set "GDAL2TILES=C:\Program Files\QGIS 3.40.8\apps\Python312\Scripts\gdal2tiles.py"

REM --- Rutas del proyecto (ajusta BASE_DIR si lo necesitas) ---
set "BASE_DIR=C:\Users\ctmiraperceval\Documents\GitHub\geointel-demo\misiones\mision2"
set "INPUT_TIF=%BASE_DIR%\tiles\WindMap.tif"              REM <- TIFF EN 4326
set "OUTPUT_3857=%BASE_DIR%\tiles\WindMap_3857.tif"
set "VRT_OUT=%BASE_DIR%\tiles\WindMap_byte.vrt"
set "TILE_OUT=%BASE_DIR%\tiles\WindMap"

REM --- Zooms de salida (ajusta si quieres más detalle) ---
set "ZOOM=2-12"

echo 🧹 Limpiando carpeta de tiles antiguas...
if exist "%TILE_OUT%" rmdir /S /Q "%TILE_OUT%"
mkdir "%TILE_OUT%"

echo 🗺️ Reproyectando 4326 -> 3857 con gdalwarp...
"%GDAL_BIN%\gdalwarp.exe" -s_srs EPSG:4326 -t_srs EPSG:3857 -r bilinear -dstalpha -multi -wo NUM_THREADS=ALL_CPUS -overwrite "%INPUT_TIF%" "%OUTPUT_3857%"
if %errorlevel% neq 0 ( echo ❌ Error en gdalwarp & pause & exit /b 1 )

echo 🌈 Convirtiendo a 8-bit (VRT) para web...
"%GDAL_BIN%\gdal_translate.exe" -of VRT -ot Byte -scale "%OUTPUT_3857%" "%VRT_OUT%"
if %errorlevel% neq 0 ( echo ❌ Error en gdal_translate & pause & exit /b 1 )

echo 🧭 Generando tiles XYZ (perfil mercator)...
"%PYTHON_EXE%" "%GDAL2TILES%" -p mercator -z %ZOOM% -r bilinear -w none "%VRT_OUT%" "%TILE_OUT%"
if %errorlevel% neq 0 ( echo ❌ Error en gdal2tiles & pause & exit /b 1 )

echo ✅ Tiles generados correctamente en:
echo %TILE_OUT%
echo     (estructura esperada: ...\WindMap\{z}\{x}\{y}.png)
echo ===========================================================
pause
