@echo off
echo ========================================
echo 扇贝阅读翻译助手 - 图标生成器
echo ========================================
echo.
echo 正在生成图标...
echo.

cd /d "%~dp0"

REM 检查是否安装了Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误：未检测到Node.js
    echo.
    echo 请先安装Node.js：https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM 检查是否安装了canvas模块
if not exist "node_modules\canvas" (
    echo 正在安装canvas模块...
    npm install canvas
    if %errorlevel% neq 0 (
        echo 安装canvas模块失败
        echo.
        echo 请手动运行：npm install canvas
        echo.
        pause
        exit /b 1
    )
)

REM 运行图标生成脚本
node generate-icons.js

echo.
echo ========================================
echo 图标生成完成！
echo.
echo 请将 icons 目录中的图标文件复制到插件目录
echo ========================================
echo.
pause