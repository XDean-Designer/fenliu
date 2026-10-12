#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
echo ""
echo " [fenliu] 启动本地演示服务（http-server，保留 .html 路径）"
echo " 打开: http://127.0.0.1:8765/index.html"
echo " 不要用 file:// 双击打开（嵌壳会白屏/丢样式）"
echo ""
if command -v open >/dev/null 2>&1; then
  (sleep 1; open "http://127.0.0.1:8765/index.html") &
elif command -v xdg-open >/dev/null 2>&1; then
  (sleep 1; xdg-open "http://127.0.0.1:8765/index.html") &
fi
npx --yes http-server@14 -p 8765 -c-1 -a 127.0.0.1 --no-dotfiles .
