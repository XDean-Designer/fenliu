@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  [fenliu] 启动本地演示（模块目录: price staff bill rts）
echo  打开: http://127.0.0.1:8765/index.html
echo  必须用本脚本 / npm start；file:// 或 Cursor 直接开文件会导致嵌壳白屏
echo.
start "" "http://127.0.0.1:8765/index.html"
npx --yes http-server@14 -p 8765 -c-1 -a 127.0.0.1 --no-dotfiles .
