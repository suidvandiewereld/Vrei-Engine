@echo off
REM Build the engine's tests with the Mettle compiler (v0.17+): tests\engine_only.exe (the renderer with no game) and
REM tests\hello_gl.exe (a GL 3.3 context and one triangle). Set METTLE_EXE to point at the compiler elsewhere.
setlocal EnableExtensions
cd /d "%~dp0"
set METTLE=G:\Projects\Mettle\bin\mettle.exe
if not "%METTLE_EXE%"=="" set METTLE=%METTLE_EXE%
if not exist "%METTLE%" (
  echo ERROR: Mettle compiler not found at %METTLE% ^(set METTLE_EXE^)
  exit /b 1
)
"%METTLE%" --build --release --linker internal tests/engine_only.mettle -o tests/engine_only.exe --link-arg -lopengl32
if errorlevel 1 exit /b 1
"%METTLE%" --build --release --linker internal tests/hello_gl.mettle -o tests/hello_gl.exe --link-arg -lopengl32
if errorlevel 1 exit /b 1
echo Built tests\engine_only.exe and tests\hello_gl.exe
