@echo off
setlocal enabledelayedexpansion

REM ===========================================================
REM === SCRIPT DE CONVERSIÓN Y GENERACIÓN DE TILES RASTER ====
REM ===========================================================

REM --- Rutas principales ---
set "GDAL_BIN=C:\Program Files\QGIS 3.40.7\bin"
set "PYTHON_EXE=C:\Program Files\QGIS 3.40.7\apps\Python312\python.exe"
set "GDAL2TILES=C:\Program Files\QGIS 3.40.7\apps\Python312\Scripts\gdal2tiles.py"

set "RASTER_DIR=C:\Users\usuario\Documents\GitHub\geointel-demo\misiones\mision3\dashboard\raster"
set "TILES_DIR=C:\Users\usuario\Documents\GitHub\geointel-demo\misiones\mision3\dashboard\tiles"

set RASTERS=dNDVI dSAR DEM THERMAL
set ZOOM=6-10

echo 🧹 Limpiando carpeta de tiles antiguas...
if exist "%TILES_DIR%" rmdir /S /Q "%TILES_DIR%"
mkdir "%TILES_DIR%"

echo ===========================================================
echo === CONVIRTIENDO A EPSG:3857 Y GENERANDO TILES ===========
echo ===========================================================

for %%R in (%RASTERS%) do (
    echo.
    echo 🔹 Procesando %%R...
    set "INPUT=%RASTER_DIR%\%%R_AOI.tif"
    set "OUTPUT3857=%RASTER_DIR%\%%R_3857.tif"
    set "VRT_OUT=%RASTER_DIR%\%%R_byte.vrt"
    set "TILE_OUT=%TILES_DIR%\%%R"

    echo 🗺️  Reproyectando %%R a EPSG:3857...
    "%GDAL_BIN%\gdalwarp.exe" -t_srs EPSG:3857 "!INPUT!" "!OUTPUT3857!" -overwrite

    echo 🌈  Convirtiendo %%R a 8-bit...
    "%GDAL_BIN%\gdal_translate.exe" -of VRT -ot Byte -scale "!OUTPUT3857!" "!VRT_OUT!"

    echo 🧭  Generando tiles para %%R...
    "%PYTHON_EXE%" "%GDAL2TILES%" -z %ZOOM% -w none "!VRT_OUT!" "!TILE_OUT!"

    echo ✅  %%R completado.
)

echo ===========================================================
echo ===     PROCESO FINALIZADO CORRECTAMENTE               ====
echo ===========================================================
pause
