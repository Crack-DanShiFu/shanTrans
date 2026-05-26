@echo off
echo ========================================
echo 扇贝阅读翻译助手 - 图标生成器 (Python版)
echo ========================================
echo.
echo 正在生成图标...
echo.

cd /d "%~dp0"

REM 检查是否安装了Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误：未检测到Python
    echo.
    echo 请先安装Python：https://www.python.org/downloads/
    echo.
    echo 安装时请勾选 "Add Python to PATH"
    echo.
    pause
    exit /b 1
)

REM 检查是否安装了Pillow
python -c "import PIL" >nul 2>nul
if %errorlevel% neq 0 (
    echo 正在安装Pillow库...
    pip install Pillow
    if %errorlevel% neq 0 (
        echo 安装Pillow库失败
        echo.
        echo 请手动运行：pip install Pillow
        echo.
        pause
        exit /b 1
    )
)

REM 运行图标生成脚本
python generate-icons.py

echo.
echo ========================================
echo 图标生成完成！
echo.
echo 请将 icons 目录中的图标文件复制到插件目录
echo ========================================
echo.
pause