# -*- coding: utf-8 -*-
"""临时脚本：清掉 PRD 修订记录里指向不存在的章节 §12.6.1 的陈旧引用。"""
import io

P = 'PRD-提成设置.md'
s = io.open(P, encoding='utf-8').read()
n = s.count('\u00a712.6.1 / ')
s = s.replace('\u00a712.6.1 / ', '')
io.open(P, 'w', encoding='utf-8', newline='').write(s)
print('removed:', n)
