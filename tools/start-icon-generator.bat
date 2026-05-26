@echo off
echo ========================================
echo 扇贝阅读翻译助手 - 图标生成器
echo ========================================
echo.
echo 正在启动本地服务器...
echo.
echo 请在浏览器中访问: http://localhost:8000/icons/generate-icons.html
echo.
echo 按 Ctrl+C 停止服务器
echo ========================================
echo.
cd /d "%~dp0"
python -m http.server 8000 2>nul || (
    echo Python未安装，尝试使用Node.js...
    npx http-server -p 8000 2>nul || (
        echo 请手动在浏览器中打开 icons/generate-icons.html 文件
        echo 如果无法正常工作，请安装Python或Node.js
        pause
        exit /b 1
    )
)
pause