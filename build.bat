@echo off
REM Build the engine's tests with the Mettle compiler (v0.17+): tests\engine_only.exe (the renderer with no game) and
REM tests\hello_vk.exe (the Vulkan layer alone: a compute pass and a triangle). Set METTLE_EXE to point at the compiler
REM elsewhere. Needs the Vulkan SDK (its installer sets VULKAN_SDK): shaderc_shared.dll is copied beside the tests.
setlocal EnableExtensions
cd /d "%~dp0"
set METTLE=G:\Projects\Mettle\bin\mettle.exe
if not "%METTLE_EXE%"=="" set METTLE=%METTLE_EXE%
if not exist "%METTLE%" (
  echo ERROR: Mettle compiler not found at %METTLE% ^(set METTLE_EXE^)
  exit /b 1
)
if "%VULKAN_SDK%"=="" (
  echo ERROR: VULKAN_SDK is not set ^(install the Vulkan SDK: https://vulkan.lunarg.com^)
  exit /b 1
)
REM the shaders as Mettle strings (import_str embeds nothing in the Mettle v0.17.0 builds)
"%METTLE%" --build --release --linker internal tools/embed_shaders.mettle -o tools/embed_shaders.exe
if errorlevel 1 exit /b 1
tools\embed_shaders.exe engine\shaders engine\shader_src.mettle
if errorlevel 1 exit /b 1
tools\embed_shaders.exe tests tests\test_shader_src.mettle
if errorlevel 1 exit /b 1
copy /y "%VULKAN_SDK%\Bin\shaderc_shared.dll" tests\ >nul
if errorlevel 1 exit /b 1
"%METTLE%" --build --release --linker internal tests/engine_only.mettle -o tests/engine_only.exe
if errorlevel 1 exit /b 1
"%METTLE%" --build --release --linker internal tests/hello_vk.mettle -o tests/hello_vk.exe
if errorlevel 1 exit /b 1
echo Built tests\engine_only.exe and tests\hello_vk.exe
